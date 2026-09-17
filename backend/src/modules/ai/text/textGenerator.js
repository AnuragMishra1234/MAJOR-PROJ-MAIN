const axios = require('axios');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryDelayMs(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') return 3500;
  const match = errorMessage.match(/try again in ([0-9.]+)s/i);
  if (match && match[1]) {
    const sec = parseFloat(match[1]);
    if (!isNaN(sec) && sec > 0) {
      return Math.ceil(sec * 1000) + 600; // Add 600ms safety buffer
    }
  }
  return 4000;
}

async function callGroq(messages, model, temperature = 0.7, maxRetries = 3) {
  const url = process.env.GROQ_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;
  const primaryModel = model || process.env.TEXT_MODEL || 'openai/gpt-oss-20b';
  const fallbackModel = process.env.FALLBACK_MODEL || 'qwen/qwen3.8-27b';

  if (!apiKey) {
    const error = new Error('GROQ_API_KEY is not configured');
    error.status = 502;
    throw error;
  }

  let currentModel = primaryModel;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI_DEBUG] callGroq (attempt ${attempt}/${maxRetries}) invoking model: ${currentModel}`);
      const response = await axios.post(
        url,
        {
          model: currentModel,
          messages,
          temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      return response.data?.choices?.[0]?.message?.content || '';
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Groq API request failed';
      lastError = err;

      const isRateLimit = (err.response?.status === 429) ||
                          /rate limit|tpm|tokens per minute|too many requests/i.test(errorMsg);

      if (isRateLimit && attempt < maxRetries) {
        const delayMs = extractRetryDelayMs(errorMsg);
        console.log(`[GROQ_BACKOFF] Rate limit encountered for model "${currentModel}". Auto-waiting ${(delayMs / 1000).toFixed(1)}s before retry (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(delayMs);

        // On attempt 2+, switch to accessible fallback model if primary is congested
        if (attempt >= 2 && currentModel === primaryModel) {
          currentModel = fallbackModel;
          console.log(`[GROQ_BACKOFF] Switching to fallback model: ${currentModel}`);
        } else if (attempt >= 2 && currentModel === fallbackModel) {
          currentModel = primaryModel;
          console.log(`[GROQ_BACKOFF] Switching back to primary model: ${currentModel}`);
        }
        continue;
      }

      // Non-rate limit or max retries exhausted
      const error = new Error(errorMsg);
      error.status = err.response?.status || 502;
      error.details = err.response?.data || null;
      throw error;
    }
  }

  const error = new Error(lastError?.response?.data?.error?.message || lastError?.message || 'Max retries exceeded');
  error.status = 502;
  throw error;
}

const TEXT_SYSTEM_PROMPT = `You are an elite technical strategist, principal systems architect, and executive copywriter.
Generate thorough, in-depth, production-ready, beautifully structured Markdown content tailored to the user's exact goal.

REQUIREMENTS:
1. Provide comprehensive, concrete, real-world content with rich detail, structured sections, realistic examples, specifications, and actionable depth.
2. Structure with clear Markdown hierarchy (# Title, ## Executive Summary, ## Technical Architecture / Specifications, ## Core Requirements & Implementation, ## Best Practices & Metrics, ## Action Plan).
3. Use realistic industry data, concrete parameters, real APIs, and accurate domain terminology.
4. STRICTLY PROHIBITED: Do not use placeholder phrases (no "lorem ipsum", no "TBD", no "insert here", no "add details later"). Deliver complete, publication-ready work.`;

function stripThinking(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function generate(goal, context = '') {
  const startTime = Date.now();
  const model = process.env.TEXT_MODEL || 'openai/gpt-oss-20b';

  if (!process.env.GROQ_API_KEY) {
    const mockContent = `# Strategic Specification: ${goal}

## 1. Executive Summary
This document defines the comprehensive architecture, operational requirements, and implementation specifications for "${goal}". Designed for high scalability and enterprise reliability.

## 2. Core Functional Requirements
- **High Throughput Execution:** Sub-second response latency with automated error boundary recovery.
- **Robust Data Pipeline:** Strict validation, schema enforcement, and telemetry tracking.
- **Resilient AI Orchestration:** Automated backoff, model failover, and self-healing error correction.

## 3. Architecture & Key Milestones
1. **Phase 1: Ingestion & Validation:** Schema parsing and prompt sanitization.
2. **Phase 2: Execution Engine:** Multi-stage task execution with real-time SSE streaming.
3. **Phase 3: Automated Quality Assurance:** Semantic relevance verification and compliance checks.

## 4. Operational Best Practices
- Strict type safety and input sanitization across all public endpoints.
- Real-time monitoring with automated healing on transient rate limits.
- Complete audit trail persistence in high-availability datastore.`;

    return {
      content: mockContent,
      model: 'mock-text',
      latencyMs: Date.now() - startTime,
    };
  }

  const messages = [
    { role: 'system', content: TEXT_SYSTEM_PROMPT },
    { role: 'user', content: `GOAL:\n${goal}\n\n${context ? `CONTEXT FROM PREVIOUS TASKS:\n${context}\n\n` : ''}Generate the complete, in-depth specification/content now:` },
  ];

  const raw = await callGroq(messages, model, 0.7);
  const content = stripThinking(raw);
  return {
    content,
    model,
    latencyMs: Date.now() - startTime,
  };
}

async function repair(goal, previousOutput, errorMessage, context = '') {
  const startTime = Date.now();
  const model = process.env.TEXT_MODEL || 'openai/gpt-oss-20b';

  if (!process.env.GROQ_API_KEY) {
    return {
      content: `# Corrected Specification: ${goal}\n\n## Resolution of Error\nFixed issue: ${errorMessage}\n\n## Validated Output\nComplete, verified content successfully generated.`,
      model: 'mock-text',
      latencyMs: Date.now() - startTime,
      _healed: true,
    };
  }

  const repairContext = `${context ? `Context: ${context}\n` : ''}Previous Output (Snippet):\n${previousOutput}\n\nError Encountered:\n${errorMessage}\n\nPlease fix the error, eliminate any placeholders or omissions, and return the complete, polished Markdown result.`;

  const messages = [
    { role: 'system', content: TEXT_SYSTEM_PROMPT },
    { role: 'user', content: `GOAL:\n${goal}\n\n${repairContext}` },
  ];

  const raw = await callGroq(messages, model, 0.7);
  const content = stripThinking(raw);
  return {
    content,
    model,
    latencyMs: Date.now() - startTime,
  };
}

module.exports = {
  callGroq,
  generate,
  repair,
};

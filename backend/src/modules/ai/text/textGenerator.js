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
        console.log(`[GROQ_BACKOFF] Rate limit encountered. Auto-waiting ${(delayMs / 1000).toFixed(1)}s before retry (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(delayMs);

        // On attempt 2+, try alternate lightweight model if primary is heavily congested
        if (attempt >= 2 && currentModel === 'qwen/qwen3.6-27b') {
          currentModel = 'openai/gpt-oss-20b';
        } else if (attempt >= 2 && currentModel === 'openai/gpt-oss-20b') {
          currentModel = 'qwen/qwen3.6-27b';
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

async function generate(goal, context = '') {
  const startTime = Date.now();
  const model = process.env.TEXT_MODEL || 'qwen/qwen3.6-27b';
  const messages = [
    { role: 'system', content: 'You are a professional content creator.' },
    { role: 'user', content: `Goal: ${goal}\nContext: ${context}` },
  ];

  const content = await callGroq(messages, model, 0.7);
  return {
    content,
    model,
    latencyMs: Date.now() - startTime,
  };
}

async function repair(goal, previousOutput, errorMessage, context = '') {
  const startTime = Date.now();
  const model = process.env.TEXT_MODEL || 'qwen/qwen3.6-27b';
  const repairContext = `${context ? `Context: ${context}\n` : ''}Previous Output:\n${previousOutput}\n\nError Encountered:\n${errorMessage}\n\nPlease fix the error and return only the corrected result.`;

  const messages = [
    { role: 'system', content: 'You are a professional content creator.' },
    { role: 'user', content: `Goal: ${goal}\n${repairContext}` },
  ];

  const content = await callGroq(messages, model, 0.7);
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

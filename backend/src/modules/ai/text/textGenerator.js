const axios = require('axios');

async function callGroq(messages, model, temperature = 0.7) {
  const url = process.env.GROQ_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    const error = new Error('GROQ_API_KEY is not configured');
    error.status = 502;
    throw error;
  }

  try {
    const response = await axios.post(
      url,
      {
        model: model || process.env.TEXT_MODEL || 'llama-3.3-70b-versatile',
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
    const message = err.response?.data?.error?.message || err.message || 'Groq API request failed';
    const error = new Error(message);
    error.status = 502;
    throw error;
  }
}

async function generate(goal, context = '') {
  const startTime = Date.now();
  const model = process.env.TEXT_MODEL || 'llama-3.3-70b-versatile';
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
  const model = process.env.TEXT_MODEL || 'llama-3.3-70b-versatile';
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

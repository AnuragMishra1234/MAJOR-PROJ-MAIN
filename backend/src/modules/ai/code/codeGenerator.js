const { callGroq } = require('./textGenerator');

function cleanCode(code) {
  if (typeof code !== 'string') return '';
  let cleaned = code.trim();
  // Strip reasoning blocks like <think>...</think> if present
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip leading markdown fences like ```javascript, ```js, or ```
  cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\r?\n?/, '');
  // Strip trailing markdown fences like ```
  cleaned = cleaned.replace(/\r?\n?```$/, '');
  return cleaned.trim();
}

function validateCode(code, language = 'javascript') {
  const lang = (language || '').toLowerCase().trim();
  if (lang === 'javascript' || lang === 'js' || lang === 'node') {
    try {
      new Function(code);
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }
  return { valid: true, skipped: true, error: null };
}

async function generate(goal, language = 'javascript', context = '') {
  const startTime = Date.now();
  const model = process.env.CODE_MODEL || 'llama-3.3-70b-versatile';
  const messages = [
    {
      role: 'system',
      content: `You are an expert ${language} programmer. Generate clean, executable, commented code. No markdown blocks, no explanations — output raw code only.`,
    },
    {
      role: 'user',
      content: `Goal: ${goal}\nContext: ${context}`,
    },
  ];

  const raw = await callGroq(messages, model, 0.3);
  const code = cleanCode(raw);
  const validation = validateCode(code, language);

  return {
    code,
    language,
    valid: validation.valid,
    validationError: validation.error || null,
    model,
    latencyMs: Date.now() - startTime,
  };
}

module.exports = {
  generate,
  cleanCode,
  validateCode,
};

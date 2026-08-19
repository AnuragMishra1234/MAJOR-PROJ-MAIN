const { callGroq } = require('../text/textGenerator');


function cleanCode(code) {
  if (typeof code !== 'string') return '';
  let cleaned = code.trim();
  // Strip reasoning blocks like <think>...</think> if present
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Extract content inside markdown code block if present
  const fenceMatch = cleaned.match(/```(?:[a-zA-Z0-9_-]*\r?\n)?([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\r?\n?/, '');
  cleaned = cleaned.replace(/\r?\n?```$/, '');
  return cleaned.trim();
}

function detectLanguage(goal, defaultLang = 'javascript') {
  const g = (goal || '').toLowerCase();
  if (g.includes('css') || g.includes('style') || g.includes('stylesheet')) return 'css';
  if (g.includes('html') || g.includes('webpage') || g.includes('markup')) return 'html';
  if (g.includes('python') || g.includes('pandas') || g.includes('numpy') || g.includes('django') || g.includes('flask')) return 'python';
  if (g.includes('sql') || g.includes('query') || g.includes('postgres') || g.includes('database')) return 'sql';
  if (g.includes('json')) return 'json';
  if (g.includes('bash') || g.includes('shell') || g.includes('script.sh')) return 'bash';
  return defaultLang;
}

function validateCode(code, language = 'javascript') {
  const lang = (language || '').toLowerCase().trim();
  // Non-JS languages or markup: skip JS new Function() syntax check
  if (['html', 'css', 'xml', 'python', 'sql', 'json', 'bash', 'shell', 'yaml', 'markdown'].includes(lang)) {
    return { valid: true, skipped: true, error: null };
  }
  if (code.trim().startsWith('<') || code.includes('body {') || code.includes('@media') || code.includes('margin:') || code.includes('padding:')) {
    // Looks like HTML or CSS
    return { valid: true, skipped: true, error: null };
  }
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
  const model = process.env.CODE_MODEL || 'qwen/qwen3.6-27b';
  const targetLang = detectLanguage(goal, language);
  console.log('[AI_DEBUG] codeGenerator invoking model:', model, 'targetLang:', targetLang);

  const messages = [
    {
      role: 'system',
      content: `You are an expert ${targetLang} programmer. Generate clean, executable, commented ${targetLang} code. No markdown blocks, no explanations — output raw ${targetLang} only.`,
    },
    {
      role: 'user',
      content: `Goal: ${goal}\nContext: ${context}`,
    },
  ];

  const raw = await callGroq(messages, model, 0.3);
  const code = cleanCode(raw);
  const validation = validateCode(code, targetLang);

  return {
    code,
    language: targetLang,
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

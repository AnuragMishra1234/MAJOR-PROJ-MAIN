const { callGroq } = require('../text/textGenerator');

/**
 * Strips reasoning tokens and markdown code fences to extract pure HTML source code.
 */
function cleanHTML(raw) {
  if (typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  
  // Strip <think>...</think> reasoning blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Extract from markdown code fence if present
  const fenceMatch = cleaned.match(/```(?:html|xml)?\r?\n([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else {
    // If no closing fence or raw string wrapped in fences
    cleaned = cleaned.replace(/^```(?:html|xml)?\r?\n?/i, '');
    cleaned = cleaned.replace(/\r?\n?```$/i, '');
  }

  // Find start of HTML document
  const docTypeIndex = cleaned.search(/<!DOCTYPE html>/i);
  if (docTypeIndex !== -1) {
    cleaned = cleaned.slice(docTypeIndex);
  } else {
    const htmlTagIndex = cleaned.search(/<html/i);
    if (htmlTagIndex !== -1) {
      cleaned = cleaned.slice(htmlTagIndex);
    }
  }

  // Find end of HTML document
  const closeHtmlIndex = cleaned.search(/<\/html>/i);
  if (closeHtmlIndex !== -1) {
    cleaned = cleaned.slice(0, closeHtmlIndex + 7);
  }

  return cleaned.trim();
}

/**
 * Scans HTML for obvious placeholder / template phrases.
 */
const FORBIDDEN_PLACEHOLDER_PATTERNS = [
  /ready-to-use template/i,
  /you can fill in with/i,
  /fill in (?:the|with|your)/i,
  /lorem ipsum/i,
  /insert (?:your|here|content)/i,
  /your name here/i,
  /add your (?:content|projects|skills|name)/i,
  /replace this (?:with|text)/i,
  /placeholder (?:text|content|image)/i,
  /coming soon\.\.\./i,
];

function detectPlaceholders(html) {
  for (const pattern of FORBIDDEN_PLACEHOLDER_PATTERNS) {
    if (pattern.test(html)) {
      return { hasPlaceholder: true, matched: pattern.toString() };
    }
  }
  return { hasPlaceholder: false, matched: null };
}

/**
 * Extracts embedded CSS and JS into separate structured file objects.
 */
function extractFiles(html) {
  const files = ['index.html'];
  const fileDetails = [];

  // Extract CSS
  const styleMatches = [...html.matchAll(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi)];
  let extractedCss = '';
  if (styleMatches.length > 0) {
    extractedCss = styleMatches.map(m => m[1].trim()).join('\n\n');
    files.push('styles.css');
    fileDetails.push({ path: 'styles.css', content: extractedCss });
  }

  // Extract JS
  const scriptMatches = [...html.matchAll(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/gi)];
  let extractedJs = '';
  if (scriptMatches.length > 0) {
    extractedJs = scriptMatches.map(m => m[1].trim()).filter(Boolean).join('\n\n');
    if (extractedJs) {
      files.push('script.js');
      fileDetails.push({ path: 'script.js', content: extractedJs });
    }
  }

  // Primary index.html
  fileDetails.unshift({ path: 'index.html', content: html });

  return { files, fileDetails, css: extractedCss, js: extractedJs };
}

/**
 * Generate a complete, production-ready, beautiful website.
 */
async function generate(goal, context = '') {
  const startTime = Date.now();
  const model = process.env.CODE_MODEL || process.env.TEXT_MODEL || 'openai/gpt-oss-20b';

  if (!process.env.GROQ_API_KEY) {
    const mockHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${goal.slice(0, 30)}</title>\n<style>body{font-family:sans-serif;margin:0;padding:2rem;background:#0a0a0a;color:#f2f0e4}</style>\n</head>\n<body>\n<h1>${goal}</h1>\n<p>Generated website for: ${goal}</p>\n</body>\n</html>`;
    const { files, fileDetails, css, js } = extractFiles(mockHtml);
    return {
      content: mockHtml,
      files,
      fileDetails,
      css,
      js,
      pageCount: 1,
      hasPlaceholder: false,
      model: 'mock-html',
      latencyMs: Date.now() - startTime,
    };
  }

  const systemPrompt = `You are a world-class principal front-end engineer and UI/UX designer.
Your task is to build a COMPLETE, self-contained, fully-styled, interactive, beautiful, production-ready website for the user's objective.

ABSOLUTE REQUIREMENTS:
1. OUTPUT FORMAT: Output ONLY the complete standalone HTML code starting with <!DOCTYPE html> and ending with </html>. Do NOT include markdown code blocks, backticks, or explanatory text.
2. RICH REALISTIC CONTENT: Provide detailed, realistic, domain-specific text, headings, descriptions, and figures for every section specified in the goal. Never use generic or placeholder copy.
3. EMBEDDED STYLES: Include comprehensive, modern, elegant CSS inside a <style> tag in <head>. Use CSS variables, modern flexbox/grid layouts, responsive media queries (mobile/tablet/desktop), polished typography, refined shadows, gradients, and micro-interactions.
4. EMBEDDED INTERACTION: Include clean, vanilla JavaScript inside a <script> tag before </body> for mobile menu toggles, smooth scroll, form validation, filter buttons, or tab switching.
5. STRICTLY FORBIDDEN:
   - NO "lorem ipsum", NO "your name here", NO "add your content", NO "fill in with", NO "ready-to-use template", NO "coming soon".
   - NO markdown fences (like \`\`\`html) or conversational commentary. Return pure HTML.`;

  const userPrompt = `GOAL:\n${goal}\n\n${context ? `CONTEXT FROM PRIOR TASKS:\n${context}\n\n` : ''}Build the complete website now:`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const raw = await callGroq(messages, model, 0.3);
  let html = cleanHTML(raw);

  // If cleanHTML stripped everything because LLM failed to include <!DOCTYPE html>, wrap or construct
  if (!html.includes('<html')) {
    html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Website</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }

  const { files, fileDetails, css, js } = extractFiles(html);
  const placeholderCheck = detectPlaceholders(html);

  return {
    content: html,
    files,
    fileDetails,
    css,
    js,
    pageCount: 1,
    hasPlaceholder: placeholderCheck.hasPlaceholder,
    placeholderMatch: placeholderCheck.matched,
    model,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Repair a failed website generation.
 */
async function repair(goal, previousOutput, errorMessage, context = '') {
  const startTime = Date.now();
  const model = process.env.CODE_MODEL || process.env.TEXT_MODEL || 'openai/gpt-oss-20b';

  const systemPrompt = `You are a world-class principal front-end engineer and UI/UX designer.
Fix the errors in the previously generated website and return the corrected, complete, standalone, runnable HTML code.

ABSOLUTE REQUIREMENTS:
1. Output ONLY pure HTML code starting with <!DOCTYPE html> and ending with </html>.
2. Fix all reported issues: ${errorMessage}.
3. Ensure every section has rich, complete, realistic content matching the goal with NO placeholder language.`;

  const userPrompt = `GOAL: ${goal}
ERROR TO FIX: ${errorMessage}
${context ? `CONTEXT: ${context}\n` : ''}
PREVIOUS INCOMPLETE OUTPUT (SNIPPET):
${typeof previousOutput === 'string' ? previousOutput.slice(0, 1500) : ''}

Generate the complete fixed HTML website now:`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const raw = await callGroq(messages, model, 0.3);
  const html = cleanHTML(raw);
  const { files, fileDetails, css, js } = extractFiles(html);
  const placeholderCheck = detectPlaceholders(html);

  return {
    content: html,
    files,
    fileDetails,
    css,
    js,
    pageCount: 1,
    hasPlaceholder: placeholderCheck.hasPlaceholder,
    placeholderMatch: placeholderCheck.matched,
    model,
    latencyMs: Date.now() - startTime,
    _healed: true,
  };
}

module.exports = {
  generate,
  repair,
  cleanHTML,
  detectPlaceholders,
  extractFiles,
};

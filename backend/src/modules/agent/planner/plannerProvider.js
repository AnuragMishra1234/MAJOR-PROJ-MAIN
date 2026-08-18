/**
 * @file plannerProvider.js
 * @module agent/planner
 *
 * LLM provider interface for the Planner.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SCOPE
 * ═══════════════════════════════════════════════════════════════════════════
 * This provider is ONLY for:
 *   goal (natural language) → task plan (structured JSON)
 *
 * It does NOT handle:
 *   • Text generation          • Website generation
 *   • Code generation          • Prompt engineering for tasks
 *
 * Those belong to Person 3's AI module (backend/src/modules/ai/).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN
 * ═══════════════════════════════════════════════════════════════════════════
 * All providers implement one method:
 *
 *   complete(messages, options?) → Promise<{ content: string }>
 *
 * messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>
 *
 * The active provider is resolved by createProvider(type):
 *   'groq'      → GroqProvider  (reads GROQ_API_KEY, PLANNER_MODEL from env)
 *   'openai'    → OpenAIProvider (reads OPENAI_API_KEY, PLANNER_MODEL from env)
 *   'mock'      → MockProvider  (used in tests — no API calls)
 *   default     → MockProvider  (safe fallback when no env key is set)
 *
 * DO NOT hardcode API keys. Use environment variables.
 */

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER ERROR
// ─────────────────────────────────────────────────────────────────────────────

export class ProviderError extends Error {
  /**
   * @param {string} message
   * @param {string} [provider] - Provider name (e.g. 'groq', 'openai')
   * @param {object} [context]  - Extra debug info
   */
  constructor(message, provider = 'unknown', context = {}) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.context = context;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GROQ PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls the Groq Chat Completions API.
 * Uses native fetch (Node.js >= 18).
 *
 * Required env vars:
 *   GROQ_API_KEY    — Groq API key
 *   PLANNER_MODEL   — Optional model override (default: llama-3.3-70b-versatile)
 */
export class GroqProvider {
  #apiKey;
  #model;
  #baseUrl;

  constructor() {
    this.#apiKey = process.env.GROQ_API_KEY ?? '';
    this.#model = process.env.PLANNER_MODEL ?? 'llama-3.3-70b-versatile';
    this.#baseUrl = 'https://api.groq.com/openai/v1';
  }

  get name() {
    return 'groq';
  }

  /**
   * @param {Array<{ role: string, content: string }>} messages
   * @param {{ temperature?: number, maxTokens?: number }} [options]
   * @returns {Promise<{ content: string }>}
   * @throws {ProviderError}
   */
  async complete(messages, options = {}) {
    if (!this.#apiKey) {
      throw new ProviderError(
        'GROQ_API_KEY is not set. Cannot call Groq API.',
        'groq',
        { hint: 'Set GROQ_API_KEY in your .env file.' },
      );
    }

    const body = {
      model: this.#model,
      messages,
      temperature: options.temperature ?? 0.2,  // low temp for deterministic JSON
      max_tokens: options.maxTokens ?? 2048,
      response_format: { type: 'json_object' }, // Groq JSON mode
    };

    let response;
    try {
      response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.#apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      throw new ProviderError(
        `Groq API network error: ${networkErr.message}`,
        'groq',
        { originalError: networkErr.message },
      );
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (_) { /* ignore */ }
      throw new ProviderError(
        `Groq API returned HTTP ${response.status}: ${errorBody}`,
        'groq',
        { status: response.status, body: errorBody },
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new ProviderError(
        `Failed to parse Groq API response as JSON: ${parseErr.message}`,
        'groq',
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new ProviderError(
        'Groq API response did not contain a valid content string.',
        'groq',
        { response: data },
      );
    }

    return { content };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OPENAI PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls the OpenAI Chat Completions API.
 * Uses native fetch (Node.js >= 18).
 *
 * Required env vars:
 *   OPENAI_API_KEY  — OpenAI API key
 *   PLANNER_MODEL   — Optional model override (default: gpt-4o-mini)
 */
export class OpenAIProvider {
  #apiKey;
  #model;
  #baseUrl;

  constructor() {
    this.#apiKey = process.env.OPENAI_API_KEY ?? '';
    this.#model = process.env.PLANNER_MODEL ?? 'gpt-4o-mini';
    this.#baseUrl = 'https://api.openai.com/v1';
  }

  get name() {
    return 'openai';
  }

  /**
   * @param {Array<{ role: string, content: string }>} messages
   * @param {{ temperature?: number, maxTokens?: number }} [options]
   * @returns {Promise<{ content: string }>}
   * @throws {ProviderError}
   */
  async complete(messages, options = {}) {
    if (!this.#apiKey) {
      throw new ProviderError(
        'OPENAI_API_KEY is not set. Cannot call OpenAI API.',
        'openai',
        { hint: 'Set OPENAI_API_KEY in your .env file.' },
      );
    }

    const body = {
      model: this.#model,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2048,
      response_format: { type: 'json_object' }, // OpenAI JSON mode
    };

    let response;
    try {
      response = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.#apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      throw new ProviderError(
        `OpenAI API network error: ${networkErr.message}`,
        'openai',
        { originalError: networkErr.message },
      );
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (_) { /* ignore */ }
      throw new ProviderError(
        `OpenAI API returned HTTP ${response.status}: ${errorBody}`,
        'openai',
        { status: response.status, body: errorBody },
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new ProviderError(
        `Failed to parse OpenAI API response as JSON: ${parseErr.message}`,
        'openai',
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new ProviderError(
        'OpenAI API response did not contain a valid content string.',
        'openai',
        { response: data },
      );
    }

    return { content };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK PROVIDER (for tests — zero API calls)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * In-memory mock provider for unit/integration testing.
 *
 * Usage:
 *   const mock = new MockProvider();
 *   mock.setResponse({ content: JSON.stringify({ goal: '...', tasks: [...] }) });
 *   mock.setError(new Error('Network failure'));  // to simulate errors
 *
 * Records all calls for assertion in tests:
 *   mock.callCount
 *   mock.lastMessages
 */
export class MockProvider {
  #responses;  // queue of { content: string } | Error
  #callCount;
  #lastMessages;

  constructor() {
    this.#responses = [];
    this.#callCount = 0;
    this.#lastMessages = null;
  }

  get name() {
    return 'mock';
  }

  /**
   * Queue a response to be returned on the next complete() call.
   * Multiple calls queue multiple responses in order.
   *
   * @param {{ content: string }} response
   */
  setResponse(response) {
    this.#responses.push({ type: 'response', value: response });
  }

  /**
   * Queue an error to be thrown on the next complete() call.
   *
   * @param {Error} error
   */
  setError(error) {
    this.#responses.push({ type: 'error', value: error });
  }

  /** Number of times complete() has been called. */
  get callCount() {
    return this.#callCount;
  }

  /** The messages array from the most recent complete() call. */
  get lastMessages() {
    return this.#lastMessages;
  }

  /**
   * @param {Array<{ role: string, content: string }>} messages
   * @returns {Promise<{ content: string }>}
   */
  async complete(messages) {
    this.#callCount += 1;
    this.#lastMessages = messages;

    if (this.#responses.length === 0) {
      throw new ProviderError('MockProvider has no queued responses', 'mock');
    }

    const next = this.#responses.shift();
    if (next.type === 'error') throw next.value;
    return next.value;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create and return a provider instance by name.
 *
 * @param {'groq' | 'openai' | 'mock'} [type] - Provider name.
 *   Defaults to 'groq' if GROQ_API_KEY is set, 'openai' if OPENAI_API_KEY is
 *   set, otherwise 'mock'.
 * @returns {GroqProvider | OpenAIProvider | MockProvider}
 */
export function createProvider(type) {
  if (type === 'groq') return new GroqProvider();
  if (type === 'openai') return new OpenAIProvider();
  if (type === 'mock') return new MockProvider();

  // Auto-detect from environment
  if (process.env.GROQ_API_KEY) return new GroqProvider();
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider();

  // Safe fallback for environments without keys
  return new MockProvider();
}

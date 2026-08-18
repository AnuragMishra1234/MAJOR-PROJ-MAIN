/**
 * @file taskQueue.js
 * @module agent/workflow
 *
 * Lightweight in-memory FIFO task queue used by WorkflowEngine to track
 * which tasks are ready for execution.
 *
 * DESIGN NOTES
 * ─────────────
 * • Deliberately simple — no Redis, BullMQ, Kafka, or external deps.
 * • Maintains insertion (FIFO) order so getNextTask() is deterministic.
 * • Does NOT hold task data — only task IDs. The engine owns the task objects.
 * • Future upgrade path: swap this class for a Redis-backed implementation
 *   without changing WorkflowEngine — just honour the same interface.
 *
 * PUBLIC INTERFACE
 * ─────────────────
 *   enqueue(taskId)     — Add a task ID to the back of the queue.
 *   dequeue()           — Remove and return the front task ID (or null).
 *   peek()              — Return the front task ID without removing it (or null).
 *   has(taskId)         — Check whether an ID is currently queued.
 *   remove(taskId)      — Remove a specific ID from anywhere in the queue.
 *   clear()             — Empty the queue.
 *   size                — Number of items currently in the queue (getter).
 *   toArray()           — Snapshot of the queue contents (safe copy).
 */

export class TaskQueue {
  /** @type {string[]} */
  #items;

  constructor() {
    this.#items = [];
  }

  // ─── Mutations ────────────────────────────────────────────────────────────

  /**
   * Add a task ID to the back of the queue.
   * Silently ignores the call if the ID is already present (idempotent).
   *
   * @param {string} taskId
   */
  enqueue(taskId) {
    if (typeof taskId !== 'string' || taskId.trim().length === 0) {
      throw new TypeError('TaskQueue.enqueue: taskId must be a non-empty string');
    }
    if (!this.#items.includes(taskId)) {
      this.#items.push(taskId);
    }
  }

  /**
   * Remove and return the front task ID.
   *
   * @returns {string | null} The front task ID, or null if the queue is empty.
   */
  dequeue() {
    return this.#items.shift() ?? null;
  }

  /**
   * Remove a specific task ID from anywhere in the queue.
   * No-op if the ID is not present.
   *
   * @param {string} taskId
   */
  remove(taskId) {
    const idx = this.#items.indexOf(taskId);
    if (idx !== -1) {
      this.#items.splice(idx, 1);
    }
  }

  /**
   * Empty the queue entirely.
   */
  clear() {
    this.#items = [];
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  /**
   * Return the front task ID without removing it.
   *
   * @returns {string | null}
   */
  peek() {
    return this.#items[0] ?? null;
  }

  /**
   * Check whether a task ID is currently in the queue.
   *
   * @param {string} taskId
   * @returns {boolean}
   */
  has(taskId) {
    return this.#items.includes(taskId);
  }

  /**
   * Number of items currently in the queue.
   *
   * @type {number}
   */
  get size() {
    return this.#items.length;
  }

  /**
   * Return a safe copy of the queue contents (insertion order).
   *
   * @returns {string[]}
   */
  toArray() {
    return [...this.#items];
  }
}

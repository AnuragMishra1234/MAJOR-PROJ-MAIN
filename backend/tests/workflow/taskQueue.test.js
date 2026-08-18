/**
 * @file taskQueue.test.js
 * Tests for the TaskQueue (in-memory FIFO queue used by WorkflowEngine).
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TaskQueue } from '../../src/modules/agent/workflow/index.js';

describe('TaskQueue', () => {
  /** @type {TaskQueue} */
  let queue;

  beforeEach(() => {
    queue = new TaskQueue();
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  it('starts empty', () => {
    expect(queue.size).toBe(0);
    expect(queue.peek()).toBeNull();
    expect(queue.dequeue()).toBeNull();
    expect(queue.toArray()).toEqual([]);
  });

  // ─── enqueue ──────────────────────────────────────────────────────────────

  it('enqueues a single item', () => {
    queue.enqueue('task-1');
    expect(queue.size).toBe(1);
    expect(queue.peek()).toBe('task-1');
  });

  it('enqueues multiple items in order', () => {
    queue.enqueue('task-1');
    queue.enqueue('task-2');
    queue.enqueue('task-3');
    expect(queue.size).toBe(3);
    expect(queue.toArray()).toEqual(['task-1', 'task-2', 'task-3']);
  });

  it('ignores duplicate enqueue (idempotent)', () => {
    queue.enqueue('task-1');
    queue.enqueue('task-1'); // duplicate — should be ignored
    expect(queue.size).toBe(1);
  });

  it('throws for empty string taskId', () => {
    expect(() => queue.enqueue('')).toThrow(TypeError);
  });

  it('throws for non-string taskId', () => {
    expect(() => queue.enqueue(42)).toThrow(TypeError);
  });

  // ─── dequeue ──────────────────────────────────────────────────────────────

  it('dequeues in FIFO order', () => {
    queue.enqueue('task-1');
    queue.enqueue('task-2');
    queue.enqueue('task-3');

    expect(queue.dequeue()).toBe('task-1');
    expect(queue.dequeue()).toBe('task-2');
    expect(queue.dequeue()).toBe('task-3');
    expect(queue.dequeue()).toBeNull(); // empty
  });

  it('returns null when dequeuing from empty queue', () => {
    expect(queue.dequeue()).toBeNull();
  });

  it('decrements size after dequeue', () => {
    queue.enqueue('task-1');
    queue.enqueue('task-2');
    queue.dequeue();
    expect(queue.size).toBe(1);
  });

  // ─── peek ─────────────────────────────────────────────────────────────────

  it('peek does not remove the item', () => {
    queue.enqueue('task-1');
    expect(queue.peek()).toBe('task-1');
    expect(queue.size).toBe(1); // still there
  });

  it('peek returns null on empty queue', () => {
    expect(queue.peek()).toBeNull();
  });

  // ─── has ──────────────────────────────────────────────────────────────────

  it('has() returns true for enqueued items', () => {
    queue.enqueue('task-1');
    expect(queue.has('task-1')).toBe(true);
  });

  it('has() returns false for non-enqueued items', () => {
    expect(queue.has('task-99')).toBe(false);
  });

  it('has() returns false after item is dequeued', () => {
    queue.enqueue('task-1');
    queue.dequeue();
    expect(queue.has('task-1')).toBe(false);
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  it('removes a specific item from the middle', () => {
    queue.enqueue('task-1');
    queue.enqueue('task-2');
    queue.enqueue('task-3');
    queue.remove('task-2');
    expect(queue.toArray()).toEqual(['task-1', 'task-3']);
    expect(queue.size).toBe(2);
  });

  it('remove is a no-op for non-existent item', () => {
    queue.enqueue('task-1');
    queue.remove('task-99'); // not present — should not throw
    expect(queue.size).toBe(1);
  });

  // ─── clear ────────────────────────────────────────────────────────────────

  it('clear empties the queue', () => {
    queue.enqueue('task-1');
    queue.enqueue('task-2');
    queue.clear();
    expect(queue.size).toBe(0);
    expect(queue.peek()).toBeNull();
  });

  // ─── toArray ──────────────────────────────────────────────────────────────

  it('toArray returns a copy (mutating it does not affect the queue)', () => {
    queue.enqueue('task-1');
    const arr = queue.toArray();
    arr.push('injected');
    expect(queue.size).toBe(1); // still 1
  });

  // ─── FIFO order ───────────────────────────────────────────────────────────

  it('maintains strict FIFO order across enqueue/dequeue mix', () => {
    queue.enqueue('a');
    queue.enqueue('b');
    queue.dequeue(); // removes 'a'
    queue.enqueue('c');
    // Queue should be: b, c
    expect(queue.toArray()).toEqual(['b', 'c']);
    expect(queue.dequeue()).toBe('b');
    expect(queue.dequeue()).toBe('c');
    expect(queue.dequeue()).toBeNull();
  });
});

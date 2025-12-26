/**
 * A semaphore implementation for limiting concurrent promises
 * @class
 * @classdesc Provides concurrency control for executing multiple promises
 * by limiting the number of promises that can execute simultaneously.
 * Useful for rate limiting API calls or managing resource usage.
 *
 * @example
 * const semaphore = new PromiseSemaphore(5); // Allow 5 concurrent tasks
 * const tasks = [
 *   () => fetch('/api/1'),
 *   () => fetch('/api/2'),
 *   () => fetch('/api/3')
 * ];
 * const results = await semaphore.executeAll(tasks);
 */
export class PromiseSemaphore {
  /**
   * Creates a new PromiseSemaphore instance
   * @param {number} maxConcurrent - Maximum number of concurrent promises allowed (default: 9)
   */
  constructor(maxConcurrent = 9) {
    this.maxConcurrent = maxConcurrent;
    this.current = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.current < this.maxConcurrent) {
      this.current += 1;
      return undefined;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.current -= 1;
    }
  }

  async execute(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  async executeAll(tasks) {
    return Promise.all(tasks.map((task) => this.execute(task)));
  }
}

/**
 * Runs multiple async tasks with concurrency control
 * @param {Array<Function>} tasks - Array of functions that each return a Promise
 * @param {number} [poolSize=9] - Maximum number of tasks to run concurrently
 * @returns {Promise<Array>} Promise that resolves with an array containing the results of all tasks in order
 *
 * @example
 * const tasks = [
 *   () => fetch('/api/1'),
 *   () => fetch('/api/2'),
 *   () => fetch('/api/3')
 * ];
 * const results = await promisePool(tasks, 5); // Run 5 tasks concurrently
 */
export function promisePool(tasks, poolSize = 9) {
  const semaphore = new PromiseSemaphore(poolSize);
  return semaphore.executeAll(tasks);
}

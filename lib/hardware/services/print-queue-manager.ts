/**
 * Print Queue Manager
 * Manages print job queue with priority and retry logic
 */

import { EventEmitter } from 'events';
import { PrintJob, PrintResult, QueueStatus, RetryPolicy } from '../types';
import { DefaultPrinterService } from './printer-service';

interface QueuedJob {
  job: PrintJob;
  addedAt: string;
  attempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: PrintResult;
  error?: string;
}

export class PrintQueueManager extends EventEmitter {
  private queue: QueuedJob[] = [];
  private processing = false;
  private printerService: DefaultPrinterService;
  private retryPolicy: RetryPolicy = {
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
    backoffMultiplier: 2,
  };
  private processInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.printerService = new DefaultPrinterService();
    this.startQueueProcessor();
  }

  /**
   * Add a job to the queue
   */
  async addToQueue(job: PrintJob): Promise<string> {
    if (!job.id) {
      job.id = this.generateJobId();
    }

    const queuedJob: QueuedJob = {
      job,
      addedAt: new Date().toISOString(),
      attempts: 0,
      status: 'pending',
    };

    // Add based on priority
    if (job.priority === 'high') {
      // Find first non-high priority job
      const index = this.queue.findIndex(q => q.job.priority !== 'high');
      if (index === -1) {
        this.queue.push(queuedJob);
      } else {
        this.queue.splice(index, 0, queuedJob);
      }
    } else if (job.priority === 'normal') {
      // Add after high priority jobs
      const index = this.queue.findIndex(q => q.job.priority === 'low');
      if (index === -1) {
        this.queue.push(queuedJob);
      } else {
        this.queue.splice(index, 0, queuedJob);
      }
    } else {
      // Low priority - add to end
      this.queue.push(queuedJob);
    }

    this.emit('job.added', job);
    this.emit('queue.updated', this.getQueueStatus());

    return job.id;
  }

  /**
   * Remove a job from the queue
   */
  removeFromQueue(jobId: string): boolean {
    const index = this.queue.findIndex(q => q.job.id === jobId);
    if (index !== -1 && this.queue[index].status === 'pending') {
      this.queue.splice(index, 1);
      this.emit('job.removed', jobId);
      this.emit('queue.updated', this.getQueueStatus());
      return true;
    }
    return false;
  }

  /**
   * Prioritize a job
   */
  prioritizeJob(jobId: string): void {
    const index = this.queue.findIndex(q => q.job.id === jobId);
    if (index !== -1 && this.queue[index].status === 'pending') {
      const job = this.queue.splice(index, 1)[0];
      job.job.priority = 'high';

      // Re-add with high priority
      this.queue.unshift(job);
      this.emit('job.prioritized', jobId);
      this.emit('queue.updated', this.getQueueStatus());
    }
  }

  /**
   * Process next job in queue
   */
  async processNext(): Promise<PrintResult | null> {
    const nextJob = this.queue.find(q => q.status === 'pending');
    if (!nextJob) return null;

    return this.processJob(nextJob);
  }

  /**
   * Process a batch of jobs
   */
  async processBatch(jobs: PrintJob[]): Promise<{ results: PrintResult[]; failed: string[] }> {
    const results: PrintResult[] = [];
    const failed: string[] = [];

    // Add all jobs to queue
    const jobIds = await Promise.all(jobs.map(job => this.addToQueue(job)));

    // Wait for all jobs to complete
    await new Promise<void>(resolve => {
      const checkCompletion = () => {
        const pending = this.queue.filter(
          q => jobIds.includes(q.job.id!) && (q.status === 'pending' || q.status === 'processing')
        );

        if (pending.length === 0) {
          // Collect results
          jobIds.forEach(jobId => {
            const job = this.queue.find(q => q.job.id === jobId);
            if (job) {
              if (job.result && job.status === 'completed') {
                results.push(job.result);
              } else {
                failed.push(jobId);
              }
            }
          });
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });

    return { results, failed };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): QueueStatus {
    return {
      pending: this.queue.filter(q => q.status === 'pending').length,
      processing: this.queue.filter(q => q.status === 'processing').length,
      completed: this.queue.filter(q => q.status === 'completed').length,
      failed: this.queue.filter(q => q.status === 'failed').length,
    };
  }

  /**
   * Get queue details
   */
  getQueueDetails() {
    return this.queue.map(q => ({
      jobId: q.job.id,
      type: q.job.type,
      priority: q.job.priority,
      status: q.status,
      addedAt: q.addedAt,
      attempts: q.attempts,
      error: q.error,
    }));
  }

  /**
   * Clear completed and failed jobs
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(q => q.status !== 'completed' && q.status !== 'failed');
    this.emit('queue.updated', this.getQueueStatus());
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    // Cancel pending jobs only
    this.queue = this.queue.filter(q => q.status === 'processing');
    this.emit('queue.cleared');
    this.emit('queue.updated', this.getQueueStatus());
  }

  /**
   * Set retry policy
   */
  setRetryPolicy(policy: Partial<RetryPolicy>): void {
    this.retryPolicy = { ...this.retryPolicy, ...policy };
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs(): Promise<{ retried: number; successful: number }> {
    const failedJobs = this.queue.filter(q => q.status === 'failed');
    let retried = 0;
    let successful = 0;

    for (const failedJob of failedJobs) {
      if (failedJob.attempts < this.retryPolicy.maxRetries) {
        failedJob.status = 'pending';
        failedJob.attempts = 0;
        retried++;

        const result = await this.processJob(failedJob);
        if (result && result.success) {
          successful++;
        }
      }
    }

    return { retried, successful };
  }

  // Private methods
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startQueueProcessor(): void {
    this.processInterval = setInterval(() => {
      if (!this.processing && this.queue.some(q => q.status === 'pending')) {
        this.processQueue();
      }
    }, 1000); // Check every second
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (true) {
        const nextJob = this.queue.find(q => q.status === 'pending');
        if (!nextJob) break;

        await this.processJob(nextJob);

        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.processing = false;
    }
  }

  private async processJob(queuedJob: QueuedJob): Promise<PrintResult> {
    queuedJob.status = 'processing';
    queuedJob.attempts++;

    this.emit('job.processing', queuedJob.job);
    this.emit('queue.updated', this.getQueueStatus());

    try {
      const result = await this.printerService.print(queuedJob.job);

      queuedJob.status = 'completed';
      queuedJob.result = result;

      this.emit('job.completed', queuedJob.job, result);
      this.emit('queue.updated', this.getQueueStatus());

      // Auto-remove completed jobs after 5 minutes
      setTimeout(() => {
        const index = this.queue.indexOf(queuedJob);
        if (index !== -1 && queuedJob.status === 'completed') {
          this.queue.splice(index, 1);
          this.emit('queue.updated', this.getQueueStatus());
        }
      }, 300000);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      queuedJob.error = errorMessage;

      if (queuedJob.attempts < this.retryPolicy.maxRetries) {
        // Retry with backoff
        const delay =
          this.retryPolicy.retryDelay *
          Math.pow(this.retryPolicy.backoffMultiplier, queuedJob.attempts - 1);

        queuedJob.status = 'pending';

        setTimeout(() => {
          this.emit('job.retry', queuedJob.job, queuedJob.attempts);
        }, delay);
      } else {
        queuedJob.status = 'failed';
        this.emit('job.failed', queuedJob.job, errorMessage);
      }

      this.emit('queue.updated', this.getQueueStatus());

      return {
        success: false,
        jobId: queuedJob.job.id!,
        error: errorMessage,
      };
    }
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }
}

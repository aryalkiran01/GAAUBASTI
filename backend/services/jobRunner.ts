export {};
const os = require('os');
const JobLock = require('../models/JobLock');

interface JobRunnerOptions {
  leaseDurationMs?: number;
}

interface ActiveJob {
  timer: NodeJS.Timeout;
  jobName: string;
}

const activeJobs: ActiveJob[] = [];
const workerId = `${process.pid}-${os.hostname()}-${Date.now()}`;

/**
 * Runs a task protected by a MongoDB distributed lease lock.
 * Ensures only 1 backend instance executes the job at a time with automatic lease expiration and retry tracking.
 */
const runWithDistributedLock = async (
  jobName: string,
  taskFn: () => Promise<any>,
  options: JobRunnerOptions = {}
) => {
  const leaseDurationMs = options.leaseDurationMs || 5 * 60 * 1000; // 5 min default lease
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() + leaseDurationMs);

  let lock: any = null;
  try {
    // Atomically acquire lock if unlocked, lease expired, or previously finished
    lock = await JobLock.findOneAndUpdate(
      {
        jobName,
        $or: [
          { lockedAt: null },
          { lockExpiresAt: null },
          { lockExpiresAt: { $lte: now } },
          { lastStatus: { $in: ['idle', 'success', 'failed'] } }
        ]
      },
      {
        $set: {
          lockedAt: now,
          lockedBy: workerId,
          lockExpiresAt: leaseExpiry,
          lastStatus: 'running'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (lockError: any) {
    if (lockError?.code === 11000) {
      return { skipped: true, reason: 'concurrency_collision' };
    }
    console.error(`[jobRunner:${jobName}] Distributed lock error:`, lockError?.message || lockError);
    return { skipped: true, error: lockError?.message };
  }

  // If lock was not acquired by this worker
  if (!lock || lock.lockedBy !== workerId) {
    return { skipped: true, reason: 'locked_by_another_instance' };
  }

  try {
    const result = await taskFn();

    await JobLock.updateOne(
      { jobName, lockedBy: workerId },
      {
        $set: {
          lastRunAt: new Date(),
          lastStatus: 'success',
          lastError: null,
          lockedAt: null,
          lockExpiresAt: null,
          attempts: 0
        }
      }
    );

    return { success: true, result };
  } catch (taskError: any) {
    console.error(`[jobRunner:${jobName}] Execution failed:`, taskError?.message || taskError);

    await JobLock.updateOne(
      { jobName, lockedBy: workerId },
      {
        $set: {
          lastRunAt: new Date(),
          lastStatus: 'failed',
          lastError: taskError?.message || String(taskError),
          lockedAt: null,
          lockExpiresAt: null
        },
        $inc: { attempts: 1 }
      }
    );

    return { success: false, error: taskError?.message || String(taskError) };
  }
};

/**
 * Starts a recurring background job with distributed coordination.
 */
const startJob = (
  jobName: string,
  intervalMs: number,
  taskFn: () => Promise<any>,
  options: JobRunnerOptions = {}
) => {
  // Execute immediately on startup within distributed lock
  runWithDistributedLock(jobName, taskFn, options).catch(() => {});

  const timer = setInterval(async () => {
    try {
      await runWithDistributedLock(jobName, taskFn, options);
    } catch (err: any) {
      console.error(`[jobRunner:${jobName}] Background interval error:`, err?.message || err);
    }
  }, intervalMs);

  timer.unref();
  activeJobs.push({ timer, jobName });
  return timer;
};

/**
 * Stops all background job timers for graceful shutdown.
 */
const stopAllJobs = () => {
  for (const job of activeJobs) {
    clearInterval(job.timer);
  }
  activeJobs.length = 0;
};

module.exports = {
  runWithDistributedLock,
  startJob,
  stopAllJobs,
  __workerId: workerId
};
module.exports.default = {
  runWithDistributedLock,
  startJob,
  stopAllJobs,
  __workerId: workerId
};

export {
  runWithDistributedLock,
  startJob,
  stopAllJobs
};

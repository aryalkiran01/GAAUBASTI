export {};
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const { runWithDistributedLock, startJob, stopAllJobs } = require('../services/jobRunner');
const JobLock = require('../models/JobLock');

describe('Phase 12 — Scalable Distributed Background Job Coordinator', () => {
  test('runWithDistributedLock executes job and records status on success', async () => {
    let executed = false;
    const originalFindOneAndUpdate = JobLock.findOneAndUpdate;
    const originalUpdateOne = JobLock.updateOne;

    JobLock.findOneAndUpdate = async (_query: any, update: any) => {
      return {
        jobName: 'test-job-1',
        lockedBy: update.$set.lockedBy,
        lastStatus: 'running'
      };
    };

    let updatedStatus: any = null;
    JobLock.updateOne = async (_query: any, update: any) => {
      updatedStatus = update.$set.lastStatus;
      return { modifiedCount: 1 };
    };

    const result = await runWithDistributedLock('test-job-1', async () => {
      executed = true;
      return { processed: 5 };
    });

    assert.equal(executed, true);
    assert.equal(result.success, true);
    assert.equal(result.result.processed, 5);
    assert.equal(updatedStatus, 'success');

    JobLock.findOneAndUpdate = originalFindOneAndUpdate;
    JobLock.updateOne = originalUpdateOne;
  });

  test('runWithDistributedLock skips execution when another worker holds active lease', async () => {
    const originalFindOneAndUpdate = JobLock.findOneAndUpdate;

    JobLock.findOneAndUpdate = async () => {
      return {
        jobName: 'test-job-busy',
        lockedBy: 'other-worker-pid-9999-host',
        lastStatus: 'running'
      };
    };

    let executed = false;
    const result = await runWithDistributedLock('test-job-busy', async () => {
      executed = true;
    });

    assert.equal(executed, false);
    assert.equal(result.skipped, true);
    assert.equal(result.reason, 'locked_by_another_instance');

    JobLock.findOneAndUpdate = originalFindOneAndUpdate;
  });

  test('runWithDistributedLock handles execution failures and records failed status', async () => {
    const originalFindOneAndUpdate = JobLock.findOneAndUpdate;
    const originalUpdateOne = JobLock.updateOne;

    JobLock.findOneAndUpdate = async (_query: any, update: any) => ({
      jobName: 'test-failing-job',
      lockedBy: update.$set.lockedBy,
      lastStatus: 'running'
    });

    let recordedFailureStatus: string | null = null;
    let recordedErrorMsg: string | null = null;
    JobLock.updateOne = async (_query: any, update: any) => {
      recordedFailureStatus = update.$set.lastStatus;
      recordedErrorMsg = update.$set.lastError;
      return { modifiedCount: 1 };
    };

    const result = await runWithDistributedLock('test-failing-job', async () => {
      throw new Error('Database connection timeout during batch');
    });

    assert.equal(result.success, false);
    assert.match(result.error, /Database connection timeout during batch/);
    assert.equal(recordedFailureStatus, 'failed');
    assert.equal(recordedErrorMsg, 'Database connection timeout during batch');

    JobLock.findOneAndUpdate = originalFindOneAndUpdate;
    JobLock.updateOne = originalUpdateOne;
  });

  test('startJob and stopAllJobs register and gracefully tear down timers', () => {
    let callCount = 0;
    const originalFindOneAndUpdate = JobLock.findOneAndUpdate;
    const originalUpdateOne = JobLock.updateOne;

    JobLock.findOneAndUpdate = async (_query: any, update: any) => ({
      jobName: 'test-interval-job',
      lockedBy: update.$set.lockedBy
    });
    JobLock.updateOne = async () => ({ modifiedCount: 1 });

    const timer = startJob('test-interval-job', 100000, async () => {
      callCount++;
    });

    assert.ok(timer);
    stopAllJobs();

    JobLock.findOneAndUpdate = originalFindOneAndUpdate;
    JobLock.updateOne = originalUpdateOne;
  });
});

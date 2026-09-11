export {};
const mongoose = require('mongoose');

const jobLockSchema = new mongoose.Schema({
  jobName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  lockedAt: {
    type: Date,
    default: null
  },
  lockedBy: {
    type: String,
    default: null
  },
  lockExpiresAt: {
    type: Date,
    default: null
  },
  lastRunAt: {
    type: Date,
    default: null
  },
  lastStatus: {
    type: String,
    enum: ['idle', 'running', 'success', 'failed'],
    default: 'idle'
  },
  lastError: {
    type: String,
    default: null
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

jobLockSchema.index({ jobName: 1, lockExpiresAt: 1 });

const JobLock = mongoose.models.JobLock || mongoose.model('JobLock', jobLockSchema);

module.exports = JobLock;
module.exports.default = JobLock;

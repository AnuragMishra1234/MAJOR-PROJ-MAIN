import mongoose from 'mongoose';

/**
 * History — immutable log of all workflow events for a project.
 * Each agent action, AI generation, execution result, or error
 * is appended here for full audit trail.
 */
const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'prompt_submitted',
        'generation_started',
        'generation_completed',
        'code_executed',
        'validation_passed',
        'validation_failed',
        'error_detected',
        'auto_healed',
        'workflow_completed',
      ],
      required: true,
    },
    prompt: {
      type: String,
      default: '',
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    executionLogs: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // History is append-only — we disable update operations in practice
  }
);

// Index for efficient project history queries
historySchema.index({ projectId: 1, createdAt: 1 });

const History = mongoose.model('History', historySchema);
export default History;

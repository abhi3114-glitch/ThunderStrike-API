import mongoose, { Schema, Document } from 'mongoose';

export interface ScenarioMetrics {
  name: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  statusCodeCounts: Record<string, number>;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  timeoutCount?: number;
  errors?: string[];
}

export interface IChaosTest extends Document {
  targetId: mongoose.Types.ObjectId;
  scenarios: string[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  metrics?: ScenarioMetrics[];
  aiReportId?: mongoose.Types.ObjectId;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

const ScenarioMetricsSchema = new Schema({
  name: String,
  totalRequests: Number,
  successCount: Number,
  errorCount: Number,
  statusCodeCounts: {
    type: Map,
    of: Number,
  },
  avgLatencyMs: Number,
  p95LatencyMs: Number,
  p99LatencyMs: Number,
  timeoutCount: Number,
  errors: [String],
}, { _id: false });

const ChaosTestSchema: Schema = new Schema({
  targetId: {
    type: Schema.Types.ObjectId,
    ref: 'Target',
    required: true,
  },
  scenarios: {
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => v.length > 0,
      message: 'At least one scenario must be selected',
    },
  },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed'],
    default: 'queued',
  },
  metrics: [ScenarioMetricsSchema],
  aiReportId: {
    type: Schema.Types.ObjectId,
    ref: 'AIReport',
  },
  errorMessage: String,
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IChaosTest>('ChaosTest', ChaosTestSchema);
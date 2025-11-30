import mongoose, { Schema, Document } from 'mongoose';

export interface IAIReport extends Document {
  testId: mongoose.Types.ObjectId;
  title: string;
  summary: string;
  timeline: string[];
  recommendations: string[];
  createdAt: Date;
}

const AIReportSchema: Schema = new Schema({
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'ChaosTest',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  timeline: {
    type: [String],
    required: true,
  },
  recommendations: {
    type: [String],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IAIReport>('AIReport', AIReportSchema);
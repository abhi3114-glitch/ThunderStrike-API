import mongoose, { Schema, Document } from 'mongoose';

export interface ITarget extends Document {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  basePayload?: Record<string, any>;
  headers?: Record<string, string>;
  createdAt: Date;
}

const TargetSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  basePayload: {
    type: Schema.Types.Mixed,
    default: {},
  },
  headers: {
    type: Map,
    of: String,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<ITarget>('Target', TargetSchema);
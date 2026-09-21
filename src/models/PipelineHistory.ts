import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPipelineHistory extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  prompt: string;
  response: string;
  modelUsed: string;
  targetModel: string;
  confidence?: number;
  isBlocked: boolean;
  blockReason?: string;
  totalLatencyMs: number;
  tokensEstimated: number;
  metrics?: {
    actualCostUsd: number;
    baselineUnroutedCostUsd: number;
    costSavingsPercent: number;
    promptTokens: number;
    completionTokens: number;
  };
  createdAt: Date;
}

const PipelineHistorySchema = new Schema<IPipelineHistory>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    modelUsed: { type: String, required: true },
    targetModel: { type: String, required: true },
    confidence: { type: Number },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String },
    totalLatencyMs: { type: Number, default: 0 },
    tokensEstimated: { type: Number, default: 0 },
    metrics: {
      actualCostUsd: Number,
      baselineUnroutedCostUsd: Number,
      costSavingsPercent: Number,
      promptTokens: Number,
      completionTokens: Number,
    },
  },
  { timestamps: true }
);

export const PipelineHistory: Model<IPipelineHistory> =
  mongoose.models.PipelineHistory ||
  mongoose.model<IPipelineHistory>("PipelineHistory", PipelineHistorySchema);

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGameHistory extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  winner: "X" | "O" | "tie";
  difficulty: string;
  scores?: {
    player: number;
    bot: number;
    ties: number;
  };
  commentary?: string;
  createdAt: Date;
}

const GameHistorySchema = new Schema<IGameHistory>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    winner: { type: String, enum: ["X", "O", "tie"], required: true },
    difficulty: { type: String, required: true },
    scores: {
      player: Number,
      bot: Number,
      ties: Number,
    },
    commentary: { type: String },
  },
  { timestamps: true }
);

export const GameHistory: Model<IGameHistory> =
  mongoose.models.GameHistory ||
  mongoose.model<IGameHistory>("GameHistory", GameHistorySchema);

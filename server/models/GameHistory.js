
import mongoose from "mongoose";

const gameHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    moves: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["completed", "incomplete"],
      default: "completed",
    },
    playedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const GameHistory = mongoose.model(
  "GameHistory",
  gameHistorySchema
);

export default GameHistory;

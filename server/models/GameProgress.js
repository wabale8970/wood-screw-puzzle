import mongoose from "mongoose";

const gameProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    score: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1, max: 30 },
    moves: { type: Number, default: 0, min: 0 },
    unlockedLevel: { type: Number, default: 1, min: 1, max: 30 },
    completedLevels: {
      type: Map,
      of: Number,
      default: {},
    },

// Daily Rewards
coins: {
  type: Number,
  default: 0,
  min: 0,
},
lastDailyDate: {
  type: String,
  default: "",
},
dailyStreak: {
  type: Number,
  default: 0,
  min: 0,
},
claimedMilestones: {
  type: [Number],
  default: [],
},

  },
  { timestamps: true }
);

const GameProgress = mongoose.model("GameProgress", gameProgressSchema);

export default GameProgress;
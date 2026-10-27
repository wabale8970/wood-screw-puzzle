
import express from "express";
import GameHistory from "../models/GameHistory.js";
import jwt from "jsonwebtoken";

const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// Save game history
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { level, score, moves, status } = req.body;

    if (
      !Number.isInteger(level) ||
      level < 1 ||
      level > 30 ||
      !Number.isInteger(score) ||
      score < 0 ||
      !Number.isInteger(moves) ||
      moves < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid game history data",
      });
    }

    const history = await GameHistory.create({
      userId: req.userId,
      level,
      score,
      moves,
      status: status === "incomplete" ? "incomplete" : "completed",
    });

    res.status(201).json({
      success: true,
      message: "Game history saved successfully",
      history,
    });
  } catch (error) {
    console.error("Save history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not save game history",
    });
  }
});

// Get logged-in user's game history
router.get("/", authenticateToken, async (req, res) => {
  try {
    const history = await GameHistory.find({
      userId: req.userId,
    }).sort({ playedAt: -1 });

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Load history error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not load game history",
    });
  }
});

export default router;

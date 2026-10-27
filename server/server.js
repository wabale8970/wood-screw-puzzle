
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import GameProgress from "./models/GameProgress.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import gameHistoryRoutes from "./routes/gameHistory.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/history", gameHistoryRoutes);

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
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Wood Screw Puzzle API is running!"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    database: mongoose.connection.readyState === 1
      ? "Connected"
      : "Disconnected"
  });
});


app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Signup failed"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});


// GET: Load logged-in user's game progress
app.get("/api/progress", authenticateToken, async (req, res) => {
  try {
    let progress = await GameProgress.findOne({
      user: req.userId,
    });

    if (!progress) {
      progress = await GameProgress.create({
        user: req.userId,
        score: 0,
        level: 1,
        moves: 0,
        unlockedLevel: 1,
        completedLevels: {},

        coins: 0,
lastDailyDate: "",
dailyStreak: 0,
claimedMilestones: [],
      });
    }

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Load progress error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not load game progress",
    });
  }
});

// PUT: Save logged-in user's game progress
app.put("/api/progress", authenticateToken, async (req, res) => {
  try {
   const {
  score,
  level,
  moves,
  unlockedLevel,
  completedLevels,
  coins,
  lastDailyDate,
  dailyStreak,
  claimedMilestones,
} = req.body;

    const isValidNumber = (value) =>
      typeof value === "number" && Number.isInteger(value);

   if (
  !isValidNumber(score) ||
  score < 0 ||
  !isValidNumber(level) ||
  level < 1 ||
  level > 30 ||
  !isValidNumber(moves) ||
  moves < 0 ||
  !isValidNumber(unlockedLevel) ||
  unlockedLevel < 1 ||
  unlockedLevel > 30 ||
  !completedLevels ||
  typeof completedLevels !== "object" ||
  Array.isArray(completedLevels) ||

  !isValidNumber(coins) ||
  coins < 0 ||
  !isValidNumber(dailyStreak) ||
  dailyStreak < 0 ||
  typeof lastDailyDate !== "string" ||
  !Array.isArray(claimedMilestones) ||
  !claimedMilestones.every(
    (milestone) => isValidNumber(milestone) && milestone > 0
  )
) {
  return res.status(400).json({
    success: false,
    message: "Invalid game progress data",
  });
}
    const progress = await GameProgress.findOneAndUpdate(
      { user: req.userId },
      {
        $set: {
  score,
  level,
  moves,
  unlockedLevel,
  completedLevels,
  coins,
  lastDailyDate,
  dailyStreak,
  claimedMilestones,
},
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Game progress saved successfully",
      progress,
    });
  } catch (error) {
    console.error("Save progress error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not save game progress",
    });
  }
});


async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

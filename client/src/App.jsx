import { useEffect, useState, useRef } from "react";
import "./App.css";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { GAME_NAME } from "./config/gameConfig";
import { generateLevel } from "./data/levelGenerator";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const TOTAL_LEVELS = Infinity;

const PROGRESS_KEY = "woodPuzzleProgress";

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const DAILY_REWARDS = [25, 50, 75, 100, 125, 150, 250];

const MILESTONE_REWARDS = {
  5: 100,
  10: 250,
  15: 150,
  20: 300,
  25: 400,
  30: 1000,
};

const ACHIEVEMENTS = [
  { id: "first", title: "First Victory", icon: "🥉", levels: 1 },
  { id: "five", title: "Puzzle Starter", icon: "🧩", levels: 5 },
  { id: "ten", title: "Puzzle Expert", icon: "🥈", levels: 10 },
  { id: "twenty", title: "Master Solver", icon: "🥇", levels: 20 },
  { id: "thirty", title: "Wood Puzzle Champion", icon: "🏆", levels: 30 },
];

function getProgressKey(email) {
  return `${PROGRESS_KEY}:${email.trim().toLowerCase()}`;
}

function loadSavedProgress(email) {
  try {
    const saved = localStorage.getItem(getProgressKey(email));
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Could not load progress:", error);
    return null;
  }
}

function saveProgress(email, progress) {
  if (!email) return;

  try {
    localStorage.setItem(
      getProgressKey(email),
      JSON.stringify(progress)
    );
  } catch (error) {
    console.error("Could not save progress:", error);
  }
}


function createLevelScrews(level) {
  const generated = generateLevel(level);

  return generated.planks.flatMap((plank) =>
    plank.screws.map((screw) => ({
      ...screw,
      board: plank.id,
      x: 50,
      y: 50,
    }))
  );
}


function playCelebrationSound() {
  const audio = new Audio("/sounds/level--complete1.mp3");

  audio.volume = 0.7;

  audio.play().catch((error) => {
    console.log("Sound could not play:", error);
  });
}

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [playerName, setPlayerName] = useState("");
  const [level, setLevel] = useState(1);

  const [gameHistory, setGameHistory] = useState([]);

  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const backgroundMusicRef = useRef(null);

  const [settings, setSettings] = useState(() => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("woodPuzzleSettings") || "{}"
    );

    return {
      musicEnabled: saved.musicEnabled ?? true,
      soundEnabled: saved.soundEnabled ?? true,
      darkMode: saved.darkMode ?? false,
      vibrationEnabled: saved.vibrationEnabled ?? false,
    };
  } catch {
    return {
      musicEnabled: true,
      soundEnabled: true,
      darkMode: false,
      vibrationEnabled: false,
    };
  }
});

function updateSetting(key, value) {
  setSettings((previous) => ({
    ...previous,
    [key]: value,
  }));
}

function startBackgroundMusic() {
if (!settings.musicEnabled) {
  stopBackgroundMusic();
  return;
}

  if (!backgroundMusicRef.current) {
    backgroundMusicRef.current = new Audio(
      "/sounds/background.mp3"
    );

    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.25;
  }

  backgroundMusicRef.current.play().catch((error) => {
    console.log("Background music could not play:", error);
  });
}

function stopBackgroundMusic() {
  if (backgroundMusicRef.current) {
    backgroundMusicRef.current.pause();
    backgroundMusicRef.current.currentTime = 0;
  }
}

function playScrewSound() {
  if (!settings.soundEnabled) return;

  const audio = new Audio("/sounds/screw.mp3");
  audio.volume = 0.6;

  audio.play().catch((error) => {
    console.log("Screw sound could not play:", error);
  });
}

  const [isSessionReady, setIsSessionReady] = useState(false);

useEffect(() => {
  const savedEmail = localStorage.getItem("woodPuzzleSession");

  if (!savedEmail) {
    setIsSessionReady(true);
    return;
  }

  const email = savedEmail.trim().toLowerCase();

  try {
    const users = JSON.parse(
      localStorage.getItem("woodPuzzleUsers") || "[]"
    );

    const user = users.find(
      (item) => item.email?.trim().toLowerCase() === email
    );

    if (user) {
      const saved = loadSavedProgress(email) || {};
      const completed =
        saved.completedLevels &&
        typeof saved.completedLevels === "object" &&
        !Array.isArray(saved.completedLevels)
          ? saved.completedLevels
          : {};

      const unlockedNumber = Number(saved.unlockedLevel);
      const unlocked = Number.isInteger(unlockedNumber)
        ? Math.max(1, Math.min(TOTAL_LEVELS, unlockedNumber))
        : 1;

      setCurrentUserEmail(email);
setPlayerName(user.name || "Player");
setCompletedLevels(completed);
setUnlockedLevel(unlocked);

const savedLevel = Number(saved.level);
const restoredLevel =
  Number.isInteger(savedLevel) &&
  savedLevel >= 1 &&
  savedLevel <= unlocked
    ? savedLevel
    : unlocked;

const validIds = createLevelScrews(restoredLevel).map(
  (screw) => screw.id
);

setLevel(restoredLevel);
setMoves(Math.max(0, Number(saved.moves) || 0));
setScore(Math.max(0, Number(saved.score) || 0));

setRemovedScrews(
  Array.isArray(saved.removedScrews)
    ? saved.removedScrews.filter((id) => validIds.includes(id))
    : []
);

setCurrentPage(
  saved.currentPage === "game" ? "game" : "dashboard"
);
    } else {
      localStorage.removeItem("woodPuzzleSession");
    }
  } catch (error) {
    console.error("Could not restore session:", error);
    localStorage.removeItem("woodPuzzleSession");
  }

  setIsSessionReady(true);
}, []);


  const [completedLevels, setCompletedLevels] = useState({});
  const [unlockedLevel, setUnlockedLevel] = useState(1);

  const [rewards, setRewards] = useState({
  coins: 0,
  lastDailyDate: "",
  dailyStreak: 0,
  claimedMilestones: [],
});


const generatedLevel = generateLevel(level);
const planks = generatedLevel.planks;

const initialScrews = planks.flatMap((plank) =>
  plank.screws.map((screw, index) => ({
    ...screw,
    board: plank.id,
    x: index === 0 ? 25 : index === 1 ? 75 : 50,
    y: 50,
  }))
);

const boardRows = planks.length;

  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [removedScrews, setRemovedScrews] = useState([]);
  const [removingScrews, setRemovingScrews] = useState([]);

  const [fallingBoards, setFallingBoards] = useState([]);

  const [history, setHistory] = useState([]);
  const [hintScrew, setHintScrew] = useState(null);
  const [message, setMessage] = useState(
    "Remove both screws from the top board first!"
  );

  const nextScrew = initialScrews.find(
    (screw) => !removedScrews.includes(screw.id)
  );

  useEffect(() => {
  if (!currentUserEmail) return;

  const progress = {
    completedLevels,
    unlockedLevel,
    level,
    moves,
    score,
    removedScrews,
    currentPage,
    rewards,
  };

  // Keep the existing local backup
  saveProgress(currentUserEmail, progress);

  // Save supported game progress to MongoDB
  const token = localStorage.getItem("woodPuzzleToken");

  if (!token) return;

  const timer = setTimeout(async () => {
    try {
      const response = await fetch(
        `${API_URL}/progress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
         body: JSON.stringify({
  score,
  level,
  moves,
  unlockedLevel,
  completedLevels,
  coins: rewards.coins,
  lastDailyDate: rewards.lastDailyDate,
  dailyStreak: rewards.dailyStreak,
  claimedMilestones: rewards.claimedMilestones,
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Progress save failed:", data.message);
      }
    } catch (error) {
      console.error("Could not save progress to MongoDB:", error);
    }
  }, 700);

  return () => clearTimeout(timer);
}, [
  currentUserEmail,
  completedLevels,
  unlockedLevel,
  level,
  moves,
  score,
  removedScrews,
  currentPage,
  rewards,
]);


useEffect(() => {
  localStorage.setItem(
    "woodPuzzleSettings",
    JSON.stringify(settings)
  );
}, [settings]);

useEffect(() => {
  document.body.classList.toggle(
    "wood-dark-mode",
    settings.darkMode
  );

  return () => {
    document.body.classList.remove("wood-dark-mode");
  };
}, [settings.darkMode]);

useEffect(() => {
  if (!settings.musicEnabled) {
    stopBackgroundMusic();
  } else if (currentPage === "game") {
    startBackgroundMusic();
  }
}, [settings.musicEnabled, currentPage]);

  function startLevel(levelNumber) {
    const levelData = generateLevel(levelNumber);
console.log("Generated level:", levelData);
    startBackgroundMusic();
    if (levelNumber > unlockedLevel || levelNumber > TOTAL_LEVELS) {
      return;
    }

    setLevel(levelNumber);
    setFallingBoards([]);

    setRemovedScrews([]);
    setRemovingScrews([]);
    setHistory([]);
    setMoves(0);
    setScore(0);
    setHintScrew(null);
    setMessage("Remove both screws from the top board first!");
    setCurrentPage("game");
  }

  function handleScrewClick(screw) {
    if (
      removedScrews.includes(screw.id) ||
      removingScrews.includes(screw.id)
    ) {
      return;
    }

    const previousPlankHasScrews = initialScrews.some(
  (item) =>
    item.board === screw.board - 1 &&
    !removedScrews.includes(item.id) &&
    item.id !== screw.id
);

if (screw.board > 1 && previousPlankHasScrews) {
  setMessage(
    `🔒 Clear all screws from Plank ${screw.board - 1} first!`
  );
  return;
}

    playScrewSound();
startBackgroundMusic();

    setHistory((previous) => [
      ...previous,
      { removed: [...removedScrews], moves, score },
    ]);

    setRemovingScrews((previous) => [...previous, screw.id]);
    setMoves((previous) => previous + 1);
    setScore((previous) => previous + 10);
    setHintScrew(null);

    const remaining = initialScrews.filter(
      (item) =>
        !removedScrews.includes(item.id) &&
        item.id !== screw.id
    );

    if (remaining.length === 0) {
      stopBackgroundMusic();
  playCelebrationSound();

      const totalMoves = moves + 1;

      setShowLevelComplete(true);

      const earnedStars =
        totalMoves <= initialScrews.length
          ? 3
          : totalMoves <= initialScrews.length + 2
          ? 2
          : 1;

      setCompletedLevels((previous) => ({
        ...previous,
        [level]: Math.max(previous[level] || 0, earnedStars),
      }));

      setUnlockedLevel((previous) =>
  Math.max(previous, level + 1)
);
setRewards((previous) => {
  const milestone = level;
  const rewardAmount = MILESTONE_REWARDS[milestone];

  if (
    !rewardAmount ||
    previous.claimedMilestones.includes(milestone)
  ) {
    return previous;
  }

  return {
    ...previous,
    coins: previous.coins + rewardAmount,
    claimedMilestones: [
      ...previous.claimedMilestones,
      milestone,
    ],
  };
});


      setMessage(
        `🎉 Level ${level} completed! ⭐ ${earnedStars} stars!`
      );
    } else if (remaining.every((item) => item.board === 2)) {
      setMessage("✅ Top board cleared! Now remove the bottom screws.");
    } else {
      setMessage("Good move! Remove the next screw.");
    }

   setTimeout(() => {
  setRemovedScrews((previous) =>
    previous.includes(screw.id)
      ? previous
      : [...previous, screw.id]
  );

  setRemovingScrews((previous) =>
    previous.filter((id) => id !== screw.id)
  );

  // Check whether all screws on this board are removed
  const boardScrews = initialScrews.filter(
    (item) => item.board === screw.board
  );

  const boardWillBeCleared = boardScrews.every(
    (item) =>
      removedScrews.includes(item.id) ||
      item.id === screw.id
  );

  if (boardWillBeCleared) {
    setFallingBoards((previous) =>
      previous.includes(screw.board)
        ? previous
        : [...previous, screw.board]
    );
  }
}, 300);
  }

  function undoMove() {
    if (history.length === 0) return;

    const previous = history[history.length - 1];

    setRemovedScrews(previous.removed);
    setFallingBoards([]);
    setRemovingScrews([]);
    setMoves(previous.moves);
    setScore(previous.score);
    setHistory((items) => items.slice(0, -1));
    setHintScrew(null);
    setMessage("↶ Last move undone.");
  }

  function showHint() {
    if (!nextScrew) {
      setMessage("🎉 Puzzle already completed!");
      return;
    }

    setHintScrew(nextScrew.id);
    setMessage(
      `💡 Try screw ${nextScrew.id} on Board ${nextScrew.board}.`
    );
  }

  function restartGame() {
    setFallingBoards([]);
    setRemovedScrews([]);
    setRemovingScrews([]);
    setHistory([]);
    setMoves(0);
    setScore(0);
    setHintScrew(null);
    setMessage("Remove both screws from the top board first!");
  }

function nextLevel() {
  setShowLevelComplete(false);
  startLevel(level + 1);
}

function claimDailyReward() {
  const today = getLocalDateKey();

  if (rewards.lastDailyDate === today) {
    setMessage("🎁 You have already claimed today's reward!");
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isConsecutive =
    rewards.lastDailyDate === getLocalDateKey(yesterday);

  const nextStreak = isConsecutive
    ? (rewards.dailyStreak % DAILY_REWARDS.length) + 1
    : 1;

  const rewardAmount = DAILY_REWARDS[nextStreak - 1];

  setRewards((previous) => ({
    ...previous,
    coins: previous.coins + rewardAmount,
    lastDailyDate: today,
    dailyStreak: nextStreak,
  }));

  setMessage(
    `🎉 You claimed ${rewardAmount} coins! Day ${nextStreak} reward.`
  );
}


  function renderScrew(screw) {
    if (removedScrews.includes(screw.id)) return null;

    const isLocked =
      screw.board === 2 &&
      initialScrews.some(
        (item) =>
          item.board === 1 &&
          !removedScrews.includes(item.id)
      );

    return (
      <div
        className="screw-position"
        key={screw.id}
        style={{ left: `${screw.x}%`, top: `${screw.y}%` }}
      >
        <div className="screw-hole" />
        <button
          className={`screw ${
            hintScrew === screw.id ? "hinted" : ""
          } ${
            removingScrews.includes(screw.id) ? "removing" : ""
          } ${isLocked ? "locked-screw" : ""}`}
          onClick={() => handleScrewClick(screw)}
          aria-label={`Screw ${screw.id}`}
          disabled={removingScrews.includes(screw.id)}
        >
  <span className="screw-head">
    <span className="screw-slot" />
  </span>
</button>
      </div>
    );
  }

useEffect(() => {
  if (isSessionReady && currentPage === "history") {
    loadGameHistory();
  }
}, [isSessionReady, currentPage, currentUserEmail]);


  if (!isSessionReady) {
  return <div>Loading your game...</div>;
}


async function saveGameHistory(status = "completed") {
  const token = localStorage.getItem("woodPuzzleToken");

  if (!token) {
    console.warn("Please log in to save game history.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/history`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          level,
          score,
          moves,
          status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("History save failed:", data.message);
      return;
    }

    console.log("Game history saved successfully!");
  } catch (error) {
    console.error("Could not save game history:", error);
  }
}


async function loadGameHistory() {
  const token = localStorage.getItem("woodPuzzleToken");

  if (!token) {
    console.warn("Please log in to view game history.");
    return;
  }

  try {
    const response = await fetch(
  `${API_URL}/history`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    const data = await response.json();

    if (!response.ok) {
      console.error("History load failed:", data.message);
      return;
    }

   setGameHistory(
  Array.isArray(data.history) ? data.history : []
);
console.log("Game History:", data.history);
  } catch (error) {
    console.error("Could not load game history:", error);
  }
}


if (showLevelComplete) {
  return (
    <div className="level-complete">
      <div className="level-complete-card">
        <h1>🎉 LEVEL COMPLETE!</h1>
        <p>Great job! Puzzle solved.</p>

        <div className="completion-stats">
          <div>
            <span>⭐ Score</span>
            <strong>{score}</strong>
          </div>

          <div>
            <span>🔨 Moves</span>
            <strong>{moves}</strong>
          </div>
        </div>

        <p>{message}</p>

        
<button
  onClick={() => {
    setShowLevelComplete(false);
    startLevel(level + 1);
    saveGameHistory("completed");
  }}
>
  Next Level →
</button>


       
<button
  onClick={async () => {
    await saveGameHistory("completed");
    setShowLevelComplete(false);
    setCurrentPage("dashboard");
  }}
>
  🏠 Dashboard
</button>

      </div>
    </div>
  );
}

 if (currentPage === "login") {
  return (
    <Login
      onSignupClick={() => setCurrentPage("signup")}
     onLoginSuccess={async (user) => {
  const email = user?.email?.trim().toLowerCase();
  if (!email) return;

  // First, read the local backup
  const localSaved = loadSavedProgress(email) || {};
  let saved = localSaved;

  // Load progress from MongoDB using the login token
  const token = localStorage.getItem("woodPuzzleToken");

  if (token) {
    try {
      const response = await fetch(
        "http://localhost:5000/api/progress",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const serverSaved = data.progress;

        if (serverSaved) {
          const serverCompleted =
            serverSaved.completedLevels &&
            typeof serverSaved.completedLevels === "object"
              ? serverSaved.completedLevels
              : {};

          const hasServerProgress =
            Number(serverSaved.score) > 0 ||
            Number(serverSaved.level) > 1 ||
            Number(serverSaved.moves) > 0 ||
            Number(serverSaved.unlockedLevel) > 1 ||
            Object.keys(serverCompleted).length > 0;

          // Keep local progress if MongoDB only has default values
          if (hasServerProgress || !localSaved.level) {
            saved = {
              ...localSaved,
              ...serverSaved,
              completedLevels: serverCompleted,
            };
          }
        }
      } else {
        console.error("Could not load server progress:", response.status);
      }
    } catch (error) {
      console.error("Could not load progress from MongoDB:", error);
    }
  }

  const completed =
    saved.completedLevels &&
    typeof saved.completedLevels === "object" &&
    !Array.isArray(saved.completedLevels)
      ? saved.completedLevels
      : {};

  const savedUnlocked = Number(saved.unlockedLevel);
  const unlocked = Number.isInteger(savedUnlocked)
    ? Math.max(1, savedUnlocked)
    : 1;

  const savedLevel = Number(saved.level);
 const restoredLevel = Number.isInteger(savedLevel)
    ? Math.max(1, Math.min(unlocked, savedLevel))
    : unlocked;

  const validIds = createLevelScrews(restoredLevel).map(
    (screw) => screw.id
  );

  const restoredRemoved = Array.isArray(saved.removedScrews)
    ? saved.removedScrews.filter((id) => validIds.includes(id))
    : [];

  setCurrentUserEmail(email);
  localStorage.setItem("woodPuzzleSession", email);
  setPlayerName(user.name || "Player");
  setCompletedLevels(completed);

setRewards({
  coins: Math.max(
    0,
    Number(saved.coins ?? saved.rewards?.coins) || 0
  ),

  lastDailyDate:
    typeof (saved.lastDailyDate ?? saved.rewards?.lastDailyDate) === "string"
      ? (saved.lastDailyDate ?? saved.rewards?.lastDailyDate)
      : "",

  dailyStreak: Math.max(
    0,
    Number(saved.dailyStreak ?? saved.rewards?.dailyStreak) || 0
  ),

  claimedMilestones: Array.isArray(
    saved.claimedMilestones ?? saved.rewards?.claimedMilestones
  )
    ? (saved.claimedMilestones ?? saved.rewards?.claimedMilestones)
        .map(Number)
        .filter((n) => Object.hasOwn(MILESTONE_REWARDS, n))
    : [],
});

  setUnlockedLevel(unlocked);
  setLevel(restoredLevel);
  setRemovedScrews(restoredRemoved);
  setRemovingScrews([]);
  setMoves(Math.max(0, Number(saved.moves) || 0));
  setScore(Math.max(0, Number(saved.score) || 0));
  setHistory([]);
  setHintScrew(null);

  setMessage(
    restoredRemoved.length === validIds.length
      ? `🎉 Level ${restoredLevel} completed!`
      : "Remove both screws from the top board first!"
  );

  setCurrentPage(saved.currentPage === "game" ? "game" : "dashboard");
      }}
    />
  );
}

if (currentPage === "signup") {
    return (
      <Signup
        onLoginClick={() => setCurrentPage("login")}
      />
    );
  }

if (currentPage === "settings") {
  const settingItems = [
    {
      key: "musicEnabled",
      icon: "🎵",
      title: "Background Music",
      description: "Music while playing",
    },
    {
      key: "soundEnabled",
      icon: "🔊",
      title: "Sound Effects",
      description: "Screw and victory sounds",
    },
    {
      key: "darkMode",
      icon: "🌙",
      title: "Dark Mode",
      description: "Darker game appearance",
    },
    {
      key: "vibrationEnabled",
      icon: "📳",
      title: "Vibration",
      description: "Vibrate when removing screws",
    },
  ];

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-heading">
          <span>⚙️</span>
          <h1>Game Settings</h1>
          <p>Customize your puzzle experience</p>
        </div>

        <div className="settings-list">
          {settingItems.map((item) => (
            <div className="setting-row" key={item.key}>
              <div className="setting-icon">{item.icon}</div>

              <div className="setting-info">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </div>

              <button
                type="button"
                role="switch"
                aria-label={item.title}
                aria-checked={Boolean(settings[item.key])}
                className={`setting-toggle ${
                  settings[item.key] ? "active" : ""
                }`}
                onClick={() =>
                  updateSetting(item.key, !settings[item.key])
                }
              >
                <span />
              </button>
            </div>
          ))}
        </div>

        <button
          className="settings-back-button"
          onClick={() => setCurrentPage("dashboard")}
        >
          🏠 Back to Dashboard
        </button>

        <p className="settings-saved">
          ✓ Settings save automatically
        </p>
      </div>
    </div>
  );
}

if (currentPage === "history") {
  return (
    <div className="history-page">
      <div className="history-page-card">
        <div className="history-page-header">
          <h1>📜 Game History</h1>
          <p>Your Wood Screw Puzzle journey</p>
        </div>

        {gameHistory.length === 0 ? (
          <div className="history-empty">
            <span>🎮</span>
            <h2>No Game History Yet</h2>
            <p>Complete a level to see your results here.</p>
          </div>
        ) : (
          <div className="game-history-list">
            {gameHistory.map((item) => (
              <div
                className="game-history-item"
                key={item._id}
              >
                <strong>🎮 Level {item.level}</strong>
                <span>⭐ Score: {item.score}</span>
                <span>🔨 Moves: {item.moves}</span>
                <span>Status: {item.status}</span>

                <small>
                  {item.playedAt
                    ? new Date(item.playedAt).toLocaleString()
                    : ""}
                </small>
              </div>
            ))}
          </div>
        )}

        <button
          className="history-back-button"
          onClick={() => setCurrentPage("dashboard")}
        >
          🏠 Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// LEADERBOARD PAGE
if (currentPage === "leaderboard") {
  const players = (() => {
    try {
      const users = JSON.parse(
        localStorage.getItem("woodPuzzleUsers") || "[]"
      );

      return users
        .map((user) => {
          const email = user.email?.trim().toLowerCase();
          if (!email) return null;

          const saved = loadSavedProgress(email) || {};
          const completed = saved.completedLevels || {};

          const completedCount = Object.keys(completed).length;
          const stars = Object.values(completed).reduce(
            (total, value) => total + (Number(value) || 0),
            0
          );

          return {
            email,
            name: user.name || "Player",
            points: completedCount * 50 + stars * 100,
            completedCount,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.points - a.points);
    } catch {
      return [];
    }
  })();

  return (
    <div className="history-page">
      <div className="history-page-card">
        <div className="history-page-header">
          <h1>🏆 Leaderboard</h1>
          <p>See how players rank in the puzzle game.</p>
        </div>

        {players.length === 0 ? (
          <div className="history-empty">
            <span>🏆</span>
            <h2>No Players Yet</h2>
          </div>
        ) : (
          <div className="game-history-list">
            {players.map((player, index) => (
              <div
                className="game-history-item"
                key={player.email}
              >
                <strong>
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : `#${index + 1}`}{" "}
                  {player.name}
                  {player.email === currentUserEmail && " (You)"}
                </strong>

                <span>⭐ Points: {player.points}</span>
                <span>🎮 Completed Levels: {player.completedCount}</span>
              </div>
            ))}
          </div>
        )}

        <p>Points = 50 per completed level + 100 per star.</p>
        <p>Note: This version ranks players saved on this device.</p>

        <button
          className="history-back-button"
          onClick={() => setCurrentPage("dashboard")}
        >
          🏠 Back to Dashboard
        </button>
      </div>
    </div>
  );
}


// DAILY REWARDS PAGE
if (currentPage === "dailyRewards") {
  const today = getLocalDateKey();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isConsecutive =
    rewards.lastDailyDate === getLocalDateKey(yesterday);

  const nextStreak = isConsecutive
    ? (rewards.dailyStreak % DAILY_REWARDS.length) + 1
    : 1;

  const todayReward =
    DAILY_REWARDS[nextStreak - 1];

  const alreadyClaimed =
    rewards.lastDailyDate === today;

  return (
    <div className="history-page">
      <div className="history-page-card">
        <div className="history-page-header">
          <h1>🎁 Daily Rewards</h1>
          <p>Claim your daily coins and keep your streak going!</p>
        </div>

        <div className="history-empty">
          <span>🪙</span>
          <h2>Your Coins: {rewards.coins}</h2>
          <p>🔥 Daily Streak: {rewards.dailyStreak} / 7 days</p>
          <h2>🎉 Today's Reward: {todayReward} Coins</h2>

          {alreadyClaimed && (
            <p>✅ You have already claimed today's reward!</p>
          )}

          <button
            className="dashboard-start"
            onClick={claimDailyReward}
            disabled={alreadyClaimed}
          >
            {alreadyClaimed
              ? "✅ Reward Claimed"
              : "🎁 Claim Reward"}
          </button>
        </div>

        <h3>🏆 Daily Reward Schedule</h3>

        <div className="game-history-list">
          {DAILY_REWARDS.map((amount, index) => (
            <div className="game-history-item" key={index}>
              <strong>Day {index + 1}</strong>
              <span>🪙 {amount} Coins</span>
            </div>
          ))}
        </div>

        <button
          className="history-back-button"
          onClick={() => setCurrentPage("dashboard")}
        >
          🏠 Back to Dashboard
        </button>
      </div>
    </div>
  );
}


// ACHIEVEMENTS PAGE
if (currentPage === "achievements") {
  const completedCount = Object.keys(completedLevels).length;

  return (
    <div className="history-page">
      <div className="history-page-card">
        <div className="history-page-header">
          <h1>🎖️ Achievements</h1>
          <p>Complete levels to unlock special rewards.</p>
        </div>

        <div className="game-history-list">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked =
              completedCount >= achievement.levels;

            return (
              <div
                className="game-history-item"
                key={achievement.id}
                style={{
                  opacity: unlocked ? 1 : 0.6,
                  border: unlocked
                    ? "2px solid #d4a017"
                    : "1px solid #999",
                }}
              >
                <strong>
                  {unlocked ? achievement.icon : "🔒"}{" "}
                  {achievement.title}
                </strong>

                <span>
                  Complete {achievement.levels} level
                  {achievement.levels === 1 ? "" : "s"}
                </span>

                <span>
                  {unlocked ? "✅ Unlocked" : "🔒 Locked"}
                </span>
              </div>
            );
          })}
        </div>

        <p>
          Your completed levels: {completedCount}
        </p>

        <button
          className="history-back-button"
          onClick={() => setCurrentPage("dashboard")}
        >
          🏠 Back to Dashboard
        </button>
      </div>
    </div>
  );
}



  if (currentPage === "dashboard") {
    const completedCount = Object.keys(completedLevels).length;

    const totalStars = Object.values(completedLevels).reduce(
      (total, stars) => total + stars,
      0
    );

  const visibleLevelsCount = Math.max(50, unlockedLevel + 10);
const lockedCount = visibleLevelsCount - unlockedLevel;

    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <div className="dashboard-header">
            <div className="dashboard-avatar">🎮</div>

            <div>
              <p className="dashboard-tag">PLAYER DASHBOARD</p>
              <h1>
                Welcome, <span>{playerName || "Player"}</span>!
              </h1>
              <p className="dashboard-description">
              Your {GAME_NAME} journey starts here.
              </p>
            </div>
          </div>

          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <span>🏆</span>
              <strong>{completedCount}</strong>
              <small>Completed Levels</small>
            </div>

            <div className="dashboard-stat">
              <span>⭐</span>
              <strong>{totalStars}</strong>
              <small>Stars Earned</small>
            </div>

            <div className="dashboard-stat">
              <span>🔓</span>
              <strong>{unlockedLevel}</strong>
              <small>Unlocked Levels</small>
            </div>

            <div className="dashboard-stat">
              <span>🔒</span>
              <strong>{lockedCount}</strong>
              <small>Locked Levels</small>
            </div>
          </div>

          <div className="levels-section">
            <h2>🎮 All Levels</h2>

            <div className="levels-grid">
              {Array.from({ length: visibleLevelsCount }, (_, index) => {
                const levelNumber = index + 1;
                const stars = completedLevels[levelNumber] || 0;
                const isLocked = levelNumber > unlockedLevel;

                return (
                  <button
                    key={levelNumber}
                    className={`level-card ${
                      stars > 0
                        ? "completed"
                        : isLocked
                        ? "locked"
                        : "unlocked"
                    }`}
                    disabled={isLocked}
                    onClick={() => startLevel(levelNumber)}
                  >
                    <span>
                      {isLocked ? "🔒" : stars > 0 ? "🏆" : "🎮"}
                    </span>

                    <strong>Level {levelNumber}</strong>

                    <span className="level-stars">
                      {[1, 2, 3]
                        .map((star) => (star <= stars ? "★" : "☆"))
                        .join(" ")}
                    </span>

                    <small>
                      {isLocked
                        ? "Locked"
                        : stars > 0
                        ? "Completed"
                        : "Play Now"}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>

          <button
  className="dashboard-settings-button"
  onClick={() => setCurrentPage("settings")}
>
  ⚙️ Game Settings
</button>
          
       <button
  className="dashboard-settings-button"
  onClick={() => setCurrentPage("history")}
>
  📜 Game History
</button>

<button
  className="dashboard-settings-button"
  onClick={() => setCurrentPage("leaderboard")}
>
  🏆 Leaderboard
</button>

<button
  className="dashboard-settings-button"
  onClick={() => setCurrentPage("achievements")}
>
  🎖️ Achievements
</button>

          <button
            className="dashboard-start"
            onClick={() => startLevel(unlockedLevel)}
          >
            ▶ Continue Playing — Level {unlockedLevel}
          </button>

<button
  className="dashboard-settings-button"
  onClick={() => setCurrentPage("dailyRewards")}
>
  🎁 Daily Rewards
</button>


          <button
            className="dashboard-logout"
           onClick={() => {
            localStorage.removeItem("woodPuzzleSession");
  setCurrentUserEmail("");
  setPlayerName("");
  setCompletedLevels({});
  setUnlockedLevel(1);
  setLevel(1);
  setMoves(0);
  setScore(0);
  setRemovedScrews([]);
  setRemovingScrews([]);
  setHistory([]);
  setHintScrew(null);
  setMessage("Remove both top-board screws first!");
  setCurrentPage("login");
}}
          >
            ↩ Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <header className="topbar">
        <div className="logo">🔩 {GAME_NAME}</div>

        <div className="topbar-right">
          <button
  className="dashboard-home-button"
  onClick={() => {
    stopBackgroundMusic();
    setShowLevelComplete(false);
    setCurrentPage("dashboard");
  }}
>
  🏠 Dashboard
</button>

          <div className="level">LEVEL {level}</div>
        </div>
      </header>

      <main className="game-content">
        <h1>Wood Screw Puzzle</h1>

        <p className="subtitle">
          Clear the top wooden board to unlock the bottom board.
        </p>

        <div className="stats">
          <div className="stat-card">
            <span>⭐ Score</span>
            <strong>{score}</strong>
          </div>

          <div className="stat-card">
            <span>🔨 Moves</span>
            <strong>{moves}</strong>
          </div>
        </div>

<div className="puzzle-area">
  <div
  className="wood-board"
  style={{
    position: "relative",
    width: "100%",
    maxWidth: "650px",
    minHeight: `${Math.max(360, planks.length * 45 + 100)}px`,
    height: `${Math.max(360, planks.length * 45 + 100)}px`,
    margin: "0 auto",
    overflow: "hidden",
  }}
>
    {planks.map((plank, index) => {
  const plankStyles = [
  {
    width: "70%",
    height: "90px",
    transform: "rotate(0deg)",
    zIndex: 8,
  },
  {
    width: "82%",
    height: "90px",
    transform: "rotate(12deg)",
    zIndex: 7,
  },
  {
    width: "82%",
    height: "90px",
    transform: "rotate(-12deg)",
    zIndex: 6,
  },
  {
    width: "82%",
    height: "90px",
    transform: "rotate(6deg)",
    zIndex: 5,
  },
  {
    width: "82%",
    height: "90px",
    transform: "rotate(-6deg)",
    zIndex: 4,
  },
];


const style = plankStyles[index % plankStyles.length];

return (
  <div
    key={plank.id}
    className={`wood-plank ${
      fallingBoards.includes(plank.id) ? "plank-falling" : ""
    }`}
    style={{
      position: "absolute",
      left: "50%",
      top: `${20 + index * 45}px`,
      width: style.width,
      height: style.height,
      minHeight: style.height,
      transform: `translateX(-50%) ${style.transform}`,
      transformOrigin: "center",
      zIndex: planks.length - index,
      boxSizing: "border-box",
    }}
  >
    <span className="board-label">
      PLANK {plank.id}
    </span>

    {initialScrews
      .filter((screw) => screw.board === plank.id)
      .map(renderScrew)}
  </div>
);
})}



  </div>
</div>

        <p className="instruction">{message}</p>

        <div className="actions">
          <button
            className="action-button"
            onClick={undoMove}
            disabled={history.length === 0}
          >
            ↶ Undo
          </button>

          <button
            className="action-button"
            onClick={showHint}
            disabled={removedScrews.length === initialScrews.length}
          >
            💡 Hint
          </button>

          <button className="action-button" onClick={restartGame}>
            ↻ Restart
          </button>

          <button
            className="action-button next-button"
            onClick={nextLevel}
          >
            Next Level →
          </button>
        </div>
      </main>

      <footer>{GAME_NAME} • Play • Think • Solve</footer>
    </div>
  );
}

export default App;
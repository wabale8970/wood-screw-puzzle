
export function getLevelConfig(level) {
  const currentLevel = Math.max(
    1,
    Math.floor(Number(level) || 1)
  );

  let difficulty;

  if (currentLevel <= 5) {
    difficulty = "Easy";
  } else if (currentLevel <= 15) {
    difficulty = "Medium";
  } else if (currentLevel <= 30) {
    difficulty = "Hard";
  } else {
    difficulty = "Expert";
  }

  const plankCount = currentLevel + 3;

  const screwsPerPlank =
    currentLevel <= 5 ? 2 : 3;

  return {
    level: currentLevel,
    difficulty,
    plankCount,
    screwsPerPlank,
    holeCount: Math.max(
      3,
      Math.ceil(plankCount * 0.3)
    ),
  };
}

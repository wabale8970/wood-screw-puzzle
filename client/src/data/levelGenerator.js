
import { getLevelConfig } from "./levelConfig";

export function generateLevel(level) {
  const config = getLevelConfig(level);

  const planks = Array.from(
    { length: config.plankCount },
    (_, index) => {
      const plankId = index + 1;

      const screws = Array.from(
        { length: config.screwsPerPlank },
        (_, screwIndex) => ({
          id: `${plankId}-${screwIndex + 1}`,
          plankId,
          removed: false,
        })
      );

      return {
        id: plankId,
        x: 0,
        y: index * 70,
        width: 100,
        height: 65,
        angle: 0,
        screws,
      };
    }
  );

  return {
    ...config,
    planks,
  };
}

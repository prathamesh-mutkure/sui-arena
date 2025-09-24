export type TGameActivityInput = {
  keyStrokes: number;
  mouseClicks: number;
  totalGamePlayDuration: number; // in seconds
  numberOfGameplays: number;
};

/**
 * Calculates the gaming activity score based on user interactions and gameplay metrics
 * Formula explanation:
 * - Base interaction score: (keyStrokes + mouseClicks) × 2
 * - Time engagement factor: sqrt(totalGamePlayDuration) × 10
 * - Gameplay frequency bonus: numberOfGameplays × 100
 * - Activity multiplier: All combined with diminishing returns using sqrt
 */
export const calculateGamingActivity = ({
  keyStrokes,
  mouseClicks,
  totalGamePlayDuration,
  numberOfGameplays,
}: TGameActivityInput): number => {
  // Basic interaction score (keystrokes and clicks)
  const interactionScore = (keyStrokes + mouseClicks) * 2;

  // Time engagement factor (using sqrt for diminishing returns)
  const timeEngagementFactor = Math.sqrt(totalGamePlayDuration) * 10;

  // Gameplay frequency bonus
  const gameplayBonus = numberOfGameplays * 100;

  // Calculate final score with diminishing returns
  const rawScore = interactionScore + timeEngagementFactor + gameplayBonus;
  const finalScore = Math.floor(Math.sqrt(rawScore) * 100);

  return finalScore;
};

import { BADGES } from "@/lib/constants";
import { Flame, Trophy } from "lucide-react";

interface StreakCardProps {
  currentStreak: number;
  totalPoints: number;
  longestStreak: number;
  onCheckin: () => void;
  canCheckin: boolean;
}

export default function StreakCard({ currentStreak, totalPoints, longestStreak, onCheckin, canCheckin }: StreakCardProps) {
  const currentBadge = [...BADGES].reverse().find(b => currentStreak >= b.days);

  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-warning" /> Streak
        </h3>
        <span className="text-2xl">{currentBadge?.emoji ?? "🏁"}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-display font-bold text-primary">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Current</p>
        </div>
        <div>
          <p className="text-2xl font-display font-bold">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">Longest</p>
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-secondary">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
      </div>

      <button
        onClick={onCheckin}
        disabled={!canCheckin}
        className="w-full rounded-lg py-3 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:opacity-90"
      >
        {canCheckin ? "✅ I followed today's advice" : "🎉 Checked in today!"}
      </button>

      <div className="flex gap-2 justify-center">
        {BADGES.map((badge) => (
          <div
            key={badge.name}
            className={`flex flex-col items-center text-xs transition-all ${
              currentStreak >= badge.days ? "opacity-100 scale-110" : "opacity-30"
            }`}
          >
            <span className="text-lg">{badge.emoji}</span>
            <span className="text-muted-foreground">{badge.days}d</span>
          </div>
        ))}
      </div>
    </div>
  );
}

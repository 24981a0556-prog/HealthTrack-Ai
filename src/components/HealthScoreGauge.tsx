interface HealthScoreGaugeProps {
  score: number;
  riskLevel: string;
}

export default function HealthScoreGauge({ score, riskLevel }: HealthScoreGaugeProps) {
  const circumference = 2 * Math.PI * 60;
  const progress = (score / 100) * circumference;
  const color =
    riskLevel === "Low" ? "hsl(var(--success))" :
    riskLevel === "Moderate" ? "hsl(var(--warning))" :
    "hsl(var(--destructive))";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="60" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="70" cy="70" r="60" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform="rotate(-90 70 70)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: color, color: "white" }}
      >
        {riskLevel} Risk
      </span>
    </div>
  );
}

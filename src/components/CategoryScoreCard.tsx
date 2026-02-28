import { Progress } from "@/components/ui/progress";

interface CategoryScoreCardProps {
  name: string;
  score: number;
  interpretation: string;
  icon: string;
}

const interpretationStyles: Record<string, string> = {
  Good: "bg-success/10 text-success",
  "Moderate Risk": "bg-warning/10 text-warning",
  "High Risk": "bg-destructive/10 text-destructive",
  Critical: "bg-destructive/20 text-destructive",
};

const progressColor: Record<string, string> = {
  Good: "[&>div]:bg-success",
  "Moderate Risk": "[&>div]:bg-warning",
  "High Risk": "[&>div]:bg-destructive/70",
  Critical: "[&>div]:bg-destructive",
};

export default function CategoryScoreCard({ name, score, interpretation, icon }: CategoryScoreCardProps) {
  return (
    <div className="glass-card rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <p className="text-sm font-semibold">{name}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${interpretationStyles[interpretation] ?? "bg-muted text-muted-foreground"}`}>
          {interpretation}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={score} className={`h-2 flex-1 ${progressColor[interpretation] ?? ""}`} />
        <span className="text-sm font-display font-bold w-8 text-right">{score}</span>
      </div>
    </div>
  );
}

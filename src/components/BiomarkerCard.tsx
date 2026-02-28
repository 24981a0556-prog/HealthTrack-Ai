interface BiomarkerCardProps {
  name: string;
  value: number;
  unit: string;
  status: string;
}

export default function BiomarkerCard({ name, value, unit, status }: BiomarkerCardProps) {
  const statusColor =
    status === "Normal" ? "bg-success/10 text-success" :
    status === "Mild" || status === "Borderline" ? "bg-warning/10 text-warning" :
    status === "Critical" ? "bg-destructive/20 text-destructive" :
    "bg-destructive/10 text-destructive";

  return (
    <div className="glass-card rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-2xl font-display font-bold">
          {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
        {status}
      </span>
    </div>
  );
}

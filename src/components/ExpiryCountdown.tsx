import { differenceInDays, format } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";

interface ExpiryCountdownProps {
  expiresAt: string;
}

export default function ExpiryCountdown({ expiresAt }: ExpiryCountdownProps) {
  const expiryDate = new Date(expiresAt);
  const daysLeft = differenceInDays(expiryDate, new Date());
  const isUrgent = daysLeft <= 15;
  const isExpired = daysLeft < 0;

  return (
    <div className={`rounded-xl p-4 flex items-center gap-3 border ${
      isExpired ? "bg-destructive/10 border-destructive/30" :
      isUrgent ? "bg-warning/10 border-warning/30" :
      "bg-accent border-border"
    }`}>
      {isUrgent || isExpired ? (
        <AlertTriangle className={`h-5 w-5 shrink-0 ${isExpired ? "text-destructive" : "text-warning"}`} />
      ) : (
        <Clock className="h-5 w-5 shrink-0 text-primary" />
      )}
      <div>
        <p className="text-sm font-medium">
          {isExpired ? "Report expired" : `${daysLeft} days until expiry`}
        </p>
        <p className="text-xs text-muted-foreground">
          Expires {format(expiryDate, "MMM d, yyyy")}
        </p>
      </div>
    </div>
  );
}

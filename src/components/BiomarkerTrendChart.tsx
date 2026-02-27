import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface BiomarkerData {
  report_id: string;
  name: string;
  value: number | null;
  unit: string | null;
  status: string | null;
  created_at: string;
}

interface ReportData {
  id: string;
  created_at: string;
}

interface BiomarkerTrendChartProps {
  biomarkers: BiomarkerData[];
  reports: ReportData[];
}

const COLORS = [
  "hsl(199, 89%, 48%)",  // primary
  "hsl(160, 60%, 45%)",  // secondary/success
  "hsl(38, 92%, 50%)",   // warning
  "hsl(270, 60%, 55%)",  // purple
  "hsl(340, 70%, 55%)",  // pink
];

export default function BiomarkerTrendChart({ biomarkers, reports }: BiomarkerTrendChartProps) {
  const { chartData, biomarkerNames } = useMemo(() => {
    if (reports.length < 2 || biomarkers.length === 0) return { chartData: [], biomarkerNames: [] };

    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const names = [...new Set(biomarkers.map((b) => b.name))].slice(0, 5);

    const data = sortedReports.map((report) => {
      const entry: Record<string, string | number | null> = {
        date: new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
      names.forEach((name) => {
        const match = biomarkers.find((b) => b.report_id === report.id && b.name === name);
        entry[name] = match?.value ?? null;
      });
      return entry;
    });

    return { chartData: data, biomarkerNames: names };
  }, [biomarkers, reports]);

  if (chartData.length < 2) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <TrendingUp className="h-5 w-5 text-primary" /> Biomarker Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Upload at least 2 reports to see trends over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <TrendingUp className="h-5 w-5 text-primary" /> Biomarker Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" strokeOpacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(210, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 15%, 50%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(210, 20%, 90%)",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              {biomarkerNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HealthScoreGauge from "@/components/HealthScoreGauge";
import StreakCard from "@/components/StreakCard";
import ExpiryCountdown from "@/components/ExpiryCountdown";
import BiomarkerCard from "@/components/BiomarkerCard";
import CategoryScoreCard from "@/components/CategoryScoreCard";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Crown } from "lucide-react";
import BiomarkerTrendChart from "@/components/BiomarkerTrendChart";
import HealthChatbot from "@/components/HealthChatbot";
import { toast } from "sonner";
import { FREE_REPORT_LIMIT } from "@/lib/constants";

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  anemia: { label: "Anemia", icon: "🩸" },
  immunity: { label: "Immunity", icon: "🛡️" },
  heart_risk: { label: "Heart Risk", icon: "❤️" },
  diabetes_risk: { label: "Diabetes Risk", icon: "🍬" },
  organ_health: { label: "Organ Health", icon: "🫁" },
};

export default function Dashboard() {
  const { user, loading, isPro } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [biomarkers, setBiomarkers] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    const [reportsRes, biomarkersRes, streakRes] = await Promise.all([
      supabase.from("reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("biomarkers").select("*").eq("user_id", user.id),
      supabase.from("streaks").select("*").eq("user_id", user.id).single(),
    ]);
    if (reportsRes.data) setReports(reportsRes.data);
    if (biomarkersRes.data) setBiomarkers(biomarkersRes.data);
    if (streakRes.data) setStreak(streakRes.data);
    setLoadingData(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckin = async () => {
    if (!user || !streak) return;
    const today = new Date().toISOString().split("T")[0];
    if (streak.last_checkin_date === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = streak.last_checkin_date === yesterday.toISOString().split("T")[0];
    const newStreak = isConsecutive ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longest_streak);
    const { error } = await supabase.from("streaks").update({
      current_streak: newStreak, longest_streak: newLongest, total_points: streak.total_points + 10, last_checkin_date: today,
    }).eq("user_id", user.id);
    if (error) { toast.error("Check-in failed"); return; }
    toast.success("+10 points! 🎉");
    fetchData();
  };

  const latestReport = reports[0];
  const latestBiomarkers = latestReport ? biomarkers.filter(b => b.report_id === latestReport.id) : [];
  const categoryScores = latestReport?.category_scores as Record<string, { score: number; interpretation: string }> | null;
  const today = new Date().toISOString().split("T")[0];
  const canCheckin = streak ? streak.last_checkin_date !== today : true;

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {isPro ? (
                <span className="inline-flex items-center gap-1"><Crown className="h-4 w-4 text-warning" /> Pro Member</span>
              ) : (
                `Free Plan · ${reports.length}/${FREE_REPORT_LIMIT} reports`
              )}
            </p>
          </div>
          <Button onClick={() => navigate("/upload")} disabled={!isPro && reports.length >= FREE_REPORT_LIMIT}>
            <Upload className="h-4 w-4 mr-2" /> Upload Report
          </Button>
        </div>

        {reports.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold">No Reports Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Upload your first medical report to get AI-powered health insights, risk scoring, and personalized action plans.</p>
            <Button onClick={() => navigate("/upload")}>
              <Upload className="h-4 w-4 mr-2" /> Upload Your First Report
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {latestReport && (
                <div className="glass-card rounded-xl p-6">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <HealthScoreGauge score={latestReport.health_score ?? 0} riskLevel={latestReport.risk_level ?? "Low"} />
                    <div className="flex-1 space-y-3">
                      <h3 className="font-display font-semibold text-lg">Latest Analysis</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{latestReport.ai_explanation ?? "Analysis pending..."}</p>
                      {latestReport.suggestions && (
                        <ul className="space-y-1">
                          {latestReport.suggestions.map((s: string, i: number) => (
                            <li key={i} className="text-sm flex gap-2"><span className="text-primary">•</span> {s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Category Scores */}
              {categoryScores && Object.keys(categoryScores).length > 0 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-3">Health Categories</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(categoryScores).map(([key, val]) => {
                      const meta = CATEGORY_META[key] || { label: key, icon: "📊" };
                      return <CategoryScoreCard key={key} name={meta.label} score={val.score} interpretation={val.interpretation} icon={meta.icon} />;
                    })}
                  </div>
                </div>
              )}

              {isPro && reports.length >= 2 && biomarkers.length > 0 && (
                <BiomarkerTrendChart biomarkers={biomarkers} reports={reports} />
              )}

              {latestBiomarkers.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold text-lg mb-3">Biomarkers</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {latestBiomarkers.map((b) => (
                      <BiomarkerCard key={b.id} name={b.name} value={b.value} unit={b.unit} status={b.status} />
                    ))}
                  </div>
                </div>
              )}

              {/* Report History */}
              <div>
                <h3 className="font-display font-semibold text-lg mb-3">Report History</h3>
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{r.file_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {r.risk_level && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.risk_level === "Low" ? "bg-success/10 text-success" :
                            r.risk_level === "Moderate" ? "bg-warning/10 text-warning" :
                            "bg-destructive/10 text-destructive"
                          }`}>{r.risk_level}</span>
                        )}
                        <ExpiryCountdown expiresAt={r.expires_at} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {streak && (
                <StreakCard currentStreak={streak.current_streak} totalPoints={streak.total_points} longestStreak={streak.longest_streak} onCheckin={handleCheckin} canCheckin={canCheckin} />
              )}
              {latestReport && <ExpiryCountdown expiresAt={latestReport.expires_at} />}
              {!isPro && (
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-3">
                  <Crown className="h-8 w-8 mx-auto text-primary" />
                  <h3 className="font-display font-semibold">Upgrade to Pro</h3>
                  <p className="text-sm text-muted-foreground">Unlimited reports, trend graphs, and advanced AI insights.</p>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/pricing")}>View Plans</Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-xs text-muted-foreground">⚕️ This tool provides informational insights and does not replace professional medical advice.</p>
        </div>
      </div>
      {reports.length > 0 && <HealthChatbot />}
    </div>
  );
}

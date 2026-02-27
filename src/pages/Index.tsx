import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Shield, Brain, TrendingUp, Zap, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  { icon: Brain, title: "AI-Powered Analysis", desc: "Get instant insights from your medical reports using advanced AI" },
  { icon: Shield, title: "Risk Scoring", desc: "Deterministic health scoring based on key biomarkers" },
  { icon: TrendingUp, title: "Track Progress", desc: "Monitor your health journey with streaks and gamification" },
  { icon: Clock, title: "Expiry Alerts", desc: "Never miss a report renewal with smart reminders" },
  { icon: Zap, title: "Actionable Plans", desc: "Receive personalized lifestyle suggestions" },
  { icon: Activity, title: "Biomarker Dashboard", desc: "Visualize HbA1c, Cholesterol, HDL, LDL and more" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container relative py-24 md:py-32 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Activity className="h-4 w-4" /> AI-Powered Health Compliance
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight max-w-3xl mx-auto">
            Your Health Reports,{" "}
            <span className="text-gradient">Understood</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload medical reports, get AI analysis, risk scores, and actionable health plans — all in one beautiful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-8">
              Start Free — No Card Required
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="text-base px-8">
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-3">Everything You Need</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">A comprehensive health compliance platform that turns complex reports into simple insights.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-xl p-6 hover:shadow-xl transition-shadow group">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="container pb-20">
        <div className="rounded-xl bg-muted p-6 text-center">
          <p className="text-sm text-muted-foreground">
            ⚕️ <strong>Disclaimer:</strong> This tool provides informational insights and does not replace professional medical advice.
            Always consult a qualified healthcare provider for medical decisions.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display font-bold text-foreground">
            <Activity className="h-5 w-5 text-primary" /> HealthTrack AI
          </div>
          <p>© {new Date().getFullYear()} HealthTrack AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

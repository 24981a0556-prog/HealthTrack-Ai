import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { STRIPE_PRO_PRICE_ID } from "@/lib/constants";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["2 medical reports", "AI biomarker extraction", "Risk scoring", "Health dashboard", "Streak gamification"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    features: ["Unlimited reports", "Advanced AI insights", "Trend graphs", "Priority analysis", "Expiry reminders", "All Free features"],
    cta: "Upgrade to Pro",
    popular: true,
  },
];

export default function Pricing() {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!user) { navigate("/auth"); return; }

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_PRO_PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Failed to open portal");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="font-display text-4xl font-bold">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Start free. Upgrade when you need more power.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card rounded-2xl p-8 relative ${
                plan.popular ? "ring-2 ring-primary shadow-xl" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  <Crown className="h-3 w-3" /> Most Popular
                </div>
              )}
              <div className="text-center space-y-2 mb-6">
                <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                <div>
                  <span className="text-4xl font-display font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {plan.popular ? (
                isPro ? (
                  <Button variant="outline" className="w-full" onClick={handleManage}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleUpgrade}>
                    {plan.cta}
                  </Button>
                )
              ) : (
                <Button variant="outline" className="w-full" onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                  {user ? "Current Plan" : plan.cta}
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-muted p-4 text-center max-w-3xl mx-auto">
          <p className="text-xs text-muted-foreground">
            ⚕️ This tool provides informational insights and does not replace professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

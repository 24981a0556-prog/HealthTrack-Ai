import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass-card border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-gradient">HealthTrack AI</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/upload" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Upload</Link>
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              <Button size="sm" onClick={() => navigate("/auth")}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-card p-4 space-y-3">
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-sm font-medium">Dashboard</Link>
              <Link to="/upload" onClick={() => setOpen(false)} className="block text-sm font-medium">Upload</Link>
              <Link to="/pricing" onClick={() => setOpen(false)} className="block text-sm font-medium">Pricing</Link>
              <button onClick={() => { signOut(); navigate("/"); setOpen(false); }} className="block text-sm text-destructive">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/pricing" onClick={() => setOpen(false)} className="block text-sm font-medium">Pricing</Link>
              <Link to="/auth" onClick={() => setOpen(false)} className="block text-sm font-medium text-primary">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

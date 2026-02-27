import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FREE_REPORT_LIMIT } from "@/lib/constants";

export default function UploadReport() {
  const { user, loading, isPro } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase.from("reports").select("id", { count: "exact" }).eq("user_id", user.id)
        .then(({ count }) => setReportCount(count ?? 0));
    }
  }, [user]);

  const canUpload = isPro || reportCount < FREE_REPORT_LIMIT;

  const handleUpload = async () => {
    if (!file || !user) return;
    if (!canUpload) {
      toast.error("Upgrade to Pro for unlimited reports");
      navigate("/pricing");
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("medical-reports").upload(filePath, file);
    if (uploadError) { toast.error("Upload failed: " + uploadError.message); setUploading(false); return; }

    // Create report record
    const { data: report, error: reportError } = await supabase.from("reports").insert({
      user_id: user.id,
      file_name: file.name,
      file_path: filePath,
    }).select().single();

    if (reportError) { toast.error("Failed to save report"); setUploading(false); return; }

    setUploading(false);
    setAnalyzing(true);
    toast.info("Report uploaded! AI is analyzing...");

    // Trigger AI analysis
    try {
      const { data, error } = await supabase.functions.invoke("analyze-report", {
        body: { reportId: report.id },
      });

      if (error) throw error;
      toast.success("Analysis complete! 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Analysis failed. You can retry from dashboard.");
      navigate("/dashboard");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-xl py-12 space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold mb-2">Upload Medical Report</h1>
          <p className="text-muted-foreground">
            Upload a PDF or image of your medical report. Our AI will extract biomarkers and provide analysis.
          </p>
        </div>

        <div className="glass-card rounded-xl p-8 space-y-6">
          {!canUpload ? (
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">You've reached the free plan limit of {FREE_REPORT_LIMIT} reports.</p>
              <Button onClick={() => navigate("/pricing")}>Upgrade to Pro</Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="file">Medical Report (PDF or Image)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={uploading || analyzing}
                />
              </div>

              {file && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={!file || uploading || analyzing}
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                ) : analyzing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing with AI...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Upload & Analyze</>
                )}
              </Button>
            </>
          )}
        </div>

        <div className="rounded-xl bg-muted p-4 text-center">
          <p className="text-xs text-muted-foreground">
            ⚕️ This tool provides informational insights and does not replace professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

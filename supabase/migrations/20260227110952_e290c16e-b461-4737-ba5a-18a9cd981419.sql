
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  extracted_text TEXT,
  health_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('Low', 'Moderate', 'High')),
  ai_explanation TEXT,
  suggestions TEXT[],
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);

-- Create biomarkers table
CREATE TABLE public.biomarkers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  status TEXT CHECK (status IN ('Normal', 'Borderline', 'High', 'Low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.biomarkers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own biomarkers" ON public.biomarkers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own biomarkers" ON public.biomarkers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create streaks table
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger function for profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', false);

CREATE POLICY "Users can upload own reports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own reports" ON storage.objects FOR SELECT USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own reports" ON storage.objects FOR DELETE USING (bucket_id = 'medical-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

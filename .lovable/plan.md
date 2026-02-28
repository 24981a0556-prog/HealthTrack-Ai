

# Plan: Chat Persistence, Expanded Biomarkers, and Structured Health Scoring

## Overview

Three major changes: (1) save chat messages to the database so conversations persist across sessions, (2) increase the free report limit to 5, and (3) overhaul the AI analysis to extract 14 biomarkers with category-based scoring (Anemia, Immunity, Heart Risk, Diabetes Risk, Organ Health).

---

## 1. Chat Message Persistence

### Database Migration
Create a `chat_messages` table:
```sql
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,  -- 'user' or 'assistant'
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id, created_at);
```

### Frontend Changes (`src/components/HealthChatbot.tsx`)
- On open, load previous messages from `chat_messages` table (last 50, ordered by `created_at`)
- After each user message and completed assistant response, insert into `chat_messages`
- Add a "Clear Chat" button in the header

---

## 2. Increase Free Report Limit

### Change (`src/lib/constants.ts`)
- Update `FREE_REPORT_LIMIT` from `2` to `5`

---

## 3. Expanded Biomarker Extraction and Structured Health Scoring

### Database Migration
Add a `category_scores` JSONB column to the `reports` table to store structured category scores:
```sql
ALTER TABLE public.reports ADD COLUMN category_scores jsonb;
```

This will store:
```json
{
  "anemia": { "score": 85, "interpretation": "Good" },
  "immunity": { "score": 72, "interpretation": "Moderate Risk" },
  "heart_risk": { "score": 60, "interpretation": "Moderate Risk" },
  "diabetes_risk": { "score": 45, "interpretation": "High Risk" },
  "organ_health": { "score": 90, "interpretation": "Good" }
}
```

### Edge Function (`supabase/functions/analyze-report/index.ts`)

**Step 1 - Expanded Extraction Prompt**: Update the AI prompt to extract all 14 biomarkers:
Hemoglobin, PCV, RBC, WBC, Platelets, HbA1c, Fasting Blood Sugar, Total Cholesterol, LDL, HDL, Triglycerides, Creatinine, ALT, AST.

**Step 2 - Deterministic Scoring Logic** (in the edge function, not AI-dependent):
- Each biomarker gets a score (100=Normal, 70=Mild, 40=Moderate, 10=Severe) based on reference ranges
- Reference ranges defined as constants in the function

**Step 3 - Category Score Calculation**:
- **Anemia Score**: Hemoglobin (50%) + PCV (30%) + RBC (20%)
- **Immunity Score**: WBC (60%) + Platelets (40%)
- **Heart Risk Score**: LDL (30%) + HDL (25%) + Triglycerides (25%) + Cholesterol (20%)
- **Diabetes Risk Score**: HbA1c (60%) + Fasting Blood Sugar (40%)
- **Organ Health Score**: Creatinine (40%) + ALT (30%) + AST (30%)

**Step 4 - Overall Score**: Average of all category scores

**Step 5 - Interpretation**:
- 80-100: Good
- 60-79: Moderate Risk
- 40-59: High Risk
- Below 40: Critical

**Step 6 - AI Explanation Prompt**: Updated to include category breakdowns, lifestyle recommendations, and "when to consult a doctor" guidance. No diagnosis.

### Dashboard UI Updates (`src/pages/Dashboard.tsx`)

- Display category score cards (Anemia, Immunity, Heart Risk, Diabetes Risk, Organ Health) with progress bars and color coding
- Show interpretation label on each category
- Update the overall health score gauge to use the new averaged score

### BiomarkerCard Updates
- Support new status values: Low, Normal, High, Critical (in addition to existing Borderline)

### New Component: `CategoryScoreCard.tsx`
- Displays a category name, score (0-100), progress bar, and interpretation badge
- Color coded: green (Good), yellow (Moderate), orange (High Risk), red (Critical)

---

## Technical Details

### Biomarker Reference Ranges (used in edge function scoring)

| Parameter | Normal | Mild Abnormal | Moderate | Severe |
|-----------|--------|---------------|----------|--------|
| Hemoglobin (g/dL) | 13-17 (M), 12-15.5 (F) | 11-12.9 / 17.1-18 | 8-10.9 / 18.1-20 | <8 / >20 |
| PCV (%) | 38.3-48.6 | 35-38.2 / 48.7-52 | 30-34.9 / 52.1-55 | <30 / >55 |
| RBC (M/uL) | 4.5-5.5 | 4-4.4 / 5.6-6 | 3-3.9 / 6.1-7 | <3 / >7 |
| WBC (K/uL) | 4-11 | 3-3.9 / 11.1-15 | 2-2.9 / 15.1-20 | <2 / >20 |
| Platelets (K/uL) | 150-400 | 100-149 / 401-500 | 50-99 / 501-600 | <50 / >600 |
| HbA1c (%) | <5.7 | 5.7-6.4 | 6.5-8 | >8 |
| Fasting Blood Sugar (mg/dL) | 70-100 | 100-125 | 126-200 | >200 |
| Total Cholesterol (mg/dL) | <200 | 200-239 | 240-300 | >300 |
| LDL (mg/dL) | <100 | 100-159 | 160-190 | >190 |
| HDL (mg/dL) | >60 | 40-59 | 20-39 | <20 |
| Triglycerides (mg/dL) | <150 | 150-199 | 200-499 | >500 |
| Creatinine (mg/dL) | 0.7-1.3 | 1.4-1.9 | 2-4 | >4 |
| ALT (U/L) | 7-56 | 57-100 | 101-200 | >200 |
| AST (U/L) | 10-40 | 41-100 | 101-200 | >200 |

### Files Modified
1. **New migration** - `chat_messages` table + `category_scores` column on reports
2. `src/lib/constants.ts` - FREE_REPORT_LIMIT = 5, updated BIOMARKER_THRESHOLDS
3. `supabase/functions/analyze-report/index.ts` - Complete rewrite of extraction + scoring logic
4. `src/components/HealthChatbot.tsx` - Load/save messages from database
5. `src/components/CategoryScoreCard.tsx` - New component for category scores
6. `src/components/BiomarkerCard.tsx` - Support new status values (Low, Critical)
7. `src/pages/Dashboard.tsx` - Display category scores section
8. `supabase/functions/health-chat/index.ts` - Include category_scores in health context


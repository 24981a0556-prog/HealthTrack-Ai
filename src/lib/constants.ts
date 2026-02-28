export const STRIPE_PRO_PRICE_ID = "price_1T5OujADU3LbqoqZhNpln3g3";
export const STRIPE_PRO_PRODUCT_ID = "prod_U3VwjZNd9kN9xm";

export const FREE_REPORT_LIMIT = 5;

export const BIOMARKER_THRESHOLDS = {
  HbA1c: { normal: 5.7, borderline: 6.4, high: 6.5, unit: "%", weight: 20 },
  Cholesterol: { normal: 200, borderline: 239, high: 240, unit: "mg/dL", weight: 15 },
  HDL: { normal: 60, borderline: 40, low: 39, unit: "mg/dL", weight: 10 },
  LDL: { normal: 100, borderline: 129, high: 130, unit: "mg/dL", weight: 15 },
  Hemoglobin: { normalMale: [13.5, 17.5], normalFemale: [12, 15.5], unit: "g/dL", weight: 10 },
} as const;

export const BADGES = [
  { name: "Bronze", days: 7, emoji: "🥉" },
  { name: "Silver", days: 30, emoji: "🥈" },
  { name: "Gold", days: 90, emoji: "🥇" },
] as const;

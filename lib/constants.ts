export const CITY_DEFAULT = "DERBENT";
export const CITY_LABEL = "Дербент";

export const TOP_UP_EXPIRES_MINUTES = 30;

export const CATEGORIES = [
  "Уборка",
  "Грузчики",
  "Курьер",
  "Няня",
  "Строительство",
  "Бариста",
  "Официант",
  "Сантехник",
  "Электрик",
  "Ремонт"
] as const;

export const PRICE_TYPE_LABELS = {
  PER_SQM: "за м2",
  PER_HOUR: "за час",
  FIXED: "фикс",
  NEGOTIABLE: "договорная"
} as const;

export const PAY_TYPE_LABELS = {
  PER_HOUR: "за час",
  FIXED: "фикс",
  NEGOTIABLE: "договорная"
} as const;

export const TARIFF_KIND_LABELS = {
  BASIC: "Базовый",
  PREMIUM: "Премиум",
  GOLD: "Gold"
} as const;

export const TARIFF_KIND_BADGE_STYLES = {
  BASIC: "bg-slate-100 text-slate-700",
  PREMIUM: "bg-amber-100 text-amber-800",
  GOLD: "bg-yellow-200 text-yellow-900"
} as const;

export const TARIFF_KIND_CARD_STYLES = {
  BASIC: "border-border",
  PREMIUM: "border-amber-300 bg-amber-50/30",
  GOLD: "border-yellow-400 bg-yellow-50/40"
} as const;

export const TARIFF_KIND_SORT_PRIORITY = {
  GOLD: 0,
  PREMIUM: 1,
  BASIC: 2
} as const;

export const EXPERIENCE_RANGES = [
  { label: "0-1", min: 0, max: 1 },
  { label: "1-3", min: 1, max: 3 },
  { label: "3-5", min: 3, max: 5 },
  { label: "5+", min: 5, max: 100 }
] as const;

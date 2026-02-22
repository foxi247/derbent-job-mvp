export const CITY_DEFAULT = "DERBENT";
export const CITY_LABEL = "Дербент";
export const DEMO_PLAN_DAYS = 7;
export const DEMO_PLAN_PRICE_RUB = 200;

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
  FIXED: "фиксированная",
  NEGOTIABLE: "договорная"
} as const;

export const PAY_TYPE_LABELS = {
  PER_HOUR: "за час",
  FIXED: "фиксированная",
  NEGOTIABLE: "договорная"
} as const;

export const EXPERIENCE_RANGES = [
  { label: "0-1", min: 0, max: 1 },
  { label: "1-3", min: 1, max: 3 },
  { label: "3-5", min: 3, max: 5 },
  { label: "5+", min: 5, max: 100 }
];

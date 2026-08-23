export const CATEGORIES = [
  "Technology",
  "Food & Drink",
  "Home",
  "Design",
  "Music",
  "Fitness",
  "Education",
  "Entertainment",
  "Photography",
  "Writing",
  "Repair",
  "Oddly Specific",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const UNITS = [
  "hour",
  "cup",
  "session",
  "task",
  "match",
  "consultation",
  "day",
  "visit",
  "plate",
  "song",
] as const;

export const DEFAULT_UNITS: string[] = [...UNITS];

/**
 * Smart search: expand the user's query with synonyms before hitting
 * the Postgres trigram/keyword matcher, so "chai" finds "tea",
 * "coder" finds "backend developer", etc. No external AI service —
 * just a curated synonym map, tuned for a human-talent marketplace.
 */

const SYNONYMS: Record<string, string[]> = {
  // tech
  coder: ["code", "developer", "programming", "backend", "software", "website"],
  developer: ["code", "coder", "programming", "software", "backend", "website"],
  programmer: ["code", "developer", "programming", "software"],
  website: ["web", "developer", "frontend", "site"],
  app: ["application", "developer", "mobile", "software"],
  tech: ["technology", "computer", "software", "code"],
  ai: ["machine", "learning", "artificial"],
  hacker: ["security", "hacking", "pentest"],
  bug: ["debug", "fix", "repair", "code"],

  // food & drink
  chai: ["tea", "beverage", "drink"],
  tea: ["chai", "beverage", "drink"],
  coffee: ["beverage", "drink", "latte", "cappuccino"],
  cook: ["cooking", "chef", "food", "kitchen", "meal"],
  chef: ["cooking", "cook", "food", "kitchen"],
  food: ["cooking", "cook", "chef", "meal", "kitchen"],
  bake: ["baking", "bakery", "cake", "pastry"],
  cake: ["baking", "bakery", "pastry", "dessert"],

  // home
  clean: ["cleaning", "tidy", "organize", "organizing", "chores"],
  cleaning: ["clean", "tidy", "organize", "organizing", "chores"],
  tidy: ["clean", "cleaning", "organize", "organizing"],
  organize: ["organizing", "clean", "cleaning", "tidy"],
  repair: ["fix", "repairing", "plumber", "electrician", "handyman"],
  fix: ["repair", "fixing", "plumber", "electrician", "handyman"],
  plumber: ["repair", "fix", "plumbing", "pipe"],
  electrician: ["repair", "fix", "electrical", "wiring"],

  // creative
  photo: ["photography", "photographer", "camera", "shoot", "portrait"],
  photographer: ["photography", "photo", "camera", "shoot", "portrait"],
  camera: ["photography", "photo", "photographer"],
  design: ["designer", "ui", "ux", "graphic", "logo", "figma"],
  designer: ["design", "ui", "ux", "graphic", "logo", "figma"],
  logo: ["design", "designer", "branding", "graphic"],
  music: ["guitar", "piano", "sing", "singing", "song", "instrument", "lesson"],
  guitar: ["music", "guitarist", "lesson", "strings"],
  sing: ["singing", "singer", "vocal", "music", "voice"],
  writer: ["writing", "copy", "copywriting", "content", "blog"],
  writing: ["writer", "copy", "copywriting", "content", "blog"],
  write: ["writing", "writer", "copy", "content"],

  // learning & wellness
  teach: ["teaching", "tutor", "tutoring", "lesson", "teacher", "learn"],
  tutor: ["tutoring", "teach", "teaching", "lesson", "teacher"],
  math: ["maths", "mathematics", "tutor", "teaching"],
  maths: ["math", "mathematics", "tutor", "teaching"],
  fitness: ["gym", "trainer", "workout", "exercise", "yoga"],
  gym: ["fitness", "trainer", "workout", "exercise"],
  yoga: ["fitness", "wellness", "stretch", "meditation"],
  funny: ["comedy", "comedian", "humor", "humour", "joke", "entertainment"],
  comedy: ["funny", "comedian", "humor", "humour", "joke"],
  joke: ["funny", "comedy", "comedian", "humor"],

  // generic
  funny_person: [],
  help: ["assist", "helping", "support"],
  party: ["event", "celebration", "birthday", "dj"],
  wedding: ["marriage", "bride", "groom", "event", "speech"],
};

/** Expand a raw query into a list of search terms (query itself always first). */
export function expandQuery(raw: string): string[] {
  const q = raw.toLowerCase().trim();
  if (!q) return [];

  const words = q.split(/[\s,]+/).filter((w) => w.length > 1);
  const terms = new Set<string>([q, ...words]);

  // whole-phrase synonyms
  const phraseKey = q.replace(/[\s_]+/g, "_");
  for (const syn of SYNONYMS[phraseKey] ?? []) terms.add(syn);

  // per-word synonyms
  for (const w of words) {
    for (const syn of SYNONYMS[w] ?? []) terms.add(syn);
  }

  return [...terms].slice(0, 12);
}

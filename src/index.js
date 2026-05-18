import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Fuse from "fuse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = join(__dirname, "..");
export const DATA_DIR = join(PROJECT_ROOT, "data");
export const GAMES_FILE = join(DATA_DIR, "games.json");
export const REMOTE_URL = "https://free.instgame.com/data/games.json";

export function loadGames(filePath = GAMES_FILE) {
  if (!existsSync(filePath)) {
    throw new Error(`No local game data found at ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export function saveGames(games, filePath = GAMES_FILE) {
  if (!existsSync(dirname(filePath))) {
    mkdirSync(dirname(filePath), { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(games, null, 2), "utf-8");
}

export async function fetchGames() {
  const res = await fetch(REMOTE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch games: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

const FUSE_OPTIONS = {
  keys: [
    { name: "name", weight: 0.5 },
    { name: "slug", weight: 0.2 },
    { name: "categoryName", weight: 0.15 },
    { name: "tagNames", weight: 0.15 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
};

export function searchGames(games, query) {
  const fuse = new Fuse(games, FUSE_OPTIONS);
  const results = fuse.search(query);
  return results.map((r) => r.item);
}

export function filterGames(games, { search, category, tag } = {}) {
  let result = [...games];

  if (search) {
    result = searchGames(result, search);
  }
  if (category) {
    const q = category.toLowerCase();
    result = result.filter(
      (g) => (g.categoryName || "").toLowerCase().includes(q)
    );
  }
  if (tag) {
    const q = tag.toLowerCase();
    result = result.filter(
      (g) =>
        (g.tagNames || []).some((t) => t.toLowerCase().includes(q)) ||
        (g.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }

  return result;
}

export function findGame(games, slug) {
  return games.find((g) => g.slug === slug || g.id === slug);
}

export function pickRandomGames(games, count = 1) {
  const shuffled = [...games].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, games.length));
}

export function pickGamesByCategory(games, count = 10) {
  const cats = {};
  for (const g of games) {
    const name = g.categoryName || "(uncategorized)";
    if (!cats[name]) cats[name] = [];
    cats[name].push(g);
  }

  const catNames = Object.keys(cats).sort(() => Math.random() - 0.5);
  const perCat = Math.ceil(count / catNames.length);
  const picked = [];
  for (const cat of catNames) {
    const catGames = cats[cat];
    const toPick = Math.min(perCat, catGames.length);
    picked.push(...pickRandomGames(catGames, toPick));
    if (picked.length >= count) break;
  }
  return picked.slice(0, count);
}

export function getCategories(games) {
  const cats = {};
  for (const g of games) {
    const name = g.categoryName || "(uncategorized)";
    cats[name] = (cats[name] || 0) + 1;
  }
  return Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function getTags(games) {
  const tagCount = {};
  for (const g of games) {
    for (const t of g.tagNames || []) {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

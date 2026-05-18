import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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

export function filterGames(games, { search, category, tag } = {}) {
  let result = [...games];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter((g) => g.name.toLowerCase().includes(q));
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

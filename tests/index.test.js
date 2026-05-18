import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  filterGames,
  findGame,
  getCategories,
  getTags,
  loadGames,
  saveGames,
  searchGames,
  pickRandomGames,
  PROJECT_ROOT,
  DATA_DIR,
  GAMES_FILE,
} from "../src/index.js";
import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// --- Fixtures ---

const sampleGames = [
  {
    id: "game-a",
    slug: "game-a",
    name: "Alpha Quest",
    categoryName: "Adventure",
    tagNames: ["Action", "RPG"],
  },
  {
    id: "game-b",
    slug: "game-b",
    name: "Billiards Classic",
    categoryName: "Sports",
    tagNames: ["Sports", "Pool"],
  },
  {
    id: "game-c",
    slug: "game-c",
    name: "Car Racing",
    categoryName: "Racing",
    tagNames: ["Action", "Sports"],
  },
  {
    id: "game-d",
    slug: "game-d",
    name: "Delta Puzzle",
    tagNames: ["Puzzle"],
  },
];

import { execSync } from "child_process";

const CLI = "node bin/cli.js";

// --- CLI binary integration tests ---

describe("cli binary", () => {
  it("shows help", () => {
    const output = execSync(`${CLI} --help`, { encoding: "utf-8" });
    expect(output).toContain("Browse and manage");
    expect(output).toContain("list");
    expect(output).toContain("show");
    expect(output).toContain("sync");
  });

  it("list outputs games table", () => {
    const output = execSync(`${CLI} list`, { encoding: "utf-8" });
    expect(output).toContain("SLUG");
    expect(output).toContain("NAME");
    expect(output).toMatch(/\d+ game\(s\) total/);
  });

  it("list --search filters", () => {
    const output = execSync(`${CLI} list -s "billiard"`, {
      encoding: "utf-8",
    });
    expect(output).toContain("8-ball-billiards");
    expect(output).toMatch(/game\(s\) total/);
  });

  it("list --json outputs valid JSON", () => {
    const output = execSync(`${CLI} list -j`, { encoding: "utf-8" });
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it("list --category filters", () => {
    const output = execSync(`${CLI} list -c "Racing"`, {
      encoding: "utf-8",
    });
    expect(output).toContain("Racing");
  });

  it("list shows no match message", () => {
    const output = execSync(`${CLI} list -s "zzzzznotfound"`, {
      encoding: "utf-8",
    });
    expect(output).toContain("No games found");
  });

  it("show outputs game details", () => {
    const output = execSync(`${CLI} show 8-ball-billiards-classic`, {
      encoding: "utf-8",
    });
    expect(output).toContain("Name:");
    expect(output).toContain("8 Ball Billiards Classic");
    expect(output).toContain("Category: Sports");
    expect(output).toContain("Play URL:");
  });

  it("show --json outputs valid JSON", () => {
    const output = execSync(
      `${CLI} show 8-ball-billiards-classic -j`,
      { encoding: "utf-8" }
    );
    const parsed = JSON.parse(output);
    expect(parsed.slug).toBe("8-ball-billiards-classic");
  });

  it("show exits with error for unknown game", () => {
    expect(() =>
      execSync(`${CLI} show nonexistent-game-xyz`, {
        encoding: "utf-8",
        stdio: "pipe",
      })
    ).toThrow();
  });

  it("categories outputs table", () => {
    const output = execSync(`${CLI} categories`, { encoding: "utf-8" });
    expect(output).toContain("CATEGORY");
    expect(output).toContain("Sports");
  });

  it("tags outputs table", () => {
    const output = execSync(`${CLI} tags`, { encoding: "utf-8" });
    expect(output).toContain("TAG");
  });

  it("version flag", () => {
    const output = execSync(`${CLI} --version`, { encoding: "utf-8" });
    expect(output.trim()).toBe("0.1.0");
  });

  it("random outputs play URLs", () => {
    const output = execSync(`${CLI} random`, { encoding: "utf-8" });
    const lines = output.trim().split("\n");
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line).toContain("https://free.instgame.com/game/");
    }
  });

  it("random -n returns specified count", () => {
    const output = execSync(`${CLI} random -n 5`, { encoding: "utf-8" });
    const lines = output.trim().split("\n");
    expect(lines).toHaveLength(5);
  });

  it("random -j outputs JSON array of URLs", () => {
    const output = execSync(`${CLI} random -j`, { encoding: "utf-8" });
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    for (const url of parsed) {
      expect(url).toMatch(/^https:\/\/free\.instgame\.com\/game\//);
    }
  });

  it("random -c filters by category", () => {
    const output = execSync(`${CLI} random -c "Sports" -n 10 -j`, {
      encoding: "utf-8",
    });
    const parsed = JSON.parse(output);
    expect(parsed.length).toBeGreaterThan(0);
  });
});

// --- searchGames (Fuse.js) ---

describe("searchGames", () => {
  it("exact match on name", () => {
    const result = searchGames(sampleGames, "Alpha Quest");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("game-a");
  });

  it("fuzzy match on name with typo", () => {
    const result = searchGames(sampleGames, "Alfa Quest");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("game-a");
  });

  it("fuzzy match with misspelling", () => {
    const result = searchGames(sampleGames, "bilyard");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].slug).toBe("game-b");
  });

  it("partial match on name", () => {
    const result = searchGames(sampleGames, "racing");
    expect(result.length).toBeGreaterThan(0);
  });

  it("match on slug", () => {
    const result = searchGames(sampleGames, "game-c");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].slug).toBe("game-c");
  });

  it("match on category", () => {
    const result = searchGames(sampleGames, "adventure");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].slug).toBe("game-a");
  });

  it("match on tag", () => {
    const result = searchGames(sampleGames, "RPG");
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].slug).toBe("game-a");
  });

  it("returns empty for completely unrelated query", () => {
    const result = searchGames(sampleGames, "xyznotfound123");
    expect(result).toHaveLength(0);
  });

  it("results are relevance-ranked", () => {
    const result = searchGames(sampleGames, "car");
    expect(result[0].slug).toBe("game-c"); // "Car Racing" should be first
  });
});

// --- filterGames ---

describe("filterGames", () => {
  it("returns all games when no filter", () => {
    expect(filterGames(sampleGames)).toHaveLength(4);
  });

  it("filters by name (case-insensitive)", () => {
    const result = filterGames(sampleGames, { search: "alpha" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("game-a");
  });

  it("filters by name partial match", () => {
    const result = filterGames(sampleGames, { search: "billiard" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("game-b");
  });

  it("filters by category", () => {
    const result = filterGames(sampleGames, { category: "sports" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("game-b");
  });

  it("filters by tag", () => {
    const result = filterGames(sampleGames, { tag: "RPG" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("game-a");
  });

  it("filters by tag partial match", () => {
    const result = filterGames(sampleGames, { tag: "Action" });
    expect(result).toHaveLength(2);
  });

  it("combines search and category", () => {
    const result = filterGames(sampleGames, {
      search: "car",
      category: "racing",
    });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("game-c");
  });

  it("returns empty when no match", () => {
    // Fuse.js is fuzzy, so test with filterGames for category/tag
    expect(filterGames(sampleGames, { category: "Horror" })).toHaveLength(0);
    expect(filterGames(sampleGames, { tag: "NonExistent" })).toHaveLength(0);
  });

  it("handles uncategorized games", () => {
    const result = filterGames(sampleGames, { category: "uncategorized" });
    expect(result).toHaveLength(0); // game-d has no categoryName but not "uncategorized" string
  });

  it("does not mutate original array", () => {
    const copy = [...sampleGames];
    filterGames(sampleGames, { search: "alpha" });
    expect(sampleGames).toEqual(copy);
  });
});

// --- findGame ---

describe("findGame", () => {
  it("finds by slug", () => {
    const game = findGame(sampleGames, "game-b");
    expect(game).toBeDefined();
    expect(game.name).toBe("Billiards Classic");
  });

  it("finds by id", () => {
    const game = findGame(sampleGames, "game-c");
    expect(game).toBeDefined();
    expect(game.name).toBe("Car Racing");
  });

  it("returns undefined for unknown slug", () => {
    expect(findGame(sampleGames, "nonexistent")).toBeUndefined();
  });
});

// --- getCategories ---

describe("getCategories", () => {
  it("returns categories sorted by count descending", () => {
    const cats = getCategories(sampleGames);
    expect(cats.map((c) => c.name)).toEqual([
      "Adventure",
      "Sports",
      "Racing",
      "(uncategorized)",
    ]);
  });

  it("counts games per category correctly", () => {
    const games = [
      { id: "1", slug: "1", name: "A", categoryName: "Puzzle" },
      { id: "2", slug: "2", name: "B", categoryName: "Puzzle" },
      { id: "3", slug: "3", name: "C", categoryName: "Racing" },
    ];
    const cats = getCategories(games);
    expect(cats).toContainEqual({ name: "Puzzle", count: 2 });
    expect(cats).toContainEqual({ name: "Racing", count: 1 });
  });

  it("treats missing categoryName as uncategorized", () => {
    const games = [{ id: "1", slug: "1", name: "A" }];
    const cats = getCategories(games);
    expect(cats).toContainEqual({ name: "(uncategorized)", count: 1 });
  });
});

// --- getTags ---

describe("getTags", () => {
  it("returns tags sorted by count descending", () => {
    const tags = getTags(sampleGames);
    expect(tags[0].name).toBe("Action"); // appears in game-a and game-c
    expect(tags[0].count).toBe(2);
  });

  it("handles games without tags", () => {
    const games = [{ id: "1", slug: "1", name: "A" }];
    expect(getTags(games)).toHaveLength(0);
  });
});

// --- pickRandomGames ---

describe("pickRandomGames", () => {
  it("returns 1 game by default", () => {
    const result = pickRandomGames(sampleGames);
    expect(result).toHaveLength(1);
  });

  it("returns exactly n games", () => {
    const result = pickRandomGames(sampleGames, 2);
    expect(result).toHaveLength(2);
  });

  it("returns games from the input array", () => {
    const result = pickRandomGames(sampleGames, 2);
    for (const game of result) {
      expect(sampleGames).toContain(game);
    }
  });

  it("caps at array length", () => {
    const result = pickRandomGames(sampleGames, 100);
    expect(result).toHaveLength(4);
  });

  it("returns different results across multiple calls", () => {
    const allResults = new Set();
    for (let i = 0; i < 50; i++) {
      const result = pickRandomGames(sampleGames, 2);
      allResults.add(result.map((g) => g.slug).sort().join(","));
    }
    expect(allResults.size).toBeGreaterThanOrEqual(3);
  });
});

// --- loadGames / saveGames ---

describe("loadGames and saveGames", () => {
  const testFile = join(tmpdir(), "instgame-test", "games.json");

  afterAll(() => {
    if (existsSync(join(tmpdir(), "instgame-test"))) {
      rmSync(join(tmpdir(), "instgame-test"), { recursive: true });
    }
  });

  it("loads games from file", () => {
    const games = loadGames(GAMES_FILE);
    expect(Array.isArray(games)).toBe(true);
    expect(games.length).toBeGreaterThan(0);
  });

  it("throws when file not found", () => {
    expect(() => loadGames("/nonexistent/path/games.json")).toThrow(
      "No local game data found"
    );
  });

  it("saves games to file and loads back", () => {
    const games = [{ id: "test", slug: "test", name: "Test Game" }];
    saveGames(games, testFile);
    expect(existsSync(testFile)).toBe(true);

    const loaded = loadGames(testFile);
    expect(loaded).toEqual(games);
  });

  it("creates directory if missing", () => {
    const dir = join(tmpdir(), "instgame-new-dir");
    const file = join(dir, "games.json");
    saveGames([{ id: "x", slug: "x", name: "X" }], file);
    expect(existsSync(file)).toBe(true);
    rmSync(dir, { recursive: true });
  });
});

// --- Real data integrity ---

describe("real data", () => {
  let realGames;

  beforeAll(() => {
    realGames = loadGames(GAMES_FILE);
  });

  it("has all required fields on each game", () => {
    const required = [
      "id",
      "slug",
      "name",
      "playUrl",
      "indexUrl",
      "createdAt",
      "updatedAt",
    ];
    for (const game of realGames) {
      for (const field of required) {
        expect(game).toHaveProperty(field);
        expect(game[field]).not.toBe("");
        expect(game[field]).not.toBeUndefined();
      }
    }
  });

  it("all slugs are unique", () => {
    const slugs = realGames.map((g) => g.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("playUrl matches slug pattern", () => {
    for (const game of realGames) {
      expect(game.playUrl).toContain(`/game/${game.slug}/`);
    }
  });

  it("filtering real data by 'Sports' category returns results", () => {
    const result = filterGames(realGames, { category: "Sports" });
    expect(result.length).toBeGreaterThan(0);
  });

  it("finding a real game by slug", () => {
    const game = findGame(realGames, "8-ball-billiards-classic");
    expect(game).toBeDefined();
    expect(game.categoryName).toBe("Sports");
  });
});

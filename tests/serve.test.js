import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync, spawn } from "child_process";

const CLI = "node bin/cli.js";
let serverProcess;
const PORT = 3012;
const BASE = `http://127.0.0.1:${PORT}`;

function waitForServer(timeout = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      try {
        const res = execSync(`curl -s ${BASE}/api/health`, { timeout: 2000 });
        JSON.parse(res);
        resolve();
      } catch {
        if (Date.now() - start > timeout) {
          reject(new Error("Server did not start in time"));
        } else {
          setTimeout(check, 100);
        }
      }
    };
    check();
  });
}

beforeAll(async () => {
  serverProcess = spawn("node", ["bin/cli.js", "serve", "-p", String(PORT)], {
    stdio: "pipe",
  });
  await waitForServer();
});

afterAll(() => {
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
});

describe("mock API server", () => {
  it("/api/health returns status", async () => {
    const res = await fetch(`${BASE}/api/health`);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.games).toBeGreaterThan(0);
  });

  it("/api/games returns random games", async () => {
    const res = await fetch(`${BASE}/api/games?count=3`);
    const games = await res.json();
    expect(Array.isArray(games)).toBe(true);
    expect(games).toHaveLength(3);
    for (const g of games) {
      expect(g).toHaveProperty("slug");
      expect(g).toHaveProperty("name");
      expect(g).toHaveProperty("playUrl");
    }
  });

  it("/api/games distributes across categories when no filter", async () => {
    const res = await fetch(`${BASE}/api/games?count=30`);
    const games = await res.json();
    const categories = new Set(games.map((g) => g.categoryName || "none"));
    // With 30 games, should get from at least 3 categories
    expect(categories.size).toBeGreaterThan(2);
  });

  it("/api/games filters by category", async () => {
    const res = await fetch(`${BASE}/api/games?count=3&category=Sports`);
    const games = await res.json();
    expect(games.length).toBeGreaterThan(0);
    for (const g of games) {
      expect(g.categoryName).toBe("Sports");
    }
  });

  it("/api/games filters by tag", async () => {
    const res = await fetch(`${BASE}/api/games?count=3&tag=Pool`);
    const games = await res.json();
    expect(games.length).toBeGreaterThan(0);
  });

  it("/api/games filters by search", async () => {
    const res = await fetch(`${BASE}/api/games?count=5&search=billiard`);
    const games = await res.json();
    expect(games.length).toBeGreaterThan(0);
  });

  it("/api/latest returns games sorted by updatedAt", async () => {
    const res = await fetch(`${BASE}/api/latest?count=5`);
    const games = await res.json();
    expect(Array.isArray(games)).toBe(true);
    expect(games).toHaveLength(5);
    for (let i = 0; i < games.length - 1; i++) {
      expect(new Date(games[i].updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(games[i + 1].updatedAt).getTime()
      );
    }
  });

  it("/api/latest?sort=created returns by creation time", async () => {
    const res = await fetch(`${BASE}/api/latest?count=5&sort=created`);
    const games = await res.json();
    for (let i = 0; i < games.length - 1; i++) {
      expect(new Date(games[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(games[i + 1].createdAt).getTime()
      );
    }
  });

  it("/api/categories returns category list", async () => {
    const res = await fetch(`${BASE}/api/categories`);
    const cats = await res.json();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);
    expect(cats[0]).toHaveProperty("name");
    expect(cats[0]).toHaveProperty("count");
  });

  it("/api/tags returns tag list", async () => {
    const res = await fetch(`${BASE}/api/tags`);
    const tags = await res.json();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);
    expect(tags[0]).toHaveProperty("name");
    expect(tags[0]).toHaveProperty("count");
  });

  it("404 for unknown path", async () => {
    const res = await fetch(`${BASE}/api/nonexistent`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Not found");
  });

  it("/api/latest default count is 10", async () => {
    const res = await fetch(`${BASE}/api/latest`);
    const games = await res.json();
    expect(games).toHaveLength(10);
  });
});

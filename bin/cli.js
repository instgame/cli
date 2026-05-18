#!/usr/bin/env node

import { Command } from "commander";
import { createRequire } from "module";
import { createServer } from "http";
import { loadGames, saveGames, fetchGames, filterGames, findGame, searchGames, getCategories, getTags, pickRandomGames, pickGamesByCategory } from "../src/index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

function formatTable(rows, columns) {
  const widths = columns.map((col) =>
    Math.max(col.header.length, ...rows.map((r) => String(r[col.key] ?? "").length))
  );

  const header = columns
    .map((col, i) => col.header.padEnd(widths[i]))
    .join("  ");
  const separator = widths.map((w) => "─".repeat(w)).join("  ");

  console.log(header);
  console.log(separator);
  for (const row of rows) {
    const line = columns
      .map((col, i) => String(row[col.key] ?? "").padEnd(widths[i]))
      .join("  ");
    console.log(line);
  }
}

const program = new Command();

program
  .name("instgame")
  .description("Browse and manage instgame.com game catalog")
  .version(version);

program
  .command("list")
  .alias("ls")
  .description("List all games")
  .option("-s, --search <query>", "Filter by game name (case-insensitive)")
  .option("-c, --category <name>", "Filter by category name")
  .option("-t, --tag <name>", "Filter by tag name")
  .option("-j, --json", "Output as JSON")
  .action((opts) => {
    const games = loadGames();
    const filtered = filterGames(games, opts);

    if (opts.json) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    if (filtered.length === 0) {
      console.log("No games found.");
      return;
    }

    const rows = filtered.map((g) => ({
      Slug: g.slug,
      Name: g.name,
      Category: g.categoryName || "",
      Tags: (g.tagNames || []).join(", "),
    }));

    formatTable(rows, [
      { key: "Slug", header: "SLUG" },
      { key: "Name", header: "NAME" },
      { key: "Category", header: "CATEGORY" },
      { key: "Tags", header: "TAGS" },
    ]);

    console.log(`\n${filtered.length} game(s) total`);
  });

program
  .command("categories")
  .alias("cats")
  .description("List all game categories")
  .action(() => {
    const games = loadGames();
    const cats = getCategories(games);
    const rows = cats.map(({ name, count }) => ({ Name: name, Count: count }));

    formatTable(rows, [
      { key: "Name", header: "CATEGORY" },
      { key: "Count", header: "GAMES" },
    ]);
  });

program
  .command("tags")
  .description("List all game tags")
  .action(() => {
    const games = loadGames();
    const tags = getTags(games);
    const rows = tags.map(({ name, count }) => ({ Name: name, Count: count }));

    formatTable(rows, [
      { key: "Name", header: "TAG" },
      { key: "Count", header: "GAMES" },
    ]);
  });

program
  .command("show <slug>")
  .description("Show details of a specific game")
  .option("-j, --json", "Output as JSON")
  .action((slug, opts) => {
    const games = loadGames();
    const game = findGame(games, slug);

    if (!game) {
      console.error(`Game "${slug}" not found.`);
      process.exit(1);
    }

    if (opts.json) {
      console.log(JSON.stringify(game, null, 2));
      return;
    }

    console.log(`Name:     ${game.name}`);
    console.log(`Slug:     ${game.slug}`);
    console.log(`Category: ${game.categoryName || "(none)"}`);
    console.log(`Tags:     ${(game.tagNames || []).join(", ") || "(none)"}`);
    console.log(`Orientation: ${game.orientation || "horizontal"}`);
    console.log(``);
    console.log(`Play URL:  ${game.playUrl}`);
    console.log(`Index URL: ${game.indexUrl}`);
    console.log(`Icon:      ${game.icon}`);
    console.log(`Banner:    ${game.banner}`);
    console.log(`Flash:     ${game.flash}`);
    console.log(``);
    console.log(`Created:  ${game.createdAt}`);
    console.log(`Updated:  ${game.updatedAt}`);
  });

program
  .command("random")
  .alias("rand")
  .description("Return random game play URLs")
  .option("-n, --count <number>", "Number of games to return", "3")
  .option("-c, --category <name>", "Limit to a specific category")
  .option("-t, --tag <name>", "Limit to a specific tag")
  .option("-j, --json", "Output as JSON")
  .action((opts) => {
    let games = loadGames();

    if (opts.category) {
      games = games.filter(
        (g) => (g.categoryName || "").toLowerCase().includes(opts.category.toLowerCase())
      );
    }
    if (opts.tag) {
      games = games.filter(
        (g) =>
          (g.tagNames || []).some((t) => t.toLowerCase().includes(opts.tag.toLowerCase())) ||
          (g.tags || []).some((t) => t.toLowerCase().includes(opts.tag.toLowerCase()))
      );
    }

    const picked = pickRandomGames(games, parseInt(opts.count, 10));

    if (opts.json) {
      console.log(JSON.stringify(picked.map((g) => g.playUrl), null, 2));
      return;
    }

    for (const g of picked) {
      console.log(`${g.name}  ${g.playUrl}`);
    }
  });

program
  .command("serve")
  .alias("mock")
  .description("Start mock API server for H5 site integration")
  .option("-p, --port <number>", "Port to listen on", "3000")
  .option("-h, --host <address>", "Host to bind to", "127.0.0.1")
  .action((opts) => {
    const port = parseInt(opts.port, 10);
    const games = loadGames();

    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://${opts.host}:${port}`);
      const path = url.pathname;

      if (path === "/api/games") {
        const count = parseInt(url.searchParams.get("count") || "10", 10);
        const category = url.searchParams.get("category");
        const tag = url.searchParams.get("tag");
        const search = url.searchParams.get("search");

        let result;
        if (category || tag || search) {
          result = filterGames(games, { category, tag, search });
          result = pickRandomGames(result, count);
        } else {
          result = pickGamesByCategory(games, count);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } else if (path === "/api/latest") {
        const count = parseInt(url.searchParams.get("count") || "10", 10);
        const sortBy = url.searchParams.get("sort") === "created" ? "createdAt" : "updatedAt";
        const result = [...games]
          .sort((a, b) => new Date(b[sortBy]) - new Date(a[sortBy]))
          .slice(0, count);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } else if (path === "/api/categories") {
        const cats = getCategories(games);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(cats));
      } else if (path === "/api/tags") {
        const tags = getTags(games);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tags));
      } else if (path === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", games: games.length, version }));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found", paths: ["/api/games", "/api/latest", "/api/categories", "/api/tags", "/api/health"] }));
      }
    });

    server.listen(port, opts.host, () => {
      console.log(`Mock API server running at http://${opts.host}:${port}`);
      console.log("");
      console.log("Endpoints:");
      console.log(`  GET /api/games              - Random games distributed across categories`);
      console.log(`  GET /api/games?count=5      - Pick 5 games`);
      console.log(`  GET /api/games?category=Sports  - Random from category`);
      console.log(`  GET /api/games?tag=Pool     - Random from tag`);
      console.log(`  GET /api/games?search=billiard  - Fuzzy search`);
      console.log(`  GET /api/latest             - Latest updated games (default 10)`);
      console.log(`  GET /api/latest?count=5     - Latest 5 games`);
      console.log(`  GET /api/latest?sort=created - Sorted by creation time`);
      console.log(`  GET /api/categories         - All categories`);
      console.log(`  GET /api/tags               - All tags`);
      console.log(`  GET /api/health             - Server health`);
      console.log("");
      console.log("Press Ctrl+C to stop");
    });
  });

program
  .command("sync")
  .description("Download latest game data from instgame.com")
  .action(async () => {
    console.log("Syncing from", "https://free.instgame.com/data/games.json", "...");
    const games = await fetchGames();
    saveGames(games);
    console.log(`Synced ${games.length} games to data/games.json`);
  });

program.parse();

#!/usr/bin/env node

import { Command } from "commander";
import { loadGames, saveGames, fetchGames, filterGames, findGame, getCategories, getTags } from "../src/index.js";

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
  .version("0.1.0");

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
  .command("sync")
  .description("Download latest game data from instgame.com")
  .action(async () => {
    console.log("Syncing from", "https://free.instgame.com/data/games.json", "...");
    const games = await fetchGames();
    saveGames(games);
    console.log(`Synced ${games.length} games to data/games.json`);
  });

program.parse();

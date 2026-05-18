# instgame-cli Agent Guide

This project is `instgame-cli`, a CLI for discovering and integrating [instgame.com](https://instgame.com) H5 games (535+ games).

## Quick Reference

| Command | Description |
|---|---|
| `node bin/cli.js list` | Browse all games |
| `node bin/cli.js show <slug>` | Show game details |
| `node bin/cli.js random` | Random game picks |
| `node bin/cli.js serve` | Start mock API server |
| `node bin/cli.js sync` | Update game data |

Run all commands from project root: `/Users/zhangzhibin/Documents/mygit/cloudcr/instgame-cli`

## For Players — Finding Games

When the user asks to find, browse, or discover games:

### Search by name (supports typos)
```bash
node bin/cli.js list -s "billiard"
node bin/cli.js list -s "puzzle"
```

### Filter by category
Available categories: `Sports`, `Puzzle`, `Casual`, `Simulation`, `Adventure`, `Strategy`, `Racing`, `Parkour`, `Dress Up`, `Shooting`, `Action`, `Arcade`, `.io`, `Music`, `Synthesis`, `Battle`, `Break Through`, `Role Playing`, `Board`, `Make Up`, `Operate`, `Card`

```bash
node bin/cli.js list -c "Sports"
node bin/cli.js list -c "Racing"
```

### Filter by tag
```bash
node bin/cli.js list -t "Pool"
node bin/cli.js list -t "Soccer"
```

### Get game details with play URL
```bash
node bin/cli.js show 8-ball-billiards-classic
```
The output includes `playUrl` — the direct link to play the game.

### Random recommendations
```bash
node bin/cli.js random              # 3 random games
node bin/cli.js random -n 10        # 10 random picks
node bin/cli.js random -c "Puzzle"  # from a category
```

## For Developers — Integrating Games

When the user asks to integrate games into an H5 site, build a game widget, or set up a game catalog API:

### Option 1: Start mock API server
```bash
node bin/cli.js serve          # starts at 127.0.0.1:3000
node bin/cli.js serve -p 8080  # custom port
```

API endpoints:
- `GET /api/games?count=5` — 5 random games (distributed across categories)
- `GET /api/games?category=Sports&count=5` — filtered random picks
- `GET /api/games?search=billiard&count=3` — fuzzy search results
- `GET /api/latest?count=5` — 5 latest updated games
- `GET /api/latest?count=5&sort=created` — 5 newest created games
- `GET /api/categories` — category list with game counts
- `GET /api/tags` — tag list with game counts
- `GET /api/health` — server status

Each game object in responses contains: `id`, `slug`, `name`, `playUrl`, `indexUrl`, `icon`, `banner`, `categoryName`, `tagNames`, `orientation`, `createdAt`, `updatedAt`.

### Option 2: Direct JSON output
For one-off data fetching without a server:
```bash
node bin/cli.js list -j                     # all games as JSON
node bin/cli.js random -j                   # JSON array of play URLs
node bin/cli.js show <slug> -j              # single game as JSON
node bin/cli.js list -s "puzzle" -j         # search results as JSON
```

### Integration pattern
Use `playUrl` for iframe embedding:
```html
<iframe src="https://free.instgame.com/game/8-ball-billiards-classic/instplay.html"></iframe>
```

The `orientation` field is `"vertical"` or `"horizontal"` — use it to set iframe dimensions.

### Refresh data
```bash
node bin/cli.js sync
```

## Project Structure

- `bin/cli.js` — CLI entry point (commander)
- `src/index.js` — Core logic (searchGames, filterGames, pickRandomGames, pickGamesByCategory)
- `data/games.json` — Local game catalog (535 games)
- `tests/` — Vitest test suite (69 tests)

## Notes

- Default URL type is `playUrl` (direct play link via `instplay.html`). Use `indexUrl` if you need the game's landing page.
- If `serve` port conflicts, try a different `-p` value.
- Search uses Fuse.js fuzzy matching — partial words and typos work.

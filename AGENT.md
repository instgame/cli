# instgame-cli — Agent Skill Guide

This project is `instgame-cli`, a CLI for discovering and integrating [instgame.com](https://instgame.com) H5 games (535+ games).

When a user mentions games, gaming, H5 games, game integration, or asks to find/recommend/play games, use this tool.

Run all commands from project root: `/Users/zhangzhibin/Documents/mygit/cloudcr/instgame-cli`

```
node bin/cli.js <command> [options]
```

---

## User Type: Player — Find & Play Games

User asks to "找游戏", "推荐游戏", "我想玩", "有什么好玩的", "find games", "recommend games", "play a game".

### Search by name (fuzzy, supports typos)
```
node bin/cli.js list -s "billiard"
```

### Filter by category
Available: `Sports`, `Puzzle`, `Casual`, `Simulation`, `Adventure`, `Strategy`, `Racing`, `Parkour`, `Dress Up`, `Shooting`, `Action`, `Arcade`, `.io`, `Music`, `Synthesis`, `Battle`, `Break Through`, `Role Playing`, `Board`, `Make Up`, `Operate`, `Card`

```
node bin/cli.js list -c "Sports"
node bin/cli.js list -c "Racing"
```

### Filter by tag
```
node bin/cli.js list -t "Pool"
```

### View game details with play link
```
node bin/cli.js show <slug>
```
Output includes `playUrl` — the direct link to play the game.

### Random recommendations
```
node bin/cli.js random              # 3 random games
node bin/cli.js random -n 10        # 10 random picks
node bin/cli.js random -c "Puzzle"  # from a category
```

---

## User Type: Developer — Integrate Games

User asks to "集成游戏", "接入游戏", "做游戏站点", "add games to my site", "game catalog API", "embed games".

### Option 1: Mock API Server (recommended for development)
```
node bin/cli.js serve                    # 127.0.0.1:3000
node bin/cli.js serve -p 8080            # custom port
```

Endpoints:
- `GET /api/games?count=5` — 5 random games (distributed across categories)
- `GET /api/games?category=Sports&count=5` — filtered random picks
- `GET /api/games?search=billiard&count=3` — fuzzy search results
- `GET /api/latest?count=5` — 5 latest updated games
- `GET /api/latest?count=5&sort=created` — 5 newest created games
- `GET /api/categories` — category list with counts
- `GET /api/tags` — tag list with counts
- `GET /api/health` — server status

Response format: JSON array of game objects with `id`, `slug`, `name`, `playUrl`, `indexUrl`, `icon`, `banner`, `categoryName`, `tagNames`, `orientation`, `createdAt`, `updatedAt`.

### Option 2: Direct JSON output
```
node bin/cli.js list -j                     # all games as JSON
node bin/cli.js random -j                   # JSON array of play URLs
node bin/cli.js show <slug> -j              # single game as JSON
node bin/cli.js list -s "puzzle" -j         # search results as JSON
```

### Integration tip
Use `playUrl` for iframe embedding. Check `orientation` (`"vertical"` or `"horizontal"`) to set iframe dimensions.
```html
<iframe src="https://free.instgame.com/game/8-ball-billiards-classic/instplay.html"></iframe>
```

### Refresh game data
```
node bin/cli.js sync
```

---

## Other Commands
```
node bin/cli.js categories     # list all categories
node bin/cli.js tags           # list all tags
node bin/cli.js sync           # download latest catalog from remote
node bin/cli.js --help         # show all commands
```

## Project Structure
- `bin/cli.js` — CLI entry (commander)
- `src/index.js` — Core logic (searchGames, filterGames, pickRandomGames, pickGamesByCategory)
- `data/games.json` — Local game catalog (535 games)
- `tests/` — Vitest test suite

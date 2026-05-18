---
name: instgame-cli
description: Discover and integrate instgame.com H5 games — search, recommend, embed, and serve a game catalog API.
version: 0.1.0
metadata:
  openclaw:
    requires:
      bins: ["node"]
      config:
        data_dir: "Local game catalog directory containing games.json"
    always:
      - "When the user wants to find, browse, or recommend H5 games"
      - "When the user wants to integrate games into a website or H5 app"
      - "When the user mentions game embedding, game catalog, or game widget"
---

# instgame-cli

Browse, search, and integrate [instgame.com](https://instgame.com) H5 games (535+ games).

Run all commands from project root: `/Users/zhangzhibin/Documents/mygit/cloudcr/instgame-cli`

```
node bin/cli.js <command> [options]
```

## For Players — Find & Play Games

User says: "找游戏", "推荐游戏", "我想玩XX", "有什么好玩的", "find games", "recommend games", "play a game".

### Search by name (fuzzy, typos tolerated)
```
node bin/cli.js list -s "billiard"
```

### Filter by category
```
node bin/cli.js list -c "Sports"
node bin/cli.js list -c "Racing"
```
Available: `Sports`, `Puzzle`, `Casual`, `Simulation`, `Adventure`, `Strategy`, `Racing`, `Parkour`, `Dress Up`, `Shooting`, `Action`, `Arcade`, `.io`, `Music`, `Synthesis`, `Battle`, `Break Through`, `Role Playing`, `Board`, `Make Up`, `Operate`, `Card`

### Filter by tag
```
node bin/cli.js list -t "Pool"
```

### View game details
```
node bin/cli.js show <slug>
```
Shows `playUrl` (direct play link), `icon`, `banner`, `categoryName`, `tagNames`, `orientation`.

### Random recommendations
```
node bin/cli.js random              # 3 random games with playUrl
node bin/cli.js random -n 10        # 10 random picks
node bin/cli.js random -c "Puzzle"  # from a category
```

## For Developers — Integrate Games

User says: "集成游戏", "接入游戏", "做游戏站点", "add games to my site", "game catalog API", "embed games".

### Option A: Mock API Server
```
node bin/cli.js serve                    # starts at 127.0.0.1:3000
node bin/cli.js serve -p 8080            # custom port
```

Endpoints:

| Endpoint | Description | Query Params |
|---|---|---|
| `GET /api/games` | Random games across categories | `?count=5` |
| `GET /api/games` | Filtered random | `?category=Sports&count=5` |
| `GET /api/games` | Fuzzy search | `?search=billiard&count=3` |
| `GET /api/latest` | Latest updated (default 10) | `?count=5` |
| `GET /api/latest` | Latest by creation time | `?count=5&sort=created` |
| `GET /api/categories` | Category list | |
| `GET /api/tags` | Tag list | |
| `GET /api/health` | Health check | |

Game object fields: `id`, `slug`, `name`, `playUrl`, `indexUrl`, `icon`, `banner`, `categoryName`, `tagNames`, `orientation`, `createdAt`, `updatedAt`.

### Option B: Direct JSON Output
```
node bin/cli.js list -j                     # all games as JSON
node bin/cli.js random -j                   # JSON array of play URLs
node bin/cli.js show <slug> -j              # single game as JSON
node bin/cli.js list -s "puzzle" -j         # search results as JSON
```

### Integration Pattern
```html
<iframe src="https://free.instgame.com/game/8-ball-billiards-classic/instplay.html"></iframe>
```
Check `orientation` (`"vertical"` or `"horizontal"`) to set iframe dimensions.

### Refresh Data
```
node bin/cli.js sync
```

## Other Commands
```
node bin/cli.js categories     # list all categories
node bin/cli.js tags           # list all tags
node bin/cli.js sync           # download latest catalog from remote
node bin/cli.js --help         # show all commands
```

## Project Structure
- `bin/cli.js` — CLI entry point (commander)
- `src/index.js` — Core logic: searchGames, filterGames, pickRandomGames, pickGamesByCategory
- `data/games.json` — Local game catalog (535 games)
- `tests/` — Vitest test suite (69 tests)

# instgame-cli

CLI tool for browsing the [instgame.com](https://instgame.com) H5 game catalog. Useful for integrating game listings into other sites.

## Install

```bash
npm install -g .
```

Or run directly:

```bash
node bin/cli.js <command>
```

## Commands

### `list` — Browse games

```bash
instgame list                     # all games
instgame list -s "billiard"       # fuzzy search by name (Fuse.js)
instgame list -c "Sports"         # filter by category
instgame list -t "Pool"           # filter by tag
instgame list -j                  # JSON output
```

### `show` — Game details

```bash
instgame show 8-ball-billiards-classic
instgame show 8-ball-billiards-classic -j   # JSON output
```

### `random` — Random game play URLs

```bash
instgame random                   # 3 random play URLs
instgame random -n 10             # 10 random play URLs
instgame random -c "Sports"       # random from specific category
instgame random -t "Pool"         # random from specific tag
instgame random -j                # JSON array of URLs
```

### `categories` / `tags` — Browse taxonomy

```bash
instgame categories
instgame tags
```

### `sync` — Update data

```bash
instgame sync   # download latest catalog from free.instgame.com
```

### `serve` — Mock API server

Starts a local HTTP server with JSON API for H5 site integration:

```bash
instgame serve                    # 127.0.0.1:3000
instgame serve -p 8080            # custom port
```

#### API Endpoints

| Method | Description | Example |
|---|---|---|
| `GET /api/games` | Random games, distributed across categories | `?count=5` |
| `GET /api/games` | Filtered random games | `?category=Sports&count=5` |
| `GET /api/games` | Fuzzy search | `?search=billiard&count=3` |
| `GET /api/latest` | Latest updated games (default 10) | `?count=5` |
| `GET /api/latest` | Latest by creation time | `?count=5&sort=created` |
| `GET /api/categories` | Category list with counts | |
| `GET /api/tags` | Tag list with counts | |
| `GET /api/health` | Server health check | |

#### Example integration

```js
// Fetch 5 random games for a recommendation widget
const res = await fetch('http://127.0.0.1:3000/api/games?count=5');
const games = await res.json();
games.forEach(g => {
  console.log(`${g.name}: ${g.playUrl}`);
});

// Fetch latest 3 new games
const latest = await fetch('http://127.0.0.1:3000/api/latest?count=3');
```

## Data

Game data is stored in `data/games.json`. Run `instgame sync` to update from the remote source.

## Test

```bash
npm test
```

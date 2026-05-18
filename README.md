# instgame-cli

CLI tool for discovering and integrating [instgame.com](https://instgame.com) H5 games.

**For H5 game players** — quickly search and find games to play.
**For H5 game site developers** — spin up a mock API server to integrate games into your site.

## Install

```bash
npm install -g @instgame/cli
```

Or run directly from source:

```bash
git clone git@github.com:instgame/cli.git
cd cli
npm install -g .
```

Or use npx without installing:

```bash
npx @instgame/cli <command>
```

## Update

```bash
npm update -g @instgame/cli
```

---

## For Players

### Search games

```bash
instgame list                     # browse all 535+ games
instgame list -s "billiard"       # fuzzy search (typos tolerated)
instgame list -c "Sports"         # filter by category
instgame list -t "Pool"           # filter by tag
```

### View game details

```bash
instgame show 8-ball-billiards-classic
```

Output includes play URL, icon, banner, category, and tags — click the play URL to start playing.

### Random picks

```bash
instgame random                   # 3 random games
instgame random -n 10             # 10 random games
instgame random -c "Sports"       # random picks from a category
```

---

## For Developers

### Mock API server

```bash
instgame serve                    # starts at 127.0.0.1:3000
instgame serve -p 8080            # custom port
```

#### API Endpoints

| Endpoint | Description | Example |
|---|---|---|
| `GET /api/games` | Random games, distributed across categories | `?count=5` |
| `GET /api/games` | Filtered random games | `?category=Sports&count=5` |
| `GET /api/games` | Fuzzy search | `?search=billiard&count=3` |
| `GET /api/latest` | Latest updated games (default 10) | `?count=5` |
| `GET /api/latest` | Latest by creation time | `?count=5&sort=created` |
| `GET /api/categories` | Category list with counts | |
| `GET /api/tags` | Tag list with counts | |
| `GET /api/health` | Server health check | |

#### Quick integration

```js
// 1. Fetch 5 random games for a recommendation widget
const res = await fetch('http://127.0.0.1:3000/api/games?count=5');
const games = await res.json();
games.forEach(g => {
  console.log(`<iframe src="${g.playUrl}"></iframe>`);
});

// 2. Fetch 3 latest new games
const latest = await fetch('http://127.0.0.1:3000/api/latest?count=3');

// 3. Get category list for navigation
const cats = await fetch('http://127.0.0.1:3000/api/categories');
```

#### JSON output (no server)

```bash
instgame random -j                # JSON array of play URLs
instgame list -j                  # full game data as JSON
instgame show <slug> -j           # single game as JSON
```

---

## Other Commands

```bash
instgame categories               # list all categories
instgame tags                     # list all tags
instgame sync                     # update game data from remote
```

## Data

Game data is stored in `data/games.json`. Run `instgame sync` to update.

## Test

```bash
npm test
```

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

## Usage

### List games

```bash
instgame list                     # all games
instgame list -s "billiard"       # search by name
instgame list -c "Sports"         # filter by category
instgame list -t "Pool"           # filter by tag
instgame list -j                  # JSON output
```

### Show game details

```bash
instgame show 8-ball-billiards-classic
instgame show 8-ball-billiards-classic -j   # JSON output
```

### Categories & Tags

```bash
instgame categories
instgame tags
```

### Sync data

```bash
instgame sync   # download latest catalog from free.instgame.com
```

## Data

Game data is stored in `data/games.json`. Run `instgame sync` to update from the remote source.

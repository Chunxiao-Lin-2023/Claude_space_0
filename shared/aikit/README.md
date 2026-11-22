# AIKit — Claude as an AI player in hub games

Source of truth: `shared/aikit/aikit.js`. Games vendor a copy into `<game>/src/vendor/aikit.js` and inline it in their
`build.py` (games never load files from `shared/` at runtime). After changing the kit: `python3 shared/aikit/sync.py`,
then rebuild the games it lists.

## Backends (picked automatically)
| where the game runs | how Claude is called | who pays |
|---|---|---|
| hub (GitHub Pages / local) | the owner's API key, typed once in the game's settings, stored only in this browser as `localStorage['hub.ai']` (shared by every game on the hub origin); called straight from the page with `anthropic-dangerous-direct-browser-access: true` | the key's account |
| claude.ai artifact | the page's `sample` capability (declare `{sample:{}}` on the artifact) | the viewer's claude.ai plan |
| neither / switched off | `AIKit.available()` is false → the game uses its scripted AI | — |

Co-op games are host-authoritative: only the host calls Claude, so guests never need a key.

## API
- `AIKit.available()` — on and a backend exists. `AIKit.backend()` — label for the UI.
- `AIKit.call({ system, user, tool:{name, description, schema}, want:'quick'|'smart', maxTokens, timeout })` → the tool's
  input object. Haiku 5.5 gets forced `tool_choice`; Sonnet/Opus 5.5 reject forced tool use (400), so they get `auto`
  plus an instruction, and a JSON object in plain text is accepted as a fallback. Sonnet may omit fields — validate. Calls are serialized; timeouts 12 s / 20 s.
- Tiers (`cfg().tier`): `eco` all Haiku 5.5, `bal` Haiku + Sonnet 5.5 for `want:'smart'`, `best` all Sonnet.
- `AIKit.usage()` — calls and estimated USD (this session / all time), from the response `usage` and list prices.
- `AIKit.panelHTML(note)` + `AIKit.bind(root, onChange)` — drop-in settings block (on/off, key, tier, test, usage).

## Hard rules every game must keep (the kit cannot enforce them for you)
1. **The game engine owns the facts.** Claude only words lines the engine already decided, or maps player text onto
   actions the engine already has. It never decides what is true, what is revealed, who wins.
2. **Never send Claude what the speaker must not know** (hidden clues, other players' secrets, the solution).
3. **Validate every output** before showing it (length, forbidden words, invented times/names, out-of-character text);
   on failure use the scripted line. Never retry in a loop.
4. **Fail soft**: no key, offline, 401/429, timeout → scripted behaviour, game never blocks.
5. Never put the key in saves, logs, network messages or the repo.

# Texas Hold'em Poker

A browser-based Fixed-Limit Texas Hold'em poker game. No installation, no build step — just click [here](https://tengyanhaiin-star.github.io/Texas-Hold-em/) and play.

---

## Features

- **6-player table** — You vs. 5 AI opponents, each with a distinct personality
- **Fixed-Limit betting** — Small bet / big bet structure with a 4-raise cap per round
- **Realistic card graphics** — Rendered via the [SVG-cards](https://github.com/htdebeer/SVG-cards) library
- **Selectable card designs** — Choose SVG-cards, Geometric Rhapsody, Blood Moon Castle, Cyber Epoch (赛博纪元), or Star Voyage (星河纪行), in that order, from the lower-left menu, opposite the deal/action controls. Fronts, backs, and the background change together without restarting the hand; the browser remembers your choice.
- **Themed backgrounds** — SVG-cards keeps the oval felt table. Geometric Rhapsody uses a textured abstract geometric painting, Blood Moon Castle uses a photorealistic Gothic castle under a blood moon, Cyber Epoch uses a futuristic city illuminated by neon lights, and Star Voyage uses a navy-and-gold celestial sailing chart. Each custom background fills the 1200×700 canvas, which scales to the screen.
- **Sound effects** — Web Audio API tones for deal, check, call, raise, fold, all-in, and win
- **Theme music** — All five themes play their supplied MP3 from the beginning every time you select that theme, looping until you leave it. Switching themes stops the previous track before starting the next.
- **Auto-advance** — Next hand starts automatically after a 10-second countdown

---

## AI Opponents

Each AI player uses a different strategy built on top of the Chen Formula (preflop) and Monte Carlo simulation (post-flop, 1000 iterations):

| Name | Style | Tendency |
|------|-------|----------|
| Ace Annie | Aggressive | Raises frequently, hard to bluff out |
| Bluff Billy | Bluffer | High bluff frequency, unpredictable |
| Cool Carlos | Cautious | Only commits with strong hands |
| Danger Dan | Balanced | Well-rounded, closest to GTO |
| Easy Eddie | Loose | Calls wide, folds reluctantly |

All AI players apply a cumulative raise discount (`strength × 0.9^totalRaiseCount`) to avoid reckless over-aggression in multi-raise pots.

---

## How to Play

### Controls

| Button | Action |
|--------|--------|
| **Fold** | Discard your hand and forfeit the pot |
| **Check** | Pass the action (only when no bet to call) |
| **Call $n** | Match the current bet |
| **Raise +$n** | Increase the bet by one unit |

### Betting Rules

- **Blinds**: Small blind $10, Big blind $20
- **Pre-flop / Flop**: Bet unit $20
- **Turn / River**: Bet unit $40
- **Raise cap**: 3 raises pre-flop, 4 raises on all other streets
- Each player starts with **$1,000** in chips

### Hand Rankings (high to low)

Straight Flush · Four of a Kind · Full House · Flush · Straight · Three of a Kind · Two Pair · One Pair · High Card

---

## Technical Notes

- Pure vanilla JavaScript, no frameworks or build tools
- Canvas: fixed 1200×700 px, CSS-scaled to viewport via `transform: scale()`
- Card rendering: SVG-cards faces use individual SVG files in `cards/`; its blue back references `svg-cards.svg`. Geometric Rhapsody uses 55 lossless WebP images in `cards/geometric-rhapsody/`, including both Jokers from version 3 of the supplied deck archive. Every decoded pixel matches its source PNG; the original 630×880 dimensions and aspect ratio are preserved.
- Blood Moon Castle: the latest supplied 630×880 artwork is stored as 55 lossless WebP images in `cards/blood-moon-castle/`, including both Jokers from version 11 of the supplied deck archive. Every decoded pixel matches its source PNG; the original dimensions and aspect ratio are preserved.
- Cyber Epoch: version 5 of the supplied `Cyber_Epoch_55_Cards_630x880_Final.zip` (updated 2026-10-08) is stored as 55 lossless WebP images in `cards/cyber-epoch/`, preserving every source pixel and the original 630×880 dimensions. The small and big Jokers are retained as `joker_black.webp` and `joker_red.webp` respectively.
- Star Voyage: version 11 of the supplied `Star_Voyage_55_Cards_630x880.zip` (updated 2026-10-02) is stored as 55 lossless WebP images in `cards/star-voyage/`, including both Jokers. Every decoded pixel matches the source PNG; all cards retain their 630×880 dimensions. The game uses the 52 standard faces and back.
- Card themes: configured in `CARD_THEMES` inside `index.html`; files follow the existing `spade_1`, `heart_jack`, etc. naming convention, with `back` for the reverse. Only the 52 standard faces and one back are used.
- Theme backgrounds: 1200×700 WebP images in `backgrounds/`, configured with the optional `background` and `surround` properties in `CARD_THEMES`. The custom themes hide the felt-table decoration while preserving the table geometry; dark panels keep foreground text readable. See [background asset notes](backgrounds/README.md) for generation prompts.
- Theme preference: saved locally as `texas-holdem-card-theme`; defaults to SVG-cards and remains usable when browser storage is blocked. Switching updates card graphics, background styling, and theme music while preserving game state and timers. The saved background is restored on reload, and choosing SVG-cards restores the green table.
- AI hand strength: Chen Formula (pre-flop) + Monte Carlo win-rate simulation (post-flop)
- Audio: sound effects use Web Audio API (`OscillatorNode` + `GainNode`). Each theme uses `audio/<theme-id>.mp3` (including `audio/cyber-epoch.mp3`) through one looping `AudioBufferSourceNode` on the same audio context, with a separate gain of 0.35. Each MP3 is loaded and decoded on demand, then cached separately for future selections. Each entry starts a fresh source at offset zero; leaving stops it and invalidates pending playback, without suspending game sound effects. If browser autoplay policy blocks the default or saved theme on page load, music starts after the first click or key interaction.
- Mobile / iOS: touch events handled via standard DOM; virtual layout scales automatically

### Checks

Run `node --test tests/theme-music.test.cjs` (Node.js 18+) for the theme-music switching, loading-race, autoplay-resume, cache, sound-effect, and countdown regression tests. These use a simulated Web Audio context; also verify actual MP3 decoding and playback in a browser when changing audio assets.

---

## Credits

- Card graphics: [SVG-cards](https://github.com/htdebeer/SVG-cards) by Huub de Beer, originally created by David Bellot — licensed under [LGPL-2.1](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html)
- SVG-cards BGM: user-supplied `SVG_Cards_Lounge_Jazz_40s_96BPM.mp3`. Playback loops from 0 to 80 seconds, skipping the trailing pause in the approximately 83-second source file.
- Geometric Rhapsody: custom deck artwork supplied for this project.
- Geometric Rhapsody BGM: user-supplied `Geometric_Rhapsody_BGM_30s_96BPM.mp3`. Playback loops from 0 to 50 seconds, skipping the trailing pause in the approximately 53-second source file.
- Blood Moon Castle: custom deck artwork supplied for this project.
- Blood Moon Castle BGM: user-supplied `blood-moon-waltz.custom_score.mp3`. Playback loops from 0 to 91 seconds, skipping the trailing pause in the approximately 94-second source file.
- Cyber Epoch: user-supplied custom deck artwork and futuristic-city background. The background is proportionally resized and center-cropped from 1672×941 to 1200×700, then encoded as WebP at quality 94.
- Cyber Epoch BGM: user-uploaded `audio/cyber-epoch.mp3`. Playback loops from 0 to 48 seconds of the approximately 50-second source file.
- Star Voyage: user-supplied custom deck artwork and 1200×700 background. The background is converted to WebP at quality 94 with its composition preserved.
- Star Voyage BGM: user-uploaded `audio/star-voyage.mp3`. Playback loops from 0 to 60 seconds of the approximately 63-second source file.
- Geometric Rhapsody and Blood Moon Castle backgrounds: generated for this project with ChatGPT's built-in image-generation tool.
- Fonts: [Noticia Text](https://fonts.google.com/specimen/Noticia+Text) via Google Fonts

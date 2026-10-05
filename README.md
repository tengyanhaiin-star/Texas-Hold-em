# Texas Hold'em Poker

A browser-based Fixed-Limit Texas Hold'em poker game. No installation, no build step — just click [here](https://tengyanhaiin-star.github.io/Texas-Hold-em/) and play.

---

## Features

- **6-player table** — You vs. 5 AI opponents, each with a distinct personality
- **Fixed-Limit betting** — Small bet / big bet structure with a 4-raise cap per round
- **Realistic card graphics** — Rendered via the [SVG-cards](https://github.com/htdebeer/SVG-cards) library
- **Selectable card designs** — Choose SVG-cards, Geometric Rhapsody, or Blood Moon Castle from the lower-left menu, opposite the deal/action controls. Fronts, backs, and the background change together without restarting the hand; the browser remembers your choice.
- **Themed backgrounds** — SVG-cards keeps the oval felt table. Geometric Rhapsody uses a textured abstract geometric painting, and Blood Moon Castle uses a photorealistic Gothic castle under a blood moon. Each custom background fills the 1200×700 canvas, which scales to the screen.
- **Sound effects** — Web Audio API tones for deal, check, call, raise, fold, all-in, and win
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
- Card rendering: SVG-cards faces use individual SVG files in `cards/`; its blue back references `svg-cards.svg`. Geometric Rhapsody uses 53 lossless WebP images in `cards/geometric-rhapsody/`. Every decoded pixel matches its source PNG; the original 630×880 dimensions and aspect ratio are preserved.
- Blood Moon Castle: the latest supplied 630×880 artwork is stored as lossless WebP in `cards/blood-moon-castle/`. Every decoded pixel matches its source PNG; the original dimensions and aspect ratio are preserved.
- Card themes: configured in `CARD_THEMES` inside `index.html`; files follow the existing `spade_1`, `heart_jack`, etc. naming convention, with `back` for the reverse. Only the 52 standard faces and one back are used.
- Theme backgrounds: 1200×700 WebP images in `backgrounds/`, configured with the optional `background` and `surround` properties in `CARD_THEMES`. The custom themes hide the felt-table decoration while preserving the table geometry; dark panels keep foreground text readable. See [background asset notes](backgrounds/README.md) for generation prompts.
- Theme preference: saved locally as `texas-holdem-card-theme`; defaults to SVG-cards and remains usable when browser storage is blocked. Switching only refreshes card graphics and background styling, so game state and timers are preserved. The saved background is restored on reload, and choosing SVG-cards restores the green table.
- AI hand strength: Chen Formula (pre-flop) + Monte Carlo win-rate simulation (post-flop)
- Audio: Web Audio API (`OscillatorNode` + `GainNode`), no external audio files
- Mobile / iOS: touch events handled via standard DOM; virtual layout scales automatically

---

## Credits

- Card graphics: [SVG-cards](https://github.com/htdebeer/SVG-cards) by Huub de Beer, originally created by David Bellot — licensed under [LGPL-2.1](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html)
- Geometric Rhapsody: custom deck artwork supplied for this project.
- Blood Moon Castle: custom deck artwork supplied for this project.
- Geometric Rhapsody and Blood Moon Castle backgrounds: generated for this project with ChatGPT's built-in image-generation tool.
- Fonts: [Noticia Text](https://fonts.google.com/specimen/Noticia+Text) via Google Fonts

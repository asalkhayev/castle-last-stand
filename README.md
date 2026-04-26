# 🏰 Castle: Last Stand

> *A dark medieval survival game — fight until the walls fall.*

---

## 👥 Team

| Name | Role |
|------|------|
| Ayan Salkhayeva | Engineer |
| Nigar Abdullayeva | Designer |
| Leyla Hajizada | Artist |

**Team Name:** TEAM ALO

---

## 🎯 Theme Interpretation

**Theme: Medieval**

Castle: Last Stand puts the player in the boots of a lone dark knight making their final defense against endless waves of undead. The setting, enemies, and atmosphere are rooted entirely in medieval fantasy — crumbling castles, cursed forests, and ancient crypts. The core tension is classic medieval siege: outnumbered, outmatched, last one standing.

---

## ⚙️ Core Mechanics

- **Wave Survival** — Enemies spawn in increasingly difficult waves. Survive all 10 to win.
- **Melee Combat** — Attack nearby enemies with a sword swing (Space or Mouse Click).
- **Shockwave Ability** — Press Shift to unleash a magic explosion that wipes all enemies on screen, at the cost of half your Stamina bar.
- **Stamina System** — Stamina (ST) drains on attacks and the shockwave, and regenerates over time. Manage it carefully.
- **Score & Waves** — Score enough points to advance waves. Higher waves spawn faster, tougher enemies.
- **Level Selection** — Choose from 3 battlefields (Castle, Forest, Crypt), each with a distinct visual theme.
- **Difficulty** — Easy, Normal, and Hard affect enemy speed and spawn rate.

---

## 🕹️ Controls

| Action | Input |
|--------|-------|
| Move | WASD or Arrow Keys |
| Attack (sword swing) | Space or Left Mouse Click |
| Shockwave (kills all on screen) | Shift — costs 50 ST |
| Pause / Unpause | Escape |

---

## 🗺️ Levels

- **Castle** — The classic medieval battlefield. Balanced enemy speed and spawn rate.
- **Forest** — A cursed dark forest. Enemies close in from all directions.
- **Crypt** — An underground tomb. The toughest environment, dimly lit and relentless.

---

## 🐛 Known Issues and Bugs

- Sound effects require the game to be run via a local server (`python3 -m http.server`) rather than opened directly as a file in some browsers — Chrome handles direct file opening best.
- Stamina regeneration continues briefly after the shockwave is used.
- No mobile/touch support.

---

## 🛠️ Used Software

| Tool | Purpose |
|------|---------|
| HTML5 Canvas + JavaScript | Game engine and rendering |
| CSS | UI styling and screen layout |
| Suno AI | Background music generation |
| Freesound / Mixkit | Sound effects (sword swing, explosion, death) |
| Visual Studio Code | Code editor |

---

## 🎮 How to Run

**Recommended — local server (fixes audio in all browsers):**

```
python3 -m http.server
```

Then open `http://localhost:8000` in your browser.

**Quick option:** Open `index.html` directly in Chrome.

---

## 📁 Project Structure

```
castle-last-stand/
├── index.html
├── style.css
├── game.js
├── sounds/
│   ├── back.mp3
│   ├── sword_swing.wav
│   ├── magic_explosion.wav
│   └── monster_death.wav
└── assets/
    ├── background/
    ├── bakground levels/
    ├── buttons/
    ├── enemies/
    └── player/
```

---

## 🧱 Built With

- HTML5 Canvas
- Vanilla JavaScript
- CSS3

*No frameworks. No libraries. Pure browser game.*

---

*Made for PRESS PLAY 2026 — Medieval theme.*

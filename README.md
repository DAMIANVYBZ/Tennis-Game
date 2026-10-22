# Baseline Tennis

A standalone browser tennis game with animated players, a faded blue court, synthesized court sounds, and an AI opponent. No build or external runtime dependencies.

Open `index.html` in Chrome, Edge, or Firefox. Alternatively, run `python -m http.server 8000` from this directory and open the server in your browser.

## Manual shots with position assistance

Move into reach, hold a shot button to prepare and charge, aim, then release just before the ball reaches your player. Waiting without a shot, holding through contact, or releasing too early loses the return. The on-court prompt shows the contact window; the power meter turns orange when overcharged. Poor timing and aggressive flat shots increase net/out risk.

- **Move:** arrows or A/D; Shift to sprint. Sprint drains stamina, which recovers when resting.
- **Aim:** Q/E; the target ring marks your intended placement. Pointer users move the pointer while holding a shot to aim.
- **Shots:** hold/release Space for topspin, X for flat, C for slice, V for lob. The same controls serve between points.
- **Pause:** P.
- **Gamepad:** left stick or D-pad moves; right stick aims; A = topspin, X = flat, B = slice, Y = lob; RT sprints; Start pauses. Hold/release shot buttons just like keyboard controls. Press A once on the welcome screen to enter the court.
- **Touch:** drag on the court to move. Hold/release the shot buttons below it; use another finger on the court to aim while charging. Holding/releasing directly on the court also plays topspin.

Position assistance defaults to 40% and can be reduced to zero. This is a limited correction toward a nearby incoming ball, capped at 0.09 court units. It never chases a distant ball or swings automatically. The number is an alignment setting, not a measured AI/human gameplay ratio or a claim about commercial tennis games.

The opponent has difficulty-dependent movement speed, reaction delay, and estimation error, and tries to find open court. First to seven points wins. This is an arcade tennis game, not a full tennis rules or spin-physics simulation.

## Sound

Sound starts after a user interaction and is enabled by default. Original Web Audio effects include racket impacts, ball bounces, foot scuffs, swing noise, net impacts, and crowd applause for points and wins. Use the Sound button to mute. No sound files or downloads are needed.

## Browser checks

With Python, Playwright, and Chromium installed, run:

```sh
python tests/gameplay.py
```

Checks cover manual shot requirements, timing, shot selection, power/aim, bounded assistance, net/out scoring, gamepad hold/release/aim/pause, mobile shot buttons, Web Audio activation/mute, and match restart. Gamepad checks use simulated input; physical controller behavior depends on browser mapping.

## Deployment

The game is deployed to Cloudflare Pages at https://tennis-legon.pages.dev. To deploy an update, stage **only `index.html`** in an asset directory and use:

```sh
npx wrangler@4 pages deploy /path/to/assets --project-name tennis-legon --branch main
```

Cloudflare credentials must be provided securely through the environment. GitHub pushes alone do not trigger deployment for this directly uploaded Pages project.

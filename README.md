# Baseline — Cross Court

An original 3D browser tennis game with animated players, a faded blue hard court, a fenced club setting, and a first-to-21 match. Live: https://tennis-legon.pages.dev

## Run locally

From this checkout, run `python -m http.server 8000`, then open the local server in a WebGL-capable browser. ES modules need an HTTP server: double-clicking `index.html` as a file will not work. No build or package installation is required. Three.js 0.180.0 and its MIT license are included in `vendor/`; the game makes no CDN requests.

The controls panel explains every input. Landscape orientation or fullscreen gives the clearest view on mobile. WebGL and browser hardware acceleration must be available.

## Controls

| Action | PS5 / DualSense | Keyboard |
| --- | --- | --- |
| Move across and along court | Left stick / D-pad | Arrows / WASD |
| Aim across court / set depth | Right stick | Q/E left/right; Z/R shorter/deeper |
| Topspin / serve | Hold/release ✕ Cross | Hold/release Space |
| Flat shot | Hold/release □ Square | Hold/release X |
| Slice | Hold/release ○ Circle | Hold/release C |
| Lob | Hold/release △ Triangle | Hold/release V |
| Sprint | R2 | Shift |
| Pause | Options | P / Escape |

Connect the controller by USB or Bluetooth and press ✕ on the welcome screen. Standard Xbox button positions map to A, X, B, Y respectively. A physical DualSense has not been tested in this cloud environment; browser tests use standard-mapped simulated input.

On touchscreens, the left joystick moves. Hold a shot button on the right and drag it horizontally to aim, vertically to adjust depth, then release. Mouse users can click their half of the court to move, click the far half to aim, and use the shot buttons or keyboard to strike.

## Match and shots

Move into reach, hold a shot to prepare/charge, then release close to contact. Shots are never automatic for the human player. Overcharging, poor timing, and aggressive placement reduce accuracy. Shot types change flight time and bounce restitution. Sprint drains stamina; it recovers when resting.

Position assistance defaults to 40% and can be reduced to zero in Settings. It makes small nearby alignment corrections only while preparing a return. It is not a measured AI/human gameplay ratio.

The ball has three-dimensional position/velocity, gravity, a first-bounce landing marker, and net collision. Serves have a visible toss and must land diagonally in the service box. Let a serve bounce before returning it. First-bounce out balls and missed second bounces lose the point. In this exhibition mode a service fault loses the point; second serves, lets, standard tennis games/sets and complete professional spin physics are not implemented.

First to 21, win by two. Service alternates every two points, then every point after 20–20. Change ends every five points; the camera follows your new end so controls remain camera-relative. Brief camera close-ups show the point winner. The opponent has difficulty-dependent movement, reaction delay, and placement estimates, and chooses among shot types.

## Visual reference

The user supplied a Cross Court Tennis 3 gameplay recording. Broad samples across the 12½-minute recording and a denser 100–112-second rally sequence informed the elevated full-court camera, compact score overlay, two-axis movement, service poses, fenced blue court, touch joystick, point camera cuts and play-to-21 flow. The models, scene, interface, code and synthesized sound are original. This is not an exact reproduction of the commercial game's assets, animation system, physics or hidden assistance rules.

## Audio

Original Web Audio effects provide racket impacts, ball bounces, foot scuffs, swing noise, net contact and applause. Sound starts after interaction. Use the on-court mute button or the Settings volume slider. No recordings or third-party sound assets are used.

## Validation

```sh
node tests/physics.mjs
python tests/gameplay.py
```

Physics checks require Node only. Browser checks require Python, Playwright and Chromium. They exercise legal serves, manual contact, two-axis movement, stamina, net/out scoring, service rotation/changeovers, win-by-two, distinct shot trajectories, actual WebGL rendering, gamepad mapping, mobile joystick/shot buttons, audio, pause, settings and restart. Physical controller testing and a mobile-device performance test remain separate.

## Deployment

Stage `index.html`, `style.css`, `game.js`, `engine.mjs`, `audio.mjs`, and the entire `vendor/` folder in an asset directory. Do not deploy tests, the repository metadata or the reference video.

```sh
npx wrangler@4 pages deploy /path/to/assets --project-name tennis-legon --branch main
```

Cloudflare credentials are supplied through the environment. This Pages project uses direct uploads; a GitHub push alone does not deploy it.

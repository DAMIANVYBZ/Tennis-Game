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

While preparing or serving, a curved 3D aiming guide shows the planned flight and bounce point. Hold the right stick to move the aim cursor continuously in direction and depth; centering it preserves your chosen position. Up moves deeper, down shorter. Both serves and rally shots support adjustable depth. The cursor can pass beyond the court lines for deliberate risk; orange warns of planned outs or faults. The arc uses the same ballistic planner as actual shots, assuming good timing; timing and reach can change the result. Orange indicates an unsafe planned shot.

A prominent power bar follows your player and fills as you hold a shot button. Its percentage and the sidebar power meter track charge; overcharging turns the bar orange.

Position assistance defaults to 40% and can be reduced to zero in Settings. It makes small nearby alignment corrections only while preparing a return. It is not a measured AI/human gameplay ratio.

The ball has three-dimensional position/velocity, gravity, a first-bounce landing marker, and net collision. Serves have a visible toss and must land diagonally in the service box. Let a serve bounce before returning it. First-bounce out balls and missed second bounces lose the point. The correct diagonal service box is highlighted. A first service fault gives a second serve with no score change; a double fault loses the point. Balls touching painted lines count as in. The service box is fixed at racket contact, so subsequent server movement cannot change it. Net lets, foot faults, standard tennis games/sets and complete professional spin physics are not implemented.

First to 21, win by two. Service alternates every two points, then every point after 20–20. Change ends every five points; the camera follows your new end so controls remain camera-relative. Brief camera close-ups show the point winner. The opponent has difficulty-dependent movement, reaction delay, and placement estimates, and chooses among shot types.

## Visual reference

The user supplied a Cross Court Tennis 3 gameplay recording. Broad samples across the 12½-minute recording and a denser 100–112-second rally sequence informed the elevated full-court camera, compact score overlay, two-axis movement, service poses, fenced blue court, touch joystick, point camera cuts and play-to-21 flow. The models, scene, interface and code are original. Racket and shoe effects now use brief excerpts from the user-provided audio; other effects are synthesized. This is not an exact reproduction of the commercial game's assets, animation system, physics or hidden assistance rules.

## Audio

Four short WAV samples cropped from the user-provided recording supply racket impacts and shoe-friction texture. Hits vary with power, and the opponent sounds more distant. Footstep scuffs follow movement; longer rubber squeaks play on sprints, braking and direction changes for both players. The original synthesized bounce, net, swing and crowd effects remain. Sound starts after interaction. Use the on-court mute button or the Settings volume slider. Samples load locally through Web Audio after interaction, with synthesized fallback if loading fails. Source times and processing are documented in `assets/audio/SOURCE.md`.

## Validation

```sh
node tests/physics.mjs
node tests/service.mjs
python tests/gameplay.py
```

Physics checks require Node only. Browser checks require Python, Playwright and Chromium. They exercise legal serves, manual contact, two-axis movement, stamina, net/out scoring, service rotation/changeovers, win-by-two, distinct shot trajectories, 297 serve regression cases (both sides/servers, all shot types/powers, line contacts, movement after contact, second serves and double faults), actual WebGL rendering, gamepad mapping, mobile joystick/shot buttons, audio, pause, settings and restart. Physical controller testing and a mobile-device performance test remain separate.

## Deployment

Stage `index.html`, `style.css`, `game.js`, `engine.mjs`, `audio.mjs`, the four WAV files under `assets/audio/`, and the entire `vendor/` folder in an asset directory. Do not deploy tests, the repository metadata or the reference video.

```sh
npx wrangler@4 pages deploy /path/to/assets --project-name tennis-legon --branch main
```

Cloudflare credentials are supplied through the environment. This Pages project uses direct uploads; a GitHub push alone does not deploy it.

### Club arrival, controls and equipment

Every visit opens the club landing page. Enter the club to choose keyboard, phone/touch or PS5 prompts and match settings, then open the owned-asset gallery to pack equipment and enter the court. A face-button press or Space cannot skip arrival. Club / Kit returns from a match; browser Back also returns through the preparation screens. Control layout can be changed during a paused match in Settings. Other input devices remain usable so connecting a controller never traps a phone or keyboard user.

Touch has a movement joystick, four named hold/drag/release shot buttons and a hold-to-sprint RUN button. Keyboard displays Space/X/C/V, movement and aiming keys. PS5 displays Cross/Square/Circle/Triangle, stick guidance and R2 sprint. Settings, ownership and packed equipment persist under `baseline-club-v1` in browser local storage, with a visible session-only notice when saving fails.

The five-piece starter kit contains a racket, terracotta outfit, hard-court shoes, filled water bottle and headband. The gallery separates My equipment from the Club shop; unowned items cannot be equipped. Local club credits start at 200. A completed match awards 50 for winning or 20 for finishing. This is a local game economy, **not real-money purchasing, account ownership or cross-device inventory**. A purchase debits credits once; optional items can be unpacked. Clothing, shoe/racket colors, cap/headband and wristbands change on the player; equipped bottles, towel and bag appear courtside. Accessories are cosmetic and do not grant gameplay advantages.

Equipment research: [USTA gear guidance](https://www.usta.com/en/home/improve/gear-up.html), [hard-court footwear](https://www.usta.com/en/home/improve/gear-up/national/i-mostly-play-on-hard-courts--what-should-i-look-for-in-a-shoe.html), and [starter racket advice](https://www.usta.com/en/home/improve/gear-up/national/first-time-players--guide--how-much-to-spend-on-a-racquet-.html). The footwear guidance recommends cushioning, stability/support and sturdy outsoles for hard courts. Racket and accessory selections here are original cosmetic game items.

**Character import remains blocked:** both user-supplied FBX attachments exceed the executor's 32 MiB transfer limit. Neither could be downloaded, inspected, converted or integrated. File order is explicitly **`character.fbx` = female**, **`character (1).fbx` = male**; preserve this mapping when smaller ZIP files or GLB exports are supplied. The current articulated players are retained until then; this change does not claim to install the supplied rigs.

Additional checks: `node tests/club.mjs` validates inventory transactions and saved state; `python tests/club.py` exercises the landing/settings/gallery/court flow, input layouts, purchases, visible equipped headwear, reload persistence, browser navigation, desktop and mobile layouts with Chromium. Run existing physics/service and gameplay checks as well.

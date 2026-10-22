# Baseline — Cross Court

An original 3D browser tennis game with animated players, a faded blue hard court, three campus environments with seven selectable courts, and a first-to-21 match. Live: https://tennis-legon.pages.dev

See [campus locations and integration URLs](docs/CAMPUS-COURTS.md) for the Athletic Oval, Commonwealth west and stadium/pool environments. Jean Nelson Aka’s basketball courtyard is excluded.

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
| Dive toward movement | L1 | B |
| Pause | Options | P / Escape |

Connect the controller by USB or Bluetooth and press ✕ on the welcome screen. Standard Xbox button positions map to A, X, B, Y respectively. A physical DualSense has not been tested in this cloud environment; browser tests use standard-mapped simulated input.

On touchscreens, the left joystick moves. Hold a shot button on the right and drag it horizontally to aim, vertically to adjust depth, then release. Mouse users can click their half of the court to move, click the far half to aim, and use the shot buttons or keyboard to strike.

## Match and shots

Assisted contact is the default: move into reach and the player swings automatically. Movement and positioning remain manual; position assistance does not move you in this mode. Aim, shot type and power remain yours. Hold a shot to charge; release early to bank power until contact, or keep holding and the current charge is used automatically. Without shot input, medium-power topspin is selected. The last selected type and power remain available for later returns in the match. Serves still start on release.

Choose **Advanced · manual swing timing** in match preparation to require a release near contact. Overcharging and poor timing reduce accuracy in advanced mode. In either mode, aggressive placement can send the ball out, and balls outside reach are missed. Shot types change flight time and bounce restitution. Sprint drains stamina; it recovers when resting.

During assisted play, preparation or serving, a curved 3D aiming guide shows the planned flight and bounce point. Hold the right stick to move the aim cursor continuously in direction and depth; centering it preserves your chosen position. Up moves deeper, down shorter. Both serves and rally shots support adjustable depth. The cursor can pass beyond the court lines for deliberate risk; orange warns of planned outs or faults. The arc uses the same ballistic planner as actual shots, assuming good timing; advanced-mode timing and reach can change the result. Orange indicates an unsafe planned shot.

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

**Character import complete:** both models were downloaded directly from the user’s Drive links, inspected in Blender, and converted to textured GLBs. The actual Drive contents reverse the earlier attachment labels: the first Drive link is the male Ch42 character; the second is the female Ch02 character. The game’s male/female labels follow their inspected appearances. Source URLs, original SHA-256 hashes and file sizes are recorded in `assets/characters/SOURCE.json`.

Additional checks: `node tests/club.mjs` validates inventory transactions and saved state; `python tests/club.py` exercises the landing/settings/gallery/court flow, input layouts, purchases, visible equipped headwear, reload persistence, browser navigation, desktop and mobile layouts with Chromium. Run existing physics/service and gameplay checks as well.


### UG Legon Tennis Smash design and rigged players

The user’s `figma_ug_tennis_showcase.html` is preserved under `design/`. `ug-theme.css` applies its UG Midnight Blue `#002147`, Deep Blue `#00122A`, Surface `#0B1D3A`, Camel Gold `#D4AF37`, glass panels, rounded tiles, italic Inter headings and monospace score typography to the actual lobby, preparation/locker, HUD, standings and match result screens. The app loads fonts locally from `assets/fonts/` (Google Fonts Inter and JetBrains Mono, SIL OFL licenses included). The supplied prototype’s editor chrome, device mockup, hardcoded balances and fake match statistics are not application data. No runtime Tailwind, FontAwesome or font CDN dependency is required.

Choose Commonwealth, Volta, Legon or Akuafo Hall during preparation. HUD hall names reflect that choice. Ball speed is measured from the simulation in km/h; scores, charge, stamina, rewards and longest rally also use actual state. Inter-hall standings are explicitly **local exhibition records on this browser**, calculated from the last 30 completed matches. They do not represent an online tournament or university-wide rankings. Winning awards the existing 50 local credits; finishing awards 20. The actual match retains first-to-21 scoring and the faded blue court.

`avatars.mjs` loads the supplied GLBs with Three.js GLTFLoader and clones their 65-bone skeletons correctly. Each player uses the original textured skinned meshes, with clothing and shoe materials separated from skin for equipment tinting. Rackets follow the right-hand bone, and caps/headbands/wristwear follow the relevant head/hand bones. Ready, running, preparation, swing and serve poses are driven by live match state. **Neither FBX contains animation clips**; these are procedural skeletal poses, not motion-captured tennis animations. Player selection persists in preparation and the portrait gallery, with the opposite character playing the CPU. The primitive athlete models have been removed.

Both GLBs are roughly 5.6 MiB each. The conversion preserves meshes/skin weights, downsizes textures to 2048px color and 1024px normals/hair, and compresses opaque body color maps to JPEG while retaining hair alpha. The browser blocks court entry until both players are ready and offers retry on download failure. Reproduce with Blender 4.3: `blender -b --python tools/convert-character.py -- input.fbx output.glb female` (or `male`), then `python tools/optimize-glb.py output.glb` (Pillow required). Raw FBX and intermediate Blender files stay outside this repository.

`python tests/characters.py` checks both real GLBs, 65-bone skinned meshes, portrait loading, saved selection, run/swing/serve bone movement, racket attachment, actual court rendering and recoverable download failure. The club checks also cover UG design tokens, selected hall in the HUD, real match rewards, local standings and phone layouts.

### Pre-match music

The original **Legon Court Walk** instrumental loops across the lobby, match preparation, locker and local standings after the first click/tap/key gesture (browser autoplay rules apply). It stops immediately when entering the court, stays silent during play, pauses and in-court settings, and resumes from its previous position when returning to the club. Hidden tabs pause music. Music has its own saved on/off preference and volume, separate from court sound effects. The navbar toggle and preparation settings control it; Web Audio gain supports volume control on mobile browsers as well as desktop. A delayed play promise cannot restart it after entering the court.

`music.mjs` manages playback. The 40-second, 96 BPM original instrumental is locally packaged as `assets/audio/legon-court-walk.mp3` (~627 KiB); `tools/compose-menu-music.py` reproduces it using NumPy and ffmpeg. `python tests/music.py` exercises actual browser playback, menu transitions, match silence, pause behavior, tab visibility, saved mute/volume, late playback promises and phone touch controls.

Assisted-contact checks: `node tests/assisted.mjs` and `python tests/assisted.py` cover automatic contact, banked/held power, manual movement, legal serve reception and the saved advanced-mode setting.

Match preparation is a compact hub with icon-only input selection, Settings, Asset Library and court entry. Settings opens a separate page with Match, Court, Controls and Audio sections; instructions appear only in its Controls section. Equipment is managed in the Asset Library. Browser Back and controller navigation work across these screens.

Court entry now starts with an eight-second aerial arrival. Both players walk from the courtside access area along their sideline to their starting positions as the camera eases into the close match view. The presentation leaves match positions, ball state and the simulation clock untouched. Skip arrival, a movement input or a shot input proceeds immediately to play. Leaving the court cancels the sequence. The selected court remains centred; neighbouring courts are peripheral during play. Portrait framing keeps both baselines visible. The arrival path uses the court's runoff area; it does not add or claim a surveyed gate in the campus model.

`python tests/preparation.py` checks icon-only control choices, separate settings/library pages and preparation without scrolling at phone portrait and landscape sizes. `python tests/arrival.py` checks the aerial-to-close transition, walking actors, frozen match, skip/natural completion and selected-court framing on desktop and phone.

Startup shows a branded loading screen immediately. The menu stays hidden and non-interactive until both character models, the selected court, club images and the initial GPU shader/render preparation finish. Progress advances on completed readiness stages; it never reaches 100% on a timer. Audio still follows browser gesture rules. Failed essential downloads show Retry loading; a failed entry module offers a page reload. `python tests/loading.py` verifies delayed downloads, readiness gating, rendered completion, retry and entry-module failure.

Wide and low returns now use an anticipated reach pose and the recorded contact point during recovery. Both rigged players lean, bend their knees and extend the racket arm toward the ball with a short joint solver; bone lengths and the hand attachment are preserved. Contact assistance still requires the player to move within reach. Normal ready and running poses have more knee flex and forward body lean.

The opponent varies placement according to court position: open-court shots, occasional wrong-foot shots, drop shots against a deep player, lobs/passes against a player at the net, and defensive deep returns under pressure. Recovery follows its previous shot, including moving forward behind a drop shot. Fatigue reduces court coverage and pressure raises the chance of a placement error; the three existing difficulty levels retain different reach, reaction and speed limits. Ball pace and manual player controls are unchanged. Checks: `node tests/competition.mjs`, `python tests/reaching.py`, and the existing character, gameplay, assisted-contact and service regressions.


## Update notifications and release preparation

Open sessions check `version.json` after startup, every minute while visible, when returning to the tab and when reconnecting. A different release shows **Update available** with **Refresh & update** and **Later**. The popup does not pause or reload a match automatically. Later hides that release for the current tab; a subsequent release can notify again. Refresh saves the club profile and preserves the selected court URL, then reloads with a release-specific query to apply the update. The current match restarts. Offline checks fail silently. Sessions opened before this feature need one manual refresh to acquire the notification code.

Before every deployment, run `python tools/prepare-release.py /tmp/tennis-release-3d`. This hashes the runtime files and generates matching `build-version.mjs` and `version.json`, then stages the static release including `_headers`. Commit the generated version files along with the changes before deploying that directory. Do not update just the server manifest: the client version must match. The Cloudflare headers revalidate HTML/scripts/styles and prevent the manifest from being cached. `python tests/updates.py` verifies detection, dismissal, offline behavior and refresh with saved preferences and court URL preserved.


Diving returns are manually triggered with **B**, **L1** on a standard-mapped PS5 controller, or the phone **DIVE** button. Move toward the ball, then dive; without directional input the dive heads toward the incoming ball. A dive advances through flight, landing and getting up. During flight, a return requires the incoming ball to intersect the moving racket contact path in position and height before its second bounce; normal assisted reach is disabled. During landing the player cannot run or hit, and movement returns gradually while rising. Stamina, reversing previous momentum and the effort of the attempt determine recovery time. Holding the button cannot chain dives. Point resets clear recovery; pausing freezes it. The opponent's rally continues normally, so its next placement can exploit a slow recovery.

Portrait phones now use a lower camera from behind the player, with gentle lateral following. The desktop match camera is unchanged; the aerial view is limited to the arrival sequence. Tests: `node tests/diving.mjs`, `python tests/diving.py`, and the existing service, automatic-contact, gameplay, character and arrival checks.

On phones, power uses one compact HUD below the score area; the floating player power panel is hidden so it does not cover the player or ball. Landscape touch devices use a small HUD at the upper right. Desktop power displays are unchanged.

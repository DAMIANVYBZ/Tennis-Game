# Baseline Tennis

A standalone browser tennis game with animated players, a faded blue court, an AI opponent, and first-to-seven scoring. No build or external dependencies.

Open `index.html` in Chrome, Edge, or Firefox. Alternatively, run `python -m http.server 8000` from this directory and open the server in your browser.

## Controls

- Mouse or touch: move your player; click or tap to serve.
- Keyboard: arrow keys or A/D to move, Space to serve, P to pause.
- Gamepad: left stick or D-pad to move, A to start/serve, Start to pause. Connect the controller and press a button to activate it in your browser.

Players automatically swing when the ball is in reach. Your position relative to the ball determines the return angle. Choose Casual, Club player, or Challenger difficulty from the sidebar. Sound is optional.

All artwork is drawn in Canvas, including articulated players with running steps and racket swings. The game works offline after downloading `index.html`; no Unity, camera, or account is required.

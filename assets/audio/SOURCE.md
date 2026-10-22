# Reference effects

These brief mono PCM effects were cropped from the gameplay audio uploaded by the user as `videoplayback (1).m4a` (748.936 seconds). They were aligned with the previously supplied gameplay video using racket contacts and player footwork, and inspected using waveforms and spectra. Direct auditory review was unavailable in the execution environment.

- `racket-a.wav`: 99.925–100.135 seconds; racket impact.
- `racket-b.wav`: 102.565–102.805 seconds; alternate racket impact.
- `shoe-a.wav`: 97.590–97.860 seconds; short friction/squeak during footwork.
- `shoe-b.wav`: 98.040–98.340 seconds; alternate shoe friction/squeak.

Processing: mono, 22,050 Hz PCM16, 90 Hz high-pass filter, normalized peaks and short edge fades. The complete recording is not included. These sample excerpts are distinct from the game's original synthesized effects and the renderer's MIT license.

## Menu instrumental

`legon-court-walk.mp3` is an original 40-second, 16-bar instrumental generated for this game with `tools/compose-menu-music.py`: 96 BPM, warm electric-piano-style chords, soft pads, plucked melody, bass and restrained percussion. No third-party recordings or samples are used in this track. Stereo MP3, 32 kHz, 128 kbps. The script uses NumPy synthesis and ffmpeg encoding; it can reproduce the track deterministically.

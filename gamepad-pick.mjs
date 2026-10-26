// Which connected gamepad to read. Windows lists some keyboards, mice, receivers,
// headsets and virtual copies of a controller (Steam Input) as gamepads too, so
// taking the first one can mean listening to a device that never moves. Prefer a
// real controller (enough buttons and axes) and, among those, the one used last.
let lastActive = -1;
export function activeGamepad(pads) {
  const list = pads || (typeof navigator !== 'undefined' && navigator.getGamepads ? Array.from(navigator.getGamepads()) : []);
  const candidates = list.filter(pad => pad?.connected && (pad.buttons?.length || 0) >= 4 && (pad.axes?.length || 0) >= 2);
  const touched = candidates.find(pad => pad.buttons.some(b => b.pressed) || pad.axes.slice(0, 4).some(v => Math.abs(v) > 0.5));
  if (touched) lastActive = touched.index;
  const remembered = candidates.find(pad => pad.index === lastActive);
  if (remembered) return remembered;
  return candidates.sort((a, b) => (b.mapping === 'standard') - (a.mapping === 'standard') || b.buttons.length - a.buttons.length)[0] || null;
}

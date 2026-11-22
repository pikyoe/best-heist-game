// input.js: keyboard + mouse state for the heist.
// WASD / arrows move, Shift sneaks, Space throws smoke, click tosses a coin,
// E interacts, R restarts, M mutes. Nothing here touches the network.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
    pressed: new Set(), // keys pressed since last consume
  };

  function keyName(e) {
    if (e.key === ' ') return 'space';
    return e.key.toLowerCase();
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!keys.has(k)) state.pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    state.mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    state.mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    state.mouse.clickX = ((e.clientX - r.left) / r.width) * canvas.width;
    state.mouse.clickY = ((e.clientY - r.top) / r.height) * canvas.height;
    state.mouse.clicked = true;
  });

  state.axis = function axis() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const n = Math.hypot(x, y);
      x /= n;
      y /= n;
    }
    return { x, y };
  };

  state.sneaking = function sneaking() {
    return keys.has('shift');
  };

  // True once for the frame the key went down; callers consume it.
  state.wasPressed = function wasPressed(k) {
    if (state.pressed.has(k)) {
      state.pressed.delete(k);
      return true;
    }
    return false;
  };

  state.consumeClick = function consumeClick() {
    if (state.mouse.clicked) {
      state.mouse.clicked = false;
      return { x: state.mouse.clickX, y: state.mouse.clickY };
    }
    return null;
  };

  state.endFrame = function endFrame() {
    state.pressed.clear();
  };

  return state;
}

(() => {
  // DOM Elements
  const board = document.getElementById('board');
  const emptyState = document.getElementById('empty-state');
  const imageWrapper = document.getElementById('image-wrapper');
  const targetImage = document.getElementById('target-image');
  const imageInput = document.getElementById('image-input');
  const changeImageInput = document.getElementById('change-image-input');
  const controlPanel = document.getElementById('control-panel');
  const btnMinimizePanel = document.getElementById('btn-minimize-panel');
  const lockOverlay = document.getElementById('lock-overlay');
  const btnLock = document.getElementById('btn-lock');
  const btnUnlock = document.getElementById('btn-unlock');

  // Control inputs
  const scaleRange = document.getElementById('scale-range');
  const scaleVal = document.getElementById('scale-val');
  const btnScaleUp = document.getElementById('btn-scale-up');
  const btnScaleDown = document.getElementById('btn-scale-down');

  const rotateRange = document.getElementById('rotate-range');
  const rotateVal = document.getElementById('rotate-val');
  const btnRot90 = document.getElementById('btn-rot-90');
  const btnFlipH = document.getElementById('btn-flip-h');
  const btnFlipV = document.getElementById('btn-flip-v');

  const bgColorInput = document.getElementById('bg-color');
  const bgColorVal = document.getElementById('bg-color-val');
  const colorPresetDots = document.querySelectorAll('.color-preset-dot');

  const btnFilterInvert = document.getElementById('btn-filter-invert');
  const btnFilterGrayscale = document.getElementById('btn-filter-grayscale');
  const btnFilterOutline = document.getElementById('btn-filter-outline');

  const opacityRange = document.getElementById('opacity-range');
  const opacityVal = document.getElementById('opacity-val');
  const btnResetTransform = document.getElementById('btn-reset-transform');

  // State Management
  const state = {
    posX: 0,
    posY: 0,
    scale: 1, // 100%
    rotation: 0,
    flipH: 1,
    flipV: 1,
    opacity: 1,
    invert: false,
    grayscale: false,
    highContrast: false,
    bgColor: '#ffffff',
    isLocked: false,
    hasImage: false
  };

  // Drag & Pinch Zoom variables for iPad Touch Support
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let startPosX = 0;
  let startPosY = 0;

  // Multi-touch pinch zoom
  let initialPinchDistance = null;
  let initialScale = 1;

  // Apply visual updates to the image
  function updateImageTransform() {
    if (!state.hasImage) return;

    // Transform position & scale & rotation
    const transformStr = `translate(-50%, -50%) translate(${state.posX}px, ${state.posY}px) scale(${state.scale}) rotate(${state.rotation}deg) scale(${state.flipH}, ${state.flipV})`;
    imageWrapper.style.transform = transformStr;

    // Filters
    const filters = [];
    if (state.invert) filters.push('invert(1)');
    if (state.grayscale) filters.push('grayscale(1)');
    if (state.highContrast) filters.push('contrast(240%) brightness(110%)');

    targetImage.style.filter = filters.length > 0 ? filters.join(' ') : 'none';
    targetImage.style.opacity = state.opacity;
  }

  // Update background color
  function updateBackgroundColor(color) {
    state.bgColor = color;
    document.body.style.backgroundColor = color;
    board.style.backgroundColor = color;
    bgColorInput.value = color;
    bgColorVal.textContent = color.toUpperCase();
  }

  // Handle Image Upload
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      targetImage.src = e.target.result;
      state.hasImage = true;
      emptyState.style.display = 'none';
      imageWrapper.style.display = 'block';

      // Reset transforms when loading a new image
      resetTransform();
    };
    reader.readAsDataURL(file);
  }

  function resetTransform() {
    state.posX = 0;
    state.posY = 0;
    state.scale = 1;
    state.rotation = 0;
    state.flipH = 1;
    state.flipV = 1;

    scaleRange.value = 100;
    scaleVal.textContent = '100%';
    rotateRange.value = 0;
    rotateVal.textContent = '0°';
    btnFlipH.classList.remove('active');
    btnFlipV.classList.remove('active');

    updateImageTransform();
  }

  // File Inputs Event Listeners
  imageInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });
  changeImageInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  // Drag & drop file to board
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (state.isLocked) return;
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // Paste image from clipboard (Ctrl+V)
  window.addEventListener('paste', (e) => {
    if (state.isLocked) return;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        handleFile(item.getAsFile());
        break;
      }
    }
  });

  // Scale Controls
  function setScale(newPercent) {
    newPercent = Math.min(500, Math.max(10, Math.round(newPercent)));
    state.scale = newPercent / 100;
    scaleRange.value = newPercent;
    scaleVal.textContent = `${newPercent}%`;
    updateImageTransform();
  }

  scaleRange.addEventListener('input', (e) => {
    setScale(parseInt(e.target.value, 10));
  });

  btnScaleUp.addEventListener('click', () => {
    setScale(parseInt(scaleRange.value, 10) + 10);
  });

  btnScaleDown.addEventListener('click', () => {
    setScale(parseInt(scaleRange.value, 10) - 10);
  });

  // Mouse wheel zoom on image
  window.addEventListener('wheel', (e) => {
    if (state.isLocked || !state.hasImage) return;
    if (controlPanel.contains(e.target)) return;

    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    setScale(parseInt(scaleRange.value, 10) + delta);
  }, { passive: false });

  // Rotation Controls
  rotateRange.addEventListener('input', (e) => {
    state.rotation = parseInt(e.target.value, 10);
    rotateVal.textContent = `${state.rotation}°`;
    updateImageTransform();
  });

  btnRot90.addEventListener('click', () => {
    state.rotation = (state.rotation + 90) % 360;
    rotateRange.value = state.rotation;
    rotateVal.textContent = `${state.rotation}°`;
    updateImageTransform();
  });

  btnFlipH.addEventListener('click', () => {
    state.flipH = state.flipH === 1 ? -1 : 1;
    btnFlipH.classList.toggle('active', state.flipH === -1);
    updateImageTransform();
  });

  btnFlipV.addEventListener('click', () => {
    state.flipV = state.flipV === 1 ? -1 : 1;
    btnFlipV.classList.toggle('active', state.flipV === -1);
    updateImageTransform();
  });

  // Color picker & presets
  bgColorInput.addEventListener('input', (e) => {
    updateBackgroundColor(e.target.value);
  });

  colorPresetDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const color = dot.getAttribute('data-color');
      updateBackgroundColor(color);
    });
  });

  // Filters for tracing
  btnFilterInvert.addEventListener('click', () => {
    state.invert = !state.invert;
    btnFilterInvert.classList.toggle('active', state.invert);
    updateImageTransform();
  });

  btnFilterGrayscale.addEventListener('click', () => {
    state.grayscale = !state.grayscale;
    btnFilterGrayscale.classList.toggle('active', state.grayscale);
    updateImageTransform();
  });

  btnFilterOutline.addEventListener('click', () => {
    state.highContrast = !state.highContrast;
    btnFilterOutline.classList.toggle('active', state.highContrast);
    updateImageTransform();
  });

  // Opacity
  opacityRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.opacity = val / 100;
    opacityVal.textContent = `${val}%`;
    updateImageTransform();
  });

  btnResetTransform.addEventListener('click', resetTransform);

  // Helper for 2-finger distance (iPad pinch zoom)
  function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  // Touch Handling for iPad & Mobile
  board.addEventListener('touchstart', (e) => {
    if (state.isLocked || !state.hasImage) return;
    if (controlPanel.contains(e.target)) return;

    if (e.touches.length === 1) {
      // 1 Finger: Drag
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      startPosX = state.posX;
      startPosY = state.posY;
      initialPinchDistance = null;
    } else if (e.touches.length === 2) {
      // 2 Fingers: Pinch to Zoom
      isDragging = false;
      initialPinchDistance = getPinchDistance(e.touches);
      initialScale = state.scale;
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (state.isLocked || !state.hasImage) return;
    if (controlPanel.contains(e.target)) return;

    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragStartX;
      const dy = e.touches[0].clientY - dragStartY;
      state.posX = startPosX + dx;
      state.posY = startPosY + dy;
      updateImageTransform();
    } else if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault();
      const currentDistance = getPinchDistance(e.touches);
      const factor = currentDistance / initialPinchDistance;
      const newScalePercent = (initialScale * factor) * 100;
      setScale(newScalePercent);
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      isDragging = false;
      initialPinchDistance = null;
    } else if (e.touches.length === 1) {
      initialPinchDistance = null;
    }
  });

  // Mouse Dragging Position
  board.addEventListener('mousedown', (e) => {
    if (state.isLocked || !state.hasImage) return;
    if (controlPanel.contains(e.target)) return;

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startPosX = state.posX;
    startPosY = state.posY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging || state.isLocked) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    state.posX = startPosX + dx;
    state.posY = startPosY + dy;
    updateImageTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Minimize / Expand Control Panel
  btnMinimizePanel.addEventListener('click', () => {
    controlPanel.classList.toggle('minimized');
  });

  // Fullscreen toggle helper for iPad Safari
  function requestFullscreenSafe() {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    }
  }

  // LOCK & UNLOCK SCREEN LOGIC
  function lockScreen() {
    state.isLocked = true;
    controlPanel.style.display = 'none';
    lockOverlay.style.display = 'block';

    // On iPad, try entering full screen mode for maximum drawing area
    requestFullscreenSafe();
  }

  function unlockScreen() {
    state.isLocked = false;
    controlPanel.style.display = 'flex';
    lockOverlay.style.display = 'none';
  }

  btnLock.addEventListener('click', lockScreen);
  btnUnlock.addEventListener('click', unlockScreen);

  // Shortcut key ESC or double click on unlock button
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isLocked) {
      unlockScreen();
    }
  });

  // Prevent context menu (long press / right click) while locked
  window.addEventListener('contextmenu', (e) => {
    if (state.isLocked) {
      e.preventDefault();
    }
  });

  // Prevent accidental bounce scrolling on iOS Safari
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });
})();

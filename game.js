(() => {
  "use strict";

  const PRESETS = {
    beginner: { rows: 9, cols: 9, mines: 10, label: "beginner" },
    intermediate: { rows: 16, cols: 16, mines: 40, label: "intermediate" },
    expert: { rows: 16, cols: 30, mines: 99, label: "expert" },
  };
  const FLAG_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V3m1 1h12l-3.2 4 3.2 4H7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="3" r="1.7" fill="currentColor"/></svg>';
  const MINE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2v3m0 13.6v3M2.2 12h3m13.6 0h3M5.08 5.08l2.12 2.12m9.6 9.6 2.12 2.12m0-13.84L16.8 7.2m-9.6 9.6-2.12 2.12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="5.1" fill="currentColor"/><circle cx="10.3" cy="10.3" r="1.2" fill="#fffefa"/></svg>';

  const boardElement = document.querySelector("#board");
  const boardWrap = document.querySelector("#board-wrap");
  const mineCounter = document.querySelector("#mine-counter");
  const timerOutput = document.querySelector("#timer");
  const highScoreOutput = document.querySelector("#high-score");
  const message = document.querySelector("#game-message");
  const difficultySelect = document.querySelector("#difficulty-select");
  const bestLabel = document.querySelector("#best-label");
  const bestTime = document.querySelector("#best-time");
  const faceButton = document.querySelector("#face-button");
  const faceIcon = document.querySelector("#face-icon");
  const flagModeButton = document.querySelector("#flag-mode");
  const flagModeState = document.querySelector("#flag-mode-state");
  const customDialog = document.querySelector("#custom-dialog");
  const customForm = document.querySelector("#custom-form");
  const customRows = document.querySelector("#custom-rows");
  const customCols = document.querySelector("#custom-cols");
  const customMines = document.querySelector("#custom-mines");
  const fieldError = document.querySelector("#field-error");
  const RECORDS_KEY = "field-notes-minesweeper-records";
  const recordCache = {};

  const state = {
    rows: PRESETS.beginner.rows,
    cols: PRESETS.beginner.cols,
    mineTotal: PRESETS.beginner.mines,
    cells: [],
    mode: "beginner",
    customKey: "",
    status: "ready",
    generated: false,
    startedAt: null,
    elapsed: 0,
    timerId: null,
    flagMode: false,
    focusIndex: 0,
  };

  function cellTemplate() {
    return { mine: false, adjacent: 0, revealed: false, flagged: false, exploded: false };
  }

  function createCells() {
    state.cells = Array.from({ length: state.rows * state.cols }, cellTemplate);
  }

  function neighborsOf(index) {
    const row = Math.floor(index / state.cols);
    const col = index % state.cols;
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (nextRow >= 0 && nextRow < state.rows && nextCol >= 0 && nextCol < state.cols) {
          neighbors.push(nextRow * state.cols + nextCol);
        }
      }
    }
    return neighbors;
  }

  function generateField(firstIndex) {
    const safe = new Set([firstIndex, ...neighborsOf(firstIndex)]);
    let candidates = state.cells.map((_, index) => index).filter((index) => !safe.has(index));
    if (candidates.length < state.mineTotal) {
      candidates = state.cells.map((_, index) => index).filter((index) => index !== firstIndex);
    }
    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    for (const index of candidates.slice(0, state.mineTotal)) state.cells[index].mine = true;
    state.cells.forEach((cell, index) => {
      if (!cell.mine) cell.adjacent = neighborsOf(index).filter((neighbor) => state.cells[neighbor].mine).length;
    });
    state.generated = true;
  }

  function iconForFace(face) {
    const shell = '<circle cx="22" cy="22" r="18" fill="#e7efcc" stroke="#b9c98e" stroke-width="1.3"/><path d="M10 9c3-3 7-4.5 12-4.5S31 6 34 9" fill="none" stroke="#f9fcf1" stroke-width="2" stroke-linecap="round"/>';
    const eyes = '<circle cx="17" cy="18" r="1.35" fill="#435445"/><circle cx="27" cy="18" r="1.35" fill="#435445"/>';
    const mouth = '<path d="M15 25c1.8 2.2 4.1 3.4 7 3.4s5.2-1.2 7-3.4" fill="none" stroke="#435445" stroke-width="1.8" stroke-linecap="round"/>';
    if (face === "shock") {
      faceIcon.innerHTML = `${shell}${eyes}<circle cx="22" cy="27" r="3" fill="none" stroke="#435445" stroke-width="1.8"/>`;
    } else if (face === "win") {
      faceIcon.innerHTML = `${shell}<path d="M13.2 16h7.4v5h-7.4zm10.8 0h7.4v5H24zM20.6 18h2.8" fill="#435445" stroke="#435445" stroke-width="1.2" stroke-linejoin="round"/><path d="M15 24c1.7 2.4 4.1 3.6 7 3.6s5.3-1.2 7-3.6" fill="none" stroke="#435445" stroke-width="1.8" stroke-linecap="round"/>`;
    } else if (face === "dead") {
      faceIcon.innerHTML = '<circle cx="22" cy="22" r="18" fill="#f3ded6" stroke="#e1b9aa" stroke-width="1.3"/><path d="m14 16 5 5m0-5-5 5m10-5 5 5m0-5-5 5M15 29c2-2.2 4.3-3.3 7-3.3s5 1.1 7 3.3" fill="none" stroke="#75544b" stroke-width="1.8" stroke-linecap="round"/>';
    } else {
      faceIcon.innerHTML = `${shell}${eyes}${mouth}`;
    }
  }

  function setFace(face) {
    iconForFace(face);
    const labels = { smile: "Start a new game", shock: "Game in progress", win: "You won. Start another game", dead: "Game over. Start another game" };
    faceButton.setAttribute("aria-label", labels[face]);
  }

  function formatCounter(value) {
    if (value < 0) return `-${String(Math.abs(value)).padStart(2, "0")}`;
    return String(Math.min(value, 999)).padStart(3, "0");
  }

  function formatTime(seconds) {
    const safeSeconds = Math.min(Math.max(0, seconds), 999);
    return String(safeSeconds).padStart(3, "0");
  }

  function remainingMines() {
    return state.mineTotal - state.cells.filter((cell) => cell.flagged).length;
  }

  function updateCounters() {
    mineCounter.textContent = formatCounter(remainingMines());
    mineCounter.setAttribute("aria-label", `${remainingMines()} mines remaining`);
    timerOutput.textContent = formatTime(state.elapsed);
  }

  function storageKey() {
    return state.mode === "custom" ? state.customKey : state.mode;
  }

  function loadBest() {
    const label = state.mode === "custom" ? "custom" : state.mode;
    bestLabel.textContent = label;
    const record = readRecords()[storageKey()];
    const hasRecord = Number.isInteger(record);
    bestTime.textContent = hasRecord ? `${formatTime(record)} sec` : "— — —";
    highScoreOutput.textContent = hasRecord ? formatTime(record) : "---";
    highScoreOutput.setAttribute("aria-label", hasRecord ? `High score: ${record} seconds for ${label}` : `No high score yet for ${label}`);
  }

  function readRecords() {
    try {
      const stored = JSON.parse(localStorage.getItem(RECORDS_KEY) || "{}");
      if (stored && typeof stored === "object" && !Array.isArray(stored)) Object.assign(recordCache, stored);
    } catch {
      // Keep this page's records usable when storage is blocked by the browser.
    }
    return recordCache;
  }

  function saveBest() {
    const key = storageKey();
    const records = readRecords();
    const previous = records[key];
    if (Number.isInteger(previous) && previous <= state.elapsed) {
      loadBest();
      return false;
    }
    records[key] = state.elapsed;
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    } catch {
      // The in-memory record remains visible for the current page session.
    }
    loadBest();
    return true;
  }

  function cellLabel(cell, index) {
    const row = Math.floor(index / state.cols) + 1;
    const col = (index % state.cols) + 1;
    const location = `Row ${row}, column ${col}`;
    if (cell.flagged) return `${location}, flagged`;
    if (!cell.revealed) return `${location}, covered`;
    if (cell.mine) return `${location}, mine`;
    return cell.adjacent ? `${location}, ${cell.adjacent} adjacent ${cell.adjacent === 1 ? "mine" : "mines"}` : `${location}, empty`;
  }

  function renderBoard(restoreFocus = false) {
    const fragment = document.createDocumentFragment();
    for (let rowIndex = 0; rowIndex < state.rows; rowIndex += 1) {
      const row = document.createElement("div");
      row.className = "board-row";
      row.setAttribute("role", "row");
      for (let colIndex = 0; colIndex < state.cols; colIndex += 1) {
        const index = rowIndex * state.cols + colIndex;
        const cell = state.cells[index];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cell";
        button.dataset.index = String(index);
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", cellLabel(cell, index));
        button.setAttribute("aria-pressed", String(cell.flagged));
        button.tabIndex = index === state.focusIndex ? 0 : -1;
        if (cell.revealed) button.classList.add("is-revealed");
        if (cell.flagged) button.classList.add("is-flagged");
        if (cell.exploded) button.classList.add("is-exploded");
        if (cell.revealed && cell.mine) button.classList.add("is-mine");
        if (state.status === "lost" && cell.flagged && !cell.mine) {
          button.classList.add("is-wrong-flag");
          button.innerHTML = `${FLAG_ICON}<span class="sr-only"> Incorrect flag</span>`;
        } else if (cell.flagged) {
          button.innerHTML = FLAG_ICON;
        } else if (cell.revealed && cell.mine) {
          button.innerHTML = MINE_ICON;
        } else if (cell.revealed && cell.adjacent > 0) {
          button.textContent = String(cell.adjacent);
          button.classList.add(`number-${cell.adjacent}`);
        }
        row.append(button);
      }
      fragment.append(row);
    }
    boardElement.replaceChildren(fragment);
    boardElement.setAttribute("aria-label", `Minesweeper board, ${state.rows} rows by ${state.cols} columns`);
    boardElement.style.gridTemplateColumns = `repeat(${state.cols}, var(--cell-size))`;
    sizeBoardCells();
    boardWrap.setAttribute("aria-label", `${state.cols} columns. Scroll horizontally to view the full board.`);
    if (restoreFocus) boardElement.querySelector(`[data-index="${state.focusIndex}"]`)?.focus({ preventScroll: true });
  }

  function sizeBoardCells() {
    const style = getComputedStyle(boardWrap);
    const availableWidth = boardWrap.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
    const cellSize = Math.max(18, Math.min(35, Math.floor((availableWidth - 2 * (state.cols - 1)) / state.cols)));
    boardElement.style.setProperty("--cell-size", `${cellSize}px`);
  }

  function startTimer() {
    if (state.startedAt !== null) return;
    state.startedAt = Date.now();
    state.timerId = window.setInterval(() => {
      if (state.status !== "playing" || state.startedAt === null) return;
      state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      updateCounters();
    }, 200);
  }

  function stopTimer() {
    if (state.timerId !== null) window.clearInterval(state.timerId);
    state.timerId = null;
    if (state.startedAt !== null) state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    state.startedAt = null;
    updateCounters();
  }

  function toggleFlag(index) {
    if (state.status !== "ready" && state.status !== "playing") return;
    const cell = state.cells[index];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    updateCounters();
    renderBoard(boardElement.contains(document.activeElement));
    message.textContent = cell.flagged ? "Flag placed. Keep reading the field." : "Flag removed.";
  }

  function revealCells(indices) {
    const stack = [...indices];
    const visited = new Set();
    let explodedIndex = null;
    while (stack.length) {
      const index = stack.pop();
      if (visited.has(index)) continue;
      visited.add(index);
      const cell = state.cells[index];
      if (!cell || cell.flagged || cell.revealed) continue;
      if (cell.mine) {
        cell.exploded = true;
        explodedIndex = index;
        break;
      }
      cell.revealed = true;
      if (cell.adjacent === 0) {
        for (const neighbor of neighborsOf(index)) {
          if (!visited.has(neighbor) && !state.cells[neighbor].flagged) stack.push(neighbor);
        }
      }
    }
    if (explodedIndex !== null) finishGame("lost", explodedIndex);
    else if (state.cells.filter((cell) => !cell.mine && cell.revealed).length === state.rows * state.cols - state.mineTotal) finishGame("won");
  }

  function finishGame(result, explodedIndex = null) {
    state.status = result;
    stopTimer();
    if (result === "won") {
      for (const cell of state.cells) if (cell.mine) cell.flagged = true;
      state.status = "won";
      setFace("win");
      const isNewRecord = saveBest();
      message.textContent = isNewRecord
        ? `New high score! Field cleared in ${formatTime(state.elapsed)} seconds.`
        : `Field cleared in ${formatTime(state.elapsed)} seconds. Nicely done.`;
    } else {
      for (const cell of state.cells) if (cell.mine) cell.revealed = true;
      if (explodedIndex !== null) state.cells[explodedIndex].exploded = true;
      setFace("dead");
      message.textContent = "That one was live. Take a breath and try again.";
    }
    updateCounters();
    renderBoard(boardElement.contains(document.activeElement));
  }

  function reveal(index) {
    if (state.status !== "ready" && state.status !== "playing") return;
    const cell = state.cells[index];
    if (cell.flagged) return;
    if (cell.revealed) {
      chord(index);
      return;
    }
    if (!state.generated) {
      generateField(index);
      state.status = "playing";
      startTimer();
    }
    setFace("shock");
    revealCells([index]);
    if (state.status === "playing") {
      setFace("smile");
      const revealed = state.cells.filter((item) => item.revealed).length;
      message.textContent = revealed > 1 ? `${revealed} squares clear. Keep going.` : "Good start. Read the numbers around you.";
      renderBoard(boardElement.contains(document.activeElement));
    }
  }

  function chord(index) {
    const cell = state.cells[index];
    if (!cell.revealed || cell.adjacent === 0 || state.status !== "playing") return;
    const neighbors = neighborsOf(index);
    const flaggedCount = neighbors.filter((neighbor) => state.cells[neighbor].flagged).length;
    if (flaggedCount !== cell.adjacent) return;
    revealCells(neighbors.filter((neighbor) => !state.cells[neighbor].flagged));
    if (state.status === "playing") {
      message.textContent = "Neighbors checked. Keep going.";
      renderBoard(boardElement.contains(document.activeElement));
    }
  }

  function newGame(config = null, mode = state.mode, customKey = state.customKey) {
    const focusWasInBoard = boardElement.contains(document.activeElement);
    const next = config || PRESETS[mode] || PRESETS.beginner;
    state.rows = next.rows;
    state.cols = next.cols;
    state.mineTotal = next.mines;
    state.mode = mode;
    state.customKey = customKey;
    state.status = "ready";
    state.generated = false;
    state.startedAt = null;
    state.elapsed = 0;
    state.focusIndex = 0;
    if (state.timerId !== null) window.clearInterval(state.timerId);
    state.timerId = null;
    state.flagMode = false;
    flagModeButton.setAttribute("aria-pressed", "false");
    flagModeState.textContent = "off";
    createCells();
    updateCounters();
    loadBest();
    setFace("smile");
    message.textContent = "Pick a square to begin. Your first click is always safe.";
    renderBoard(focusWasInBoard);
  }

  function openCustomDialog() {
    fieldError.textContent = "";
    customMines.max = String(Number(customRows.value) * Number(customCols.value) - 1);
    if (typeof customDialog.showModal === "function") customDialog.showModal();
    else customDialog.setAttribute("open", "");
  }

  function closeCustomDialog() {
    if (typeof customDialog.close === "function") customDialog.close();
    else customDialog.removeAttribute("open");
    difficultySelect.value = state.mode === "custom" ? "custom" : state.mode;
  }

  boardElement.addEventListener("click", (event) => {
    const button = event.target.closest(".cell");
    if (!button) return;
    const index = Number(button.dataset.index);
    state.focusIndex = index;
    if (state.flagMode) toggleFlag(index);
    else reveal(index);
  });

  boardElement.addEventListener("contextmenu", (event) => {
    const button = event.target.closest(".cell");
    if (!button) return;
    event.preventDefault();
    state.focusIndex = Number(button.dataset.index);
    toggleFlag(state.focusIndex);
  });

  boardElement.addEventListener("keydown", (event) => {
    const button = event.target.closest(".cell");
    if (!button) return;
    const index = Number(button.dataset.index);
    const row = Math.floor(index / state.cols);
    const col = index % state.cols;
    const moves = { ArrowUp: index - state.cols, ArrowDown: index + state.cols, ArrowLeft: index - 1, ArrowRight: index + 1 };
    if (Object.hasOwn(moves, event.key)) {
      event.preventDefault();
      const nextRow = Math.floor(moves[event.key] / state.cols);
      const nextCol = moves[event.key] % state.cols;
      const inside = moves[event.key] >= 0 && moves[event.key] < state.cells.length && Math.abs(nextRow - row) <= 1 && Math.abs(nextCol - col) <= 1;
      if (inside) {
        state.focusIndex = moves[event.key];
        boardElement.querySelector(`[data-index="${state.focusIndex}"]`)?.focus();
      }
    } else if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      state.focusIndex = index;
      toggleFlag(index);
    }
  });

  document.querySelector("#new-game").addEventListener("click", () => newGame());
  faceButton.addEventListener("click", () => newGame());
  flagModeButton.addEventListener("click", () => {
    state.flagMode = !state.flagMode;
    flagModeButton.setAttribute("aria-pressed", String(state.flagMode));
    flagModeState.textContent = state.flagMode ? "on" : "off";
    message.textContent = state.flagMode ? "Flag mode is on. Tap a covered square to mark it." : "Flag mode is off. Tap to uncover a square.";
  });

  difficultySelect.addEventListener("change", () => {
    if (difficultySelect.value === "custom") {
      openCustomDialog();
      return;
    }
    newGame(PRESETS[difficultySelect.value], difficultySelect.value, "");
  });

  document.querySelector("#dialog-close").addEventListener("click", closeCustomDialog);
  customDialog.addEventListener("click", (event) => {
    if (event.target === customDialog) closeCustomDialog();
  });

  customRows.addEventListener("input", () => {
    const safeMax = Math.max(1, Number(customRows.value) * Number(customCols.value) - 1);
    customMines.max = String(safeMax);
    if (Number(customMines.value) > safeMax) customMines.value = String(safeMax);
  });
  customCols.addEventListener("input", () => {
    const safeMax = Math.max(1, Number(customRows.value) * Number(customCols.value) - 1);
    customMines.max = String(safeMax);
    if (Number(customMines.value) > safeMax) customMines.value = String(safeMax);
  });

  customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const rows = Number(customRows.value);
    const cols = Number(customCols.value);
    const mines = Number(customMines.value);
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || !Number.isInteger(mines) || rows < 5 || rows > 30 || cols < 5 || cols > 40 || mines < 1 || mines >= rows * cols) {
      fieldError.textContent = "Use 5–30 rows, 5–40 columns, and fewer mines than squares.";
      return;
    }
    const config = { rows, cols, mines, label: "custom" };
    const key = `custom-${rows}x${cols}-${mines}`;
    difficultySelect.value = "custom";
    if (typeof customDialog.close === "function") customDialog.close();
    else customDialog.removeAttribute("open");
    newGame(config, "custom", key);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "r" && !customDialog.open && !event.target.matches("input, select, textarea")) {
      newGame();
    }
    if (event.key === "Escape" && customDialog.open) closeCustomDialog();
  });

  window.addEventListener("resize", sizeBoardCells);

  newGame(PRESETS.beginner, "beginner", "");
})();

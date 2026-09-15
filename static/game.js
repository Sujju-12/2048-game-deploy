const SIZE = 4;
let board = [];
let score = 0;
let best = Number(localStorage.getItem("2048-best") || 0);
let touchStart = null;

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const statusEl = document.getElementById("status");

function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function emptyCells() {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile() {
  const cells = emptyCells();
  if (!cells.length) return;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function startGame() {
  board = emptyBoard();
  score = 0;
  statusEl.textContent = "";
  addRandomTile();
  addRandomTile();
  render();
  sendMetric("/api/reset", {});
}

function render() {
  boardEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = board[r][c];
      const tile = document.createElement("div");
      tile.className = "tile" + (value ? ` n${value}` : "");
      if (value) tile.textContent = value;
      boardEl.appendChild(tile);
    }
  }
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function slideLine(line) {
  const compacted = line.filter((value) => value !== 0);
  const result = [];
  let gained = 0;

  for (let i = 0; i < compacted.length; i++) {
    if (compacted[i] === compacted[i + 1]) {
      const merged = compacted[i] * 2;
      result.push(merged);
      gained += merged;
      i++;
    } else {
      result.push(compacted[i]);
    }
  }

  while (result.length < SIZE) result.push(0);
  return { result, gained };
}

function getLine(direction, index) {
  if (direction === "left") return [...board[index]];
  if (direction === "right") return [...board[index]].reverse();
  if (direction === "up") return board.map((row) => row[index]);
  return board.map((row) => row[index]).reverse();
}

function setLine(direction, index, values) {
  const line = direction === "right" || direction === "down" ? [...values].reverse() : values;
  if (direction === "left" || direction === "right") {
    board[index] = line;
  } else {
    for (let r = 0; r < SIZE; r++) board[r][index] = line[r];
  }
}

function move(direction) {
  let changed = false;
  let gainedTotal = 0;

  for (let i = 0; i < SIZE; i++) {
    const original = getLine(direction, i);
    const { result, gained } = slideLine(original);
    if (result.some((value, j) => value !== original[j])) changed = true;
    gainedTotal += gained;
    setLine(direction, i, result);
  }

  if (!changed) return false;
  score += gainedTotal;
  if (score > best) {
    best = score;
    localStorage.setItem("2048-best", String(best));
  }
  addRandomTile();
  render();
  sendMetric("/api/move", { direction });

  if (board.flat().includes(2048)) {
    statusEl.textContent = "You reached 2048! Keep going or start a new game.";
  } else if (!canMove()) {
    statusEl.textContent = "Game over. Start a new game.";
  }
  return true;
}

function canMove() {
  if (emptyCells().length) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function sendMetric(path, payload) {
  fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Metrics should never interrupt gameplay.
  });
}

document.addEventListener("keydown", (event) => {
  const directionMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  const direction = directionMap[event.key];
  if (!direction) return;
  event.preventDefault();
  move(direction);
});

boardEl.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

boardEl.addEventListener("touchend", (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
}, { passive: true });

document.getElementById("new-game").addEventListener("click", startGame);
bestEl.textContent = best;
startGame();

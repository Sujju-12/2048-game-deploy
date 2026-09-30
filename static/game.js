const SIZE = 4;
let board = [];
let score = 0;
let best = 0;
let playerName = "";
let globalRecord = { name: "", score: 0 };
let canPlay = false;
let touchStart = null;

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const statusEl = document.getElementById("status");
const recordEl = document.getElementById("record-display");
const playerLabelEl = document.getElementById("player-label");
const nameModalEl = document.getElementById("name-modal");
const nameFormEl = document.getElementById("name-form");
const playerNameInput = document.getElementById("player-name");

function bestKey(name) {
  return `2048-best-${name.toLowerCase()}`;
}

function loadPersonalBest() {
  best = Number(localStorage.getItem(bestKey(playerName)) || 0);
}

function savePersonalBest() {
  localStorage.setItem(bestKey(playerName), String(best));
}

function formatRecord(record) {
  if (!record.name || record.score <= 0) return "—";
  return `${record.name} · ${record.score}`;
}

function updateRecordDisplay() {
  recordEl.textContent = formatRecord(globalRecord);
}

async function fetchGlobalRecord() {
  try {
    const response = await fetch("/api/highscore");
    if (!response.ok) return;
    const data = await response.json();
    globalRecord = {
      name: String(data.name || ""),
      score: Number(data.score || 0),
    };
    updateRecordDisplay();
  } catch {
    // Offline or transient error — keep last known record.
  }
}

async function tryUpdateGlobalRecord(currentScore) {
  if (!playerName || currentScore <= globalRecord.score) return;
  try {
    const response = await fetch("/api/highscore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playerName, score: currentScore }),
    });
    if (!response.ok) return;
    globalRecord = await response.json();
    updateRecordDisplay();
    if (currentScore === score) {
      statusEl.textContent = `New record! ${playerName} — ${currentScore}`;
    }
  } catch {
    // Ignore — gameplay continues.
  }
}

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
  if (!canPlay) return;
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

function afterScoreUpdate() {
  if (score > best) {
    best = score;
    savePersonalBest();
  }
  void tryUpdateGlobalRecord(score);
}

function move(direction) {
  if (!canPlay) return false;

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
  afterScoreUpdate();
  addRandomTile();
  render();
  sendMetric("/api/move", { direction });

  if (board.flat().includes(2048)) {
    statusEl.textContent = "You reached 2048! Keep going or start a new game.";
  } else if (!canMove()) {
    statusEl.textContent = `Game over, ${playerName}. Score: ${score}. Start a new game.`;
    void tryUpdateGlobalRecord(score);
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

function beginSession(name) {
  playerName = name.trim();
  if (!playerName) return;
  localStorage.setItem("2048-player-name", playerName);
  playerLabelEl.textContent = playerName;
  loadPersonalBest();
  nameModalEl.classList.add("hidden");
  boardEl.setAttribute("aria-hidden", "false");
  canPlay = true;
  startGame();
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

nameFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  beginSession(playerNameInput.value);
});

document.getElementById("new-game").addEventListener("click", startGame);

void fetchGlobalRecord();

const savedName = localStorage.getItem("2048-player-name");
if (savedName) {
  playerNameInput.value = savedName;
}

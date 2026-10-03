const gridSize = 3;
const totalPieces = gridSize * gridSize;

const board = document.querySelector('#board');
const tray = document.querySelector('#pieces-tray');
const statusText = document.querySelector('#game-status');
const piecesCount = document.querySelector('#pieces-count');
const movesCount = document.querySelector('#moves-count');
const timerText = document.querySelector('#timer');
const completionVideo = document.querySelector('#completion-video');
const previewToggle = document.querySelector('#preview-toggle');

let selectedPiece = null;
let moves = 0;
let placedPieces = 0;
let startedAt = null;
let timerInterval = null;

function createBoard() {
  board.querySelectorAll('.slot').forEach((slot) => slot.remove());
  board.classList.remove('is-complete');

  for (let index = 0; index < totalPieces; index += 1) {
    const slot = document.createElement('button');
    const column = index % gridSize;
    const row = Math.floor(index / gridSize);
    slot.type = 'button';
    slot.className = 'slot';
    slot.dataset.index = String(index);
    slot.style.setProperty('--image-position', `${column * 50}% ${row * 50}%`);
    slot.setAttribute('aria-label', `Lugar ${index + 1}`);
    slot.addEventListener('click', () => {
      if (selectedPiece) placePiece(selectedPiece, slot);
    });
    board.insertBefore(slot, completionVideo);
  }
}

function createPiece(index) {
  const piece = document.createElement('button');
  const column = index % gridSize;
  const row = Math.floor(index / gridSize);
  piece.type = 'button';
  piece.className = 'piece';
  piece.dataset.index = String(index);
  piece.style.backgroundPosition = `${column * 50}% ${row * 50}%`;
  piece.setAttribute('aria-label', `Pieza ${index + 1}`);
  piece.setAttribute('aria-pressed', 'false');

  piece.addEventListener('click', () => {
    if (piece.dataset.justDragged === 'true') {
      delete piece.dataset.justDragged;
      return;
    }
    selectPiece(piece);
  });
  piece.addEventListener('pointerdown', startDrag);
  return piece;
}

function selectPiece(piece) {
  if (!tray.contains(piece)) return;
  if (selectedPiece) {
    selectedPiece.classList.remove('is-selected');
    selectedPiece.setAttribute('aria-pressed', 'false');
  }
  selectedPiece = selectedPiece === piece ? null : piece;
  if (selectedPiece) {
    selectedPiece.classList.add('is-selected');
    selectedPiece.setAttribute('aria-pressed', 'true');
    statusText.textContent = 'Ahora elige el lugar donde encaja.';
  } else {
    statusText.textContent = 'Elige una pieza y colócala en su lugar.';
  }
}

function startDrag(event) {
  const piece = event.currentTarget;
  if (event.button !== 0 || !tray.contains(piece)) return;
  event.preventDefault();

  const bounds = piece.getBoundingClientRect();
  const offsetX = event.clientX - bounds.left;
  const offsetY = event.clientY - bounds.top;
  piece.classList.add('is-dragging');
  piece.style.setProperty('--piece-size', `${bounds.width}px`);
  piece.style.left = `${event.clientX - offsetX}px`;
  piece.style.top = `${event.clientY - offsetY}px`;

  function movePiece(moveEvent) {
    piece.style.left = `${moveEvent.clientX - offsetX}px`;
    piece.style.top = `${moveEvent.clientY - offsetY}px`;
  }

  function finishDrag(upEvent) {
    document.removeEventListener('pointermove', movePiece);
    document.removeEventListener('pointerup', finishDrag);
    document.removeEventListener('pointercancel', cancelDrag);

    const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
    const slot = target?.closest('.slot');
    piece.classList.remove('is-dragging');
    piece.style.removeProperty('left');
    piece.style.removeProperty('top');
    piece.style.removeProperty('--piece-size');

    if (slot) {
      piece.dataset.justDragged = 'true';
      placePiece(piece, slot);
    } else {
      piece.dataset.justDragged = 'true';
    }
  }

  function cancelDrag() {
    document.removeEventListener('pointermove', movePiece);
    document.removeEventListener('pointerup', finishDrag);
    document.removeEventListener('pointercancel', cancelDrag);
    piece.classList.remove('is-dragging');
    piece.style.removeProperty('left');
    piece.style.removeProperty('top');
    piece.style.removeProperty('--piece-size');
  }

  document.addEventListener('pointermove', movePiece);
  document.addEventListener('pointerup', finishDrag);
  document.addEventListener('pointercancel', cancelDrag);
}

function placePiece(piece, slot) {
  if (!piece || !tray.contains(piece) || slot.classList.contains('is-correct')) return;
  moves += 1;
  movesCount.textContent = String(moves);

  if (piece.dataset.index !== slot.dataset.index) {
    statusText.textContent = 'Esa pieza no encaja ahí. Prueba en otro lugar.';
    return;
  }

  if (!startedAt) {
    startedAt = Date.now();
    timerInterval = window.setInterval(updateTimer, 1000);
  }

  slot.classList.add('is-correct');
  slot.setAttribute('aria-label', `Lugar ${Number(slot.dataset.index) + 1}, completado`);
  slot.append(piece);
  piece.classList.remove('is-selected');
  piece.setAttribute('aria-pressed', 'false');
  if (selectedPiece === piece) selectedPiece = null;
  placedPieces += 1;
  piecesCount.textContent = `${placedPieces} / ${totalPieces}`;
  statusText.textContent = placedPieces === totalPieces ? '¡Rompecabezas completo!' : '¡Bien! Esa pieza está en su sitio.';

  if (placedPieces === totalPieces) finishGame();
}

function updateTimer() {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');
  timerText.textContent = `${minutes}:${remainder}`;
}

function finishGame() {
  window.clearInterval(timerInterval);
  board.classList.add('is-complete');
  statusText.textContent = '';
  completionVideo.currentTime = 0;
  completionVideo.play().catch(() => {});
}

function shufflePieces() {
  const pieces = Array.from(tray.querySelectorAll('.piece'));
  for (let index = pieces.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pieces[index], pieces[swapIndex]] = [pieces[swapIndex], pieces[index]];
  }
  pieces.forEach((piece) => tray.append(piece));
}

function resetGame() {
  window.clearInterval(timerInterval);
  timerInterval = null;
  startedAt = null;
  moves = 0;
  placedPieces = 0;
  selectedPiece = null;
  timerText.textContent = '00:00';
  movesCount.textContent = '0';
  piecesCount.textContent = `0 / ${totalPieces}`;
  statusText.textContent = 'Elige una pieza y colócala en su lugar.';
  completionVideo.pause();
  completionVideo.currentTime = 0;
  createBoard();
  tray.replaceChildren(...Array.from({ length: totalPieces }, (_, index) => createPiece(index)));
  shufflePieces();
}

document.querySelector('#shuffle-button').addEventListener('click', shufflePieces);
document.querySelector('#reset-button').addEventListener('click', resetGame);
previewToggle.addEventListener('click', () => {
  const isVisible = board.classList.toggle('show-preview');
  previewToggle.setAttribute('aria-pressed', String(isVisible));
  previewToggle.textContent = isVisible ? 'Ocultar imagen' : 'Ver imagen';
});

createBoard();
resetGame();
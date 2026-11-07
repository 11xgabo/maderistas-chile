import React, { useReducer, useRef } from 'react';
import './Merge10.css';

const SIZE = 4;
const TILE_IMAGES = {
  1: new URL('./images/1.jpg', import.meta.url).href,
  2: new URL('./images/2.jpg', import.meta.url).href,
  3: new URL('./images/3.jfif', import.meta.url).href,
  4: new URL('./images/4.webp', import.meta.url).href,
  5: new URL('./images/5.jfif', import.meta.url).href,
  6: new URL('./images/6.jfif', import.meta.url).href,
  7: new URL('./images/7.jfif', import.meta.url).href,
  8: new URL('./images/8.jfif', import.meta.url).href,
  9: new URL('./images/9.jfif', import.meta.url).href,
  10: new URL('./images/10.jfif', import.meta.url).href,
};
const WIN_IMAGE = new URL('./images/Win.png', import.meta.url).href;
const DIRECTIONS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

function spawn(board) {
  const empty = [];
  board.forEach((row, r) => row.forEach((value, c) => {
    if (value === 0) empty.push([r, c]);
  }));
  if (empty.length === 0) return;

  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 1 : 2;
}

function createInitialState() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  spawn(board);
  spawn(board);
  return { board, score: 0, status: 'playing' };
}

function hasMoves(board) {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (board[r][c] === 0) return true;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function getLines(direction) {
  return Array.from({ length: SIZE }, (_, line) =>
    Array.from({ length: SIZE }, (_, step) => {
      if (direction === 'left') return [line, step];
      if (direction === 'right') return [line, SIZE - 1 - step];
      if (direction === 'up') return [step, line];
      return [SIZE - 1 - step, line];
    }),
  );
}

function move(state, direction) {
  if (state.status !== 'playing') return state;

  const board = state.board.map((row) => [...row]);
  let score = state.score;
  let won = false;

  getLines(direction).forEach((coordinates) => {
    const values = coordinates
      .map(([r, c]) => board[r][c])
      .filter((value) => value !== 0);
    const merged = [];

    for (let i = 0; i < values.length; i += 1) {
      if (values[i] === values[i + 1]) {
        const nextValue = values[i] + 1;
        merged.push(nextValue);
        score += nextValue * 10;
        if (nextValue === 11) won = true;
        i += 1;
      } else {
        merged.push(values[i]);
      }
    }

    while (merged.length < SIZE) merged.push(0);
    coordinates.forEach(([r, c], index) => {
      board[r][c] = merged[index];
    });
  });

  if (board.every((row, r) => row.every((value, c) => value === state.board[r][c]))) {
    return state;
  }

  spawn(board);
  const status = won ? 'won' : hasMoves(board) ? 'playing' : 'game-over';
  return { board, score, status };
}

function reducer(state, action) {
  if (action.type === 'reset') return createInitialState();
  if (action.type === 'move') return move(state, action.direction);
  return state;
}

function Merge10() {
  const [game, dispatch] = useReducer(reducer, undefined, createInitialState);
  const boardRef = useRef(null);
  const pointerStart = useRef(null);
  const highestTile = Math.max(1, ...game.board.flat());

  function handleKeyDown(event) {
    const direction = DIRECTIONS[event.key];
    if (!direction) return;
    event.preventDefault();
    dispatch({ type: 'move', direction });
  }

  function handlePointerDown(event) {
    if (game.status !== 'playing') return;
    boardRef.current?.focus();
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event) {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    pointerStart.current = null;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;

    const direction = Math.abs(deltaX) > Math.abs(deltaY)
      ? deltaX > 0 ? 'right' : 'left'
      : deltaY > 0 ? 'down' : 'up';
    dispatch({ type: 'move', direction });
  }

  function resetGame() {
    dispatch({ type: 'reset' });
    boardRef.current?.focus();
  }

  return (
    <section className="merge10" aria-label="Juego Madero 10">
      <header className="merge10__header">
        <h2 className="merge10__title">Madero 10</h2>
        <div className="merge10__score" aria-live="polite">
          PUNTOS
          <span>{game.score}</span>
        </div>
      </header>

      <div
        ref={boardRef}
        className="merge10__board"
        role="grid"
        aria-label="Tablero de juego. Usa las flechas o desliza para mover las fichas."
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerStart.current = null; }}
      >
        {game.board.flatMap((row, r) => row.map((level, c) => (
          <div className="merge10__cell" role="gridcell" key={`${r}-${c}`}>
            {level > 0 && (
              <div className="merge10__tile">
                <img src={TILE_IMAGES[level]} alt={`Ficha ${level}`} draggable="false" />
              </div>
            )}
          </div>
        )))}

        {game.status !== 'playing' && (
          <div className={`merge10__overlay merge10__overlay--${game.status}`}>
            <h3 className="merge10__status">
              {game.status === 'won' ? '¡Felicidades!' : '¡Fin del juego!'}
            </h3>
            <p className="merge10__message">
              {game.status === 'won'
                ? '¡Has completado el juego!'
                : 'Tu disco conseguido'}
            </p>
            <img
              className="merge10__preview"
              src={game.status === 'won' ? WIN_IMAGE : TILE_IMAGES[highestTile]}
              alt={game.status === 'won' ? 'Imagen de victoria' : `Ficha ${highestTile}`}
            />
            <button className="merge10__button" type="button" onClick={resetGame}>
              {game.status === 'won' ? 'Jugar otra vez' : 'Intentar de nuevo'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Merge10;

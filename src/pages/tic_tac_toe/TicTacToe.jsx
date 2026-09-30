import { useState } from "react";
import "./TicTacToe.css";

const SIZE = 3;

export function TicTacToe() {
  const [board, setBoard] = useState(
    Array.from({ length: SIZE * SIZE }, () => null),
  );

  // X O
  const [currentUser, setCurrentUser] = useState("X");

  //能 derive 的东西不要轻易再放 state
  const winner = hardCodeDetermineWinner(board);

  const isDraw = winner === null && board.every((cell) => cell !== null);

  const currentTurn = `${currentUser} is playing`;
  const onCellClick = (index) => {
    /**
     * 修改了原数组，然后又把 同一个 array reference return 回去了。
        React state 更新大致会比较：
        Object.is(oldState, newState)
        oldBoard === newBoard // true
        state 根本没有变化。

        Don't mutate prev.
        Create a new reference.
    */
    // setBoard((board) => {
    //   board[index] = currentUser;
    //   return board;
    // });

    setBoard((prevBoard) => {
      const nextBoard = [...prevBoard];
      nextBoard[index] = currentUser;
      return nextBoard;
    });

    setCurrentUser(currentUser === "X" ? "O" : "X");
  };
  /*
   * 【关键技巧：用内联 CSS 变量把 size 传给 CSS】
   * React 的 style 属性支持自定义属性（--xxx），所以可以写 style={{ '--size': size }}。
   * 这样 CSS 里就能用 `repeat(var(--size), 1fr)` 动态决定列数，
   * 而不需要为 3x3 / 4x4 / 5x5 各写一个 class。JS 算尺寸、CSS 用尺寸，职责分得很干净。*/
  return (
    <div className="board-container" style={{ "--size": SIZE }}>
      <div className="board">
        {board.map((cellValue, index) => (
          /*
           *child component 尽量不要拿 setter
           */
          <Cell
            key={index}
            index={index}
            cellValue={cellValue}
            board={board}
            winner={winner}
            onCellClick={onCellClick}
          />
        ))}
      </div>
      {winner != null ? <div>{`${winner} is the winner!`}</div> : null}
      {isDraw ? <div>{`Draw!`}</div> : null}
      <section>{currentTurn}</section>
      <Reset setBoard={setBoard} setCurrentUser={setCurrentUser} />
    </div>
  );
}

function Cell({ index, cellValue, board, onCellClick, winner }) {
  const isDisabled = board[index] != null || winner != null;
  return (
    <button
      className="cell"
      disabled={isDisabled}
      onClick={() => onCellClick(index)}
    >
      {cellValue}
    </button>
  );
}

function Reset({ setBoard, setCurrentUser }) {
  return (
    <button
      className="reset"
      onClick={() => {
        setBoard(Array.from({ length: SIZE * SIZE }, () => null));
        setCurrentUser("X");
      }}
    >
      Reset
    </button>
  );
}

// 你在面试里的目标通常不是证明自己能写最 generic 的算法，而是：
const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6],
];

function hardCodeDetermineWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

//--------------------------Generic determine-------------------------------//
const DIRECTIONS = [
  [0, 1], // 水平 ─
  [1, 0], // 垂直 │
  [1, 1], // 主对角线 ╲
  [1, -1], // 副对角线 ╱
];

// eslint-disable-next-line no-unused-vars
function determineWinner(board, size, lastIndex, target = size) {
  const grid = board;

  const row = Math.floor(lastIndex / size);
  const col = lastIndex % size;

  const player = grid[row][col];

  if (player == null) {
    return null;
  }

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;

    // positive direction
    count += countDirection(grid, row, col, dr, dc, player);

    // negative direction
    count += countDirection(grid, row, col, -dr, -dc, player);

    if (count >= target) {
      return player;
    }
  }

  return null;
}
function countDirection(grid, startRow, startCol, dr, dc, player) {
  const size = grid.length;

  let row = startRow + dr;
  let col = startCol + dc;

  let count = 0;

  while (
    row >= 0 &&
    row < size &&
    col >= 0 &&
    col < size &&
    grid[row][col] === player
  ) {
    count++;

    row += dr;
    col += dc;
  }

  return count;
}

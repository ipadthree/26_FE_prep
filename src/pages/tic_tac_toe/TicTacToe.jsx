import { useState } from "react";
import "./TicTacToe.css";

export function TicTacToe() {
  const [board, setBoard] = useState(Array.from({ length: 9 }, () => null));
  // X O
  const [currentUser, setCurrentUser] = useState("X");

  //能 derive 的东西不要轻易再放 state
  const winner = determineWinner(board);

  const isDraw = winner === null && board.every((cell) => cell !== null);

  const currentTurn = `${currentUser} is playing`;
  return (
    <div className="board-container">
      <div className="board">
        {board.map((cellValue, index) => (
          /*
           *child component 尽量不要拿 setter
           */
          <Cell
            key={index}
            index={index}
            cellValue={cellValue}
            setBoard={setBoard}
            board={board}
            setCurrentUser={setCurrentUser}
            currentUser={currentUser}
            winner={winner}
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

function Cell({
  index,
  cellValue,
  board,
  setBoard,
  currentUser,
  setCurrentUser,
  winner,
}) {
  const isDisabled = board[index] != null || winner != null;
  return (
    <button
      className="cell"
      disabled={isDisabled}
      onClick={() => {
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
      }}
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
        setBoard(Array.from({ length: 9 }, () => null));
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

function determineWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

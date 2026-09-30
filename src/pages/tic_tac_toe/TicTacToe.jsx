import { useEffect, useState } from "react";
import "./TicTacToe.css";

export function TicTacToe() {
  const [board, setBoard] = useState(Array.from({ length: 9 }, () => null));
  // X O null
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const result = determineResult(board);

    console.log("board", board, "result", result);
  }, [board, currentUser]);
  const currentTurn = `${currentUser} is playing`;
  return (
    <div className="board-container">
      <div className="board">
        {board.map((cellValue, index) => (
          <Cell
            key={index}
            index={index}
            cellValue={cellValue}
            setBoard={setBoard}
            board={board}
            setCurrentUser={setCurrentUser}
            currentUser={currentUser}
          />
        ))}
      </div>
      <section>{currentTurn}</section>
      <Reset setBoard={setBoard} />
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
}) {
  const isDisabled = board[index] != null;
  return (
    <button
      className="cell"
      disabled={isDisabled}
      onClick={() => {
        setBoard((board) => {
          board[index] = currentUser;

          return board;
        });
        setCurrentUser(currentUser === "X" ? "O" : "X");
      }}
    >
      {cellValue}
    </button>
  );
}

function Reset({ setBoard }) {
  return (
    <button
      className="reset"
      onClick={() => {
        setBoard(Array.from({ length: 9 }, () => null));
      }}
    >
      Reset
    </button>
  );
}

function determineResult(board) {
  const newBoard = [];
  newBoard.push(board.slice(0, 3), board.slice(3, 6), board.slice(6));
  for (let i = 0; i < 3; i++) {
    if (
      newBoard[i][0] === newBoard[i][1] &&
      newBoard[i][1] === newBoard[i][2]
    ) {
      return newBoard[i][0];
    }

    if (
      newBoard[0][i] === newBoard[1][i] &&
      newBoard[1][i] === newBoard[2][i]
    ) {
      return newBoard[0][i];
    }
  }

  if (newBoard[0][0] === newBoard[1][1] && newBoard[1][1] === newBoard[2][2]) {
    return newBoard[0][0];
  }

  if (newBoard[0][2] === newBoard[1][1] && newBoard[1][1] === newBoard[2][0]) {
    return newBoard[1][1];
  }

  return null;
}

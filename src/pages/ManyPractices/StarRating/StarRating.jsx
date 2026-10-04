import { useState } from "react";
import "./StarRating.css";

export default function StarRating() {
  // a state to store saved stars
  const [savedIndex, setSavedIndex] = useState(-1);
  // hover temp state
  const [hoverIndex, setHoverIndex] = useState(-1);
  // use hover to trigger hover temp state

  function handleStarClick(index) {
    setSavedIndex(index);
  }

  function handleMouseEnter(index) {
    setHoverIndex(index);
  }

  return (
    <div className="star-container" handleMouseLeave={() => setHoverIndex(-1)}>
      {Array.from({ length: 5 }, () => {}).map((_, index) => (
        <Star
          filled={hoverIndex !== -1 ? index <= hoverIndex : index <= savedIndex}
          key={index}
          index={index}
          handleStarClick={() => handleStarClick(index)}
          handleMouseEnter={() => handleMouseEnter(index)}
        />
      ))}
    </div>
  );
}

function Star({ filled, handleStarClick, handleMouseEnter }) {
  return (
    <button
      className="star-button"
      onClick={handleStarClick}
      onMouseEnter={handleMouseEnter}
      aria-label={`Rate stars`}
      type="button"
      // onMouseLeave is attached at the wrong level:
      // individual star has leave would:
      /**
       * mouseleave star 1
            ↓
        hoverIndex = -1

        mouseenter star 2
            ↓
        hoverIndex = 1
      */
      // onMouseLeave={handleMouseLeave}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`star-icon ${filled ? "star-icon-filled" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    </button>
  );
}

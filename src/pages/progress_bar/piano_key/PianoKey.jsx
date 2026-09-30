import { useEffect, useState } from "react";
import "./PianoKey.css";

const KEYS = ["C", "D", "E", "F", "G", "A"];

export default function PianoKey() {
  const [pressedKey, setPressedKey] = useState(new Set());
  const [mousePressedKey, setMousePressedKey] = useState(null);

  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key.toUpperCase();
      if (KEYS.includes(key)) {
        setPressedKey((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
      console.log("key", key);
    }

    function handleKeyUp(event) {
      const key = event.key.toUpperCase();
      if (KEYS.includes(key)) {
        setPressedKey((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }

    function handleMouseUp() {
      setMousePressedKey(null);
    }
    addEventListener("keydown", handleKeyDown);
    addEventListener("keyup", handleKeyUp);
    addEventListener("mouseup", handleMouseUp);

    return () => {
      removeEventListener("keydown", handleKeyDown);
      removeEventListener("keyup", handleKeyUp);
      removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  function onMouseDown(event, key) {
    setMousePressedKey(key);
  }

  return (
    <div className="piano-container">
      {KEYS.map((key, index) => (
        <Key
          key={index}
          pianoKey={key}
          onMouseDown={onMouseDown}
          isActive={pressedKey.has(key) || mousePressedKey === key}
        />
      ))}
    </div>
  );
}

function Key({ pianoKey, onMouseDown, isActive }) {
  return (
    <button
      className={`piano-key ${isActive ? "active" : null}`}
      onMouseDown={(e) => onMouseDown(e, pianoKey)}
    >
      {pianoKey}
    </button>
  );
}

import { useEffect, useRef, useState } from "react";
import "./Clocks.css";
import DigitalClock from "./DigitalClock.jsx";

export default function ClocksAppPage() {
  return (
    <div className="clocks-container">
      <StopWatch />
      <DigitalClock />
    </div>
  );
}

//------------------stop watch--------------------

function StopWatch() {
  const startTimeRef = useRef(null);
  const previouslySavedTimeRef = useRef(0);
  const animationIdRef = useRef(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  function handleStart() {
    if (isRunning) {
      return;
    }
    startTimeRef.current = performance.now();
    setIsRunning(true);
  }

  function handlePause() {
    // previouslySavedTimeRef.current = timeElapsed;
    /**
     * 直接 previouslySavedTimeRef.current = timeElapsed;
     * 会导致 timeElapsed 是最近一次 React render 时的时间。
     * 最近一次 rAF 更新时间：1000ms
     * 用户实际点击 Pause：1012ms
     * 少一帧，
     *
     */
    /**
     * 更严谨的方式是
     */
    const currentTimeElapsed =
      performance.now() - startTimeRef.current + previouslySavedTimeRef.current;

    previouslySavedTimeRef.current = currentTimeElapsed;
    setTimeElapsed(currentTimeElapsed);
    setIsRunning(false);
  }

  function handleReset() {
    setIsRunning(false);
    previouslySavedTimeRef.current = 0;
    setTimeElapsed(0);
  }

  function updateTime(timestamp) {
    const timeElapsed =
      timestamp - startTimeRef.current + previouslySavedTimeRef.current;
    setTimeElapsed(timeElapsed);

    animationIdRef.current = requestAnimationFrame(updateTime);
  }

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    animationIdRef.current = requestAnimationFrame(updateTime);
    // updateTime();
    /**
     * 直接call updateTime（）会让第一帧数的timestamp 是 undefined。
     */

    return () => {
      if (animationIdRef.current != null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isRunning, updateTime]);

  return (
    <div className="stopwatch-container">
      <div>{formTime(timeElapsed)}</div>
      <div className="stopwatch-buttons">
        <button onClick={handleStart} disabled={isRunning}>
          {previouslySavedTimeRef.current === 0 ? "Start" : "Resume"}
        </button>
        <button onClick={handlePause} disabled={!isRunning}>
          Pause
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}

function formTime(timestamp) {
  // timestamp is milliseconds

  //minutes
  const minutesInMilliseconds = 1000 * 60;
  const minutes = Math.floor(timestamp / minutesInMilliseconds);

  //seconds
  const secondsInMilliseconds = 1000;
  const seconds = Math.floor(
    (timestamp % minutesInMilliseconds) / secondsInMilliseconds,
  );

  //milliseconds
  const milliseconds = Math.floor(timestamp % secondsInMilliseconds);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(milliseconds).padStart(3, "0")}`;
}

//-------------------Clock-------------------------

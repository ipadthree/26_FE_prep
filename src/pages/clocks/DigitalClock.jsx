import { useEffect, useState } from "react";
import "./DigitalClock.css";

export default function DigitalClockContainer() {
  // 1 first get time
  // 2 assign hour min second to each pair
  // 3 each pair can display
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let timerId;

    function udpateTime() {
      setCurrentTime(new Date());
      timerId = setTimeout(() => {
        udpateTime();
      }, 1000);
    }

    udpateTime();

    return () => {
      clearTimeout(timerId);
    };
  });

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  return (
    <div className="digital-clock-container">
      <DigitPair value={hours} />
      <Colon />
      <DigitPair value={minutes} />
      <Colon />
      <DigitPair value={seconds} />
    </div>
  );
}

function DigitPair({ value }) {
  const valueString = String(value).padStart(2, "0");
  return (
    <div className="digit-pair">
      <Digit digit={valueString[0]} />
      <Digit digit={valueString[1]} />
    </div>
  );
}

const lightUp = new Map([
  ["0", ["a", "b", "d", "e", "f", "g"]],
  ["1", ["b", "d"]],
  ["2", ["a", "b", "c", "f", "e"]],
  ["3", ["a", "b", "c", "d", "e"]],
  ["4", ["g", "c", "b", "d"]],
  ["5", ["a", "g", "c", "d", "e"]],
  ["6", ["a", "g", "c", "f", "d", "e"]],
  ["7", ["a", "b", "d"]],
  ["8", ["a", "b", "c", "d", "e", "f", "g"]],
  ["9", ["a", "b", "c", "d", "e", "g"]],
]);

function Digit({ digit }) {
  const lightUpBars = lightUp.get(digit);
  console.log("bars", lightUpBars);
  /**
   *     a
   *     -
   *  g | | b
   *     - c
   *  f | | d
   *     - e
   *
   */
  return (
    <div className="digit-container">
      <div className={`a ${lightUpBars.includes("a") ? "light-up" : ""}`} />
      <div className={`b ${lightUpBars.includes("b") ? "light-up" : ""}`} />
      <div className={`c ${lightUpBars.includes("c") ? "light-up" : ""}`} />
      <div className={`d ${lightUpBars.includes("d") ? "light-up" : ""}`} />
      <div className={`e ${lightUpBars.includes("e") ? "light-up" : ""}`} />
      <div className={`f ${lightUpBars.includes("f") ? "light-up" : ""}`} />
      <div className={`g ${lightUpBars.includes("g") ? "light-up" : ""}`} />
    </div>
  );
}

function Colon() {
  return (
    <div className="colon-wrapper">
      <div className="dot" />
      <div className="dot" />
    </div>
  );
}

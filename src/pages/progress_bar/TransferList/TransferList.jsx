import { useState } from "react";
import "./TransferList.css";
import { DEFAULT_LEFT, DEFAULT_RIGHT } from "./defaults";

export default function TransferList() {
  const [leftItems, setLeftItems] = useState(DEFAULT_LEFT);
  const [rightItems, setRightItems] = useState(DEFAULT_RIGHT);
  const [selected, setSelected] = useState(new Set());

  function moveAllToRight() {
    setRightItems((oldRightItems) => {
      const rightItems = [...oldRightItems, ...leftItems];
      return rightItems;
    });
    setLeftItems([]);
  }
  function moveAllToLeft() {
    setLeftItems((oldLeftItems) => [...oldLeftItems, ...rightItems]);
    setRightItems([]);
  }
  function onCheck(id) {
    if (selected.has(id)) {
      setSelected((oldSelected) => {
        oldSelected.delete(id);
        return new Set([...oldSelected]);
      });
    } else {
      setSelected((oldSelected) => {
        oldSelected.add(id);
        return new Set([...oldSelected]);
      });
    }
  }

  function moveSelectedToRight() {
    //remove from left
    // moving
    const moving = leftItems.filter((item) => selected.has(item.id));
    // remaining
    const remaining = leftItems.filter((item) => !selected.has(item.id));
    // add to right
    setLeftItems(remaining);
    setRightItems((prev) => [...prev, ...moving]);
  }

  function moveSelectedToLeft() {
    // moving
    const moving = rightItems.filter((item) => selected.has(item.id));
    // remaining
    const remaining = rightItems.filter((item) => !selected.has(item.id));
    setRightItems(remaining);
    setLeftItems((prev) => [...prev, ...moving]);
  }
  return (
    <article className="transfer-list">
      <ul className="list">
        {leftItems.map((item) => (
          <Item
            key={item.id}
            item={item}
            onCheck={onCheck}
            isChecked={selected.has(item.id)}
          />
        ))}
      </ul>
      <ButtonsColumn
        moveAllToLeft={moveAllToLeft}
        moveAllToRight={moveAllToRight}
        moveSelectedToRight={moveSelectedToRight}
        moveSelectedToLeft={moveSelectedToLeft}
      />
      <ul className="list">
        {rightItems.map((item) => (
          <Item
            key={item.id}
            item={item}
            onCheck={onCheck}
            isChecked={selected.has(item.id)}
          />
        ))}
      </ul>
    </article>
  );
}

function ButtonsColumn({
  moveAllToLeft,
  moveAllToRight,
  moveSelectedToRight,
  moveSelectedToLeft,
}) {
  return (
    <section className="buttons">
      <button onClick={moveAllToLeft} aria-label="move all to left">
        <span aria-hidden="true">{"<<"}</span>
      </button>
      <button onClick={moveSelectedToLeft} aria-label="move selected to left">
        <span aria-hidden="true">{"<"}</span>
      </button>
      <button onClick={moveSelectedToRight} aria-label="move selected to right">
        <span aria-hidden="true">{">"}</span>
      </button>
      <button onClick={moveAllToRight} aria-label="move all to right">
        <span aria-hidden="true">{">>"}</span>
      </button>
    </section>
  );
}

function Item({ item, onCheck, isChecked }) {
  return (
    <li className="item">
      <label>
        <input
          type="checkbox"
          onChange={() => onCheck(item.id)}
          checked={isChecked}
        />
        {item.name}
      </label>
    </li>
  );
}

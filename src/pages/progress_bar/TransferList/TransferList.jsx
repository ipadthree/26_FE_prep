import { useState } from "react";
import "./TransferList.css";

const DEFAULT_LEFT = [
  {
    id: 1,
    name: "html",
  },
  {
    id: 2,
    name: "css",
  },
  {
    id: 3,
    name: "javascript",
  },
  {
    id: 4,
    name: "typescript",
  },
  {
    id: 5,
    name: "Typescript",
  },
];

const DEFAULT_RIGHT = [
  {
    id: 6,
    name: "react",
  },
  {
    id: 7,
    name: "angualr",
  },
  {
    id: 8,
    name: "vue",
  },
  {
    id: 9,
    name: "Svelte",
  },
];

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
      <button onClick={moveAllToLeft}>
        <span aria-hidden="true">{"<<"}</span>
      </button>
      <button onClick={moveSelectedToLeft}>
        <span aria-hidden="true">{"<"}</span>
      </button>
      <button onClick={moveSelectedToRight}>
        <span aria-hidden="true">{">"}</span>
      </button>
      <button onClick={moveAllToRight}>
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

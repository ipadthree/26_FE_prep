import "./FileExplorer.css";
import { data } from "./FileData";
import { useState } from "react";

export default function FileExplorer() {
  return <FileChildren list={data} />;
}

function Directory({ directory }) {
  const children = directory.children;
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="directory">
      <button
        onClick={() => {
          setIsExpanded((prev) => !prev);
        }}
      >
        {isExpanded ? "▼" : "▶"} {directory.name}
      </button>
      {/**
       * Accordion 得在wrapper上
       */}
      <div className={`children-wrapper ${isExpanded ? "expanded" : ""}`}>
        <FileChildren list={children} />
      </div>
    </div>
  );
}

function FileChildren({ list }) {
  return (
    <div className="children-list">
      {list.map((item) => {
        if (item.children != null) {
          return <Directory key={item.id} directory={item} />;
        } else {
          return <File key={item.id} file={item} />;
        }
      })}
    </div>
  );
}

function File({ file }) {
  return <div className="file">{file.name}</div>;
}

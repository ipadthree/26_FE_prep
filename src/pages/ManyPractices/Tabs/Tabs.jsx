import "./Tabs.css";
import { TABS } from "./Tabs";
import { useRef, useState } from "react";

export default function Tabs() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const tabRefs = useRef([]);

  function onChangeTab(tab) {
    setActiveTab(tab);
  }

  function handleKeyDown(event) {
    const index = TABS.findIndex(({ id }) => id === activeTab.id);
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const nextIndex = index === 0 ? TABS.length - 1 : index - 1;

      setActiveTab(TABS[nextIndex]);

      //浏览器真正的 keyboard focus
      tabRefs.current[nextIndex].focus();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = index === TABS.length - 1 ? 0 : index + 1;
      setActiveTab(TABS[nextIndex]);
      tabRefs.current[nextIndex].focus();
    }
  }

  return (
    <div className="container">
      <div className="tabs" role="tablist" onKeyDown={handleKeyDown}>
        {TABS.map((tab, index) => (
          <button
            onClick={() => onChangeTab(tab)}
            role="tab"
            key={tab.id}
            ref={(node) => (tabRefs.current[index] = node)}
            className={`${activeTab.id === tab.id ? "active" : ""}`}
            // tab in to active only, then tab out
            tabIndex={activeTab.id === tab.id ? 0 : -1}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div role="tabpanel"> {activeTab && <p>{activeTab.content}</p>}</div>
    </div>
  );
}

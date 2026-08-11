import { Navigate, NavLink, Route, Routes, useLocation } from "react-router";
import { useEffect } from "react";
import GifSearchPage from "../pages/gif_select/App.jsx";
import TodoPage from "../pages/todo_list/todo.jsx";
import "./PracticeApp.css";
import ProgressBar from "../pages/progress_bar/progressBar.jsx";
import Clocks from "../pages/clocks/Clocks.jsx";
import Carousel from "../pages/carousel/Carousel.jsx";

// 所有练习集中配置在这里；每一项会同时生成顶部 Tab 和对应 Route。
const PRACTICE_TABS = [
  {
    path: "/gif-search",
    label: "GIF 搜索",
    number: "01",
    element: <GifSearchPage />,
  },
  {
    path: "/ToDo",
    label: "ToDo",
    number: "02",
    element: <TodoPage label="ToDo" />,
  },
  {
    path: "/progress_bar",
    label: "Progress Bar",
    number: "03",
    element: <ProgressBar label="progressBar" />,
  },
  {
    path: "/Clocks",
    label: "Clocks",
    number: "04",
    element: <Clocks label="Clocks" />,
  },
  {
    path: "/practice-05",
    label: "Carousel",
    number: "05",
    element: <Carousel label="carousel" />,
  },
  {
    path: "/practice-6",
    label: "练习 6",
    number: "6",
    element: <BlankPracticePage label="练习 6" />,
  },
  {
    path: "/practice-7",
    label: "练习 7",
    number: "7",
    element: <BlankPracticePage label="练习 7" />,
  },
];

function RouteScrollToTop() {
  const { pathname } = useLocation();

  // 切换练习时回到页面顶部，避免保留上一个长页面的滚动位置。
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function PracticeTabs() {
  return (
    <nav className="practice-tabs" aria-label="前端 UI 练习">
      <div className="practice-tabs__inner">
        <span className="practice-tabs__title">UI Practice</span>
        <div className="practice-tabs__list">
          {PRACTICE_TABS.map(({ path, label, number }) => (
            <NavLink
              className={({ isActive }) =>
                `practice-tab${isActive ? " is-active" : ""}`
              }
              end
              key={path}
              to={path}
            >
              <span className="practice-tab__number">{number}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function BlankPracticePage({ label }) {
  return <main className="blank-practice" aria-label={`${label}空白练习页`} />;
}

function PracticeApp() {
  return (
    <>
      <RouteScrollToTop />
      <PracticeTabs />
      <Routes>
        <Route path="/" element={<Navigate to="/gif-search" replace />} />
        {PRACTICE_TABS.map(({ path, element }) => (
          <Route path={path} element={element} key={path} />
        ))}
        <Route path="*" element={<Navigate to="/gif-search" replace />} />
      </Routes>
    </>
  );
}

export default PracticeApp;

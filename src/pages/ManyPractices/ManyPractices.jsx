import "./ManyPractices.css";
import FileExplorer from "./FileExplorer/FileExplorer.jsx";
import Tabs from "./Tabs/Tabs.jsx";
import StarRating from "./StarRating/StarRating.jsx";

export default function ManyPractices() {
  return (
    <article className="many_container">
      <Tabs />
      <FileExplorer />
      <StarRating />
    </article>
  );
}

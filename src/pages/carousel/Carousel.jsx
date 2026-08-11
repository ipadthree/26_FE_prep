import { useRef, useState } from "react";
import "./carousel.css";

const IMAGES = [
  {
    src: "https://picsum.photos/id/600/600/400",
    alt: "Forest",
  },
  {
    src: "https://picsum.photos/id/100/600/400",
    alt: "Beach",
  },
  {
    src: "https://picsum.photos/id/200/600/400",
    alt: "Yak",
  },
  {
    src: "https://picsum.photos/id/300/600/400",
    alt: "Hay",
  },
  {
    src: "https://picsum.photos/id/400/600/400",
    alt: "Plants",
  },
  {
    src: "https://picsum.photos/id/500/600/400",
    alt: "Building",
  },
];

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageRef = useRef(null);

  function goTo(index) {
    let scrollTo = index;
    if (index >= 0 && index < IMAGES.length) {
      setCurrentIndex(scrollTo);
    } else if (index === -1) {
      scrollTo = IMAGES.length - 1;
      setCurrentIndex(scrollTo);
    } else if (index === IMAGES.length) {
      scrollTo = 0;
      setCurrentIndex(scrollTo);
    }

    if (imageRef.current !== null) {
      imageRef.current.scrollTo({
        behavior: "smooth",
        left: imageRef.current.clientWidth * scrollTo,
      });
    }
  }

  return (
    <div className="carousel-container">
      <div className="image-canvas" ref={imageRef}>
        {IMAGES.map((image, index) => {
          return (
            <img
              className="image"
              alt={image.alt}
              src={image.src}
              key={index}
            />
          );
        })}
      </div>
      <button
        className="carousel-button button-left"
        onClick={() => goTo(currentIndex - 1)}
      >
        left
      </button>
      <button
        className="carousel-button button-right"
        onClick={() => goTo(currentIndex + 1)}
      >
        right
      </button>
      <div className="dots-container">
        {IMAGES.map((image, index) => (
          <button
            className="dot"
            onClick={() => {
              goTo(index);
            }}
          />
        ))}
      </div>
    </div>
  );
}

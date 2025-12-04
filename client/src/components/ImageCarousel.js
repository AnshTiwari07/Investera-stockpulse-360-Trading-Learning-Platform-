import React, { useEffect, useRef, useState } from 'react';
import './ImageCarousel.css';

/**
 * Accessible, responsive image carousel with autoplay, swipe, and graceful error handling.
 * Props:
 * - images: Array<{ src: string, alt: string }>
 * - interval: number (ms), default 3000
 * - showDots: boolean, default true
 * - showArrows: boolean, default true
 * - ariaLabel: string
 */
export default function ImageCarousel({
  images = [],
  interval = 3000,
  showDots = true,
  showArrows = true,
  ariaLabel = 'Image carousel'
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const timerRef = useRef(null);

  const count = Array.isArray(images) ? images.length : 0;

  const goTo = (i) => {
    if (count === 0) return;
    const next = ((i % count) + count) % count; // wrap around
    setIndex(next);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Autoplay
  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, interval, count]);

  // Touch / swipe support
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setPaused(true);
  };
  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    const x = e.touches[0].clientX;
    touchDeltaX.current = x - touchStartX.current;
  };
  const onTouchEnd = () => {
    setPaused(false);
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0) next(); else prev();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  // Keyboard accessibility: left/right arrows
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  const handleImgError = (e) => {
    // Fallback to a local placeholder if image fails
    if (e && e.target) {
      e.target.onerror = null;
      e.target.src = '/logo-invest.png';
      e.target.alt = e.target.alt || 'Placeholder image';
    }
  };

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <div
        className="carousel-track"
        style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, i) => (
          <div
            className="carousel-slide"
            key={i}
            aria-hidden={i !== index}
          >
            <img
              src={img.src}
              alt={img.alt || 'Trading related illustration'}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchpriority={i === 0 ? 'high' : 'low'}
              onError={handleImgError}
            />
          </div>
        ))}
      </div>

      {showArrows && count > 1 && (
        <>
          <button className="carousel-arrow left" aria-label="Previous slide" onClick={prev}>
            ‹
          </button>
          <button className="carousel-arrow right" aria-label="Next slide" onClick={next}>
            ›
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className="carousel-dots" role="tablist" aria-label="Slide navigation">
          {images.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className={i === index ? 'dot active' : 'dot'}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import '../styles/splash.css';

function SplashScreen({ show, logoSrc }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`splash-overlay ${show ? 'visible' : 'hidden'}`} aria-hidden={!show}>
      <div className="splash-background" />
      <div className="splash-content" role="dialog" aria-label="Loading">
        {!imgError ? (
          <img
            src={logoSrc}
            alt="Site logo"
            className={`splash-logo ${imgLoaded ? 'loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="splash-fallback">
            <span className="fallback-title">Investara</span>
            <span className="fallback-subtitle">Loading experience</span>
          </div>
        )}

        {!imgLoaded && !imgError && (
          <div className="splash-loader" aria-label="Loading indicator">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
        )}

        <div className="splash-caption">Preparing your dashboard…</div>
      </div>
    </div>
  );
}

export default SplashScreen;


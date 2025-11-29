import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import fallbackFavicon from './images/investara.png';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Ensure favicon: prefer `public/image.png` if available; otherwise use embedded fallback from src
const setFavicon = (url) => {
  try {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = 'image/png';
    link.href = url;
  } catch (err) {
    // ignore
  }
};

const publicImage = `${process.env.PUBLIC_URL}/image.png`;
// Attempt to fetch the public image (HEAD) and set if available
fetch(publicImage, { method: 'HEAD' }).then((res) => {
  if (res.ok) setFavicon(publicImage);
  else setFavicon(fallbackFavicon);
}).catch(() => setFavicon(fallbackFavicon));

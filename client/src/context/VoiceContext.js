import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const VoiceContext = createContext({
  supported: false,
  speaking: false,
  muted: true,
  volume: 0.6,
  rate: 1.0,
  voiceName: null,
  speak: () => {},
  welcome: () => {},
  setMuted: () => {},
  setVolume: () => {},
});

function pickVoice(preferredLangs = ['en-US', 'en-GB']) {
  const synth = window.speechSynthesis;
  const voices = synth && synth.getVoices ? synth.getVoices() : [];
  if (!voices || !voices.length) return null;
  const match = voices.find(v => preferredLangs.includes(v.lang)) || voices[0];
  return match || null;
}

export const VoiceProvider = ({ children }) => {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const [muted, setMuted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('voiceMuted')) ?? false; } catch { return false; }
  });
  const [volume, setVolume] = useState(() => {
    try { return Number(localStorage.getItem('voiceVolume')) || 0.85; } catch { return 0.85; }
  });
  const [rate, setRate] = useState(1.0);
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef(null);
  const greetingDoneRef = useRef(false);

  useEffect(() => {
    try { localStorage.setItem('voiceMuted', JSON.stringify(muted)); } catch {}
  }, [muted]);
  useEffect(() => {
    try { localStorage.setItem('voiceVolume', String(volume)); } catch {}
  }, [volume]);

  // Load voices asynchronously on some browsers
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const loadVoices = () => { voiceRef.current = pickVoice(); };
    loadVoices();
    if (synth && synth.addEventListener) {
      synth.addEventListener('voiceschanged', loadVoices);
      return () => synth.removeEventListener('voiceschanged', loadVoices);
    }
  }, [supported]);

  const speak = useCallback((text, opts = {}) => {
    if (!supported) return false;
    if (muted || !text) return false;
    const synth = window.speechSynthesis;
    // visual indicator
    setSpeaking(true);
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.voice = voiceRef.current || null;
    const desired = Math.max(0.8, Math.min(1, opts.volume ?? volume));
    utter.volume = desired;
    utter.rate = Math.max(0.5, Math.min(1.5, opts.rate ?? rate));
    utter.pitch = Math.max(0.8, Math.min(1.2, opts.pitch ?? 1.0));
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    try {
      synth.speak(utter);
      return true;
    } catch (e) {
      setSpeaking(false);
      return false;
    }
  }, [supported, muted, volume, rate]);

  const welcome = useCallback(() => {
    if (!supported || muted) return;
    if (greetingDoneRef.current) return;
    greetingDoneRef.current = true;
    // Gentle volume to avoid startling users
    const text = 'Welcome to our stock trading platform Investara';
    setTimeout(() => { speak(text, { volume: Math.min(0.5, volume) }); }, 300);
  }, [supported, muted, speak, volume]);

  const value = useMemo(() => ({
    supported, speaking, muted, volume, rate,
    voiceName: voiceRef.current?.name || null,
    speak, welcome,
    setMuted, setVolume, setRate,
  }), [supported, speaking, muted, volume, rate, speak, welcome]);

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};

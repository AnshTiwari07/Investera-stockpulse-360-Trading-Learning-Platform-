import React, { useContext } from 'react';
import { FiMic } from 'react-icons/fi';
import { VoiceContext } from '../context/VoiceContext';
import './VoiceFab.css';

export default function VoiceFab() {
  const { supported, muted, setMuted, speaking } = useContext(VoiceContext);
  if (!supported) return null;
  const toggle = () => setMuted(!muted);
  const label = muted ? 'Enable voice feedback' : 'Disable voice feedback';
  return (
    <button
      type="button"
      className="voice-fab"
      aria-label={label}
      title={label}
      onClick={toggle}
    >
      <FiMic className={speaking ? 'voice-icon active' : 'voice-icon'} aria-hidden="true" />
    </button>
  );
}


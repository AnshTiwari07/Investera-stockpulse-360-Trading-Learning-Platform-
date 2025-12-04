import React, { useContext } from 'react';
import { VoiceContext } from '../context/VoiceContext';

const indicatorStyle = (active) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  marginLeft: 8,
  backgroundColor: active ? '#22c55e' : '#6b7280',
  boxShadow: active ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
});

export default function VoiceControls() {
  const { supported, speaking, muted, volume, setMuted, setVolume, voiceName } = useContext(VoiceContext);
  if (!supported) return null;
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1200, display: 'flex', alignItems: 'center', background: 'rgba(17,24,39,0.85)', borderRadius: 12, padding: '8px 12px', color: '#fff', backdropFilter: 'blur(6px)' }}>
      <span style={{ fontSize: 12 }}>Voice</span>
      <div style={indicatorStyle(speaking)} title={speaking ? 'Speaking' : 'Idle'} aria-label={speaking ? 'voice-active' : 'voice-idle'} />
      <button onClick={() => setMuted(!muted)} style={{ marginLeft: 8, background: 'transparent', border: '1px solid #9ca3af', color: '#fff', padding: '4px 8px', borderRadius: 6 }} aria-label={muted ? 'Unmute voice' : 'Mute voice'}>
        {muted ? 'Unmute' : 'Mute'}
      </button>
      <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ marginLeft: 10 }} aria-label="Voice volume" />
      {voiceName && <span style={{ marginLeft: 8, fontSize: 11, color: '#9ca3af' }}>{voiceName}</span>}
    </div>
  );
}


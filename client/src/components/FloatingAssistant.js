import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AiOutlineRobot } from 'react-icons/ai';
import './FloatingAssistant.css';

const FloatingAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goAssistant = useCallback(() => {
    if (location.pathname !== '/assistant') {
      navigate('/assistant');
    }
  }, [navigate, location.pathname]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goAssistant();
    }
  };

  return (
    <button
      type="button"
      className="assistant-fab"
      aria-label="Open Trading Assistant"
      title="Open Trading Assistant"
      onClick={goAssistant}
      onKeyDown={onKeyDown}
    >
      <AiOutlineRobot className="assistant-icon" aria-hidden="true" />
    </button>
  );
};

export default FloatingAssistant;


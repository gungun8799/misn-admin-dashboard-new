import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomBar.css';

const BottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activePath, setActivePath] = useState('/Dashboard'); // default path

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport.height < window.innerHeight) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const savedPath = localStorage.getItem('activePath');
    if (savedPath) {
      setActivePath(savedPath);
    }
  }, []);

  const handleNavigate = (path) => {
    if (location.pathname !== path) {
      setActivePath(path);
      localStorage.setItem('activePath', path);
      navigate(path);
    }
  };

  const getActiveClass = (path) => {
    return activePath === path ? 'active' : '';
  };

  return (
    <div className={`bottom-bar ${isKeyboardVisible ? 'hidden' : ''}`}>
      <button onClick={() => handleNavigate('/Dashboard')} className={`bottom-bar-button ${getActiveClass('/Dashboard')}`}>
        <i className="fas fa-Dashboard"></i>
        <span>Dashboard</span>
      </button>
      <button onClick={() => handleNavigate('/client-profile')} className={`bottom-bar-button ${getActiveClass('/client-profile')}`}>
        <i className="fas fa-book"></i>
        <span>Client Profile</span>
      </button>
      <button onClick={() => handleNavigate('/AgentProfile')} className={`bottom-bar-button ${getActiveClass('/AgentProfile')}`}>
        <i className="fas fa-user"></i>
        <span>Profile</span>
      </button>
      <button onClick={() => handleNavigate('/my-chat')} className={`bottom-bar-button ${getActiveClass('/my-chat')}`}>
        <i className="fa-solid fa-comment"></i>
        <span>Chat</span>
      </button>
    </div>
  );
};

export default BottomBar;

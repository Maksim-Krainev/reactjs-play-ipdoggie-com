import React, { useState } from 'react';
import './App.css';
import ChatBlock from './components/ChatBlock';
import ChatMenu from './components/ChatMenu';

function App() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [hideChatBlock, setHideChatBlock] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
    
    if (window.innerWidth <= 768) {
      setHideChatBlock(!hideChatBlock);
    }
  };

  return (
    <div className={`App ${isMenuOpen ? 'menu-open' : ''}`}>
      {isMenuOpen && <ChatMenu />}
      <button className={`menu-btn ${isMenuOpen ? 'rotate' : ''} ${window.innerWidth <= 900 ? 'top' : ''}`} onClick={toggleMenu}>
        <img src='./assets/paw-print.svg' alt='Menu'></img>
      </button>
      {hideChatBlock ? null : <ChatBlock />}
    </div>
  );
}

export default App;

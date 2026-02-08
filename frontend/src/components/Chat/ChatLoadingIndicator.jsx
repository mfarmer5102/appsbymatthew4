import React from 'react';

const ChatLoadingIndicator = () => {
  return (
    <div className="chat-loading">
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="loading-text">Thinking...</div>
    </div>
  );
};

export default ChatLoadingIndicator;

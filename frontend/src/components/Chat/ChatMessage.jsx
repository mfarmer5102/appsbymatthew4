import React from 'react';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-content">
        {message.content}
      </div>

      {/* Show sources if available (only for assistant messages) */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="message-sources">
          <small>Sources:</small>
          <div className="sources-list">
            {message.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.link}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                {source.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="message-timestamp">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

export default ChatMessage;

import React, { useState, useRef, useEffect } from 'react';
import { IoSend, IoClose } from 'react-icons/io5';
import ChatMessage from './ChatMessage';
import ChatLoadingIndicator from './ChatLoadingIndicator';
import { chatAPI } from '../../config/api';
import './ChatPanel.css';

const ChatPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Generate session ID on mount
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm here to help you learn about Matthew's projects and skills. Ask me anything!",
        timestamp: new Date(),
      }]);
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    // Validate input
    if (!inputMessage.trim() || isLoading) {
      return;
    }

    const userMessage = inputMessage.trim();

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Call API
      const response = await chatAPI.sendMessage({
        message: userMessage,
        session_id: sessionId
      });

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        sources: response.data.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update session ID if provided
      if (response.data.session_id) {
        setSessionId(response.data.session_id);
      }

    } catch (err) {
      console.error('Chat error:', err);
      setError('Sorry, I encountered an error. Please try again.');

      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <h3>Ask Me Anything</h3>
        <button className="chat-close" onClick={onClose} aria-label="Close chat">
          <IoClose size={24} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}

        {isLoading && <ChatLoadingIndicator />}

        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about projects, skills..."
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="send-button"
          aria-label="Send message"
        >
          <IoSend size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;

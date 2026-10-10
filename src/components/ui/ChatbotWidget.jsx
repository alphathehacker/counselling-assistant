import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ChatbotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', text: 'Hello! I am your AI Counseling Assistant. How can I help with your college admission questions today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = { role: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/chat', {
        message: userMessage.text,
        chatHistory: chatHistory.slice(-5) // Send last 5 for context
      });

      if (response.data.success) {
        setChatHistory(prev => [...prev, { role: 'model', text: response.data.message }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 lg:bottom-6 z-[999]">
      {/* Chat Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-secondary rotate-90' : 'bg-primary hover:scale-110'
        }`}
      >
        <Icon name={isOpen ? 'X' : 'MessageCircle'} color="white" size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] max-w-[350px] sm:w-[400px] sm:max-w-none h-[65dvh] max-h-[500px] bg-card border border-border rounded-2xl shadow-modal flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Icon name="GraduationCap" size={20} />
            </div>
            <div>
              <h4 className="font-heading font-semibold text-sm">AI Counseling Assistant</h4>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5"
          >
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm'
                      : 'bg-card border border-border text-foreground rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form 
            onSubmit={handleSend}
            className="p-4 border-t border-border bg-card flex items-center space-x-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-smooth"
            />
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Icon name="Send" size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;

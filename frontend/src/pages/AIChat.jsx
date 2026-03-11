import React, { useState } from 'react';
import { chatWithAI } from '../services/aiApi';

const AIChat = () => {
  const [messages, setMessages] = useState([]); // {sender:'user'|'ai', text}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((m) => [...m, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      const res = await chatWithAI(userText);
      setMessages((m) => [...m, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      console.error('AI chat request failed:', err);
      const text = err?.message || 'Error contacting AI.';
      setMessages((m) => [...m, { sender: 'ai', text }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow overflow-auto p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 max-w-md ${msg.sender === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-gray-200 text-gray-900'} rounded-lg px-4 py-2`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask the AI health assistant..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-full disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default AIChat;
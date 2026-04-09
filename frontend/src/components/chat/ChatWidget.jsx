import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AIChat from '../../pages/AIChat';
import { HiOutlineChat, HiOutlineX } from 'react-icons/hi';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem('token');
  const location = useLocation();
  
  // Don't show on Chat page
  const isChatPage = location.pathname.includes('/chat/');
  
  if (!token || isChatPage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* inline panel above button */}
      {open && (
        <div className="mb-2 w-80 md:w-96 h-96 bg-white shadow-lg rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-2 bg-blue-600 text-white">
            <span className="font-semibold">Health Assistant</span>
            <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200">
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <AIChat />
          </div>
        </div>
      )}

      {/* floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none"
      >
        <HiOutlineChat className="w-8 h-8" />
      </button>
    </div>
  );
};

export default ChatWidget;

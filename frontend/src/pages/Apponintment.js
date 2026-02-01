import React from 'react'
import  { useState } from 'react';
import { Search, X } from 'lucide-react';
import Footer from '../components/Footer';

const Apponintment = () => {

    const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    setSearchQuery('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
  };
  return (
    <>
      <div className="mt-32 min-h-screen w-full">
        <div className="w-full max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div
              className={`relative flex items-center bg-white rounded-full shadow-lg transition-all duration-300 ${
                isFocused ? 'ring-2 ring-blue-500 shadow-2xl' : ''
              }`}
            >
              <div className="pl-6 pr-3">
                <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search doctors, specialties, symptoms..."
                className="flex-1 py-4 text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}

              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 mr-1"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Apponintment

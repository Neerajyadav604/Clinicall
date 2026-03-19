import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavbarLinks } from "../data/NavbarLinks";
import ProfileDropDown from "./ProfileDropDown";
import logo from "../assets/logo.png";

const Navbar = () => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const userRole = user ? JSON.parse(user)?.role?.toLowerCase() : null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper function to check if a link should be shown
  const shouldShowLink = (item) => {
    // If link is protected and user is not logged in, hide it
    if (item.protected && !token) return false;
    
    // If link has a specific role requirement, check user's role (case-insensitive)
    if (item.role && item.role.toLowerCase() !== userRole) return false;
    
    return true;
  };

  return (
    <div className="w-full fixed top-0 left-0 z-50 bg-white px-4 sm:px-6 py-4">
      <nav className="max-w-7xl mx-auto bg-white rounded-full shadow-2xl px-4 sm:px-5 py-3 flex items-center justify-between">
        
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="Logo"
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </Link>

        <div className="hidden lg:flex gap-2 items-center">
          {NavbarLinks
            .filter((item) => shouldShowLink(item))
            .map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.title}
                  to={item.path}
                  className={`
                    px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ease-in-out
                    ${isActive
                      ? "bg-gradient-to-r from-blue-300 to-blue-400 text-gray-900 shadow-lg"
                      : "text-gray-800 hover:bg-gray-100"
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {item.title}
                    {isActive && (
                      <span className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {token ? (
            <ProfileDropDown />
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-full font-semibold text-sm text-gray-800 hover:bg-gray-100 transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 rounded-full font-semibold text-sm bg-gradient-to-r from-blue-300 to-blue-400 text-gray-900 shadow-md hover:shadow-lg transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition"
        >
          <svg
            className="w-6 h-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

      </nav>

      {isMenuOpen && (
        <div className="lg:hidden mt-4 mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex flex-col py-4">
            {NavbarLinks
              .filter((item) => shouldShowLink(item))
              .map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      px-6 py-3 font-semibold text-sm transition-all duration-300
                      ${isActive
                        ? "bg-gradient-to-r from-blue-300 to-blue-400 text-gray-900"
                        : "text-gray-800 hover:bg-gray-100"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {item.title}
                      {isActive && (
                        <span className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            
            <div className="border-t border-gray-200 mt-2 pt-2 px-6 pb-2">
              {token ? (
                <div className="py-2">
                  <ProfileDropDown />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-5 py-2 rounded-full font-semibold text-sm text-center text-gray-800 hover:bg-gray-100 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-5 py-2 rounded-full font-semibold text-sm text-center bg-gradient-to-r from-blue-300 to-blue-400 text-gray-900 shadow-md hover:shadow-lg transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
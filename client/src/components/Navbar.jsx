import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { token, logout, user } = useAuth();
  const [theme, setTheme] = useState(() => {
    // ✅ load from localStorage on first render
    return localStorage.getItem("theme") || "light";
  });

  // ✅ apply theme immediately when state changes
  useEffect(() => {
    document.querySelector("html").setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="navbar bg-base-200 shadow-md px-6 sticky top-0 z-50">
      <div className="flex-1">
        <Link to="/" className="text-2xl font-extrabold text-primary">
          WellNest
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {token ? (
          <>
            <Link to="/test-selector" className="btn btn-ghost">Take Test</Link>
            <Link to="/profile" className="btn btn-ghost">Profile</Link>
            <Link to="/chatbot" className="btn btn-ghost">Chatbot</Link>
            <button onClick={logout} className="btn btn-error">
              Logout ({user?.name})
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/register" className="btn btn-ghost">Register</Link>
          </>
        )}

        <button onClick={toggleTheme} className="btn btn-ghost btn-circle">
          {theme === "light" ? (
            <Sun className="w-6 h-6 text-yellow-500" />
          ) : (
            <Moon className="w-6 h-6 text-blue-400" />
          )}
        </button>
      </div>
    </div>
  );
}

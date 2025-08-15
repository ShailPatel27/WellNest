import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React from "react";

export default function Navbar() {
  const { token, logout, user } = useAuth();

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to="/" className="font-bold text-lg">WellNest</Link>
      <div className="space-x-4">
        {token ? (
          <>
            <Link to="/test-selector">Take Test</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/chatbot">Chatbot</Link>
            <button
              onClick={logout}
              className="bg-red-500 px-3 py-1 rounded"
            >
              Logout ({user?.name})
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

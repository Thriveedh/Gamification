import React, { useState } from "react";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import './index.css';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [driverName, setDriverName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const nameKey = driverName.trim().toLowerCase();
    const docRef = doc(db, "users", nameKey);

    try {
      if (isLogin) {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          alert("User not found.");
          return;
        }
        const userData = docSnap.data();
        if (userData.password !== password) {
          alert("Wrong password.");
          return;
        }
        onAuthSuccess(userData);
      } else {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          alert("User already exists.");
          return;
        }
        const newUser = {
          name: driverName.trim(),
          password,
          points: 0,
          level: "1",
          gain: 0,
          badges: [],
          avatar: "https://via.placeholder.com/40", // Default avatar
          createdAt: new Date(),
          removed: false
        };
        await setDoc(docRef, newUser);
        onAuthSuccess(newUser);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? "Login" : "Register"}
        </h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Driver Name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="auth-input"
            required
            disabled={loading}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
            disabled={loading}
          />
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>
        
        <p 
          className="auth-toggle"
          onClick={() => setIsLogin(!isLogin)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsLogin(!isLogin);
            }
          }}
        >
          {isLogin ? "New user? Register here" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
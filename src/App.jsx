import React, { useState } from "react";
import AuthPage from "./AuthPage.jsx";
import Leaderboard from "./Leaderboard.jsx";
import './index.css'
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <div>
      {currentUser ? (
        <Leaderboard currentUser={currentUser} />
      ) : (
        <AuthPage onAuthSuccess={(user) => setCurrentUser(user)} />
      )}
    </div>
  );
};

export default App;

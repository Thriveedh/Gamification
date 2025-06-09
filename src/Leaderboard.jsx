import React, { useEffect, useState, useCallback } from "react";
import { db, auth } from "./firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Trophy, Search, Heart, Shield, MessageSquare, FileText, MoreVertical, LogOut, UserX, Camera } from "lucide-react";
import './Leaderboard.css';

export default function Leaderboard({ setUser, setIsAuthenticated }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRemoveUser, setShowRemoveUser] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [removeUserForm, setRemoveUserForm] = useState({ name: '', password: '' });
  const [newAvatar, setNewAvatar] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized function to fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out removed users and sort by points
      const activeUsers = data.filter(user => !user.removed);
      activeUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
      
      setUsers(activeUsers);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it doesn't rely on external state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // If user is signed out, update parent component
      if (!user) {
        if (setIsAuthenticated) {
          setIsAuthenticated(false);
        }
        if (setUser) {
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, [setIsAuthenticated, setUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenu]);

  const badgeIcons = {
    heart: <Heart className="badge-icon text-pink-500" size={18} />, 
    shield: <Shield className="badge-icon text-green-500" size={18} />,
    chat: <MessageSquare className="badge-icon text-purple-500" size={18} />,
    file: <FileText className="badge-icon text-orange-500" size={18} />
  };

  const handleLogout = async () => {
    try {
      setShowMenu(false);
      await signOut(auth);
      
      // Clear all local state
      setUsers([]);
      setCurrentUser(null);
      
      // Call parent component functions to update auth state
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      if (setUser) {
        setUser(null);
      }
      
      // Optional: redirect or reload page
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  const handleRemoveUser = async (e) => {
    e.preventDefault();
    
    if (!removeUserForm.name.trim() || !removeUserForm.password.trim()) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      // Find user by name
      const userToRemove = users.find(user => 
        user.name.toLowerCase() === removeUserForm.name.toLowerCase()
      );

      if (!userToRemove) {
        alert("Driver not found!");
        return;
      }

      // Verify password (you should implement proper password verification)
      if (removeUserForm.password !== "admin123") { // Replace with proper verification
        alert("Incorrect password!");
        return;
      }

      // Mark user as removed instead of deleting
      await updateDoc(doc(db, "users", userToRemove.id), {
        removed: true,
        removedAt: new Date()
      });

      // Refresh users list
      await fetchUsers();

      setShowRemoveUser(false);
      setRemoveUserForm({ name: '', password: '' });
      setShowMenu(false);
      alert("Driver removed successfully!");
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove driver. Please try again.");
    }
  };

  const handleAvatarChange = async () => {
    if (!newAvatar.trim()) {
      alert("Please enter a valid avatar URL");
      return;
    }

    try {
      if (currentUser) {
        // Find current user's document
        const userDoc = users.find(user => user.email === currentUser.email);
        if (userDoc) {
          await updateDoc(doc(db, "users", userDoc.id), {
            avatar: newAvatar
          });

          // Update local state
          setUsers(prev => prev.map(user => 
            user.id === userDoc.id ? { ...user, avatar: newAvatar } : user
          ));

          setShowAvatarUpload(false);
          setNewAvatar('');
          setShowMenu(false);
          alert("Avatar updated successfully!");
        }
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("Failed to update avatar. Please try again.");
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="header-section">
        <div className="title-container">
          <Trophy className="trophy-icon" size={28} />
          <h1 className="main-title">Leaderboard</h1>
          
          {/* Three dots menu */}
          <div className="menu-container">
            <button 
              className="menu-trigger"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Open menu"
            >
              <MoreVertical size={24} />
            </button>
            
            {showMenu && (
              <div className="dropdown-menu">
                <button 
                  className="menu-item"
                  onClick={() => {
                    setShowAvatarUpload(true);
                    setShowMenu(false);
                  }}
                >
                  <Camera size={18} />
                  Change Avatar
                </button>
                <button 
                  className="menu-item"
                  onClick={() => {
                    setShowRemoveUser(true);
                    setShowMenu(false);
                  }}
                >
                  <UserX size={18} />
                  Remove User
                </button>
                <button 
                  className="menu-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="button-group">
          <button className="btn btn-active">Normal Drivers</button>
          <button className="btn btn-inactive">Goods Carriers</button>
        </div>

        <div className="button-group">
          <button className="btn btn-primary">Monthly Ranking</button>
          <button className="btn btn-secondary">Overall Ranking</button>
        </div>

        <div className="search-container">
          <Search className="search-icon" />
          <input 
            type="text" 
            placeholder="Search drivers..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          Normal Drivers - This Month's Champions
          <span className="date-badge">December 2024</span>
        </div>

        <div className="table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Driver</th>
                <th>Level</th>
                <th>Badges</th>
                <th>Points</th>
                <th>Gain</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr key={user.id || idx} className={`rank-${idx + 1}`}>
                  <td className="rank-number">{idx + 1}</td>
                  <td className="driver-info">
                    <div className="driver-details">
                      <img 
                        src={user.avatar || "https://via.placeholder.com/40"} 
                        alt={`${user.name || 'Unknown Driver'} avatar`}
                        className="avatar"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/40";
                        }}
                      />
                      <div className="driver-text">
                        <div className="driver-name">{user.name || 'Unknown Driver'}</div>
                        {idx === 0 && <div className="rank-badge champion">🏆 Champion</div>}
                        {idx === 1 && <div className="rank-badge runner-up">🥈 Runner-up</div>}
                        {idx === 2 && <div className="rank-badge third-place">🥉 Third Place</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="level-badge">Level {user.level || 1}</span>
                  </td>
                  <td className="badges-cell">
                    <div className="badges-container">
                      {(user.badges || []).map((badge, i) => (
                        <span key={i} className="badge-item">
                          {badgeIcons[badge] || badgeIcons.heart}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="points-cell">{user.points || 0}</td>
                  <td className="gain-cell">+{user.gain || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Active Drivers</div>
        </div>
        <div className="stat-item">
          <div className="stat-number stat-blue">
            {users.reduce((sum, u) => sum + (u.points || 0), 0)}
          </div>
          <div className="stat-label">Monthly Points</div>
        </div>
        <div className="stat-item">
          <div className="stat-number stat-green">
            {users.reduce((sum, u) => sum + ((u.badges && u.badges.length) || 0), 0)}
          </div>
          <div className="stat-label">Badges Earned</div>
        </div>
      </div>

      <p className="footer-text">
        Rankings reset monthly for normal drivers. Keep driving safely to climb the leaderboard!
      </p>

      {/* Remove User Modal */}
      {showRemoveUser && (
        <div className="modal-overlay" onClick={() => setShowRemoveUser(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Driver</h3>
            <form onSubmit={handleRemoveUser}>
              <div className="form-group">
                <label>Driver Name:</label>
                <input
                  type="text"
                  value={removeUserForm.name}
                  onChange={(e) => setRemoveUserForm(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="Enter driver name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Password:</label>
                <input
                  type="password"
                  value={removeUserForm.password}
                  onChange={(e) => setRemoveUserForm(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowRemoveUser(false)}>
                  Cancel
                </button>
                <button type="submit" className="danger-btn">
                  Remove Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="modal-overlay" onClick={() => setShowAvatarUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Change Avatar</h3>
            <div className="form-group">
              <label>Avatar URL:</label>
              <input
                type="url"
                value={newAvatar}
                onChange={(e) => setNewAvatar(e.target.value)}
                placeholder="Enter image URL"
              />
            </div>
            {newAvatar && (
              <div className="avatar-preview">
                <img 
                  src={newAvatar} 
                  alt="Preview" 
                  className="preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setShowAvatarUpload(false)}>
                Cancel
              </button>
              <button onClick={handleAvatarChange} className="primary-btn">
                Update Avatar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
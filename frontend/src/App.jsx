import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Notebook from './components/Notebook';
import Login from './components/Login';
import Register from './components/Register';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './styles/styles.css';

const App = () => {
  const [user, setUser] = useState(null); // Manage user state

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <Header user={user} handleLogout={handleLogout} />
      <div className="app-container">
        <Sidebar user={user} handleLogout={handleLogout} />
        <div className="content">
          <Routes>
            <Route path="/notebook" element={<Notebook />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;

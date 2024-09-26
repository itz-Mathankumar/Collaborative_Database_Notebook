import './styles/styles.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Notebook from './components/Notebook';
import Login from './components/Login';
import Register from './components/Register';

const App = () => {
  const [user, setUser] = useState(null);
  const [notebooks, setNotebooks] = useState([]);

  // Check for user in localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('userToken');
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Set user from localStorage if available
    }
  }, []);

  // Load notebooks if user is logged in
  useEffect(() => {
    if (user) {
      const savedNotebooks = JSON.parse(localStorage.getItem(`notebooks_${user.username}`)) || [];
      setNotebooks(savedNotebooks);
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('userToken', JSON.stringify(userData)); // Store user data in localStorage
  };

  const handleLogout = () => {
    setUser(null);
    setNotebooks([]);
    localStorage.removeItem('userToken'); // Remove user data from localStorage
  };

  const handleCreateNotebook = (notebookName) => {
    const newNotebook = { id: Date.now(), name: notebookName, cells: [] };
    const updatedNotebooks = [...notebooks, newNotebook];
    setNotebooks(updatedNotebooks);
    localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
  };

  const handleDeleteNotebook = (notebookId) => {
    const updatedNotebooks = notebooks.filter(notebook => notebook.id !== notebookId);
    setNotebooks(updatedNotebooks);
    localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
  };

  const handleUpdateNotebook = (updatedNotebook) => {
    const updatedNotebooks = notebooks.map(notebook => 
      notebook.id === updatedNotebook.id ? updatedNotebook : notebook
    );
    setNotebooks(updatedNotebooks);
    localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar 
          user={user} 
          handleLogout={handleLogout} 
          notebooks={notebooks}
          onDeleteNotebook={handleDeleteNotebook}
          onCreateNotebook={handleCreateNotebook}
        />
        <div className="content">
          <Header user={user} handleLogout={handleLogout} />
          <Routes>
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route 
              path="/notebook/:id" 
              element={user ? <Notebook notebooks={notebooks} onUpdateNotebook={handleUpdateNotebook} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;

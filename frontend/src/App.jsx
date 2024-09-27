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

  useEffect(() => {
    const storedUser = localStorage.getItem('userToken');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      console.log('User loaded from localStorage:', JSON.parse(storedUser));
    } else {
      console.log('No user found in localStorage.');
    }
  }, []);

  const fetchNotebooks = async (userId) => {
    console.log('Fetching notebooks for user ID:', userId);
    try {
      const response = await fetch(`/notebooks/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notebooks');
      }

      const data = await response.json();
      setNotebooks(data.notebooks);
      console.log('Fetched notebooks:', data.notebooks);
      console.log(user)
      localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(data.notebooks));
    } catch (error) {
      console.error('Error fetching notebooks:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotebooks(user.userId);
    } else {
      setNotebooks([]);
      console.log('No user logged in, notebooks reset.');
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('userToken', JSON.stringify(userData));
    console.log('User logged in:', userData);
    fetchNotebooks(userData.userId);
  };

  const handleLogout = () => {
    setUser(null);
    setNotebooks([]);
    localStorage.removeItem('userToken');
    console.log('User logged out.');
  };

  const handleCreateNotebook = async (notebookName) => {
    if (!user) return;
    console.log('Creating notebook with name:', notebookName);

    try {
      const response = await fetch('/create-notebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: notebookName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create notebook');
      }

      const data = await response.json();
      const newNotebook = { id: data.notebookId, name: notebookName, cells: [] };
      const updatedNotebooks = [...notebooks, newNotebook];
      setNotebooks(updatedNotebooks);
      localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
      console.log('New notebook created:', newNotebook);
    } catch (error) {
      console.error('Error creating notebook:', error);
    }

    window.location.reload();
  };

  const handleDeleteNotebook = async (notebookId) => {
    if (!user) return;
    console.log('Deleting notebook with ID:', notebookId);
    console.log(localStorage.getItem('token'))
  
    try {
      const response = await fetch(`/notebooks/${notebookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete notebook');
      }
  
      const updatedNotebooks = notebooks.filter(notebook => notebook.id !== notebookId);
      setNotebooks(updatedNotebooks);
      localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
      console.log('Notebook deleted. Updated notebooks:', updatedNotebooks);
      alert("Notebook is deleted successfully.");
    } catch (error) {
      console.error('Error deleting notebook:', error);
      alert("Failed to delete notebook. Only notebook owner can delete it.");
    }

    window.location.reload();
  };
  

  const handleUpdateNotebook = (updatedNotebook) => {
    console.log('Updating notebook:', updatedNotebook);
    const updatedNotebooks = notebooks.map(notebook => 
      notebook.id === updatedNotebook.id ? updatedNotebook : notebook
    );
    setNotebooks(updatedNotebooks);
    localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
    console.log('Notebooks updated:', updatedNotebooks);
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
            <Route path="/" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
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

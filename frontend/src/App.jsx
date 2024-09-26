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
      console.log('User loaded from localStorage:', JSON.parse(storedUser)); // Log the loaded user
    } else {
      console.log('No user found in localStorage.');
    }
  }, []);

  // Fetch notebooks for logged-in user
  const fetchNotebooks = async (userId) => {
    console.log('Fetching notebooks for user ID:', userId); // Log the user ID for fetching notebooks
    try {
      const response = await fetch(`http://localhost:5000/notebooks/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming you store a token for user authentication
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notebooks');
      }

      const data = await response.json();
      setNotebooks(data.notebooks);
      console.log('Fetched notebooks:', data.notebooks); // Log fetched notebooks
      localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(data.notebooks)); // Store fetched notebooks in local storage
    } catch (error) {
      console.error('Error fetching notebooks:', error); // Log error if fetching fails
    }
  };

  // Load notebooks if user is logged in
  useEffect(() => {
    if (user) {
      fetchNotebooks(user.userId); // Fetch notebooks when user logs in
    } else {
      setNotebooks([]); // Reset notebooks if no user
      console.log('No user logged in, notebooks reset.');
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('userToken', JSON.stringify(userData)); // Store user data in localStorage
    console.log('User logged in:', userData); // Log the user data on login
    fetchNotebooks(userData.userId); // Fetch notebooks immediately after login
  };

  const handleLogout = () => {
    setUser(null);
    setNotebooks([]);
    localStorage.removeItem('userToken'); // Remove user data from localStorage
    console.log('User logged out.'); // Log the logout event
  };

  const handleCreateNotebook = async (notebookName) => {
    if (!user) return;
    console.log('Creating notebook with name:', notebookName); // Log the notebook name being created

    try {
      const response = await fetch('http://localhost:5000/create-notebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming you store a token for user authentication
        },
        body: JSON.stringify({ title: notebookName }), // Pass the user ID and notebook title
      });

      if (!response.ok) {
        throw new Error('Failed to create notebook');
      }

      const data = await response.json();
      const newNotebook = { id: data.notebookId, name: notebookName, cells: [] }; // Use the ID returned from the server
      const updatedNotebooks = [...notebooks, newNotebook];
      setNotebooks(updatedNotebooks);
      localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
      console.log('New notebook created:', newNotebook); // Log the created notebook
    } catch (error) {
      console.error('Error creating notebook:', error); // Log error if creation fails
    }

    window.location.reload();
  };

  const handleDeleteNotebook = async (notebookId) => {
    if (!user) return;
    console.log('Deleting notebook with ID:', notebookId); // Log the notebook ID being deleted
    console.log(localStorage.getItem('token'))
  
    try {
      const response = await fetch(`http://localhost:5000/notebooks/${notebookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming you store a token for user authentication
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete notebook');
      }
  
      const updatedNotebooks = notebooks.filter(notebook => notebook.id !== notebookId);
      setNotebooks(updatedNotebooks);
      localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
      console.log('Notebook deleted. Updated notebooks:', updatedNotebooks); // Log updated notebooks after deletion
  

      
    } catch (error) {
      console.error('Error deleting notebook:', error); // Log error if deletion fails
    }

    window.location.reload();
  };
  

  const handleUpdateNotebook = (updatedNotebook) => {
    console.log('Updating notebook:', updatedNotebook); // Log the updated notebook
    const updatedNotebooks = notebooks.map(notebook => 
      notebook.id === updatedNotebook.id ? updatedNotebook : notebook
    );
    setNotebooks(updatedNotebooks);
    localStorage.setItem(`notebooks_${user.username}`, JSON.stringify(updatedNotebooks));
    console.log('Notebooks updated:', updatedNotebooks); // Log the updated notebooks list
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

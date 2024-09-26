import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus } from 'lucide-react';

const Sidebar = ({ user, handleLogout, notebooks, onDeleteNotebook, onCreateNotebook }) => {
  const [newNotebookName, setNewNotebookName] = useState('');

  const handleCreateNotebook = (e) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      onCreateNotebook(newNotebookName.trim());
      setNewNotebookName('');
    }
  };

  return (
    <nav className="sidebar">
      <h2>Navigate</h2>
      <ul>
        {user ? (
          <>
            <li><Link to="/notebooks">Home</Link></li>
            {notebooks.map(notebook => (
              <li key={notebook.id} className="notebook-item">
                <Link to={`/notebook/${notebook.id}`}>{notebook.name}</Link>
                <button 
                  className="delete-notebook" 
                  onClick={() => onDeleteNotebook(notebook.id)}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
            <li>
              <form onSubmit={handleCreateNotebook} className="create-notebook-form">
                <input
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  placeholder="New notebook name"
                />
                <button type="submit" className="btn-create-notebook">
                  <Plus size={16} />
                </button>
              </form>
            </li>
            <li><button className="btn-logout" onClick={handleLogout}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Sidebar;

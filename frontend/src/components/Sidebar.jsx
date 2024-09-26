import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus } from 'lucide-react';

const Sidebar = ({ user, handleLogout, notebooks, onDeleteNotebook, onCreateNotebook }) => {
  const [newNotebookName, setNewNotebookName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleCreateNotebook = (e) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      onCreateNotebook(newNotebookName.trim());
      setNewNotebookName('');
    }
  };

  const handleDeleteClick = (notebookId) => {
    setConfirmDelete(notebookId);
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      onDeleteNotebook(confirmDelete);
      setConfirmDelete(null);
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
              <li key={notebook._id} className="notebook-item">
                <Link to={`/notebook/${notebook._id}`}>{notebook.title}</Link>
                {confirmDelete === notebook._id ? (
                  <div className="delete-confirm">
                    <button onClick={handleConfirmDelete} className="confirm-yes">Yes</button>
                    <button onClick={() => setConfirmDelete(null)} className="confirm-no">No</button>
                  </div>
                ) : (
                  <button 
                    className="delete-notebook" 
                    onClick={() => handleDeleteClick(notebook._id)}
                  >
                    <X size={16} />
                  </button>
                )}
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
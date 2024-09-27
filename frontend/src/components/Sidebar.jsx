import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus } from 'lucide-react';

const Sidebar = ({ user, handleLogout, notebooks, onDeleteNotebook, onCreateNotebook }) => {
  const [newNotebookName, setNewNotebookName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showHome, setShowHome] = useState(false);

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
            <li><Link to="/notebooks" onClick={() => setShowHome(true)}>Home</Link></li>
            {notebooks.map(notebook => (
              <li key={notebook._id} className="notebook-item">
                <Link to={`/notebook/${notebook._id}`} onClick={() => setShowHome(false)}>{notebook.title}</Link>
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
      {showHome && (
        <div className="notebooks-table">
          <h3>Your Notebooks</h3>
          {notebooks.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {notebooks.map(notebook => (
                  <tr key={notebook._id}>
                    <td>{notebook.title}</td>
                    <td>{new Date(notebook.createdAt).toLocaleString()}</td>
                    <td>{new Date(notebook.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No notebooks found.</p>
          )}
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
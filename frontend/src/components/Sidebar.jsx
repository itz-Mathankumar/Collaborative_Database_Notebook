import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ user, handleLogout }) => {
  return (
    <nav className="sidebar">
      <h2>Navigate</h2>
      <ul>
        {user ? (
          <>
            <li><Link to="/notebook">Notebook</Link></li>
            <li><button className="btn-logout" onClick={handleLogout}>Logout</button></li>
          </>
        ) : (
          <>
            <li><Link  to="/login">Login</Link></li>
            <li><Link  to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Sidebar;

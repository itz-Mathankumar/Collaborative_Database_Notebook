import React from 'react';

const Header = ({ user, handleLogout }) => (
  <header className="header">
    <div className="container">
      <div className="header-content">
        <nav className="header-nav">
          <ul>
            <li>
            </li>
          </ul>
        </nav>
        <h1 className="header-title">Collaborative Database Notebook</h1>
        <div className="database-selector">
          <span>Database:</span>
          <select>
            <option>MongoDB</option>
          </select>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
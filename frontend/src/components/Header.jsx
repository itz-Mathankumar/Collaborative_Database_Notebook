import React from 'react';
import { Share2 } from 'lucide-react'; // Make sure to import the Share icon

const Header = () => (
  <header className="header">
    <div className="container">
      <div className="header-content">
        <nav className="header-nav">
          <ul style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <li>
              <button style={{ display: 'flex', alignItems: 'center' }}>
                <Share2 size={16} style={{ marginRight: '0.5rem' }} />
                Share
              </button>
            </li>
          </ul>
        </nav>
        <h1 className="header-title">Collaborative Database Notebook</h1>
        <div className="database-selector" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          <span>Database:</span>
          <select style={{ marginLeft: '0.5rem' }}>
            <option>MongoDB</option>
          </select>
        </div>
      </div>
    </div>
  </header>
);

export default Header;

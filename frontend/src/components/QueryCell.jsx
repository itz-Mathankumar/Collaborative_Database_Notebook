import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Trash2, Edit3, Play, Save } from 'lucide-react';

const QueryCell = ({ cell, index, onDelete, onUpdate, onExecute, onMoveUp, onMoveDown }) => {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState(cell.query);

  const handleSave = () => {
    setEditing(false);
    onUpdate(cell.id, query);
  };

  return (
    <div className="cell">
      <div className="cell-header">
        <span className="cell-number">Cell {index + 1}</span>
        <div className="cell-controls">
          <button onClick={onMoveUp}><ChevronUp size={16} /></button>
          <button onClick={onMoveDown}><ChevronDown size={16} /></button>
          <button onClick={() => onDelete(cell.id)}><Trash2 size={16} /></button>
        </div>
      </div>
      {editing ? (
        <div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows="4"
          />
          <div className="cell-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      ) : (
        <div>
          <pre>{query || "No query entered."}</pre>
          <div className="cell-actions">
            <button className="btn btn-primary" onClick={() => onExecute(cell.id, query)}>
              <Play size={16} />
              Run
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Edit3 size={16} />
              Edit
            </button>
          </div>
        </div>
      )}
      {cell.result && (
        <div className="result">
          <div className={`alert ${cell.result.status === 'Pass' ? 'alert-success' : 'alert-error'}`}>
            <div className="alert-icon">
              {cell.result.status === 'Pass' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="alert-content">
              <div className="alert-title">{cell.result.status === 'Pass' ? 'Success' : 'Error'}</div>
              <div>{cell.result.status === 'Pass' ? 'Query executed successfully' : 'An error occurred'}</div>
            </div>
          </div>
          <pre>{JSON.stringify(cell.result.output, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default QueryCell;

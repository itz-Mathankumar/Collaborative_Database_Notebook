import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Trash2, Edit3, Play, Save, ArrowUp, ArrowDown, Plus } from 'lucide-react';

const QueryCell = ({ cell, cellNumber, onDelete, onUpdate, onExecute, onMoveUp, onMoveDown, onInsertCell, isFirst, isLast }) => {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(cell.content);

  const handleSave = () => {
    setEditing(false);
    onUpdate(cell._id, content);
  };

  return (
    <div className="cell">
      <div className="cell-header">
        <span className="cell-number">Cell {cellNumber}</span>
        <div className="cell-controls">
          <button onClick={() => onDelete(cell._id)}><Trash2 size={16} /></button>
          {!isFirst && <button onClick={onMoveUp}><ArrowUp size={16} /></button>}
          {!isLast && <button onClick={onMoveDown}><ArrowDown size={16} /></button>}
        </div>
      </div>
      {editing ? (
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
          <pre>{content || "No query entered."}</pre>
          <div className="cell-actions">
            <button className="btn btn-primary" onClick={() => onExecute(cell._id, content)}>
              <Play size={16} />
              Run
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Edit3 size={16} />
              Edit
            </button>
            <button className="btn btn-secondary" onClick={onInsertCell}>
              <Plus size={16} />
              Insert Cell
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
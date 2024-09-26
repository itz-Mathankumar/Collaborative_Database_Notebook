// src/components/Notebook.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Share2 } from 'lucide-react';
import QueryCell from './QueryCell';
import { mongoDBExecution } from '../utils/mongoDBExecution';

const Notebook = ({ notebooks, onUpdateNotebook }) => {
  const { id } = useParams();
  const [notebook, setNotebook] = useState(null);

  useEffect(() => {
    const currentNotebook = notebooks.find(n => n.id === parseInt(id));
    if (!currentNotebook.cells.length) {
      currentNotebook.cells.push({
        id: Date.now(),
        query: '',
        result: null,
      });
    }
    setNotebook(currentNotebook);
  }, [id, notebooks]);

  const handleAddCell = () => {
    if (notebook) {
      const newCell = {
        id: Date.now(),
        query: '',
        result: null,
      };
      const updatedCells = [...notebook.cells, newCell];
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    }
  };

  const handleInsertCell = (index) => {
    if (notebook) {
      const newCell = {
        id: Date.now(),
        query: '',
        result: null,
      };
      const updatedCells = [...notebook.cells];
      updatedCells.splice(index, 0, newCell); // Insert the new cell at the specified index
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    }
  };

  const handleDeleteCell = (cellId) => {
    if (notebook) {
      const updatedCells = notebook.cells.filter((cell) => cell.id !== cellId);

      // Ensure at least one cell remains
      if (updatedCells.length === 0) {
        updatedCells.push({
          id: Date.now(),
          query: '',
          result: null,
        });
      }

      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    }
  };

  const handleUpdateCell = (cellId, newQuery) => {
    if (notebook) {
      const updatedCells = notebook.cells.map((cell) =>
        cell.id === cellId ? { ...cell, query: newQuery } : cell
      );
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    }
  };

  const handleExecuteCell = async (cellId, query) => {
    try {
      const result = await mongoDBExecution(query);
      const updatedCells = notebook.cells.map((cell) =>
        cell.id === cellId ? { ...cell, result: { status: 'Pass', output: result } } : cell
      );
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    } catch (error) {
      const updatedCells = notebook.cells.map((cell) =>
        cell.id === cellId ? { ...cell, result: { status: 'Fail', output: error.message } } : cell
      );
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    }
  };

  const handleMoveCellUp = (index) => {
    if (index > 0) {
      const updatedCells = [...notebook.cells];
      [updatedCells[index - 1], updatedCells[index]] = [updatedCells[index], updatedCells[index - 1]];
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    }
  };

  const handleMoveCellDown = (index) => {
    if (index < notebook.cells.length - 1) {
      const updatedCells = [...notebook.cells];
      [updatedCells[index], updatedCells[index + 1]] = [updatedCells[index + 1], updatedCells[index]];
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    }
  };

  if (!notebook) {
    return <div>Notebook not found</div>;
  }

  return (
    <div className="notebook-container">
      <div className="notebook-header">
        <h2>{notebook.name}</h2>
        <button className="share-button">
          <Share2 size={16} />
          Share
        </button>
      </div>
      {notebook.cells.map((cell, index) => (
        <div key={cell.id}>
          <QueryCell
            cell={cell}
            index={index}
            onDelete={handleDeleteCell}
            onUpdate={handleUpdateCell}
            onExecute={handleExecuteCell}
            onMoveUp={() => handleMoveCellUp(index)}
            onMoveDown={() => handleMoveCellDown(index)}
          />
          <button className="btn-insert-cell" onClick={() => handleInsertCell(index)}>
            <Plus size={16} />
            Add Cell
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notebook;

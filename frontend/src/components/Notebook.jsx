import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import QueryCell from './QueryCell';

const Notebook = ({ notebooks, onUpdateNotebook }) => {
  const { id } = useParams();
  const [notebook, setNotebook] = useState(null);

  useEffect(() => {
    const currentNotebook = notebooks.find(n => n._id === id);
    setNotebook(currentNotebook);
  }, [id, notebooks]);

  const handleAddCell = async (index) => {
    if (notebook) {
      const newCell = {
        content: '',
      };
      try {
        const response = await fetch(`http://localhost:5000/notebooks/${notebook._id}/cells`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ content: newCell.content }),
        });
        if (!response.ok) throw new Error('Failed to add cell');
        const data = await response.json();
        const updatedCells = [
          ...notebook.cells.slice(0, index + 1),
          data.cell,
          ...notebook.cells.slice(index + 1)
        ];
        const updatedNotebook = { ...notebook, cells: updatedCells };
        setNotebook(updatedNotebook);
        onUpdateNotebook(updatedNotebook);
      } catch (error) {
        console.error('Error adding cell:', error);
      }
    }
  };

  const handleDeleteCell = async (cellId) => {
    if (notebook) {
      try {
        const response = await fetch(`http://localhost:5000/notebooks/${notebook._id}/cells/${cellId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to delete cell');
        const updatedCells = notebook.cells.filter((cell) => cell._id !== cellId);
        const updatedNotebook = { ...notebook, cells: updatedCells };
        setNotebook(updatedNotebook);
        onUpdateNotebook(updatedNotebook);
      } catch (error) {
        console.error('Error deleting cell:', error);
      }
    }
  };

  const handleUpdateCell = async (cellId, newContent) => {
    if (notebook) {
      try {
        const response = await fetch(`http://localhost:5000/notebooks/${notebook._id}/cells/${cellId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ content: newContent }),
        });
        if (!response.ok) throw new Error('Failed to update cell');
        const updatedCells = notebook.cells.map((cell) =>
          cell._id === cellId ? { ...cell, content: newContent } : cell
        );
        const updatedNotebook = { ...notebook, cells: updatedCells };
        setNotebook(updatedNotebook);
        onUpdateNotebook(updatedNotebook);
      } catch (error) {
        console.error('Error updating cell:', error);
      }
    }
  };

  const handleExecuteCell = async (cellId, query) => {
    try {
      const response = await fetch('http://localhost:5000/execute-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ command: query }),
      });
      const data = await response.json();
      const updatedCells = notebook.cells.map((cell) =>
        cell._id === cellId ? { ...cell, result: data } : cell
      );
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    } catch (error) {
      console.error('Error executing query:', error);
      const updatedCells = notebook.cells.map((cell) =>
        cell._id === cellId ? { ...cell, result: { status: 'Fail', output: error.message } } : cell
      );
      const updatedNotebook = { ...notebook, cells: updatedCells };
      setNotebook(updatedNotebook);
      onUpdateNotebook(updatedNotebook);
    }
  };

  const handleMoveCell = (index, direction) => {
    if (notebook) {
      const newIndex = index + direction;
      if (newIndex >= 0 && newIndex < notebook.cells.length) {
        const updatedCells = [...notebook.cells];
        [updatedCells[index], updatedCells[newIndex]] = [updatedCells[newIndex], updatedCells[index]];
        const updatedNotebook = { ...notebook, cells: updatedCells };
        setNotebook(updatedNotebook);
        onUpdateNotebook(updatedNotebook);
      }
    }
  };

  if (!notebook) {
    return <div>Notebook not found</div>;
  }

  return (
    <div className="notebook-container">
      <div className="notebook-header">
        <h2 style={{ textAlign: 'center' }}>{notebook.title}</h2>
        <button className="share-button">
          <Share2 size={16} />
          Share
        </button>
      </div>
      {notebook.cells.length === 0 ? (
        <button className="btn-add-cell" onClick={() => handleAddCell(-1)}>
          Add Cell
        </button>
      ) : (
        notebook.cells.map((cell, index) => (
          <QueryCell
            key={cell._id}
            cell={cell}
            cellNumber={index + 1}
            onDelete={handleDeleteCell}
            onUpdate={handleUpdateCell}
            onExecute={handleExecuteCell}
            onMoveUp={() => handleMoveCell(index, -1)}
            onMoveDown={() => handleMoveCell(index, 1)}
            onInsertCell={() => handleAddCell(index)}
            isFirst={index === 0}
            isLast={index === notebook.cells.length - 1}
          />
        ))
      )}
    </div>
  );
};

export default Notebook;
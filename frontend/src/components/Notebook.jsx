import React, { useState } from 'react';
import Header from './Header';
import QueryCell from './QueryCell';
import { Plus } from 'lucide-react';
import { mongoDBExecution } from '../utils/mongoDBExecution';

const Notebook = () => {
  const [cells, setCells] = useState([{ id: 1, query: '', result: null }]);

  const executeQuery = async (cellId, query) => {
      try {
      const response = await mongoDBExecution(query);
      setCells(prevCells => 
        prevCells.map(cell => 
          cell.id === cellId ? { ...cell, result: { output: response, status: 'Pass' } } : cell
        )
      );
    } catch (error) {
      setCells(prevCells => 
        prevCells.map(cell => 
          cell.id === cellId ? { ...cell, result: { output: error.message, status: 'Fail' } } : cell
        )
      );
    }
  };

  const updateCell = (id, newQuery) => {
    setCells(prevCells =>
      prevCells.map(cell => (cell.id === id ? { ...cell, query: newQuery } : cell))
    );
  };

  const addCell = () => {
    const newCell = { id: Date.now(), query: '', result: null };
    setCells([...cells, newCell]);
  };

  const deleteCell = (id) => {
    setCells(cells.filter(cell => cell.id !== id));
  };

  const moveCell = (id, direction) => {
    const index = cells.findIndex(cell => cell.id === id);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < cells.length - 1)) {
      const newCells = [...cells];
      const adjacentIndex = direction === 'up' ? index - 1 : index + 1;
      [newCells[index], newCells[adjacentIndex]] = [newCells[adjacentIndex], newCells[index]];
      setCells(newCells);
    }
  };

  return (
    <div>
      <Header />
      <div className="container">
        <main className="notebook">
          {cells.map((cell, index) => (
            <QueryCell
              key={cell.id}
              cell={cell}
              index={index}
              onDelete={deleteCell}
              onUpdate={updateCell}
              onExecute={executeQuery}
              onMoveUp={() => moveCell(cell.id, 'up')}
              onMoveDown={() => moveCell(cell.id, 'down')}
            />
          ))}
          <button className="add-cell-btn" onClick={addCell}>
            <Plus size={16} />
            Add Cell
          </button>
        </main>
      </div>
    </div>
  );
};

export default Notebook;

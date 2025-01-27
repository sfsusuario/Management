import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/outline';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const getColorPriority = (color, defaultColors) => {
  const index = defaultColors.indexOf(color);
  return index === -1 ? defaultColors.length : index; // If color not found, lowest priority
};

const compareDates = (dateA, dateB) => {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  return new Date(dateA) - new Date(dateB);
};

const sortCards = (cards, defaultColors) => {
  return [...cards].sort((a, b) => {
    // First priority: Archived status
    if (a.archived !== b.archived) {
      return a.archived ? 1 : -1;
    }
    
    // Second priority: Compare colors based on defaultColors order
    const colorDiff = getColorPriority(a.color, defaultColors) - getColorPriority(b.color, defaultColors);
    if (colorDiff !== 0) return colorDiff;
    
    // Third priority: Compare due dates
    return compareDates(a.dueDate, b.dueDate);
  });
};

// Add reorder helper function
const reorderColumns = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const Management = () => {
  const defaultColors = [
    '#FF5252', // red - highest priority
    '#FF4081', // pink
    '#7C4DFF', // purple
    '#448AFF', // blue
    '#64FFDA', // teal
    '#FFD740', // amber - lowest priority
  ];

  // Add new state for projects
  const [projects, setProjects] = useState([
    { id: 1, name: 'Default Project' }
  ]);

  // Add project to column model
  const [columns, setColumns] = useState([
    { 
      id: 1, 
      title: 'To Do',
      projectId: 1,
      cards: [{ 
        id: 1, 
        title: 'Task 1',
        color: defaultColors[0],
        dueDate: null,
        notes: '',
        archived: false,
        progress: 0 // Add progress property
      }] 
    }
  ]);

  const [expandedCards, setExpandedCards] = useState({});
  const [showArchived, setShowArchived] = useState(false);
  const [showTop10, setShowTop10] = useState(true);
  const [expandedTopCards, setExpandedTopCards] = useState({});

  // Add new state for project filtering
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Add new states
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const addColumn = () => {
    const newColumn = {
      id: Date.now(),
      title: 'New Column',
      cards: []
    };
    setColumns([...columns, newColumn]);
  };

  const addCard = (columnId) => {
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        const newCard = { 
          id: Date.now(), 
          title: 'New Card',
          color: defaultColors[0],
          dueDate: null,
          notes: '', // Add notes field
          archived: false,
          progress: 0 // Add progress property
        };
        return { ...column, cards: [...column.cards, newCard] };
      }
      return column;
    }));
  };

  const updateCardTitle = (columnId, cardId, newTitle) => {
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        const updatedCards = column.cards.map(card => {
          if (card.id === cardId) {
            return { ...card, title: newTitle };
          }
          return card;
        });
        return { ...column, cards: updatedCards };
      }
      return column;
    }));
  };

  const updateCardColor = (columnId, cardId, newColor) => {
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        const updatedCards = column.cards.map(card => {
          if (card.id === cardId) {
            return { ...card, color: newColor };
          }
          return card;
        });
        return { ...column, cards: updatedCards };
      }
      return column;
    }));
  };

  const updateCardDueDate = (columnId, cardId, newDate) => {
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        const updatedCards = column.cards.map(card => {
          if (card.id === cardId) {
            return { ...card, dueDate: newDate };
          }
          return card;
        });
        return { ...column, cards: updatedCards };
      }
      return column;
    }));
  };

  const archiveCard = (columnId, cardId) => {
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        const updatedCards = column.cards.map(card => {
          if (card.id === cardId) {
            return { ...card, archived: true };
          }
          return card;
        });
        return { ...column, cards: updatedCards };
      }
      return column;
    }));
  };

  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diff < 0) return 'Expired';
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Less than 1h remaining';
  };

  // Add new function to update column title
  const updateColumnTitle = (columnId, newTitle) => {
    setColumns(columns.map(column => 
      column.id === columnId 
        ? { ...column, title: newTitle }
        : column
    ));
  };

  // Add helper function for date formatting
  const formatDueDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add toggle function:
  const toggleCardOptions = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const getFilteredAndSortedCards = (cards, defaultColors) => {
    return sortCards(cards, defaultColors).filter(card => !card.archived || showArchived);
  };

  const expandAll = () => {
    const expandedState = {};
    columns.forEach(column => {
      column.cards.forEach(card => {
        expandedState[card.id] = true;
      });
    });
    setExpandedCards(expandedState);
  };

  const collapseAll = () => {
    setExpandedCards({});
  };

  // Add notes update function
  const updateCardNotes = (columnId, cardId, newNotes) => {
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        const updatedCards = column.cards.map(card => {
          if (card.id === cardId) {
            return { ...card, notes: newNotes };
          }
          return card;
        });
        return { ...column, cards: updatedCards };
      }
      return column;
    }));
  };

  // Add function to get top 10 cards with project filtering
  const getTop10Cards = () => {
    const allCards = columns
      .filter(column => !selectedProjectId || column.projectId === selectedProjectId)
      .flatMap(column => 
        column.cards.map(card => ({
          ...card,
          columnId: column.id,
          columnTitle: column.title,
          projectId: column.projectId
        }))
      );
  
    return sortCards(allCards, defaultColors)
      .filter(card => !card.archived)
      .slice(0, 10);
  };

  // Add toggle function for top cards
  const toggleTopCardNotes = (cardId) => {
    setExpandedTopCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Add new function to locate and highlight card
  const locateCard = (cardId, columnId) => {
    // Collapse all cards except target
    const newExpandedState = {};
    newExpandedState[cardId] = true;
    setExpandedCards(newExpandedState);

    // Wait for next render then scroll and highlight
    setTimeout(() => {
      const cardElement = document.getElementById(`card-${cardId}`);
      const columnElement = document.getElementById(`column-${columnId}`);
      
      if (cardElement && columnElement) {
        columnElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        cardElement.classList.add('highlight-card');
        
        // Remove highlight after animation
        setTimeout(() => {
          cardElement.classList.remove('highlight-card');
        }, 2000);
      }
    }, 100);
  };

  // Add project management functions
  const addProject = (name) => {
    if (!name.trim()) return;
    setProjects([...projects, { id: Date.now(), name }]);
  };

  const updateColumnProject = (columnId, projectId) => {
    setColumns(columns.map(column => 
      column.id === columnId 
        ? { ...column, projectId } 
        : column
    ));
  };

  // Add filter function
  const getFilteredColumns = () => {
    if (!selectedProjectId) return columns;
    return columns.filter(col => col.projectId === selectedProjectId);
  };

  // Add delete column function
  const deleteColumn = (columnId) => {
    if (window.confirm('Are you sure you want to delete this column and all its cards?')) {
      setColumns(columns.filter(column => column.id !== columnId));
    }
  };

  const toggleCardArchive = (columnId, cardId) => {
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        const updatedCards = column.cards.map(card => {
          if (card.id === cardId) {
            return { ...card, archived: !card.archived };
          }
          return card;
        });
        return { ...column, cards: updatedCards };
      }
      return column;
    }));
  };

  // Add rename project function
  const renameProject = (projectId, newName) => {
    if (!newName.trim()) return;
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, name: newName } : p
    ));
  };

  // Add helper function to get project name
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'No Project';
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = reorderColumns(
      columns,
      result.source.index,
      result.destination.index
    );
    
    setColumns(items);
  };

  // Add progress update function
  const updateCardProgress = (columnId, cardId, progress) => {
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        const updatedCards = column.cards.map(card => {
          if (card.id === cardId) {
            return { ...card, progress: parseInt(progress) };
          }
          return card;
        });
        return { ...column, cards: updatedCards };
      }
      return column;
    }));
  };

  // Add progress bar component
  const ProgressBar = ({ progress }) => {
    if (progress <= 0) return null;
    
    return (
      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  // Add save/load functions
  const saveToLocalStorage = async () => {
    setIsSaving(true);
    const data = {
      projects,
      columns,
      expandedCards,
      showArchived,
      showTop10,
      selectedProjectId
    };
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      localStorage.setItem('managementBoardData', JSON.stringify(data));
      setLastSaved(new Date().toLocaleTimeString());
    } finally {
      setIsSaving(false);
    }
  };

  // Add load function
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('managementBoardData');
    if (saved) {
      const data = JSON.parse(saved);
      setProjects(data.projects);
      setColumns(data.columns);
      setExpandedCards(data.expandedCards);
      setShowArchived(data.showArchived);
      setShowTop10(data.showTop10);
      setSelectedProjectId(data.selectedProjectId);
    }
  };

  // Add export function
  const exportData = () => {
    const data = {
      projects,
      columns,
      expandedCards,
      showArchived,
      showTop10,
      selectedProjectId
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `management-board-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add import function
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setProjects(data.projects);
          setColumns(data.columns);
          setExpandedCards(data.expandedCards);
          setShowArchived(data.showArchived);
          setShowTop10(data.showTop10);
          setSelectedProjectId(data.selectedProjectId);
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  // Add useEffect for auto-save
  useEffect(() => {
    // Load initial data
    loadFromLocalStorage();
    
    // Setup auto-save interval
    const interval = setInterval(() => {
      saveToLocalStorage();
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  // Add delete card permanently function
  const deleteCardPermanently = (columnId, cardId) => {
    if (!window.confirm('Are you sure you want to permanently delete this card?')) {
      return;
    }
    
    setColumns(columns.map(column => {
      if (column.id === columnId) {
        return {
          ...column,
          cards: column.cards.filter(card => card.id !== cardId)
        };
      }
      return column;
    }));
  };

  return (
    <div className="p-6">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Management Board</h1>
          
          {/* Project Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedProjectId(null)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                !selectedProjectId 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Projects
            </button>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}
              className="text-sm bg-white border border-gray-200 rounded px-2 py-1 
                       hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Filter by Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add new control section */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 
                       transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </label>
            <button
              onClick={exportData}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 
                       transition-colors flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              onClick={saveToLocalStorage}
              disabled={isSaving}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 
                       transition-colors flex items-center gap-1 relative"
            >
              {isSaving ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              Save
              {lastSaved && (
                <span className="text-xs opacity-75 ml-2">
                  Last: {lastSaved}
                </span>
              )}
            </button>
          </div>
          {/* ...existing controls... */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 
                       transition-colors flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 
                       transition-colors flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Collapse All
            </button>
          </div>

          {/* Existing Toggles */}
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded text-blue-500"
            />
            <span className="text-sm text-gray-600">Show archived</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={showTop10} 
              onChange={(e) => setShowTop10(e.target.checked)}
              className="rounded text-blue-500"
            />
            <span className="text-sm text-gray-600">Show Top 10</span>
          </label>
        </div>
      </div>

      {/* Board Layout */}
      <div className="flex gap-4">
        {/* Fixed Top 10 Section */}
        {showTop10 && (
          <div className="flex-none w-80 sticky top-6">
            <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg p-4">
              <h3 className="font-bold text-blue-800 mb-3">Top 10 Priority Tasks</h3>
              <div className="space-y-2">
                {getTop10Cards().map(card => (
                  <div 
                    key={card.id} 
                    className="bg-white rounded shadow-sm overflow-hidden border-l-4"
                    style={{ borderLeftColor: card.color }}
                  >
                    <div className="p-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <div className="text-xs">
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {getProjectName(card.projectId)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              From: {card.columnTitle}
                            </div>
                            <div className="font-medium mt-1">
                              {card.title}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => locateCard(card.id, card.columnId)}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                              title="Locate in board"
                            >
                              <svg 
                                className="h-4 w-4 text-gray-500" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleTopCardNotes(card.id)}
                              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <svg 
                                className={`h-4 w-4 text-gray-500 transform transition-transform ${
                                  expandedTopCards[card.id] ? 'rotate-180' : ''
                                }`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {card.dueDate && (
                          <div className="text-xs text-gray-600 mt-1">
                            Due: {new Date(card.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedTopCards[card.id] ? 'max-h-32 opacity-100 mt-2' : 'max-h-0 opacity-0'
                        }`}>
                          {card.notes ? (
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {card.notes}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 italic">
                              No notes available
                            </div>
                          )}
                        </div>
                        {card.progress > 0 && (
                          <div className="mt-2">
                            <ProgressBar progress={card.progress} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Columns Section */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="columns" direction="horizontal">
            {(provided) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 overflow-x-auto pb-4"
              >
                {/* Draggable Columns */}
                {getFilteredColumns().map((column, index) => (
                  <Draggable 
                    key={column.id} 
                    draggableId={column.id.toString()} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex-none w-80 bg-gray-100 rounded-lg p-4 ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div 
                            {...provided.dragHandleProps}
                            className="cursor-move p-1 hover:bg-gray-200 rounded"
                          >
                            <svg 
                              className="h-4 w-4 text-gray-400" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M4 8h16M4 16h16" 
                              />
                            </svg>
                          </div>
                          <input
                            value={column.title}
                            onChange={(e) => updateColumnTitle(column.id, e.target.value)}
                            className="font-semibold text-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                          />
                          <button
                            onClick={() => deleteColumn(column.id)}
                            className="p-1.5 hover:bg-red-100 rounded-full transition-colors group"
                            title="Delete column"
                          >
                            <svg 
                              className="h-4 w-4 text-gray-400 group-hover:text-red-500" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                              />
                            </svg>
                          </button>
                        </div>
                        {/* Project selector - more minimal design */}
                        <div className="relative group">
                          <select
                            value={column.projectId || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === 'new') {
                                const name = prompt('Enter new project name:');
                                if (name) {
                                  const newProject = { id: Date.now(), name };
                                  setProjects([...projects, newProject]);
                                  updateColumnProject(column.id, newProject.id);
                                }
                              } else if (value.startsWith('rename_')) {
                                const projectId = Number(value.replace('rename_', ''));
                                const project = projects.find(p => p.id === projectId);
                                if (project) {
                                  const newName = prompt('Enter new project name:', project.name);
                                  if (newName && newName !== project.name) {
                                    renameProject(projectId, newName);
                                  }
                                }
                                // Reset select to current project
                                e.target.value = column.projectId || '';
                              } else {
                                updateColumnProject(column.id, Number(value));
                              }
                            }}
                            className="w-full text-xs bg-transparent border-none hover:bg-gray-200 
                                     rounded px-2 py-1 focus:outline-none focus:ring-1 
                                     focus:ring-blue-500 cursor-pointer appearance-none"
                          >
                            <option value="" className="text-gray-400">📂 Select Project...</option>
                            {projects.map(project => (
                              <optgroup key={project.id} label="─────────────">
                                <option value={project.id}>📁 {project.name}</option>
                                <option value={`rename_${project.id}`} className="text-blue-500">
                                  ✏️ Rename "{project.name}"
                                </option>
                              </optgroup>
                            ))}
                            <option value="new" className="font-medium text-blue-500">
                              ➕ Add New Project...
                            </option>
                          </select>
                          
                          {/* Custom dropdown arrow */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg 
                              className="h-4 w-4 text-gray-400" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {/* Separator and spacing */}
                        <div className="h-px bg-gray-200 my-4"></div>
                        {/* Existing cards section */}
                        <div className="space-y-2">
                          {getFilteredAndSortedCards(column.cards, defaultColors).map(card => (
                            <div 
                              id={`card-${card.id}`}
                              key={card.id} 
                              className={`bg-white rounded shadow-sm overflow-hidden ${
                                card.archived ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="h-2" style={{ backgroundColor: card.color }} />
                              <div className="p-3">
                                <div className="flex justify-between items-center">
                                  <input
                                    value={card.title}
                                    onChange={(e) => updateCardTitle(column.id, card.id, e.target.value)}
                                    className="w-full border-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                                  />
                                  <div className="flex items-center gap-2">
                                    {card.archived ? (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => toggleCardArchive(column.id, card.id)}
                                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                          title="Restore task"
                                        >
                                          <svg 
                                            className="h-5 w-5 text-green-500 hover:text-green-600" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                          >
                                            <path 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round" 
                                              strokeWidth={2} 
                                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                            />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => deleteCardPermanently(column.id, card.id)}
                                          className="p-1 hover:bg-red-100 rounded-full transition-colors"
                                          title="Delete permanently"
                                        >
                                          <svg 
                                            className="h-5 w-5 text-red-500 hover:text-red-600" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                          >
                                            <path 
                                              strokeLinecap="round" 
                                              strokeLinejoin="round" 
                                              strokeWidth={2} 
                                              d="M6 18L18 6M6 6l12 12" 
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => toggleCardArchive(column.id, card.id)}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        title="Archive task"
                                      >
                                        <svg 
                                          className="h-5 w-5 text-gray-500 hover:text-gray-600" 
                                          fill="none" 
                                          viewBox="0 0 24 24" 
                                          stroke="currentColor"
                                        >
                                          <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                          />
                                        </svg>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => toggleCardOptions(card.id)}
                                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                      <svg className={`h-5 w-5 text-gray-500 transform transition-transform ${expandedCards[card.id] ? 'rotate-180' : ''}`} 
                                           fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Due date notification - Always visible */}
                                {card.dueDate && (
                                  <div className={`mt-2 flex items-center gap-2 text-sm rounded-md p-2
                                    ${getTimeRemaining(card.dueDate) === 'Expired' 
                                      ? 'bg-red-50 text-red-600' 
                                      : 'bg-blue-50 text-blue-600'}`}>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{formatDueDate(card.dueDate)}</span>
                                      <span className="text-xs opacity-75">{getTimeRemaining(card.dueDate)}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Show progress bar if progress > 0 and card is collapsed */}
                                {!expandedCards[card.id] && card.progress > 0 && (
                                  <div className="mt-2">
                                    <ProgressBar progress={card.progress} />
                                  </div>
                                )}

                                {/* Collapsible options */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                  expandedCards[card.id] ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
                                }`}>
                                  <div className="space-y-3">
                                    {/* Date picker */}
                                    <div className="flex items-center gap-2">
                                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <input
                                        type="datetime-local"
                                        value={card.dueDate || ''}
                                        onChange={(e) => updateCardDueDate(column.id, card.id, e.target.value)}
                                        className="text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1 
                                                 hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500
                                                 transition-all duration-200 w-full cursor-pointer"
                                      />
                                    </div>

                                    {/* Color picker */}
                                    <div className="flex gap-1">
                                      {defaultColors.map(color => (
                                        <button
                                          key={color}
                                          onClick={() => updateCardColor(column.id, card.id, color)}
                                          className="w-6 h-6 rounded-full border-2 border-white hover:scale-110 transition-transform"
                                          style={{ backgroundColor: color }}
                                        />
                                      ))}
                                    </div>

                                    {/* Add notes textarea */}
                                    <div className="mt-3">
                                      <textarea
                                        value={card.notes || ''}
                                        onChange={(e) => updateCardNotes(column.id, card.id, e.target.value)}
                                        placeholder="Add notes..."
                                        className="w-full min-h-[80px] text-sm bg-gray-50 border border-gray-200 
                                                 rounded px-2 py-1 hover:border-blue-400 focus:outline-none 
                                                 focus:ring-1 focus:ring-blue-500 transition-all duration-200 
                                                 resize-none"
                                      />
                                    </div>

                                    {/* Add progress slider */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>Progress</span>
                                        <span>{card.progress}%</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={card.progress}
                                        onChange={(e) => updateCardProgress(column.id, card.id, e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addCard(column.id)}
                          className="w-full mt-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          + Add Card
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Add Column Button */}
                <div className="flex-none w-80 flex items-start">
                  <button
                    onClick={addColumn}
                    className="w-full mt-2 p-3 bg-gray-100 hover:bg-gray-200 
                             text-gray-600 rounded-lg transition-colors duration-200
                             flex items-center justify-center gap-2"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Column
                  </button>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default Management;
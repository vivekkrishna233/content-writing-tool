import { useState, useEffect } from 'react';

export default function HistoryManager({
  content,
  setContent,
  cursorPosition,
  setCursorPosition,
  contentUpdateRef // Changed from setContentUpdateRef to contentUpdateRef
}) {
  const [history, setHistory] = useState([{ content: '', cursorPosition: 0 }]);
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSavedContent, setLastSavedContent] = useState('<p>Start typing here...</p>');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState(null);
  
  // Maximum history steps to store
  const MAX_HISTORY = 50;
  
  // Debounce content changes to group related operations
  useEffect(() => {
    // Skip initial render
    if (content === history[0].content) return;
    
    // Group typing operations with debounce
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    
    if (isTyping) {
      // Update the last saved content for comparison
      setLastSavedContent(content);
    } else {
      setIsTyping(true);
    }
    
    // Save history after typing stops
    const timer = setTimeout(() => {
      saveHistory(content, cursorPosition);
      setIsTyping(false);
    }, 500); // 500ms debounce
    
    setTypingTimer(timer);
    
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [content]);
  
  // Handle keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeydown = (e) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [currentStep, history]);
  
  // Save state to history
  const saveHistory = (newContent, newCursorPosition) => {
    // Don't save if content hasn't changed
    if (newContent === lastSavedContent) return;
    
    // Create new history entry
    const newEntry = {
      content: newContent,
      cursorPosition: newCursorPosition
    };
    
    // If we're not at the latest history step, remove future history
    const newHistory = history.slice(0, currentStep + 1);
    
    // Add new entry and trim history if too large
    newHistory.push(newEntry);
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
    setLastSavedContent(newContent);
  };
  
  // Undo operation
  const undo = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      const prevState = history[prevStep];
      
      // Update content and cursor position
      setContent(prevState.content);
      
      // Properly update the ref by setting its current property
      if (contentUpdateRef && typeof contentUpdateRef === 'object') {
        contentUpdateRef.current = true;
      }
      
      setCursorPosition(prevState.cursorPosition);
      setCurrentStep(prevStep);
    }
  };
  
  // Redo operation
  const redo = () => {
    if (currentStep < history.length - 1) {
      const nextStep = currentStep + 1;
      const nextState = history[nextStep];
      
      // Update content and cursor position
      setContent(nextState.content);
      
      // Properly update the ref by setting its current property
      if (contentUpdateRef && typeof contentUpdateRef === 'object') {
        contentUpdateRef.current = true;
      }
      
      setCursorPosition(nextState.cursorPosition);
      setCurrentStep(nextStep);
    }
  };
  
  // Force save for significant operations like component insertion
  const forceSave = () => {
    saveHistory(content, cursorPosition);
  };
  
  return (
    <div className="history-controls">
      <button 
        className="toolbar-btn" 
        onClick={undo} 
        disabled={currentStep === 0}
        title="Undo (Ctrl+Z)"
      >
        ↩️
      </button>
      <button 
        className="toolbar-btn" 
        onClick={redo} 
        disabled={currentStep === history.length - 1}
        title="Redo (Ctrl+Y)"
      >
        ↪️
      </button>
    </div>
  );
}
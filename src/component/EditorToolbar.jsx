import { useState, useRef } from 'react';
import { Bold, Italic, Underline, List, Code, Quote, Heading1, Heading2 } from 'lucide-react';
import HistoryManager from './component/HistoryManager';

export default function EditorToolbar({ 
  editorRef, 
  content, 
  setContent, 
  cursorPosition, 
  setCursorPosition, 
  setContentUpdateRef 
}) {
  // Format selected text
  const formatText = (command, value = null) => {
    // Save selection before formatting
    const selection = window.getSelection();
    const range = selection.getRangeAt(0).cloneRange();
    
    // Apply formatting command
    document.execCommand(command, false, value);
    
    // Focus back on the editor immediately
    editorRef.current?.focus();
    
    // Restore selection if needed
    if (selection.rangeCount === 0) {
      selection.addRange(range);
    }
    
    // Trigger input event to update state
    if (editorRef.current) {
      const event = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(event);
    }
  };

  return (
    <div className="editor-toolbar">
      <button className="toolbar-btn" onClick={() => formatText('bold')}>
        <Bold size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('italic')}>
        <Italic size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('underline')}>
        <Underline size={16} />
      </button>
      <span className="toolbar-divider"></span>
      <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<h1>')}>
        <Heading1 size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<h2>')}>
        <Heading2 size={16} />
      </button>
      <span className="toolbar-divider"></span>
      <button className="toolbar-btn" onClick={() => formatText('insertUnorderedList')}>
        <List size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<pre>')}>
        <Code size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<blockquote>')}>
        <Quote size={16} />
      </button>
      
      {/* Reintegrated History Manager to restore undo/redo functionality */}
      <HistoryManager
        content={content}
        setContent={setContent}
        cursorPosition={cursorPosition}
        setCursorPosition={setCursorPosition}
        setContentUpdateRef={setContentUpdateRef}
      />
    </div>
  );
}
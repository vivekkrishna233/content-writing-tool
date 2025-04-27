import { useState, useEffect, useRef } from 'react';
import './RichTextEditor.css';
import { Bold, Italic, Underline, List, Code, Quote, Heading1, Heading2 } from 'lucide-react';
import ClipboardHandler from './component/ClipboardHandler';
import KeyboardShortcuts from './component/KeyboardShortcuts';
import HistoryManager from './component/HistoryManager';
import MentionSystem from './component/MentionSystem';
import ComponentMenu from './component/ComponentMenu';
import ComponentRenderer from './component/ComponentRenderer';
import ComponentPropertiesModal from './component/ComponentPropertiesModal';
import FormatMenu from './component/FormatMenu';

export default function RichTextEditor() {
  const [content, setContent] = useState('<p>Start typing here...</p>');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState({ top: 0, left: 0 });
  const [componentMenuPosition, setComponentMenuPosition] = useState({ top: 0, left: 0 });
  const [showComponentMenu, setShowComponentMenu] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [componentPropsMenu, setComponentPropsMenu] = useState(false);
  const [components, setComponents] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isPlaceholderActive, setIsPlaceholderActive] = useState(true);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [contentUpdateRef, setContentUpdateRef] = useState({ current: false });
  const editorRef = useRef(null);
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.format-menu') === null) {
        setShowFormatMenu(false);
      }
      if (event.target.closest('.component-menu') === null) {
        setShowComponentMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Format selected text
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    
    // Update content state after formatting
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      
      // Store cursor position
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const newPos = getCharacterOffsetWithin(editorRef.current, range);
        setCursorPosition(newPos);
      }
    }
    
    // Focus back on the editor
    editorRef.current?.focus();
  };
  
  // Calculate character offset within an element
  const getCharacterOffsetWithin = (containerNode, range) => {
    let charCount = 0;
    const walker = document.createTreeWalker(
      containerNode, 
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null, 
      false
    );
    
    // Walk the tree until we find the node containing the selection
    let node;
    while ((node = walker.nextNode())) {
      if (range.startContainer === node) {
        charCount += range.startOffset;
        break;
      } else if (node.nodeType === Node.TEXT_NODE) {
        charCount += node.length;
      } else if (node.nodeName === 'BR') {
        charCount += 1;
      }
    }
    
    return charCount;
  };
  
  // Insert custom component
  const insertComponent = (type) => {
    const newComponent = {
      id: `component-${components.length + 1}`,
      type,
      position: { x: componentMenuPosition.left, y: componentMenuPosition.top },
      properties: getDefaultPropertiesForType(type)
    };
    
    setComponents([...components, newComponent]);
    setShowComponentMenu(false);
  };
  
  const getDefaultPropertiesForType = (type) => {
    switch (type) {
      case 'Button':
        return { text: 'Click me', color: '#3182ce', action: 'alert("Button clicked")' };
      case 'Callout':
        return { text: 'Important note', type: 'info' };
      case 'Code':
        return { language: 'javascript', code: '// Your code here' };
      case 'Quote':
        return { text: 'Quote text here', author: 'Author Name' };
      default:
        return {};
    }
  };
  
  // Update component properties
  const updateComponentProperty = (id, property, value) => {
    setComponents(components.map(component => 
      component.id === id ? { ...component, properties: { ...component.properties, [property]: value } } : component
    ));
  };
  
  // Show component menu at right-click position
  const handleContextMenu = (e) => {
    e.preventDefault();
    setComponentMenuPosition({ top: e.clientY, left: e.clientX });
    setShowComponentMenu(true);
  };
  
  // Start dragging a component
  const startDrag = (e, component) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedComponent(component);
  };
  
  // Update component position during drag
  const handleDrag = (e) => {
    if (isDragging && draggedComponent) {
      setComponents(components.map(component => 
        component.id === draggedComponent.id 
          ? { ...component, position: { x: e.clientX, y: e.clientY } } 
          : component
      ));
    }
  };
  
  // End dragging
  const endDrag = () => {
    setIsDragging(false);
    setDraggedComponent(null);
  };
  
  // Handle text selection
  const handleSelection = (show = true) => {
    setShowFormatMenu(show);
  };
  
  // Handle editor input and preserve cursor position
  const handleEditorInput = (e) => {
    // Store cursor position before updating state
    const cursorPos = saveCurrentCursorPosition();
    const editorContent = e.currentTarget.innerHTML;
    
    // Check if the content is empty or just contains empty paragraphs/line breaks
    const strippedContent = editorContent.replace(/<[^>]*>/g, '').trim();
    
    // Only remove placeholder on actual content
    if (isPlaceholderActive && strippedContent !== '' && strippedContent !== 'Start typing here...') {
      setIsPlaceholderActive(false);
      setContent(editorContent);
      
      if (cursorPos !== null) {
        setContentUpdateRef({ current: true });
        setCursorPosition(cursorPos);
      }
    } else if (!isPlaceholderActive && strippedContent === '') {
      // If content is empty after backspace, reset to placeholder
      setIsPlaceholderActive(true);
      setContent('<p>Start typing here...</p>');
      
      // Position cursor at beginning of placeholder
      setContentUpdateRef({ current: true });
      setCursorPosition(0);
    } else {
      // Normal content update
      setContent(editorContent);
      
      if (cursorPos !== null) {
        setContentUpdateRef({ current: true });
        setCursorPosition(cursorPos);
      }
    }
  };
  
  // Calculate current cursor position
  const saveCurrentCursorPosition = () => {
    try {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return null;
      
      const range = selection.getRangeAt(0);
      if (!range.collapsed) return null; // Don't save if there's a selection
      
      // Get the character offset from the start of the editor
      const editorNode = editorRef.current;
      const charCount = getCharacterOffsetWithin(editorNode, range);
      return charCount;
    } catch (e) {
      console.error("Error saving cursor position:", e);
      return null;
    }
  };
  
  // Handle focus on editor
  const handleEditorFocus = () => {
    if (isPlaceholderActive) {
      // When editor gets focus and placeholder is showing
      const selection = window.getSelection();
      const range = document.createRange();
      
      if (editorRef.current && editorRef.current.firstChild) {
        if (editorRef.current.firstChild.firstChild) {
          range.setStart(editorRef.current.firstChild.firstChild, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  };
  
  // Handle keydown events including Enter key
  const handleKeyDown = (e) => {
    // Handle the Enter key to insert a new line
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Insert a new paragraph at cursor position
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // If placeholder is active, clear it first
      if (isPlaceholderActive) {
        setIsPlaceholderActive(false);
        setContent('<p><br></p>');
        
        // Position cursor in the new paragraph
        setContentUpdateRef({ current: true });
        setCursorPosition(0);
        return;
      }
      
      // Create a new paragraph element
      const newParagraph = document.createElement('p');
      newParagraph.innerHTML = '<br>';
      
      // Split the current paragraph at the cursor position
      const currentNode = range.startContainer;
      let currentParagraph = currentNode;
      
      // Find the closest paragraph parent
      while (currentParagraph && currentParagraph.nodeName !== 'P') {
        currentParagraph = currentParagraph.parentNode;
        if (currentParagraph === editorRef.current) {
          currentParagraph = null;
          break;
        }
      }
      
      if (currentParagraph) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
          // Split text node
          const textBeforeCursor = currentNode.textContent.substring(0, range.startOffset);
          const textAfterCursor = currentNode.textContent.substring(range.startOffset);
          
          if (textAfterCursor) {
            // If there's text after cursor, move it to the new paragraph
            currentNode.textContent = textBeforeCursor;
            
            const textNode = document.createTextNode(textAfterCursor);
            newParagraph.innerHTML = ''; // Clear the <br>
            newParagraph.appendChild(textNode);
          }
        }
        
        // Insert the new paragraph after the current one
        if (currentParagraph.nextSibling) {
          editorRef.current.insertBefore(newParagraph, currentParagraph.nextSibling);
        } else {
          editorRef.current.appendChild(newParagraph);
        }
        
        // Update content and set cursor in the new paragraph
        const newContent = editorRef.current.innerHTML;
        setContent(newContent);
        
        // Calculate new cursor position
        const newCursorPos = getCharacterOffsetWithin(editorRef.current, document.createRange());
        setContentUpdateRef({ current: true });
        setCursorPosition(newCursorPos);
      }
    }
  };
  
  // Handle mouse up event to show format menu
  const onMouseUp = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setFormatMenuPosition({
        top: rect.top - 40,
        left: rect.left
      });
      handleSelection(true);
    } else {
      handleSelection(false);
    }
  };

  return (
    <div 
      className={`editor-container ${darkMode ? 'dark' : ''}`}
      onMouseMove={handleDrag}
      onMouseUp={endDrag}
    >
      <div className="editor-header">
        <h1 className="editor-title">Advanced Content Editor</h1>
        <button 
          className="theme-toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      
      {/* Editor Toolbar */}
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
        
        {/* History Manager integrated into toolbar */}
        <HistoryManager
          content={content}
          setContent={setContent}
          cursorPosition={cursorPosition}
          setCursorPosition={setCursorPosition}
          setContentUpdateRef={setContentUpdateRef}
        />
      </div>
      
      <div className="editor-content-wrapper">
        <div 
          ref={editorRef}
          contentEditable
          className={`editor-content ${isPlaceholderActive ? 'placeholder-active' : ''}`}
          onMouseUp={onMouseUp}
          onContextMenu={handleContextMenu}
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={handleEditorInput}
          onFocus={handleEditorFocus}
          onKeyDown={handleKeyDown}
        />
      </div>
      
      {/* Clipboard Handler */}
      <ClipboardHandler
        editorRef={editorRef}
        setContent={setContent}
        setCursorPosition={setCursorPosition}
        setContentUpdateRef={setContentUpdateRef}
      />
      
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        editorRef={editorRef}
        content={content}
        setContent={setContent}
        components={components}
        setComponents={setComponents}
        insertComponent={insertComponent}
        setShowComponentMenu={setShowComponentMenu}
        setComponentMenuPosition={setComponentMenuPosition}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      
      {/* Mention System */}
      <MentionSystem
        editorRef={editorRef}
        content={content}
        setContent={setContent}
        cursorPosition={cursorPosition}
        setCursorPosition={setCursorPosition}
        setContentUpdateRef={setContentUpdateRef}
        darkMode={darkMode}
      />
      
      {/* Format Menu */}
      {showFormatMenu && (
        <FormatMenu 
          position={formatMenuPosition}
          setShowFormatMenu={setShowFormatMenu}
        />
      )}
      
      {/* Component Menu */}
      {showComponentMenu && (
        <ComponentMenu 
          position={componentMenuPosition}
          insertComponent={insertComponent}
          setShowComponentMenu={setShowComponentMenu}
        />
      )}
      
      {/* Render all components */}
      {components.map(component => (
        <div 
          key={component.id}
          className="component-wrapper"
          style={{ 
            top: component.position.y, 
            left: component.position.x,
            cursor: isDragging && draggedComponent?.id === component.id ? 'grabbing' : 'default'
          }}
        >
          <ComponentRenderer 
            component={component} 
            startDrag={startDrag}
            setSelectedComponent={setSelectedComponent}
            setComponentPropsMenu={setComponentPropsMenu}
          />
        </div>
      ))}
      
      {/* Component Properties Modal */}
      {componentPropsMenu && (
        <ComponentPropertiesModal 
          selectedComponent={selectedComponent}
          updateComponentProperty={updateComponentProperty}
          setComponentPropsMenu={setComponentPropsMenu}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
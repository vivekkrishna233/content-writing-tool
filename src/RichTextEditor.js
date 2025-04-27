import { useState, useEffect, useRef } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, Type, Code, Quote, 
  Heading1, Heading2, AlignLeft, AlignCenter, AlignRight 
} from 'lucide-react';
import './RichTextEditor.css';
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
  const [isPlaceholderActive, setIsPlaceholderActive] = useState(true);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [contentUpdateRef, setContentUpdateRef] = useState({ current: false });
  const [fontSize, setFontSize] = useState("11");
  const [fontFamily, setFontFamily] = useState("Arial");
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
  const editorRef = useRef(null);
  
  // Keep cursor position consistent after content updates
  useEffect(() => {
    if (contentUpdateRef.current && cursorPosition !== null && editorRef.current) {
      restoreCursorPosition(cursorPosition);
      setContentUpdateRef({ current: false });
    }
  }, [content, cursorPosition, contentUpdateRef]);
  
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
  
  // Restore cursor to a specific position
  const restoreCursorPosition = (position) => {
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      
      // Find the position within the text nodes
      let currentPos = 0;
      const findPos = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (currentPos + node.length >= position) {
            range.setStart(node, position - currentPos);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            return true;
          }
          currentPos += node.length;
        } else if (node.nodeName === 'BR') {
          currentPos += 1;
        } else if (node.childNodes && node.childNodes.length > 0) {
          for (let i = 0; i < node.childNodes.length; i++) {
            if (findPos(node.childNodes[i])) {
              return true;
            }
          }
        }
        return false;
      };
      
      findPos(editorRef.current);
    } catch (e) {
      console.error("Error restoring cursor position:", e);
    }
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
  
  // Save current cursor position
  const saveCurrentCursorPosition = () => {
    try {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return null;
      
      const range = selection.getRangeAt(0);
      if (!range.collapsed) return null; // Don't save if there's a selection
      
      // Get the character offset from the start of the editor
      const editorNode = editorRef.current;
      return getCharacterOffsetWithin(editorNode, range);
    } catch (e) {
      console.error("Error saving cursor position:", e);
      return null;
    }
  };
  
  // Format text with document.execCommand
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
        setContentUpdateRef({ current: true });
      }
    }
    
    // Focus back on the editor
    editorRef.current?.focus();
  };
  
  // Apply font family change
  const handleFontFamilyChange = (e) => {
    const font = e.target.value;
    setFontFamily(font);
    formatText('fontName', font);
  };

  // Apply font size change
  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    setFontSize(size);
    formatText('fontSize', size === '11' ? '3' : size === '12' ? '4' : '2');
  };
  
  // Handle editor input
  const handleEditorInput = (e) => {
    // Store cursor position before updating state
    const cursorPos = saveCurrentCursorPosition();
    const editorContent = e.currentTarget.innerHTML;
    
    // Check if content is empty or just contains empty elements
    const strippedContent = editorContent.replace(/<[^>]*>/g, '').trim();
    
    if (isPlaceholderActive && strippedContent !== '' && strippedContent !== 'Start typing here...') {
      setIsPlaceholderActive(false);
      setContent(editorContent);
      
      if (cursorPos !== null) {
        setContentUpdateRef({ current: true });
        setCursorPosition(cursorPos);
      }
    } else if (!isPlaceholderActive && strippedContent === '') {
      // If content is empty, reset to placeholder
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
      
      {/* Enhanced Editor Toolbar */}
      <div className="editor-toolbar">
        {/* Document structure dropdown */}
        <div className="toolbar-section">
          <div className="toolbar-dropdown">
            <button className="toolbar-dropdown-btn">
              <span className="dropdown-icon">≡</span>
              <span>tc</span>
              <span className="dropdown-arrow">▼</span>
            </button>
          </div>
        </div>
        
        {/* Font family dropdown */}
        <div className="toolbar-section">
          <select 
            className="toolbar-select font-family-select" 
            value={fontFamily} 
            onChange={handleFontFamilyChange}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
        
        {/* Font size dropdown */}
        <div className="toolbar-section">
          <select 
            className="toolbar-select font-size-select" 
            value={fontSize} 
            onChange={handleFontSizeChange}
          >
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="24">24</option>
            <option value="36">36</option>
          </select>
        </div>
        
        {/* Text formatting options */}
        <div className="toolbar-section formatting-buttons">
          <button className="toolbar-btn" onClick={() => formatText('bold')} title="Bold">
            <Bold size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('italic')} title="Italic">
            <Italic size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('underline')} title="Underline">
            <Underline size={16} />
          </button>
        </div>
        
        {/* Text color */}
        <div className="toolbar-section">
          <div className="toolbar-dropdown color-dropdown">
            <button className="toolbar-btn">
              <Type size={16} />
              <span className="dropdown-arrow">▼</span>
            </button>
          </div>
        </div>
        
        {/* Text alignment */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('justifyLeft')} title="Align Left">
            <AlignLeft size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('justifyCenter')} title="Align Center">
            <AlignCenter size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('justifyRight')} title="Align Right">
            <AlignRight size={16} />
          </button>
        </div>
        
        {/* Lists */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('insertUnorderedList')} title="Bullet List">
            <List size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('insertOrderedList')} title="Numbered List">
            <ListOrdered size={16} />
          </button>
        </div>
        
        {/* Additional formatting options */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<pre>')} title="Code Block">
            <Code size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<blockquote>')} title="Quote Block">
            <Quote size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<h1>')} title="Heading 1">
            <Heading1 size={16} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<h2>')} title="Heading 2">
            <Heading2 size={16} />
          </button>
        </div>
        
        {/* Background color / Indentation */}
        <div className="toolbar-section">
          <button className="toolbar-btn highlight-btn" title="Highlight">
            <div className="color-box"></div>
          </button>
          <button className="toolbar-btn" title="Decrease indent" onClick={() => formatText('outdent')}>
            <div className="indent-decrease-icon">⇠</div>
          </button>
          <button className="toolbar-btn" title="Increase indent" onClick={() => formatText('indent')}>
            <div className="indent-increase-icon">⇢</div>
          </button>
        </div>
        
        {/* Clear formatting */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('removeFormat')} title="Clear formatting">
            <span className="clear-format-icon">T<sub>x</sub></span>
          </button>
        </div>
        
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
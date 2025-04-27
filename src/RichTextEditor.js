import { useState, useEffect } from 'react';
import './RichTextEditor.css';
import EditorToolbar from './component/EditorToolbar';
import EditorContent from './component/EditorContent';
import FormatMenu from './component/FormatMenu';
import ComponentMenu from './component/ComponentMenu';
import ComponentRenderer from './component/ComponentRenderer';
import ComponentPropertiesModal from './component/ComponentPropertiesModal';

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
      
      <EditorToolbar />
      
      <div className="editor-content-wrapper">
        <EditorContent 
          content={content}
          setContent={setContent}
          isPlaceholderActive={isPlaceholderActive}
          setIsPlaceholderActive={setIsPlaceholderActive}
          handleSelection={setShowFormatMenu}
          setFormatMenuPosition={setFormatMenuPosition}
          handleContextMenu={handleContextMenu}
          cursorPosition={cursorPosition}
          setCursorPosition={setCursorPosition}
          contentUpdateRef={contentUpdateRef}
          setContentUpdateRef={setContentUpdateRef}
        />
      </div>
      
      {showFormatMenu && (
        <FormatMenu 
          position={formatMenuPosition}
          setShowFormatMenu={setShowFormatMenu}
        />
      )}
      
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
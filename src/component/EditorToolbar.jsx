import { useState, useRef } from 'react';
import './EditorToolbar.css'
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, Type, Heading1, 
  StrikethroughIcon, TextIcon
} from 'lucide-react';

export default function EditorToolbar({ editorRef, onFormatText }) {
  const [fontSize, setFontSize] = useState("11");
  const [fontFamily, setFontFamily] = useState("Arial");
  
  // Format text with document.execCommand
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (onFormatText) onFormatText(command, value);
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

  return (
    <div className="editor-container">
      {/* Top Menu Bar */}
      <div className="editor-menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="menu-item">View</div>
        <div className="menu-item">Insert</div>
        <div className="menu-item">Format</div>
        <div className="menu-item">Tools</div>
        <div className="menu-item">Table</div>
      </div>
      
      {/* Formatting Toolbar */}
      <div className="formatting-toolbar">
        {/* Document type dropdown */}
        <div className="toolbar-section">
          <div className="toolbar-dropdown">
            <button className="toolbar-dropdown-btn">
              <span className="dropdown-icon">≡</span>
              <span>tc</span>
              <span className="dropdown-arrow">▼</span>
            </button>
          </div>
        </div>
        
        {/* Font controls */}
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
            <option value="18">18</option>
            <option value="24">24</option>
            <option value="36">36</option>
          </select>
        </div>
        
        {/* Text formatting */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('bold')} title="Bold">
            <Bold size={18} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('italic')} title="Italic">
            <Italic size={18} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('underline')} title="Underline">
            <Underline size={18} />
          </button>
        </div>
        
        {/* Text color */}
        <div className="toolbar-section">
          <button className="toolbar-btn" title="Text Color">
            <TextIcon size={18} />
          </button>
          <button className="toolbar-btn highlight-btn" title="Highlight">
            <div className="color-box" style={{backgroundColor: '#000'}}></div>
          </button>
        </div>
        
        {/* Alignment */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('justifyLeft')} title="Align Left">
            <AlignLeft size={18} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('justifyCenter')} title="Align Center">
            <AlignCenter size={18} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('justifyRight')} title="Align Right">
            <AlignRight size={18} />
          </button>
        </div>
        
        {/* Lists */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('insertUnorderedList')} title="Bullet List">
            <List size={18} />
          </button>
          <button className="toolbar-btn" onClick={() => formatText('insertOrderedList')} title="Numbered List">
            <ListOrdered size={18} />
          </button>
        </div>
        
        {/* Indentation */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('outdent')} title="Decrease indent">
            <div className="indent-decrease-icon">⇠</div>
          </button>
          <button className="toolbar-btn" onClick={() => formatText('indent')} title="Increase indent">
            <div className="indent-increase-icon">⇢</div>
          </button>
        </div>
        
        {/* Clear formatting */}
        <div className="toolbar-section">
          <button className="toolbar-btn" onClick={() => formatText('removeFormat')} title="Clear formatting">
            <span className="clear-format-icon">T<sub>x</sub></span>
          </button>
        </div>
      </div>
    </div>
  );
}
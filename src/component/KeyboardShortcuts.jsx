import { useEffect, useState, useRef } from 'react';

export default function KeyboardShortcuts({
  editorRef,
  content,
  setContent,
  components,
  setComponents,
  insertComponent,
  setShowComponentMenu,
  setComponentMenuPosition,
  darkMode,
  setDarkMode
}) {
  const [keySequence, setKeySequence] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [filteredCommands, setFilteredCommands] = useState([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const commandPaletteRef = useRef(null);
  const commandInputRef = useRef(null);
  
  // List of available commands
  const commands = [
    { 
      id: 'heading1', 
      name: 'Heading 1', 
      description: 'Insert heading level 1',
      shortcut: 'Cmd+Alt+1',
      action: () => document.execCommand('formatBlock', false, '<h1>')
    },
    { 
      id: 'heading2', 
      name: 'Heading 2', 
      description: 'Insert heading level 2',
      shortcut: 'Cmd+Alt+2',
      action: () => document.execCommand('formatBlock', false, '<h2>')
    },
    { 
      id: 'bulletList', 
      name: 'Bullet List', 
      description: 'Insert bullet list',
      shortcut: 'Cmd+Shift+8',
      action: () => document.execCommand('insertUnorderedList', false, null)
    },
    { 
      id: 'numberedList', 
      name: 'Numbered List', 
      description: 'Insert numbered list',
      shortcut: 'Cmd+Shift+7',
      action: () => document.execCommand('insertOrderedList', false, null)
    },
    { 
      id: 'insertButton', 
      name: 'Insert Button', 
      description: 'Insert interactive button',
      shortcut: '/button',
      action: () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setComponentMenuPosition({ 
            top: rect.top + window.scrollY,
            left: rect.left
          });
          insertComponent('Button');
        }
      }
    },
    { 
      id: 'insertCallout', 
      name: 'Insert Callout', 
      description: 'Insert callout block',
      shortcut: '/callout',
      action: () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setComponentMenuPosition({ 
            top: rect.top + window.scrollY,
            left: rect.left
          });
          insertComponent('Callout');
        }
      }
    },
    { 
      id: 'insertCode', 
      name: 'Insert Code Block', 
      description: 'Insert code block',
      shortcut: '/code',
      action: () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setComponentMenuPosition({ 
            top: rect.top + window.scrollY,
            left: rect.left
          });
          insertComponent('Code');
        }
      }
    },
    { 
      id: 'insertQuote', 
      name: 'Insert Quote', 
      description: 'Insert quote block',
      shortcut: '/quote',
      action: () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setComponentMenuPosition({ 
            top: rect.top + window.scrollY,
            left: rect.left
          });
          insertComponent('Quote');
        }
      }
    },
    { 
      id: 'toggleDarkMode', 
      name: 'Toggle Dark Mode', 
      description: 'Switch between light and dark theme',
      shortcut: 'Cmd+J',
      action: () => setDarkMode(!darkMode)
    },
    { 
      id: 'showComponentMenu', 
      name: 'Component Menu', 
      description: 'Show available components',
      shortcut: 'Cmd+/',
      action: () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setComponentMenuPosition({ 
            top: rect.top + window.scrollY,
            left: rect.left
          });
          setShowComponentMenu(true);
        }
      }
    }
  ];
  
  // Filter commands based on search query
  useEffect(() => {
    if (showCommandPalette) {
      const query = commandQuery.toLowerCase();
      const filtered = commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query) || 
        cmd.description.toLowerCase().includes(query) ||
        cmd.shortcut.toLowerCase().includes(query)
      );
      setFilteredCommands(filtered);
      setSelectedCommandIndex(0);
    }
  }, [commandQuery, showCommandPalette]);
  
  // Focus input when command palette opens
  useEffect(() => {
    if (showCommandPalette && commandInputRef.current) {
      setTimeout(() => {
        commandInputRef.current.focus();
      }, 10);
    }
  }, [showCommandPalette]);
  
  // Handle key sequence for slash commands
  useEffect(() => {
    if (keySequence === '/') {
      setShowCommandPalette(true);
      // Clear the slash character from editor if command palette is shown
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range.startContainer.nodeType === Node.TEXT_NODE) {
            const text = range.startContainer.textContent;
            const pos = range.startOffset;
            if (pos > 0 && text[pos - 1] === '/') {
              // Remove the slash
              range.startContainer.textContent = text.substring(0, pos - 1) + text.substring(pos);
              // Move cursor back
              range.setStart(range.startContainer, pos - 1);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }
    }
    
    // Reset key sequence after 1.5 seconds
    const timer = setTimeout(() => {
      setKeySequence('');
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [keySequence]);
  
  // Handle keyboard events
  useEffect(() => {
    // Main keyboard shortcut handler
    const handleKeyDown = (e) => {
      // Skip if inside input field or contentEditable is not focused
      if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' ||
        !document.activeElement.isContentEditable
      ) {
        return;
      }
      
      // Handle command palette navigation
      if (showCommandPalette) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCommandIndex(prevIndex => 
            prevIndex < filteredCommands.length - 1 ? prevIndex + 1 : prevIndex
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCommandIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : 0);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands.length > 0) {
            filteredCommands[selectedCommandIndex].action();
          }
          setShowCommandPalette(false);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowCommandPalette(false);
        }
        return;
      }
      
      // Command palette toggle (Cmd+P or Ctrl+P)
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setShowCommandPalette(true);
        setCommandQuery('');
        return;
      }
      
      // Track key sequence for slash commands
      if (e.key === '/') {
        setKeySequence('/');
      } else if (keySequence === '/') {
        setKeySequence(keySequence + e.key);
      }
      
      // Check for command shortcuts
      for (const command of commands) {
        // Check for key combination shortcuts
        if (command.shortcut.includes('Cmd+') || command.shortcut.includes('Ctrl+')) {
          const parts = command.shortcut.split('+');
          
          const needsCmd = parts.includes('Cmd');
          const needsCtrl = parts.includes('Ctrl');
          const needsShift = parts.includes('Shift');
          const needsAlt = parts.includes('Alt');
          
          // Check if number or letter key is included
          const keyPart = parts[parts.length - 1];
          const matchesKey = e.key.toUpperCase() === keyPart.toUpperCase();
          
          if (
            ((needsCmd && (e.metaKey || e.ctrlKey)) || !needsCmd) &&
            ((needsCtrl && e.ctrlKey) || !needsCtrl) &&
            ((needsShift && e.shiftKey) || !needsShift) &&
            ((needsAlt && e.altKey) || !needsAlt) &&
            matchesKey
          ) {
            e.preventDefault();
            command.action();
            return;
          }
        }
        
        // Check for slash commands
        else if (command.shortcut.startsWith('/') && keySequence === command.shortcut) {
          e.preventDefault();
          command.action();
          setKeySequence('');
          return;
        }
      }
    };
    
    // Handle clicks outside command palette
    const handleClickOutside = (e) => {
      if (
        showCommandPalette && 
        commandPaletteRef.current && 
        !commandPaletteRef.current.contains(e.target)
      ) {
        setShowCommandPalette(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    showCommandPalette, 
    filteredCommands, 
    selectedCommandIndex, 
    keySequence,
    darkMode
  ]);
  
  return (
    <>
      {showCommandPalette && (
        <div 
          ref={commandPaletteRef}
          className={`command-palette ${darkMode ? 'dark' : ''}`}
        >
          <div className="command-palette-header">
            <input
              ref={commandInputRef}
              type="text"
              placeholder="Search commands..."
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              className="command-palette-input"
            />
          </div>
          
          <div className="command-palette-results">
            {filteredCommands.map((command, index) => (
              <div
                key={command.id}
                className={`command-palette-item ${index === selectedCommandIndex ? 'selected' : ''}`}
                onClick={() => {
                  command.action();
                  setShowCommandPalette(false);
                }}
                onMouseEnter={() => setSelectedCommandIndex(index)}
              >
                <div className="command-info">
                  <div className="command-name">{command.name}</div>
                  <div className="command-description">{command.description}</div>
                </div>
                <div className="command-shortcut">{command.shortcut}</div>
              </div>
            ))}
            
            {filteredCommands.length === 0 && (
              <div className="command-palette-no-results">
                No commands found
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
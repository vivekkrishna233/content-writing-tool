import { useRef, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function EditorContent({
  editorRef,
  content,
  setContent,
  isPlaceholderActive,
  setIsPlaceholderActive,
  handleSelection,
  setFormatMenuPosition,
  handleContextMenu,
  darkMode
}) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const selectionTimeoutRef = useRef(null);
  const [lastSelection, setLastSelection] = useState(null);

  const isManuallyUpdatingRef = useRef(false);
  // Track if we need to update content
  const contentNeedsUpdateRef = useRef(false);
  // Debounce timer for content updates
  const updateTimerRef = useRef(null);
  
  // Mention system state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mentionMenuRef = useRef(null);
  
  // Sample data for mentions - in production this would come from an API
  const mentionData = [
    { id: 1, name: 'John Smith', role: 'Designer', avatar: '👨‍🎨' },
    { id: 2, name: 'Alice Johnson', role: 'Developer', avatar: '👩‍💻' },
    { id: 3, name: 'Bob Williams', role: 'Project Manager', avatar: '👨‍💼' },
    { id: 4, name: 'Emma Davis', role: 'UX Researcher', avatar: '👩‍🔬' },
    { id: 5, name: 'James Miller', role: 'QA Engineer', avatar: '👨‍🔧' },
    { id: 6, name: 'Sarah Wilson', role: 'Product Owner', avatar: '👩‍💼' },
    { id: 7, name: 'Michael Brown', role: 'CTO', avatar: '👨‍💻' },
    { id: 8, name: 'Jessica Taylor', role: 'Marketing', avatar: '👩‍💼' }
  ];
  
  // Initialize editor when component mounts
  useEffect(() => {
    if (isInitialLoad && editorRef.current) {
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

  // Debounced content update function
  const debouncedContentUpdate = () => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    updateTimerRef.current = setTimeout(() => {
      if (contentNeedsUpdateRef.current && editorRef.current && !isManuallyUpdatingRef.current) {
        contentNeedsUpdateRef.current = false;
        isManuallyUpdatingRef.current = true;
        
        // Update content state
        setContent(editorRef.current.innerHTML);
        
        // Reset the manual update flag after state is updated
        setTimeout(() => {
          isManuallyUpdatingRef.current = false;
        }, 0);
      }
    }, 50); // Increased debounce time for better performance
  };

  // Handle text selection
  const onMouseUp = (e) => {
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }
    
    selectionTimeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
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
    }, 0);
  };
  
  // Use MutationObserver to detect changes but with improved handling
  useEffect(() => {
    if (!editorRef.current) return;
    
    const observer = new MutationObserver(() => {
      // Skip during composition or manual updates
      if (isComposing || isManuallyUpdatingRef.current) return;
      
      // Mark that content needs updating and trigger debounced update
      contentNeedsUpdateRef.current = true;
      debouncedContentUpdate();
    });
    
    observer.observe(editorRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });
    
    return () => {
      observer.disconnect();
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [editorRef, setContent, isComposing]);
  
  // Improved input handler focusing on placeholder logic
  const handleEditorInput = (e) => {
    if (isComposing || isManuallyUpdatingRef.current) return;
    
    const editorContent = e.currentTarget.innerHTML;
    const strippedContent = editorContent.replace(/<[^>]*>/g, '').trim();
    
    // Handle placeholder logic
    if (isPlaceholderActive && strippedContent !== '' && strippedContent !== 'Start typing here...') {
      setIsPlaceholderActive(false);
    } else if (!isPlaceholderActive && strippedContent === '') {
      setIsPlaceholderActive(true);
      isManuallyUpdatingRef.current = true;
      setContent('<p>Start typing here...</p>');
      
      setTimeout(() => {
        isManuallyUpdatingRef.current = false;
      }, 0);
    }
  };
  
  // Focus handler with improved placeholder logic
  const handleEditorFocus = () => {
    if (isPlaceholderActive && editorRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      
      if (editorRef.current.firstChild) {
        if (editorRef.current.firstChild.firstChild) {
          range.setStart(editorRef.current.firstChild.firstChild, 0);
        } else {
          range.setStart(editorRef.current.firstChild, 0);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };
  
  // Enhanced keydown handler with improved cursor control
  const handleKeyDown = (e) => {
    // Check for @ symbol to trigger mention menu
    if (e.key === '@') {
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setMentionPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left
      });
      
      setMentionQuery('');
      setShowMentionMenu(true);
      setSelectedIndex(0);
      return;
    }
    
    // Handle mention menu navigation
    if (showMentionMenu) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionMenu(false);
        return;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, mentionResults.length - 1));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      } else if (e.key === 'Enter' && mentionResults.length > 0) {
        e.preventDefault();
        insertMention(mentionResults[selectedIndex]);
        return;
      }
    }
    
    // Handle special backspace case
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // If cursor is at the beginning with empty content
      if (range.startOffset === 0 && range.collapsed) {
        const strippedContent = editorRef.current.innerHTML.replace(/<[^>]*>/g, '').trim();
        
        if (strippedContent === '' || strippedContent === 'Start typing here...') {
          e.preventDefault();
          return;
        }
      }
    }
    
    // Handle enter key with proper paragraph and line break insertion
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      let node = range.startContainer;
      
      // Find if we're inside a pre/code block
      while (node && node.nodeType !== Node.ELEMENT_NODE) {
        node = node.parentNode;
      }
      
      const closestPre = node?.closest('pre');
      if (closestPre) {
        // Inside pre tag, allow default behavior
        return;
      }
      
      e.preventDefault();
      
      // Mark that we're manually updating
      isManuallyUpdatingRef.current = true;
      
      if (e.shiftKey) {
        // Insert line break with shift+enter
        document.execCommand('insertHTML', false, '<br>');
      } else {
        // Insert paragraph break
        document.execCommand('insertParagraph', false);
        
        // Fix empty paragraphs
        setTimeout(() => {
          const newSelection = window.getSelection();
          if (newSelection && newSelection.rangeCount > 0) {
            const newContainer = newSelection.getRangeAt(0).startContainer;
            
            // If container is empty element, insert BR to maintain height
            if (newContainer.nodeType === Node.ELEMENT_NODE && 
                !newContainer.textContent.trim() && 
                !newContainer.querySelector('br')) {
              const br = document.createElement('br');
              newContainer.appendChild(br);
            }
          }
          
          // Update content state after our changes
          if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
          }
          
          // Reset updating flag
          isManuallyUpdatingRef.current = false;
        }, 10);
      }
      
      // Clear placeholder if active
      if (isPlaceholderActive) {
        setIsPlaceholderActive(false);
      }
    }
  };
  
  // Improved IME composition handling
  const handleCompositionStart = () => {
    setIsComposing(true);
  };
  
  const handleCompositionEnd = () => {
    setTimeout(() => {
      setIsComposing(false);
      
      // Mark content as needing update
      if (editorRef.current) {
        contentNeedsUpdateRef.current = true;
        debouncedContentUpdate();
      }
    }, 30);
  };

  
  
  // Click handler for placeholder clearing
  const handleClick = () => {
    if (isPlaceholderActive) {
      setIsPlaceholderActive(false);
      
      isManuallyUpdatingRef.current = true;
      setContent('<p><br></p>');
      
      // Focus editor and place cursor at beginning
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          
          const selection = window.getSelection();
          const range = document.createRange();
          
          if (editorRef.current.firstChild) {
            range.setStart(editorRef.current.firstChild, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
          
          isManuallyUpdatingRef.current = false;
        }
      }, 0);
    }
  };
  
  // Check for keyup to update mention query
  const handleKeyUp = (e) => {
    if (showMentionMenu && e.key !== '@' && e.key !== 'Enter' && 
        e.key !== 'Escape' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
      // Update query with current text after @
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      
      if (textNode.nodeType === Node.TEXT_NODE) {
        const text = textNode.textContent;
        const cursorPos = range.startOffset;
        
        // Find the @ character before the cursor
        const atIndex = text.lastIndexOf('@', cursorPos - 1);
        
        if (atIndex !== -1) {
          const query = text.substring(atIndex + 1, cursorPos);
          setMentionQuery(query);
        } else {
          setShowMentionMenu(false);
        }
      }
    }
  };

  // Filter mention results based on query using fuzzy search
  useEffect(() => {
    if (showMentionMenu) {
      // Simple fuzzy search - production version would use a proper algorithm
      const results = mentionData.filter(user => {
        const query = mentionQuery.toLowerCase();
        const name = user.name.toLowerCase();
        const role = user.role.toLowerCase();
        
        return name.includes(query) || role.includes(query);
      });
      
      setMentionResults(results);
    }
  }, [mentionQuery, showMentionMenu]);


  
  
  
  // Insert mention at cursor position
  const insertMention = (user) => {
    const selection = window.getSelection();
    const range = (lastSelection || (selection.rangeCount > 0 ? selection.getRangeAt(0) : null));
    
    if (!range) return;
    
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent;
      const cursorPos = range.startOffset;
      
      const atIndex = text.lastIndexOf('@', cursorPos - 1);
      
      if (atIndex !== -1) {
        const mentionSpan = document.createElement('span');
        mentionSpan.className = 'mention-tag';
        mentionSpan.contentEditable = 'false';
        mentionSpan.dataset.userId = user.id;
        mentionSpan.innerHTML = `${user.avatar} @${user.name}`;
        
        const beforeText = text.substring(0, atIndex);
        const afterText = text.substring(cursorPos);
        
        textNode.textContent = beforeText;
        
        const nextNode = textNode.nextSibling;
        if (nextNode) {
          textNode.parentNode.insertBefore(mentionSpan, nextNode);
        } else {
          textNode.parentNode.appendChild(mentionSpan);
        }
        
        const spaceNode = document.createTextNode(' ' + afterText);
        textNode.parentNode.insertBefore(spaceNode, mentionSpan.nextSibling);
        
        if (editorRef.current) {
          isManuallyUpdatingRef.current = true;
          setContent(editorRef.current.innerHTML);
          
          const newRange = document.createRange();
          newRange.setStart(spaceNode, 1);
          newRange.collapse(true);
          
          const newSelection = window.getSelection();
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
          
          setTimeout(() => {
            isManuallyUpdatingRef.current = false;
          }, 0);
        }
      }
    }
    
    setShowMentionMenu(false);
  };
  
  
  // Handle clicks outside mention menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(e.target)) {
        setShowMentionMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div 
        ref={editorRef}
        contentEditable="true"
        className={`editor-content ${isPlaceholderActive ? 'placeholder-active' : ''} ${darkMode ? 'dark-mode' : ''}`}
        onMouseUp={onMouseUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onInput={handleEditorInput}
        onFocus={handleEditorFocus}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        suppressContentEditableWarning={true}
      >
      </div>
      
      {/* Mention Menu */}
      {showMentionMenu && (
        <div
          ref={mentionMenuRef}
          className={`mention-menu ${darkMode ? 'dark' : ''}`}
          style={{ top: mentionPosition.top, left: mentionPosition.left }}
        >
          <div className="mention-menu-header">
            <Search size={14} />
            <span>Mentioning: {mentionQuery}</span>
          </div>
          
          <div className="mention-results">
            {mentionResults.length === 0 ? (
              <div className="mention-no-results">No results found</div>
            ) : (
              mentionResults.map((user, index) => (
                <div 
                  key={user.id}
                  className={`mention-result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => insertMention(user)}
                  onMouseEnter={() => {
                    setSelectedIndex(index);
                    
                    // Save the current selection
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      setLastSelection(selection.getRangeAt(0));
                    }
                  }}
                >
                  <div className="mention-avatar">{user.avatar}</div>
                  <div className="mention-info">
                    <div className="mention-name">{user.name}</div>
                    <div className="mention-role">{user.role}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
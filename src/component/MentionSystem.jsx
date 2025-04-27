import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function MentionSystem({ 
  editorRef, 
  content, 
  setContent, 
  cursorPosition, 
  setCursorPosition, 
  setContentUpdateRef,
  darkMode
}) {
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
  
  // Check for @ symbol to trigger mention menu
  useEffect(() => {
    const handleKeyUp = (e) => {
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
      } else if (showMentionMenu) {
        if (e.key === 'Escape') {
          setShowMentionMenu(false);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, mentionResults.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && mentionResults.length > 0) {
          e.preventDefault();
          insertMention(mentionResults[selectedIndex]);
        } else if (e.key !== '@') {
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
      }
    };
    
    // Handle clicks outside mention menu
    const handleClickOutside = (e) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(e.target)) {
        setShowMentionMenu(false);
      }
    };
    
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentionMenu, mentionResults, selectedIndex]);
  
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
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent;
      const cursorPos = range.startOffset;
      
      // Find the @ character before the cursor
      const atIndex = text.lastIndexOf('@', cursorPos - 1);
      
      if (atIndex !== -1) {
        // Create mention span
        const mentionSpan = document.createElement('span');
        mentionSpan.className = 'mention-tag';
        mentionSpan.contentEditable = 'false';
        mentionSpan.dataset.userId = user.id;
        mentionSpan.innerHTML = `${user.avatar} @${user.name}`;
        
        // Replace text from @ to cursor with mention span
        const beforeText = text.substring(0, atIndex);
        const afterText = text.substring(cursorPos);
        
        // Update text node
        textNode.textContent = beforeText;
        
        // Insert mention span after text node
        const nextNode = textNode.nextSibling;
        if (nextNode) {
          textNode.parentNode.insertBefore(mentionSpan, nextNode);
        } else {
          textNode.parentNode.appendChild(mentionSpan);
        }
        
        // Add space after mention
        const spaceNode = document.createTextNode(' ' + afterText);
        textNode.parentNode.insertBefore(spaceNode, mentionSpan.nextSibling);
        
        // Update content state
        if (editorRef.current) {
          setContent(editorRef.current.innerHTML);
          
          // Set cursor position after mention
          const newRange = document.createRange();
          newRange.setStart(spaceNode, 1);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          // Store cursor position
          const newPos = getCharacterOffsetWithin(editorRef.current, newRange);
          setContentUpdateRef({ current: true });
          setCursorPosition(newPos);
        }
      }
    }
    
    setShowMentionMenu(false);
  };
  
  // Helper to get character offset within element
  const getCharacterOffsetWithin = (containerNode, range) => {
    let charCount = 0;
    const walker = document.createTreeWalker(
      containerNode, 
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null, 
      false
    );
    
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
  
  return (
    <>
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
                  onMouseEnter={() => setSelectedIndex(index)}
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
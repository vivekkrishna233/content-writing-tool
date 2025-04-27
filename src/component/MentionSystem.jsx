import { useState, useEffect, useRef } from 'react';
import './MentionSystem.css';
import { User } from 'lucide-react';

export default function MentionSystem({
  editorRef,
  content,
  setContent,
  darkMode
}) {
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [searchText, setSearchText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mentionListRef = useRef(null);
  const searchStartPosition = useRef(null);
  const isInsertingMentionRef = useRef(false);
  
  const users = [
    { id: 1, name: 'John Smith', username: 'johnsmith', avatar: null },
    { id: 2, name: 'Sarah Johnson', username: 'sarahj', avatar: null },
    { id: 3, name: 'Michael Brown', username: 'mikeb', avatar: null },
    { id: 4, name: 'Emily Davis', username: 'emilyd', avatar: null },
    { id: 5, name: 'David Wilson', username: 'davidw', avatar: null }
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) || 
    user.username.toLowerCase().includes(searchText.toLowerCase())
  );
  
  useEffect(() => {
    if (!editorRef.current) return;
    
    const handleKeyUp = (e) => {
      if (isInsertingMentionRef.current) return;
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const cursorPosition = range.startOffset;
        
        let atIndex = -1;
        for (let i = cursorPosition - 1; i >= 0; i--) {
          if (text[i] === '@') {
            atIndex = i;
            break;
          } else if (/\s/.test(text[i])) {
            break;
          }
        }
        
        if (atIndex >= 0) {
          const search = text.substring(atIndex + 1, cursorPosition);
          setSearchText(search);
          
          searchStartPosition.current = {
            node,
            startOffset: atIndex,
            endOffset: cursorPosition
          };
          
          const tempRange = document.createRange();
          tempRange.setStart(node, atIndex);
          tempRange.setEnd(node, atIndex + 1);
          const rect = tempRange.getBoundingClientRect();
          
          setMentionPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX
          });
          
          setShowMentionList(true);
          setSelectedIndex(0);
        } else {
          setShowMentionList(false);
        }
      } else if (e.key === 'Escape') {
        setShowMentionList(false);
      }
    };
    
    const handleKeyDown = (e) => {
      if (!showMentionList) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredUsers.length > 0) {
            insertMention(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowMentionList(false);
          break;
        default:
          break;
      }
    };
    
    editorRef.current.addEventListener('keyup', handleKeyUp);
    editorRef.current.addEventListener('keydown', handleKeyDown);
    
    const handleClickOutside = (e) => {
      if (mentionListRef.current && !mentionListRef.current.contains(e.target)) {
        setShowMentionList(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('keyup', handleKeyUp);
        editorRef.current.removeEventListener('keydown', handleKeyDown);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editorRef, showMentionList, filteredUsers.length, selectedIndex]);
  
  const insertMention = (user) => {
    isInsertingMentionRef.current = true;
    
    try {
      if (searchStartPosition.current) {
        const { node, startOffset, endOffset } = searchStartPosition.current;
        const selection = window.getSelection();
        const range = document.createRange();
        
        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);
        
        selection.removeAllRanges();
        selection.addRange(range);

        const mentionNode = document.createElement('span');
        mentionNode.className = 'mention-tag';
        mentionNode.contentEditable = 'false';
        mentionNode.dataset.userId = user.id;
        mentionNode.innerText = `@${user.username}`;

        range.deleteContents();
        range.insertNode(mentionNode);

        const spaceNode = document.createTextNode(' ');
        if (mentionNode.parentNode) {
          mentionNode.parentNode.insertBefore(spaceNode, mentionNode.nextSibling);
        }

        const newRange = document.createRange();
        newRange.setStart(spaceNode, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        setShowMentionList(false);
        setSearchText('');

        setTimeout(() => {
          if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
          }
        }, 10);
      }
    } catch (err) {
      console.error("Error inserting mention:", err);
    } finally {
      if (editorRef.current) editorRef.current.focus();
      setTimeout(() => {
        isInsertingMentionRef.current = false;
        searchStartPosition.current = null;
      }, 100);
    }
  };

  return (
    <div className="mention-system">
      {showMentionList && filteredUsers.length > 0 && (
        <div 
          ref={mentionListRef}
          className={`mention-list ${darkMode ? 'dark' : ''}`} 
          style={{ top: mentionPosition.top, left: mentionPosition.left }}
        >
          <div className="mention-list-header">
            <User size={14} />
            <span>Mentioning: {searchText}</span>
          </div>
          <ul className="mention-results">
            {filteredUsers.map((user, index) => (
              <li 
                key={user.id}
                className={`mention-result-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => insertMention(user)}
              >
                <div className="mention-avatar">
                  <User size={16} />
                </div>
                <div className="mention-info">
                  <div className="mention-name">{user.name}</div>
                  <div className="mention-username">@{user.username}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

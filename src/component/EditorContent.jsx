import { useRef, useEffect } from 'react';

export default function EditorContent({
  content,
  setContent,
  isPlaceholderActive,
  setIsPlaceholderActive,
  handleSelection,
  setFormatMenuPosition,
  handleContextMenu,
  cursorPosition,
  setCursorPosition,
  contentUpdateRef,
  setContentUpdateRef
}) {
  const editorRef = useRef(null);
  
  // Initialize editor
  useEffect(() => {
    if (editorRef.current) {
      // Focus the editor when component mounts
      editorRef.current.focus();
    }
  }, []);

  // Handle cursor position
  useEffect(() => {
    if (contentUpdateRef.current && cursorPosition && editorRef.current) {
      setContentUpdateRef({ current: false });
      
      // Wait for React to update the DOM
      setTimeout(() => {
        // Skip positioning if editor is not focused
        if (document.activeElement !== editorRef.current) return;
        
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          
          // Find the appropriate node and position within the editor
          const nodeAndOffset = findNodeAndOffsetAtPosition(
            editorRef.current, 
            cursorPosition
          );
          
          if (nodeAndOffset) {
            range.setStart(nodeAndOffset.node, nodeAndOffset.offset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (e) {
          console.error("Error restoring cursor position:", e);
        }
      }, 0);
    }
  }, [content, cursorPosition, contentUpdateRef, setContentUpdateRef]);
  
  // Handle text selection
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
  
  // Helper function to find node and offset at given character position
  const findNodeAndOffsetAtPosition = (rootNode, targetOffset) => {
    // Text nodes only
    if (rootNode.nodeType === Node.TEXT_NODE) {
      if (targetOffset <= rootNode.length) {
        return { node: rootNode, offset: targetOffset };
      }
      return null;
    }
    
    // Skip non-element nodes that aren't text
    if (rootNode.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    
    // Search child nodes
    let currentOffset = 0;
    for (const childNode of rootNode.childNodes) {
      // For text nodes, just add their length
      if (childNode.nodeType === Node.TEXT_NODE) {
        if (currentOffset + childNode.length >= targetOffset) {
          return { 
            node: childNode, 
            offset: targetOffset - currentOffset 
          };
        }
        currentOffset += childNode.length;
      } 
      // For element nodes, recursively search
      else if (childNode.nodeType === Node.ELEMENT_NODE) {
        // Special handling for BR tags
        if (childNode.tagName === 'BR') {
          currentOffset += 1;
          if (currentOffset === targetOffset) {
            return { 
              node: rootNode, 
              offset: Array.from(rootNode.childNodes).indexOf(childNode) + 1 
            };
          }
        } 
        // For other elements, search within
        else {
          const result = findNodeAndOffsetAtPosition(childNode, targetOffset - currentOffset);
          if (result) {
            return result;
          }
          
          // If no result in child, add its text content length
          currentOffset += childNode.textContent.length;
        }
      }
    }
    
    // If we've gone through all children and haven't found the position,
    // return the last possible position in this node
    if (rootNode.childNodes.length > 0) {
      const lastChild = rootNode.childNodes[rootNode.childNodes.length - 1];
      if (lastChild.nodeType === Node.TEXT_NODE) {
        return { node: lastChild, offset: lastChild.length };
      } else {
        return { node: rootNode, offset: rootNode.childNodes.length };
      }
    }
    
    return { node: rootNode, offset: 0 };
  };
  
  // Handle input and preserve cursor position
  const handleEditorInput = (e) => {
    // Store cursor position before updating state
    const cursorPos = saveCurrentCursorPosition();
    const editorContent = e.currentTarget.innerHTML;
    
    // Check if the content is empty or just contains empty paragraphs/line breaks
    const strippedContent = editorContent.replace(/<[^>]*>/g, '').trim();
    
    // Handle placeholder text behavior
    if (isPlaceholderActive && strippedContent !== 'Start typing here...') {
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
  
  // Handle first keydown to clear placeholder
  const handleKeyDown = (e) => {
    if (isPlaceholderActive) {
      // Don't immediately clear on navigation keys
      const nonContentKeys = [
        'Tab', 'Shift', 'Control', 'Alt', 'Meta', 
        'CapsLock', 'Escape', 'ArrowLeft', 'ArrowRight', 
        'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'
      ];
      
      if (!nonContentKeys.includes(e.key)) {
        // If it's a character key, delete key, or backspace key
        if (e.key === 'Backspace' || e.key === 'Delete') {
          // Let the default handler work but mark placeholder as gone
          setIsPlaceholderActive(false);
        } else if (e.key.length === 1) { // Character key
          // Clear placeholder and insert the character
          e.preventDefault();
          setIsPlaceholderActive(false);
          setContent('<p>' + e.key + '</p>');
          
          // Position cursor after the inserted character
          setContentUpdateRef({ current: true });
          setCursorPosition(1); // After the first character
        }
      }
    }
  };

  return (
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
  );
}
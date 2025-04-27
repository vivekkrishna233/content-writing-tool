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
    if (contentUpdateRef.current && cursorPosition !== null && editorRef.current) {
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
  };
  
  // Calculate current cursor position
  const saveCurrentCursorPosition = () => {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      
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
    
    // Track if we've found our target node
    let foundTarget = false;
    
    // Walk the tree until we find the node containing the selection
    let node;
    while ((node = walker.nextNode()) && !foundTarget) {
      if (range.startContainer === node) {
        charCount += range.startOffset;
        foundTarget = true;
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
    // Bail early for invalid inputs
    if (!rootNode || targetOffset < 0) return null;
    
    // Handle text nodes directly
    if (rootNode.nodeType === Node.TEXT_NODE) {
      const length = rootNode.length || 0;
      if (targetOffset <= length) {
        return { node: rootNode, offset: Math.min(targetOffset, length) };
      }
      return null;
    }
    
    // Skip non-element nodes that aren't text
    if (rootNode.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    
    // Search child nodes
    let currentOffset = 0;
    let childNodes = Array.from(rootNode.childNodes);
    
    // Handle empty editor case
    if (childNodes.length === 0) {
      return { node: rootNode, offset: 0 };
    }
    
    for (let i = 0; i < childNodes.length; i++) {
      const childNode = childNodes[i];
      
      // For text nodes, check if target position is within this node
      if (childNode.nodeType === Node.TEXT_NODE) {
        const length = childNode.length;
        if (currentOffset + length >= targetOffset) {
          return { 
            node: childNode, 
            offset: targetOffset - currentOffset 
          };
        }
        currentOffset += length;
      } 
      // Handle BR tags specially
      else if (childNode.nodeName === 'BR') {
        currentOffset += 1;
        if (currentOffset === targetOffset) {
          // Position after this BR
          return { 
            node: rootNode, 
            offset: i + 1
          };
        }
      } 
      // For other elements, recursively search
      else if (childNode.nodeType === Node.ELEMENT_NODE) {
        const result = findNodeAndOffsetAtPosition(childNode, targetOffset - currentOffset);
        if (result) {
          return result;
        }
        
        // If no result in child, add its text content length
        const textLength = childNode.textContent ? childNode.textContent.length : 0;
        currentOffset += textLength;
      }
    }
    
    // If we've gone through all children and the position is at or beyond the end
    // return the position at the end of the content
    if (currentOffset <= targetOffset) {
      const lastIndex = childNodes.length;
      return { node: rootNode, offset: lastIndex };
    }
    
    return null;
  };
  
  // Handle input and preserve cursor position
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
  
  // Fix for backspace issue - handle keydown events
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // If cursor is at the beginning of the editor and content is empty except for formatting
      if (range.startOffset === 0 && range.collapsed) {
        const strippedContent = editorRef.current.innerHTML.replace(/<[^>]*>/g, '').trim();
        
        if (strippedContent === '' || strippedContent === 'Start typing here...') {
          e.preventDefault();
          // Don't do anything - prevent cursor from jumping
          return;
        }
      }
    }
    
    // Handle Enter key press - FIXED HERE
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Find current selection
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // Clear placeholder if active
      if (isPlaceholderActive) {
        setIsPlaceholderActive(false);
        setContent('<p><br></p>');
        setContentUpdateRef({ current: true });
        setCursorPosition(0);
        return;
      }
      
      // Find current paragraph
      let currentNode = range.startContainer;
      let currentParagraph = currentNode;
      
      // Find the closest paragraph parent
      while (currentParagraph && currentParagraph.nodeName !== 'P') {
        currentParagraph = currentParagraph.parentNode;
        if (currentParagraph === editorRef.current) {
          // If we reach the editor root without finding a paragraph, create one
          const newP = document.createElement('p');
          newP.innerHTML = '<br>';
          editorRef.current.appendChild(newP);
          
          // Insert at the end
          const newRange = document.createRange();
          newRange.setStart(newP, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          // Update content
          setContent(editorRef.current.innerHTML);
          const newPos = editorRef.current.innerHTML.length;
          setContentUpdateRef({ current: true });
          setCursorPosition(newPos);
          return;
        }
      }
      
      // Create new paragraph
      const newParagraph = document.createElement('p');
      newParagraph.innerHTML = '<br>';
      
      if (currentParagraph) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
          const textBeforeCursor = currentNode.textContent.substring(0, range.startOffset);
          const textAfterCursor = currentNode.textContent.substring(range.startOffset);
          
          // Set text before cursor to current paragraph
          currentNode.textContent = textBeforeCursor;
          
          // Move text after cursor to new paragraph
          if (textAfterCursor) {
            newParagraph.innerHTML = '';
            newParagraph.appendChild(document.createTextNode(textAfterCursor));
          }
        }
        
        // Insert new paragraph after current one
        if (currentParagraph.nextSibling) {
          editorRef.current.insertBefore(newParagraph, currentParagraph.nextSibling);
        } else {
          editorRef.current.appendChild(newParagraph);
        }
        
        // Set cursor to beginning of new paragraph
        const newRange = document.createRange();
        if (newParagraph.firstChild) {
          if (newParagraph.firstChild.nodeType === Node.TEXT_NODE) {
            newRange.setStart(newParagraph.firstChild, 0);
          } else {
            newRange.setStart(newParagraph, 0);
          }
        } else {
          newRange.setStart(newParagraph, 0);
        }
        
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Update content and cursor position
        setContent(editorRef.current.innerHTML);
        const newPosition = saveCurrentCursorPosition();
        if (newPosition !== null) {
          setContentUpdateRef({ current: true });
          setCursorPosition(newPosition);
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
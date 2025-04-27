import { useEffect } from 'react';
import DOMPurify from 'dompurify';
export default function ClipboardHandler({
  editorRef,
  setContent,
  setCursorPosition,
  setContentUpdateRef
}) {
  // Configure DOMPurify to allow specific tags and attributes
  const purifyConfig = {
    ALLOWED_TAGS: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's',
      'blockquote', 'pre', 'code', 'br', 'ul', 'ol', 'li', 'a', 'span'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
  };
  
  useEffect(() => {
    if (!editorRef.current) return;
    
    const handlePaste = (e) => {
      e.preventDefault();
      
      // Get clipboard data in different formats
      const clipboard = e.clipboardData || window.clipboardData;
      const html = clipboard.getData('text/html');
      const text = clipboard.getData('text/plain');
      
      // Get selection and create a range
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // Try to process HTML content first
      if (html) {
        // Sanitize HTML content
        const sanitizedHtml = DOMPurify.sanitize(html, purifyConfig);
        
        // Create temporary div to hold sanitized content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedHtml;
        
        // Process the content to make it compatible with our editor
        processContentForEditor(tempDiv);
        
        // Insert the processed content
        document.execCommand('insertHTML', false, tempDiv.innerHTML);
      } 
      // Fallback to plain text
      else if (text) {
        // For plain text, we'll convert line breaks to <br> or new paragraphs
        const formattedText = formatPlainText(text);
        document.execCommand('insertHTML', false, formattedText);
      }
      
      // Update editor content in state
      if (editorRef.current) {
        setContent(editorRef.current.innerHTML);
        
        // Update cursor position
        const newSelection = window.getSelection();
        if (newSelection.rangeCount > 0) {
          const newRange = newSelection.getRangeAt(0);
          const newPos = getCharacterOffsetWithin(editorRef.current, newRange);
          setCursorPosition(newPos);
        }
        
        // Trigger content update reference for other components
        if (setContentUpdateRef) {
          setContentUpdateRef(prev => !prev);
        }
      }
    };
    
    // Helper function to process HTML content for editor compatibility
    const processContentForEditor = (element) => {
      // Remove any unwanted elements or attributes
      const nodes = element.querySelectorAll('*');
      nodes.forEach(node => {
        // Remove empty nodes except for <br>
        if (node.tagName !== 'BR' && !node.textContent.trim()) {
          node.parentNode.removeChild(node);
          return;
        }
        
        // Convert divs to paragraphs
        if (node.tagName === 'DIV') {
          const p = document.createElement('p');
          p.innerHTML = node.innerHTML;
          node.parentNode.replaceChild(p, node);
        }
        
        // Handle specific styles or classes
        if (node.style) {
          // Convert font-weight: bold to <strong>
          if (node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight) >= 600) {
            const strong = document.createElement('strong');
            strong.innerHTML = node.innerHTML;
            node.parentNode.replaceChild(strong, node);
          }
          
          // Convert font-style: italic to <em>
          if (node.style.fontStyle === 'italic') {
            const em = document.createElement('em');
            em.innerHTML = node.innerHTML;
            node.parentNode.replaceChild(em, node);
          }
        }
      });
    };
    
    // Helper function to format plain text
    const formatPlainText = (text) => {
      // Convert newlines to <br> tags
      return text.replace(/\n/g, '<br>');
    };
    
    // Helper function to get cursor position
    const getCharacterOffsetWithin = (element, range) => {
      let charCount = 0;
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while ((node = walker.nextNode())) {
        if (node === range.endContainer) {
          charCount += range.endOffset;
          break;
        }
        charCount += node.textContent.length;
      }
      
      return charCount;
    };
    
    // Attach the paste event handler
    editorRef.current.addEventListener('paste', handlePaste);
    
    // Clean up
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('paste', handlePaste);
      }
    };
  }, [editorRef, setContent, setCursorPosition, setContentUpdateRef]);
  
  // This component doesn't render anything
  return null;
}
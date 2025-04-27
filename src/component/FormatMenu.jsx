import { useRef } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

export default function FormatMenu({ position, setShowFormatMenu }) {
  const formatMenuRef = useRef(null);
  
  // Format selected text
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    setShowFormatMenu(false);
    
    // Focus back on the editor
    const editor = document.querySelector('.editor-content');
    editor?.focus();
    
    // Update content state after formatting
    if (editor) {
      const event = new Event('input', { bubbles: true });
      editor.dispatchEvent(event);
    }
  };

  return (
    <div 
      ref={formatMenuRef}
      className="format-menu"
      style={{ top: position.top, left: position.left }}
    >
      <button className="format-menu-btn" onClick={() => formatText('bold')}>
        <Bold size={16} />
      </button>
      <button className="format-menu-btn" onClick={() => formatText('italic')}>
        <Italic size={16} />
      </button>
      <button className="format-menu-btn" onClick={() => formatText('underline')}>
        <Underline size={16} />
      </button>
    </div>
  );
}
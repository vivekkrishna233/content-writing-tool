import { Bold, Italic, Underline, List, Code, Quote, Heading1, Heading2 } from 'lucide-react';

export default function EditorToolbar() {
  // Format selected text
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    
    // Update content state after formatting
    const editor = document.querySelector('.editor-content');
    if (editor) {
      // We'll let the EditorContent component handle the state updates
      const event = new Event('input', { bubbles: true });
      editor.dispatchEvent(event);
    }
    
    // Focus back on the editor
    editor?.focus();
  };
  
  return (
    <div className="editor-toolbar">
      <button className="toolbar-btn" onClick={() => formatText('bold')}>
        <Bold size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('italic')}>
        <Italic size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('underline')}>
        <Underline size={16} />
      </button>
      <span className="toolbar-divider"></span>
      <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<h1>')}>
        <Heading1 size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<h2>')}>
        <Heading2 size={16} />
      </button>
      <span className="toolbar-divider"></span>
      <button className="toolbar-btn" onClick={() => formatText('insertUnorderedList')}>
        <List size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<pre>')}>
        <Code size={16} />
      </button>
      <button className="toolbar-btn" onClick={() => formatText('formatBlock', '<blockquote>')}>
        <Quote size={16} />
      </button>
    </div>
  );
}
import './ComponentPropertiesModal.css';

export default function ComponentPropertiesModal({ 
  selectedComponent, 
  updateComponentProperty, 
  setComponentPropsMenu,
  darkMode
}) {
  if (!selectedComponent) return null;
  
  const { type, properties, id } = selectedComponent;
  
  const renderPropertyFields = () => {
    switch (type) {
      case 'Button':
        return (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Button Text</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded text-gray-800"
                onChange={(e) => updateComponentProperty(id, 'text', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Button Color</label>
              <input 
                type="color" 
                className="p-1 border rounded"
                onChange={(e) => updateComponentProperty(id, 'color', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Action (JavaScript)</label>
              <textarea 
                className="w-full p-2 border rounded font-mono h-20 text-gray-800"
                onChange={(e) => updateComponentProperty(id, 'action', e.target.value)}
              />
            </div>
          </>
        );

      case 'Callout':
        return (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Text</label>
              <textarea 
                className="w-full p-2 border rounded h-20 text-gray-800"
                onChange={(e) => updateComponentProperty(id, 'text', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Type</label>
              <select 
                className="w-full p-2 border rounded text-gray-800"
                onChange={(e) => updateComponentProperty(id, 'type', e.target.value)}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
            </div>
          </>
        );

      case 'Code':
        return (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Language</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded text-gray-800"
                onChange={(e) => updateComponentProperty(id, 'language', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Code</label>
              <textarea 
                className="w-full p-2 border rounded font-mono h-40 text-gray-800"
                onChange={(e) => updateComponentProperty(id, 'code', e.target.value)}
              />
            </div>
          </>
        );

      case 'Quote':
        return (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Quote Text</label>
              <textarea 
                className="w-full p-2 border rounded h-20 text-gray-800"
                onChange={(e) => updateComponentProperty(id, 'text', e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Author</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded text-gray-800"
                onChange={(e) => updateComponentProperty(id, 'author', e.target.value)}
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className={`modal-content ${darkMode ? 'dark' : ''}`}>
        <h2 className="modal-title">{type} Properties</h2>
        
        {renderPropertyFields()}
        
        <div className="modal-actions">
          <button 
            className="btn-secondary"
            onClick={() => setComponentPropsMenu(false)}
          >
            Cancel
          </button>
          <button 
            className="btn-primary"
            onClick={() => setComponentPropsMenu(false)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

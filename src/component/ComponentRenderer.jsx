import { Maximize } from 'lucide-react';

export default function ComponentRenderer({ 
  component, 
  startDrag, 
  setSelectedComponent, 
  setComponentPropsMenu 
}) {
  const { type, properties, id } = component;
  
  switch (type) {
    case 'Button':
      return (
        <div className="relative group">
          <button 
            className="px-4 py-2 rounded text-white font-medium"
            style={{ backgroundColor: properties.color }}
            onClick={() => eval(properties.action)}
          >
            {properties.text}
          </button>
          <div 
            className="absolute -top-2 -left-2 bg-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-move"
            onMouseDown={(e) => startDrag(e, component)}
          >
            <Maximize size={12} />
          </div>
          <div 
            className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
            onClick={() => {
              setSelectedComponent(component);
              setComponentPropsMenu(true);
            }}
          >
            ✏️
          </div>
        </div>
      );
    
    case 'Callout':
      const calloutColors = {
        info: 'callout-info',
        warning: 'callout-warning',
        error: 'callout-error',
        success: 'callout-success'
      };
      
      return (
        <div className={`relative group callout ${calloutColors[properties.type]}`}>
          <div>{properties.text}</div>
          <div 
            className="absolute -top-2 -left-2 bg-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-move"
            onMouseDown={(e) => startDrag(e, component)}
          >
            <Maximize size={12} />
          </div>
          <div 
            className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
            onClick={() => {
              setSelectedComponent(component);
              setComponentPropsMenu(true);
            }}
          >
            ✏️
          </div>
        </div>
      );
      
    case 'Code':
      return (
        <div className="relative group">
          <div className="code-block">
            <div className="code-language">{properties.language}</div>
            <pre>{properties.code}</pre>
          </div>
          <div 
            className="absolute -top-2 -left-2 bg-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-move"
            onMouseDown={(e) => startDrag(e, component)}
          >
            <Maximize size={12} />
          </div>
          <div 
            className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
            onClick={() => {
              setSelectedComponent(component);
              setComponentPropsMenu(true);
            }}
          >
            ✏️
          </div>
        </div>
      );
      
    case 'Quote':
      return (
        <div className="relative group">
          <blockquote className="quote-block">
            <p>{properties.text}</p>
            <footer>— {properties.author}</footer>
          </blockquote>
          <div 
            className="absolute -top-2 -left-2 bg-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-move"
            onMouseDown={(e) => startDrag(e, component)}
          >
            <Maximize size={12} />
          </div>
          <div 
            className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
            onClick={() => {
              setSelectedComponent(component);
              setComponentPropsMenu(true);
            }}
          >
            ✏️
          </div>
        </div>
      );
      
    default:
      return null;
  }
}
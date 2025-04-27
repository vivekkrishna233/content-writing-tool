import { useRef } from 'react';

export default function ComponentMenu({ position, insertComponent, setShowComponentMenu }) {
  const componentMenuRef = useRef(null);

  return (
    <div 
      ref={componentMenuRef}
      className="component-menu"
      style={{ top: position.top, left: position.left }}
    >
      <div className="component-menu-title">Insert Component</div>
      <button className="component-menu-btn" onClick={() => insertComponent('Button')}>
        Button
      </button>
      <button className="component-menu-btn" onClick={() => insertComponent('Callout')}>
        Callout
      </button>
      <button className="component-menu-btn" onClick={() => insertComponent('Code')}>
        Code Block
      </button>
      <button className="component-menu-btn" onClick={() => insertComponent('Quote')}>
        Quote
      </button>
    </div>
  );
}
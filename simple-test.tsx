import React from 'react';
import ReactDOM from 'react-dom/client';

const SimpleTest = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>Pan React Test</h1>
      <p>If you see this, React is working!</p>
      <p>This should be a black page with white text.</p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<SimpleTest />);

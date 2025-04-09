import React from 'react';
import './BrightnessWidget.css';

function BrightnessWidget({ brightness }) {
  // Normalize brightness to a percentage (0-100)
  const brightnessPercent = Math.min(Math.max(brightness, 0), 100);

  return (
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>
        Room Darkness
      </h3>
      <div style={{ marginTop: '40px', fontWeight: 'bold' }}>
      </div>
    <div className="brightness-widget">
      
      <div className="brightness-bar-container">
        <div 
          className="brightness-bar" 
          style={{ width: `${brightnessPercent}` }}
        />
      </div>
      <div className="brightness-value">{brightnessPercent}</div>
    </div>
    <div style={{ marginTop: '130px', fontWeight: 'bold' }}>
      </div>
      </div>
  );
}

export default BrightnessWidget;

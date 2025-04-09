import React from 'react';
import './LightWidget.css';
// Import your light bulb images (adjust the paths as needed)
import bulbOff from './images/bulb_off.jpg';
import bulbOn from './images/bulb_on.jpg';

function LightWidget({ status, percent }) {
  // Determine if the light is on with a case-insensitive check
  const isOn = typeof status === 'string' ? status.toLowerCase() === 'on' : false;

  return (
    <div className="light-widget">
      <img
        src={isOn ? bulbOn : bulbOff}
        alt="Light Bulb"
        className={`bulb-image ${isOn ? 'glow' : ''}`}
      />
      <p className="light-status">{isOn ? 'On' : 'Off'}</p>
      <p className="light-percentage">Usage: {percent}%</p>
    </div>
  );
}

export default LightWidget;

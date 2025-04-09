import React, { useState } from 'react';
import io from 'socket.io-client';
import './ControlsPage.css'; // Import the external CSS file
import fan from './images/fan.png';

// Connect to your backend server (adjust the URL/port as needed)
const socket = io('http://localhost:3000');

function ControlsPage() {
  // false means "off" for fan and LED; true means "on"
  const [fanState, setFanState] = useState(false);
  const [ledState, setLedState] = useState(false);
  // When autoControl is true, manual controls are disabled.
  const [autoControl, setAutoControl] = useState(true);

  // Toggle fan if manual control is enabled
  const handleFanToggle = () => {
    if (!autoControl) {
      const newFanState = !fanState;
      setFanState(newFanState);
      // Emit the fan status as a JSON object
      socket.emit('control_update', { fan: { status: newFanState ? 'on' : 'off' } });
    }
  };

  // Toggle LED if manual control is enabled
  const handleLedToggle = () => {
    if (!autoControl) {
      const newLedState = !ledState;
      setLedState(newLedState);
      // Emit the LED (light) status as a JSON object
      socket.emit('control_update', { led: { status: newLedState ? 'on' : 'off' } });
    }
  };

  // Toggle automatic climate control.
  // When enabling automatic control, ensure fan and LED are turned off.
  const handleAutoControlToggle = () => {
    const newAutoControl = !autoControl;
    setAutoControl(newAutoControl);
    // Emit the control mode as a JSON object (automatic or manual)
    socket.emit('control_update', { control: { status: newAutoControl ? 'automatic' : 'manual' } });

    // If automatic control is enabled, turn off fan and LED immediately.
    if (newAutoControl) {
      if (fanState) {
        setFanState(false);
        socket.emit('control_update', { fan: { status: 'off' } });
      }
      if (ledState) {
        setLedState(false);
        socket.emit('control_update', { led: { status: 'off' } });
      }
    }
  };

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
        <h1 className="controls-title">Smart Home Control Panel</h1>
        <p style={{ fontFamily: 'cursive' }}>Manage your home devices effortlessly</p>
      </header>
      
      <div className="boxs-container">
        <div className="auto-control-container">
          <button className="auto-control-btn" onClick={handleAutoControlToggle}>
            {autoControl ? 'Disable' : 'Enable'} Automatic Climate Control
          </button>
        </div>
        <div className="controls">
          {/* Fan Button */}
          <button className="control-btn" onClick={handleFanToggle} disabled={autoControl}>
            <div className="fan-container">
              <img 
                src={fan}
                alt="Fan Blades" 
                className={`fan-blades ${fanState ? 'rotate' : ''}`}
              />
            </div>
            <span>Fan: {fanState ? 'On' : 'Off'}</span>
          </button>
          {/* Light Button */}
          <button className="control-btn" onClick={handleLedToggle} disabled={autoControl}>
            <img 
              src="https://img.icons8.com/fluency/96/000000/light-on.png" 
              alt="Light Icon" 
              className={`icon light-icon ${ledState ? 'glow' : ''}`}
            />
            <span>Light: {ledState ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ControlsPage;

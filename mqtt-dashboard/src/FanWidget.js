import React, { useEffect, useRef } from 'react';
import './FanWidget.css';

function FanWidget({ status, percent }) {
  // Provide a safe fallback for status
  const displayedStatus = status ? status.toUpperCase() : 'OFF';

  // Use a ref for the rotation value that is updated in the animation loop.
  const rotationRef = useRef(0);
  // Ref for the DOM element to update its style directly.
  const fanRef = useRef(null);
  const speedRef = useRef(360); // Full speed in degrees per second
  const previousTimeRef = useRef();
  const statusRef = useRef(status);

  // Update statusRef and reset speed when fan turns on.
  useEffect(() => {
    statusRef.current = status;
    if (status === 'on') {
      speedRef.current = 360;
    }
  }, [status]);

  const animate = (time) => {
    if (previousTimeRef.current != null) {
      const deltaTime = time - previousTimeRef.current;
      // Update rotation value
      rotationRef.current = (rotationRef.current + speedRef.current * (deltaTime / 1000)) % 360;
      
      // Directly update the fan element's transform via ref
      if (fanRef.current) {
        fanRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }
      
      // If the fan is off, gradually decelerate.
      if (statusRef.current === 'off') {
        speedRef.current = speedRef.current * 0.98;
        if (speedRef.current < 1) {
          speedRef.current = 0;
        }
      }
    }
    previousTimeRef.current = time;
    requestAnimationFrame(animate);
  };

  // Start the animation loop when the component mounts.
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="fan-widget-container">
      <h3 className="fan-title">Fan Status</h3>
      <div className="fan-widget-header">
        <span className="fan-percentage">Usage: {percent}%</span>
      </div>
      <div className="fan-wrapper">
        <div
          className="fan"
          ref={fanRef}  // Assign the ref to the div that rotates
        >
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Outer circle */}
            <circle cx="60" cy="60" r="55" className="fan-outer-circle" />
            {/* Fan blades group */}
            <g className="fan-blades-group">
              {/* Blade template */}
              <g id="blade">
                <path d="M60,60 L60,20 A20,20 0 0,1 80,40 Z" />
              </g>
              {/* Cloned blades */}
              <use href="#blade" transform="rotate(0,60,60)" />
              <use href="#blade" transform="rotate(90,60,60)" />
              <use href="#blade" transform="rotate(180,60,60)" />
              <use href="#blade" transform="rotate(270,60,60)" />
            </g>
            {/* Center hub */}
            <circle cx="60" cy="60" r="5" className="fan-center-hub" />
          </svg>
        </div>
      </div>
      <div className="fan-status-text">{displayedStatus}</div>
    </div>
  );
}

export default FanWidget;

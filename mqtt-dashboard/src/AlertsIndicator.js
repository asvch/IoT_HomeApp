import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import './AlertsIndicator.css'; // Contains blinking and modal styles

const socket = io('http://localhost:3000');

function AlertsIndicator() {
  const [blink, setBlink] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const handleAlert = (data) => {
      console.log("Received mqtt_message event:", data);
      
      // Only handle alert topics
      if (
        data.topic === 'Alert_temp' ||
        data.topic === 'Alert_humidity' ||
        data.topic === 'Alert_brightness'
      ) {
        let alertStatus = '';
        try {
          // Try parsing the JSON payload, e.g., {"status": "on"}
          const parsed = JSON.parse(data.message);
          if (parsed.status) {
            alertStatus = parsed.status.toLowerCase();
          }
        } catch (e) {
          console.warn(`Could not parse alert JSON for topic ${data.topic}: ${e.message}`);
          alertStatus = data.message.toLowerCase();
        }
        console.log(`Parsed alert status for ${data.topic}: ${alertStatus}`);
        
        // If status is "on", trigger blinking
        if (alertStatus === 'on') {
          // Force re-trigger: turn off then shortly on
          setBlink(false);
          setTimeout(() => {
            setBlink(true);
          }, 50);
        }
      }
    };

    // Listen to the event that the server emits.
    socket.on('mqtt_message', handleAlert);
    return () => {
      socket.off('mqtt_message', handleAlert);
    };
  }, []);

  const handleClick = async () => {
    setBlink(false);
    setShowModal(true);
    try {
      const response = await fetch('http://localhost:3000/alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleClearAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3000/clear_alerts', {
        method: 'POST'
      });
      const data = await response.json();
      console.log(data.message);
      setAlerts([]);
    } catch (error) {
      console.error('Error clearing alerts:', error);
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={closeModal}>X</button>
        <h2>Alert Records</h2>
        <table>
          <thead>
            <tr>
              <th>Sensor</th>
              <th>Value</th>
              <th>Date</th>
              <th>Time</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <tr key={index}>
                  <td>{alert.sensor}</td>
                  <td>{alert.value}</td>
                  <td>{alert.date}</td>
                  <td>{alert.time}</td>
                  <td>{alert.location}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No alerts available.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ marginTop: '10px', textAlign: 'right' }}>
          <button className="clear-button" onClick={handleClearAlerts}>Clear Alerts</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <span 
        onClick={handleClick} 
        className={blink ? 'blink-alert' : ''} 
        style={{ display: 'inline-block', cursor: 'pointer' }}
      >
        Alerts
      </span>
      {showModal && ReactDOM.createPortal(modalContent, document.body)}
    </>
  );
}

export default AlertsIndicator;

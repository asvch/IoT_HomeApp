import React, { useState, useEffect } from 'react';

function AlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:3000/alerts');
        const data = await response.json();
        // Assuming the backend returns { alerts: [ ... ] }
        setAlerts(data.alerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Alert Records</h2>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
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
              <td colSpan="5">No alerts available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AlertsPage;
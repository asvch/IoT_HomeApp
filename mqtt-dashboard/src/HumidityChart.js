import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import socketIOClient from 'socket.io-client';

// Endpoint for Socket.IO server
const ENDPOINT = "http://localhost:3000";

function HumidityChart() {
  // Load initial chart data from localStorage or use empty data
  const [chartData, setChartData] = useState(() => {
    const savedData = localStorage.getItem('humidityChartData');
    return savedData ? JSON.parse(savedData) : {
      labels: [],
      datasets: [{
        label: 'Humidity (%)',
        data: [],
        fill: false,
        backgroundColor: 'blue',
        borderColor: 'blue',
      }]
    };
  });

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT, { transports: ["websocket"] });

    // Listen for MQTT messages for humidity
    socket.on('mqtt_message', (data) => {
      if (data.topic === 'sensors/humidity') {
        try {
          const dataObj = JSON.parse(data.message);
          const humidityValue = parseFloat(dataObj.humidity);
          if (!isNaN(humidityValue)) {
            const currentTime = new Date().toLocaleTimeString();
            setChartData(prevData => {
              const newLabels = [...prevData.labels, currentTime];
              const newData = [...prevData.datasets[0].data, humidityValue];
              // Keep only the last 10 data points
              if (newLabels.length > 10) {
                newLabels.shift();
                newData.shift();
              }

              // Persist updated chart data in localStorage
              const updatedChartData = {
                labels: newLabels,
                datasets: [{
                  ...prevData.datasets[0],
                  data: newData,
                }]
              };
              localStorage.setItem('humidityChartData', JSON.stringify(updatedChartData));
              return updatedChartData;
            });
          }
        } catch (error) {
          console.error("Error parsing humidity data", error);
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <h5>Humidity vs. Time</h5>
      <Line data={chartData} />
    </div>
  );
}

export default HumidityChart;

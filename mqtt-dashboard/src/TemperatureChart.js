import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import socketIOClient from 'socket.io-client';

const ENDPOINT = "http://localhost:3000";

function TemperatureChart() {
  // Load initial chart data from localStorage or use empty data
  const [chartData, setChartData] = useState(() => {
    const savedData = localStorage.getItem('temperatureChartData');
    return savedData ? JSON.parse(savedData) : {
      labels: [],
      datasets: [{
        label: 'Temperature (F)',
        data: [],
        fill: false,
        backgroundColor: 'red',
        borderColor: 'red',
      }]
    };
  });

  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = socketIOClient(ENDPOINT, { transports: ["websocket"] });

    // Listen for MQTT messages for temperature
    socket.on('mqtt_message', (data) => {
      if (data.topic === 'sensors/temperature') {
        try {
          const dataObj = JSON.parse(data.message);
          const tempValue = parseFloat(dataObj.temperature);
          if (!isNaN(tempValue)) {
            // Use current time as label
            const currentTime = new Date().toLocaleTimeString();
            setChartData(prevData => {
              const newLabels = [...prevData.labels, currentTime];
              const newData = [...prevData.datasets[0].data, tempValue];
              
              // Limit to last 20 data points
              if (newLabels.length > 20) {
                newLabels.splice(0, newLabels.length - 20);
                newData.splice(0, newData.length - 20);
              }

              // Persist updated chart data in localStorage
              const updatedChartData = {
                labels: newLabels,
                datasets: [{
                  ...prevData.datasets[0],
                  data: newData
                }]
              };
              localStorage.setItem('temperatureChartData', JSON.stringify(updatedChartData));
              return updatedChartData;
            });
          }
        } catch (error) {
          console.error("Error parsing temperature data", error);
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <h5>Temperature vs. Time</h5>
      <Line data={chartData} />
    </div>
  );
}

export default TemperatureChart;

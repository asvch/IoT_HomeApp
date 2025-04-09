import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import socketIOClient from 'socket.io-client';

const ENDPOINT = "http://localhost:3000";

function BrightnessChart() {
  // Load initial chart data from localStorage or use empty data
  const [chartData, setChartData] = useState(() => {
    const savedData = localStorage.getItem('brightnessChartData');
    return savedData ? JSON.parse(savedData) : {
      labels: [],
      datasets: [{
        label: 'Brightness',
        data: [],
        fill: false,
        backgroundColor: 'orange',
        borderColor: 'orange',
      }]
    };
  });

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT, { transports: ["websocket"] });

    // Listen for MQTT messages for brightness
    socket.on('mqtt_message', (data) => {
      if (data.topic === 'sensors/ldr') {
        try {
          const dataObj = JSON.parse(data.message);
          const brightnessValue = parseFloat(dataObj.brightness);
          if (!isNaN(brightnessValue)) {
            const currentTime = new Date().toLocaleTimeString();
            setChartData(prevData => {
              const newLabels = [...prevData.labels, currentTime];
              const newData = [...prevData.datasets[0].data, brightnessValue];
              // Keep only the last 20 data points
              if (newLabels.length > 20) {
                newLabels.splice(0, newLabels.length - 20);
                newData.splice(0, newData.length - 20);
              }

              // Persist updated chart data in localStorage
              const updatedChartData = {
                labels: newLabels,
                datasets: [{
                  ...prevData.datasets[0],
                  data: newData,
                }]
              };
              localStorage.setItem('brightnessChartData', JSON.stringify(updatedChartData));
              return updatedChartData;
            });
          }
        } catch (error) {
          console.error("Error parsing brightness data", error);
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <h5>Darkness vs. Time</h5>
      <Line data={chartData} />
    </div>
  );
}

export default BrightnessChart;
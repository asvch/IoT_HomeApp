import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import socketIOClient from 'socket.io-client';

const ENDPOINT = "http://localhost:3000";

function FanChart() {
  // Load initial chart data from localStorage or use empty data
  const [chartData, setChartData] = useState(() => {
    const savedData = localStorage.getItem('fanChartData');
    return savedData ? JSON.parse(savedData) : {
      labels: [],
      datasets: [{
        label: 'Fan State (On=1, Off=0)',
        data: [],
        fill: false,
        backgroundColor: 'purple',
        borderColor: 'purple',
      }]
    };
  });

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT, { transports: ["websocket"] });
    socket.on('mqtt_message', (data) => {
      if (data.topic === 'sensors/fan') {
        try {
          const dataObj = JSON.parse(data.message);
          const state = dataObj.status;
          const numericState = state === 'on' ? 1 : 0;
          const currentTime = new Date().toLocaleTimeString();
          setChartData(prev => {
            const newLabels = [...prev.labels, currentTime];
            const newData = [...prev.datasets[0].data, numericState];
            // Keep only the last 10 data points
            if (newLabels.length > 10) {
              newLabels.shift();
              newData.shift();
            }

            // Persist updated chart data in localStorage
            const updatedChartData = {
              labels: newLabels,
              datasets: [{
                ...prev.datasets[0],
                data: newData,
              }]
            };
            localStorage.setItem('fanChartData', JSON.stringify(updatedChartData));
            return updatedChartData;
          });
        } catch (error) {
          console.error("Error parsing fan state data", error);
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <h5>Fan State vs. Time</h5>
      <Line data={chartData} />
    </div>
  );
}

export default FanChart;

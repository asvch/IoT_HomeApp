// LightStateChart.js
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import socketIOClient from 'socket.io-client';

const ENDPOINT = "http://localhost:3000";

function LightStateChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Light State (On=1, Off=0)',
      data: [],
      fill: false,
      backgroundColor: 'blue',
      borderColor: 'blue',
    }]
  });

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT, { transports: ["websocket"] });
    socket.on('mqtt_message', (data) => {
      if (data.topic === 'sensors/light') {
        // Assume data.message is a JSON string with property "status"
        try {
          const dataObj = JSON.parse(data.message);
          const status = dataObj.status === 'on' ? 1 : 0;
          const currentTime = new Date().toLocaleTimeString();
          setChartData(prevData => {
            const newLabels = [...prevData.labels, currentTime];
            const newData = [...prevData.datasets[0].data, status];
            if (newLabels.length > 20) {
              newLabels.splice(0, newLabels.length - 20);
              newData.splice(0, newData.length - 20);
            }
            return {
              labels: newLabels,
              datasets: [{
                ...prevData.datasets[0],
                data: newData
              }]
            };
          });
        } catch (error) {
          console.error("Error parsing light status data", error);
        }
      }
    });
    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <h5>Light State vs. Time</h5>
      <Line data={chartData} />
    </div>
  );
}

export default LightStateChart;

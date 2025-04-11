import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import socketIOClient from 'socket.io-client';

const endpoint = "http://localhost:3000";

function DarknessChart() {
  // we are loading initial chart data from localStorage and useState keep updating the chart
  const [c, setChart] = useState(() => {
    const s = localStorage.getItem('darknessChartData');
    return s
      ? JSON.parse(s)
      : {
          labels: [],
          datasets: [{
            label: 'Darkness',
            data: [],
            fill: false,
            backgroundColor: 'black',
            borderColor: 'black',
          }]
        };
  });

  //initializing socket
  useEffect(() => {
    const socket = socketIOClient(endpoint, { transports: ["websocket"] });

    // We are listening for MQTT messages on the sensors/ldr topic.
    // We are assuming that the sensor sends a value (float) that directly represents darkness.
    socket.on('mqtt_message', (data) => {
      if (data.topic === 'sensors/ldr') {
        try {
          const dataObj = JSON.parse(data.message);
          const d = parseFloat(dataObj.darkness);
          if (!isNaN(d)) {
            //We  use the sensor value directly as darkness (a decimal between 0 and 1)
            const darkValue = d;
            const cTime = new Date().toLocaleTimeString();

            setChart(prevData => {
              const newLabels = prevData.labels.concat(cTime);
              const newData = prevData.datasets[0].data.concat(darkValue);
              // Keeping only the last 10 data points.
              if (newLabels.length > 10) {
                newLabels.splice(0, newLabels.length - 10);
                newData.splice(0, newData.length - 10);
              }
              //update the chart data 
              const charts = {
                labels: newLabels,
                datasets: [
                  Object.assign({}, prevData.datasets[0], { data: newData })
                ]
              };
              //push chartdata into localstorage
              localStorage.setItem('darknessChartData', JSON.stringify(charts));
              return charts;
            });
          }
        } catch (error) {
          console.error("Error parsing LDR sensor data", error);
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <h5>Darkness vs. Time</h5>
      <Line data={c} />
    </div>
  );
}

export default DarknessChart;

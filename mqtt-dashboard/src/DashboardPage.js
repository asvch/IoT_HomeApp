import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
// Imports for Widgets/displays
import TemperatureWidget from './TemperatureWidget';
import FanWidget from './FanWidget';
import BrightnessWidget from './BrightnessWidget';
import HumidityWidget from './HumidityWidget';
import LightWidget from './LightWidget';
// Imports for charts
import TemperatureChart from './TemperatureChart';
import FanChart from './FanChart';
import BrightnessChart from './BrightnessChart';
import HumidityChart from './HumidityChart';
import LightStateChart from './LightStateChart';
// Import for styling
import './DashboardPage.css';

const ENDPOINT = "http://localhost:3000";

function DashboardPage() {
  // Sensor state variables retrieved from localStorage (or defaults)
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem('temperature');
    return saved ? parseFloat(saved) : 0;
  });

  const [fanStatus, setFanstatus] = useState(() => localStorage.getItem('fanStatus') || 'off');

  const [brightness, setBrightness] = useState(() => {
    const saved = localStorage.getItem('brightness');
    return saved ? parseFloat(saved) : 0;
  });

  const [humidity, setHumidity] = useState(() => {
    const saved = localStorage.getItem('humidity');
    return saved ? parseFloat(saved) : 0;
  });

  const [lightStatus, setLightstatus] = useState(() => localStorage.getItem('lightStatus') || 'off'); 

  // New state for usage percentages
  const [fanPercent, setFanpercent] = useState(() => {
    const saved = localStorage.getItem('fanPercent');
    return saved ? parseFloat(saved) : 0;
  });
  const [lightPercent, setLightpercent] = useState(() => {
    const saved = localStorage.getItem('lightPercent');
    return saved ? parseFloat(saved) : 0;
  });

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT, { transports: ["websocket"] });

    socket.on('connect', () => {
      console.log('Connected to WebSocket with id:', socket.id);
    });

    socket.on('mqtt_message', (data) => {
      console.log('Received mqtt_message from backend server.js:', data);

      // Process sensor topics
      if (data.topic === 'sensors/temperature') {
        try {
          const dataObject = JSON.parse(data.message);
          const tempValue = parseFloat(dataObject.temperature);
          if (!isNaN(tempValue)) {
            setTemperature(tempValue);
            localStorage.setItem('temperature', tempValue);
          }
        } catch (err) {
          console.error('Error parsing temperature:', err);
        }
      }

      if (data.topic === 'sensors/fan') {
        try {
          const dataObject = JSON.parse(data.message);
          const status = dataObject.status;
          if (status === 'on' || status === 'off') {
            setFanstatus(status);
            localStorage.setItem('fanStatus', status);
          }
        } catch (err) {
          console.error('Error parsing fan status:', err);
        }
      }

      if (data.topic === 'sensors/ldr') {
        try {
          const dataObject = JSON.parse(data.message);
          const brightValue = parseFloat(dataObject.brightness);
          if (!isNaN(brightValue)) {
            setBrightness(brightValue);
            localStorage.setItem('brightness', brightValue);
          }
        } catch (err) {
          console.error('Error parsing brightness value:', err);
        }
      }

      if (data.topic === 'sensors/humidity') {
        try {
          const dataObject = JSON.parse(data.message);
          const humidValue = parseFloat(dataObject.humidity);
          if (!isNaN(humidValue)) {
            setHumidity(humidValue);
            localStorage.setItem('humidity', humidValue);
          }
        } catch (err) {
          console.error('Error parsing humidity:', err);
        }
      }

      if (data.topic === 'sensors/light') {
        try {
          const dataObject = JSON.parse(data.message);
          const status = dataObject.status;
          if (status === 'on' || status === 'off') {
            setLightstatus(status);
            localStorage.setItem('lightStatus', status);
          }
        } catch (err) {
          console.error('Error parsing light status:', err);
        }
      }

      // Process fan usage percentage
      if (data.topic === 'fan_usage_percentage') {
        try {
          const dataObject = JSON.parse(data.message);
          const fanPct = parseFloat(dataObject.percentage);
          if (!isNaN(fanPct)) {
            setFanpercent(fanPct);
            localStorage.setItem('fanPercent', fanPct);
          }
        } catch (err) {
          console.error('Error parsing fan usage percentage:', err);
        }
      }

      // Process light usage percentage
      if (data.topic === 'light_usage_percentage') {
        try {
          const dataObject = JSON.parse(data.message);
          const lightPct = parseFloat(dataObject.percentage);
          if (!isNaN(lightPct)) {
            setLightpercent(lightPct);
            localStorage.setItem('lightPercent', lightPct);
          }
        } catch (err) {
          console.error('Error parsing light usage percentage:', err);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => socket.disconnect();
  }, []); // Empty dependency array: run once on mount

  return (
    <div className="db-box">
      <h1 className="db-title">Home Controls</h1>
      <div className="sen-box">
        <div className="box-div">
          <div className="widget-box">
            {/* Temperature Widget */}
            <div className="widget-comp">
              <TemperatureWidget temperature={temperature} />
              <div className="chart-comp">
                <TemperatureChart />
              </div>
            </div>

            {/* Fan Widget */}
            <div className="widget-comp">
              <FanWidget status={fanStatus} percent={fanPercent} />
              <div className="chart-comp">
                <FanChart />
              </div>
            </div>

            {/* Brightness Widget */}
            <div className="widget-comp">
              <BrightnessWidget brightness={brightness} />
              <div className="chart-comp">
                <BrightnessChart />
              </div>
            </div>

            {/* Humidity Widget */}
            <div className="widget-comp">
              <HumidityWidget humidity={humidity} />
              <div className="chart-comp">
                <HumidityChart />
              </div>
            </div>

            {/* Light Widget */}
            <div className="widget-comp">
              <LightWidget status={lightStatus} percent={lightPercent} />
              <div className="chart-comp">
                <LightStateChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

// Load environment variables from the .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const AWS = require('aws-sdk');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env['Frontend'] || 'http://localhost:3001',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory state: alert records and sensor data
const alertRecords = [];
let latestTemperature = null;
let latestHumidity = null;
let latestBrightness = null;
let fanStatus = null;
let lightStatus = null;
let latestFanpercent = null;
let latestLightpercent = null;

const PORT = process.env['Port'] || 3000;

// MQTT connection info from .env variables
const MQTT_HOST = process.env['Mqtt-Host'];
const MQTT_PORT = parseInt(process.env['Mqtt-Port'], 10) || 8883;
const CLIENT_ID = (process.env['Mqtt-Client-Id'] || 'mqtt_webapp_client_random_id') + '_' + Math.floor((Math.random() * 100000) + 1);

// Load MQTT TLS certificate files from paths specified in .env
const KEY = fs.readFileSync(path.resolve(__dirname, process.env['Cert-Path']));
const CERT = fs.readFileSync(path.resolve(__dirname, process.env['Cert-Path2']));
const CA = fs.readFileSync(path.resolve(__dirname, process.env['Cert-Path3']));

// Express setup with CORS
app.use(cors({
  origin: process.env['Frontend'] || 'http://localhost:3001',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// MQTT connection
const mqttClient = mqtt.connect({
  host: MQTT_HOST,
  port: MQTT_PORT,
  protocol: 'mqtts',
  clientId: CLIENT_ID,
  key: KEY,
  cert: CERT,
  ca: CA
});

const topicGroups = [
  [
    'sensors/temperature',
    'sensors/humidity',
    'sensors/ldr',
    'sensors/fan',
    'sensors/light'
  ],
  [
    'Alert_temp',
    'Alert_humidity',
    'Alert_brightness'
  ],
  [
    'fan_usage_percentage',
    'light_usage_percentage'
  ]
];

mqttClient.on('connect', () => {
  console.log('✅ Connected to AWS IoT Core');
  topicGroups.forEach((group) => {
    mqttClient.subscribe(group, (err) => {
      if (err) {
        console.error('❌ Subscription error for group:', group, err);
      } else {
        console.log('📡 Subscribed to group:', group);
      }
    });
  });
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT connection error:', err);
});

// AWS SNS configuration using environment variables from .env
AWS.config.update({
  region: process.env['Aws-Reg'],
  accessKeyId: process.env['Aws-Access-Key'],
  secretAccessKey: process.env['Aws-Secret-Access-Key']
});
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
const SNS_TOPIC_ARN = process.env['Arn'];

// MQTT message handler
mqttClient.on('message', (topic, message) => {
  const msg = message.toString().trim();
  console.log(`📥 MQTT [${topic}]: ${msg}`);

  // Process sensor topics by parsing the JSON payload
  try {
    const dataObj = JSON.parse(msg);
    if (topic === 'sensors/temperature') {
      latestTemperature = parseFloat(dataObj.temperature);
    } else if (topic === 'sensors/humidity') {
      latestHumidity = parseFloat(dataObj.humidity);
    } else if (topic === 'sensors/ldr') {
      latestBrightness = parseFloat(dataObj.brightness);
    } else if (topic === 'sensors/fan') {
      fanStatus = dataObj.status?.toLowerCase();
      console.log(`🌀 Fan status updated: ${fanStatus}`);
      io.emit('fan_status', { status: fanStatus });
    } else if (topic === 'sensors/light') {
      lightStatus = dataObj.status?.toLowerCase();
      console.log(`💡 Light status updated: ${lightStatus}`);
      io.emit('light_status', { status: lightStatus });
    } else if (topic === 'fan_usage_percentage') {
      latestFanpercent = parseFloat(dataObj.percentage);
      console.log(`Fan usage percentage updated: ${latestFanpercent}`);
    } else if (topic === 'light_usage_percentage') {
      latestLightpercent = parseFloat(dataObj.percentage);
      console.log(`Light usage percentage updated: ${latestLightpercent}`);
    }
  } catch (e) {
    console.warn(`⚠️ Failed to parse JSON from ${topic}:`, e.message);
  }

  // Process alert topics (expects payload {"status": "on"} or plain "on")
  if (['Alert_temp', 'Alert_humidity', 'Alert_brightness'].includes(topic)) {
    let alertStatus = '';
    try {
      const payload = JSON.parse(msg);
      if (payload.status) {
        alertStatus = payload.status.toLowerCase();
      }
    } catch (e) {
      console.warn(`⚠️ Could not parse alert JSON for topic ${topic}:`, e.message);
      alertStatus = msg.toLowerCase();
    }
    console.log(`Alert status for ${topic}: ${alertStatus}`);

    if (alertStatus === 'on') {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      let valueToRecord = msg;
      if (topic === 'Alert_temp' && latestTemperature !== null) {
        valueToRecord = latestTemperature;
      } else if (topic === 'Alert_humidity' && latestHumidity !== null) {
        valueToRecord = latestHumidity;
      } else if (topic === 'Alert_brightness' && latestBrightness !== null) {
        valueToRecord = latestBrightness;
      } else if (topic === 'fan_usage_percentage' && latestFanpercent !== null) {
        valueToRecord = latestFanpercent;
      } else if (topic === 'light_usage_percentage' && latestLightpercent !== null) {
        valueToRecord = latestLightpercent;
      }

      const record = {
        sensor: topic,
        value: valueToRecord,
        date: formattedDate,
        time: formattedTime,
        location: process.env['Location'] || 'USA'
      };

      alertRecords.push(record);
      console.log('🚨 New Alert:', record);

      const snsParams = {
        Message: `Alert triggered: ${topic}\nValue: ${valueToRecord}\nDate: ${formattedDate}\nTime: ${formattedTime}\nLocation: ${record.location}`,
        TopicArn: SNS_TOPIC_ARN
      };

      sns.publish(snsParams, (err, data) => {
        if (err) {
          console.error("❌ SNS Publish Error:", err);
        } else {
          console.log("📨 SNS Message Sent, MessageId:", data.MessageId);
        }
      });

      io.emit('alert_blink', { topic, status: 'on' });
    } else {
      console.log(`Received non-"on" alert message for ${topic}: "${msg}"`);
    }
  }

  // Emit all MQTT messages to connected web clients via Socket.IO
  io.emit('mqtt_message', { topic, message: msg });
});

// Express routes
app.get('/alerts', (req, res) => {
  res.json({ alerts: alertRecords });
});

app.post('/clear_alerts', (req, res) => {
  alertRecords.length = 0;
  res.json({ message: "Alerts cleared" });
});

// WebSocket control logic
io.on('connection', (socket) => {
  console.log('🔌 WebSocket client connected');

  socket.on('control_update', (data) => {
    console.log('🎮 Received control update:', data);

    const controlMap = {
      fan: 'manual_status_fan',
      // light: 'manual_status_led',
      led: 'manual_status_led',
      control: 'status_control',
      alert_temp: 'Alert_temp',
      alert_humidity: 'Alert_humidity',
      alert_brightness: 'Alert_brightness'
    };

    for (const [key, topic] of Object.entries(controlMap)) {
      if (data[key] !== undefined) {
        // Use JSON.stringify() to send a string payload
        const payload = JSON.stringify(data[key]);
        mqttClient.publish(topic, payload, (err) => {
          if (err) {
            console.error(`❌ Error publishing to ${topic}:`, err);
          } else {
            console.log(`✅ Published ${payload} to ${topic}`);
          }
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('⚠️ WebSocket client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

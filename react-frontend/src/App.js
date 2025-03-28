// --------------------------------------------------------------------------------------------------------------------

// import { useEffect, useState } from 'react';

// function SensorStatus() {
//     const [data, setData] = useState({});


//     useEffect(() => {
//         const fetchData = async () => {
//             const response = await fetch('http://localhost:5000/sensor-status');
//             const result = await response.json();
//             setData(result);

//             console.log("Response", response);
//             console.log("Result", result);
//         };
//         fetchData();
//         const interval = setInterval(fetchData, 5000); // Auto-refresh data every 5s
//         return () => clearInterval(interval);
//     }, []);

//     return (
//         <div>
//             <h2>Sensor Status</h2>
//             <p>Temperature: {data.temperature}°C</p>
//             <p>Humidity: {data.humidity}%</p>
//         </div>
//     );
// }

// export default SensorStatus;



// ----------------------------------------------------------------------------------------------------------------

import React from 'react';
import { AppBar, Toolbar, Card, CardContent, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Circle } from 'lucide-react';
import '@coreui/coreui/dist/css/coreui.min.css';
import { CCard, CCardBody, CCardLink, CCardSubtitle, CCardText, CCardTitle, CCardImage, CButton } from '@coreui/react';

const Navbar = () => {
  return (
    <AppBar position="static" style={{ marginBottom: '1rem' }}>
      <Toolbar>
        <Typography variant="h6" component="div" style={{ flexGrow: 1 }}>
          IoT Home Dashboard
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

const FanCard = ({ fanStatus }) => {
  return (
    <CCard style={{ width: '18rem' }}>
      <CCardImage orientation="top" src="/images/fan.jpg" /> 
      <CCardBody>
        <CCardTitle>
        <strong>Fan</strong>
        </CCardTitle>
        <CCardText>
          {/* <strong>ON</strong> */}
          <StatusText variant="body1" status={fanStatus}>
          <Circle
            size={16}
            fill={fanStatus === 'ON' ? 'green' : 'red'}
            stroke={fanStatus === 'ON' ? 'green' : 'red'}
          />
          {fanStatus === 'ON' ? 'ON' : 'OFF'}
          </StatusText>
        </CCardText>
        {/* <CButton color="primary" href="#">
          Go somewhere
        </CButton> */}
      </CCardBody>
    </CCard>
  )
}

const StatusText = styled(Typography)(({ status }) => ({
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: status === 'ON' ? 'green' : 'red',
}));


const TempCard = ({ temperature }) => {
  return (
    <CCard style={{ width: '18rem' }}>
      <CCardBody>
        <CCardTitle>
          <strong>Temperature</strong>
        </CCardTitle>
        {/* <CCardSubtitle className="mb-2 text-body-secondary">Card subtitle</CCardSubtitle> */}
        <CCardText>
        {temperature !== null ? `${temperature} °C` : 'N/A'}
        </CCardText>
        {/* <CCardLink href="#">Card link</CCardLink>
        <CCardLink href="#">Another link</CCardLink> */}
      </CCardBody>
    </CCard>
  )
}

const HumidCard = ({ humidity }) => {
  return (
    <CCard style={{ width: '18rem' }}>
      <CCardBody>
        <CCardTitle>
          <strong>Humidity</strong>
        </CCardTitle>
        {/* <CCardSubtitle className="mb-2 text-body-secondary">Card subtitle</CCardSubtitle> */}
        <CCardText>
        {humidity !== null ? `${humidity} °C` : 'N/A'}
        </CCardText>
        {/* <CCardLink href="#">Card link</CCardLink>
        <CCardLink href="#">Another link</CCardLink> */}
      </CCardBody>
    </CCard>
  )
}

const Dashboard = () => {
  // Hardcoded data for demonstration
  const fanStatus = 'ON';  // Or 'OFF'
  const temperature = 28.5;
  const humidity = 65;
  // const otherData = [
  //   { title: 'Pressure', value: 1012, unit: 'hPa' },
  //   { title: 'Wind Speed', value: 15, unit: 'km/h' },
  //   { title: 'Rainfall', value: 2, unit: 'mm' },
  // ];

  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem' }}>
        <TempCard temperature={temperature} />
        <HumidCard humidity={humidity} />
        <FanCard fanStatus={fanStatus} />
        {/* {otherData.map((item, index) => (
          <DataCard
            key={index}
            title={item.title}
            value={item.value}
            unit={item.unit}
          />
        ))} */}
      </div>
    </div>
  );
};

export default Dashboard;

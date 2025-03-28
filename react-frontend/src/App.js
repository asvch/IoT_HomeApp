import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Slider, Box, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Circle } from 'lucide-react';
import '@coreui/coreui/dist/css/coreui.min.css';
import { CCard, CCardBody, CCardTitle, CCardText } from '@coreui/react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Tiehang from './components/Tiehang';

// Styled components for modern minimalist look
const StyledCard = styled(CCard)({
  width: '100%',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  border: 'none',
  overflow: 'hidden',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
  }
});

const StyledCardBody = styled(CCardBody)({
  padding: '1.5rem',
});

const StyledCardTitle = styled(CCardTitle)({
  fontSize: '1.1rem',
  marginBottom: '1rem',
  color: '#333',
  fontWeight: '500',
});

const StyledSlider = styled(Slider)({
  color: '#3f51b5',
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
  },
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: '#fff',
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
  },
});

const Navbar = () => {
  return (
    <AppBar position="static" style={{ marginBottom: '1.5rem', background: '#3f51b5', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <Toolbar>
        <Typography variant="h6" component="div" style={{ flexGrow: 1, fontWeight: '500' }}>
          IoT Home Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
          <Link to="/tiehang" style={{ color: 'white', textDecoration: 'none' }}>Tiehang</Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const StatusText = styled(Typography)(({ status }) => ({
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: status === 'ON' ? '#4caf50' : '#f44336',
}));

const DevicesCard = ({ devices }) => {
  return (
    <StyledCard>
      <StyledCardBody>
        <StyledCardTitle>
          Device Status
        </StyledCardTitle>
        <Box sx={{ mt: 2 }}>
          {devices.map((device, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
              <Typography variant="body1" sx={{ color: '#555' }}>{device.name}</Typography>
              <StatusText variant="body1" status={device.status}>
                <Circle
                  size={16}
                  fill={device.status === 'ON' ? '#4caf50' : '#f44336'}
                  stroke={device.status === 'ON' ? '#4caf50' : '#f44336'}
                />
                {device.status}
              </StatusText>
            </Box>
          ))}
        </Box>
      </StyledCardBody>
    </StyledCard>
  );
};

const TempCard = ({ temperature, threshold, onThresholdChange }) => {
  return (
    <StyledCard>
      <StyledCardBody>
        <StyledCardTitle>
          Temperature
        </StyledCardTitle>
        <CCardText sx={{ fontSize: '1.5rem', fontWeight: '300', color: '#333', mb: 2 }}>
          {temperature !== null ? `${temperature} °C` : 'N/A'}
        </CCardText>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>Temperature Threshold: {threshold}°C</Typography>
          <StyledSlider
            value={threshold}
            onChange={onThresholdChange}
            min={16}
            max={32}
            step={0.5}
            marks
            valueLabelDisplay="auto"
          />
        </Box>
      </StyledCardBody>
    </StyledCard>
  );
};

const HumidCard = ({ humidity, threshold, onThresholdChange }) => {
  return (
    <StyledCard>
      <StyledCardBody>
        <StyledCardTitle>
          Humidity
        </StyledCardTitle>
        <CCardText sx={{ fontSize: '1.5rem', fontWeight: '300', color: '#333', mb: 2 }}>
          {humidity !== null ? `${humidity} %` : 'N/A'}
        </CCardText>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>Humidity Threshold: {threshold}%</Typography>
          <StyledSlider
            value={threshold}
            onChange={onThresholdChange}
            min={30}
            max={80}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Box>
      </StyledCardBody>
    </StyledCard>
  );
};

const Home = () => {
  const [tempThreshold, setTempThreshold] = useState(25);
  const [humidThreshold, setHumidThreshold] = useState(60);

  const devices = [
    { name: 'Fan', status: 'ON' },
    { name: 'Air Conditioner', status: 'OFF' }
  ];

  const temperature = 28.5;
  const humidity = 65;

  const handleTempThresholdChange = (event, newValue) => {
    setTempThreshold(newValue);
  };

  const handleHumidThresholdChange = (event, newValue) => {
    setHumidThreshold(newValue);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: '400', color: '#333' }}>Home</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TempCard 
            temperature={temperature} 
            threshold={tempThreshold}
            onThresholdChange={handleTempThresholdChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <HumidCard 
            humidity={humidity} 
            threshold={humidThreshold}
            onThresholdChange={handleHumidThresholdChange}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DevicesCard devices={devices} />
        </Grid>
      </Grid>
    </Box>
  );
};

const Dashboard = () => {
  return (
    <Router>
      <div style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tiehang" element={<Tiehang />} />
        </Routes>
      </div>
    </Router>
  );
};

export default Dashboard;

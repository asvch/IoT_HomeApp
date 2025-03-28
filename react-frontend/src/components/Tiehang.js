import React, { useState } from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { CCard, CCardBody, CCardTitle, CCardText } from '@coreui/react';

// Styled components matching the main app style
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

const StyledButton = styled(Button)({
  margin: '8px 0',
  borderRadius: '8px',
  textTransform: 'none',
  padding: '8px 16px',
  boxShadow: 'none',
  fontWeight: 500,
});

const Tiehang = () => {
  const [actionHistory, setActionHistory] = useState([
    { time: '2023-11-20 09:15', action: 'Temperature threshold adjusted to 24°C' },
    { time: '2023-11-20 10:30', action: 'Fan turned ON automatically' },
    { time: '2023-11-20 14:45', action: 'Humidity threshold adjusted to 55%' }
  ]);

  const addAction = () => {
    const now = new Date();
    const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newAction = {
      time: formattedTime,
      action: 'Manual system check completed'
    };
    
    setActionHistory([newAction, ...actionHistory]);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: '400', color: '#333' }}>Tiehang Branch</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <StyledCardBody>
              <StyledCardTitle>
                System Information
              </StyledCardTitle>
              <CCardText>
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  Smart Home System Version: 1.2.3
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  Last Connection: Today at 15:30
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  Connected Devices: 5
                </Typography>
                <StyledButton 
                  variant="contained" 
                  color="primary"
                  onClick={addAction}
                >
                  Run System Check
                </StyledButton>
              </CCardText>
            </StyledCardBody>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <StyledCard>
            <StyledCardBody>
              <StyledCardTitle>
                Activity Log
              </StyledCardTitle>
              <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                {actionHistory.map((item, index) => (
                  <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index !== actionHistory.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                      {item.time}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      {item.action}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </StyledCardBody>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Tiehang;

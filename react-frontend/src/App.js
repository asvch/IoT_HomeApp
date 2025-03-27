import { useEffect, useState } from 'react';

function SensorStatus() {
    const [data, setData] = useState({});


    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('http://localhost:5000/sensor-status');
            const result = await response.json();
            setData(result);

            console.log("Response", response);
            console.log("Result", result);
        };
        fetchData();
        const interval = setInterval(fetchData, 5000); // Auto-refresh data every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <h2>Sensor Status</h2>
            <p>Temperature: {data.temperature}°C</p>
            <p>Humidity: {data.humidity}%</p>
        </div>
    );
}

export default SensorStatus;
import Control
import DHT
import MQTTPublish
import time
import paho.mqtt.client as mqtt

def main():
    # Initialize GPIO
    GPIO.setwarnings(False)
    
    # Connect to MQTT broker
    if not connect_mqtt():
        print("Running without MQTT functionality")
    
    # Initial state of AC (OFF)
    turn_ac_off()
    
    try:
        print("System running. Press CTRL+C to exit")
        while True:
            # Read sensor data
            temperature, humidity = read_sensor()
            
            if temperature is not None and humidity is not None:
                print(f"Temperature: {temperature:.1f}°C, Humidity: {humidity:.1f}%")
                publish_data(temperature, humidity)
                
            else:
                print("Failed to read from DHT sensor")
            
            # Wait before next reading
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("Program stopped by user")
    finally:
        GPIO.cleanup()
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        print("Cleanup done")

if __name__ == "__main__":
    main()
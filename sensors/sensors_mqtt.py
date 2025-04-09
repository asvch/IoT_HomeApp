import time
import json
import board
import busio
# import Adafruit_DHT
import adafruit_ads1x15.ads1115 as ADS  # Use ADS1115 instead of ADS1015
from adafruit_ads1x15.analog_in import AnalogIn
import paho.mqtt.client as mqtt
import ssl
import adafruit_dht
import RPi.GPIO as GPIO

# Initialize I2C and ADS1115
i2c = busio.I2C(board.SCL, board.SDA)
ads = ADS.ADS1115(i2c)  # Use ADS1115
GAIN = 1  # Gain setting for ADC

# DHT11 Sensor Configuration
# DHT_SENSOR = Adafruit_DHT.DHT11
dhtDevice = adafruit_dht.DHT11(board.D4, use_pulseio=False)
# DHT_PIN = 4  # GPIO pin for DHT11

# AWS MQTT Configuration
# AWS_BROKER = "your-aws-endpoint.amazonaws.com"
# AWS_PORT = 8883
MQTT_TOPIC = "sensor/data"
STATUS_TOPIC = "HomePi/FanStatus"
fan_status = 'OFF'
# HUM_TOPIC = "sensor/hum"
# TMP_TOPIC = "sensor/tmp"

# MQTT Client Setup
# client = mqtt.Client()
# client.tls_set("/path/to/aws-certificate.pem")  # Set correct AWS cert path
# client.username_pw_set("username", "password")  # If authentication is needed

# def on_connect(client, userdata, flags, rc):
#     print("Connected to AWS MQTT Broker with result code " + str(rc))
#     client.subscribe(MQTT_TOPIC)

# client.on_connect = on_connect

# # Connect to AWS MQTT Broker
# client.connect(AWS_BROKER, AWS_PORT, 60)
# client.loop_start()

def on_connect(client, userdata, flags, rc):
    print("Connected with result code", rc)
    client.subscribe(STATUS_TOPIC)

def on_message(client, userdata, msg):
    global fan_status
    try:
        payload = json.loads(msg.payload.decode())
        if "status" in payload:
            fan_status = payload["status"]
            print(f"Received fan status: {fan_status}")
            GPIO.output(LED_PIN, GPIO.HIGH if fan_status == "ON" else GPIO.LOW)
    except json.JSONDecodeError:
        print("Invalid JSON received")

def button_callback(channel):
    global fan_status
    # Toggle fan status
    fan_status = "OFF" if fan_status == "ON" else "ON"
    new_status = json.dumps({"status": fan_status})
    client.publish(STATUS_TOPIC, new_status)
    print("Button pressed! Toggled fan status:", fan_status)

if __name__ == '__main__':
    # Define the AWS IoT endpoint and port
    AWS_IOT_ENDPOINT = "a1s8a3str92yk-ats.iot.us-east-1.amazonaws.com"  # Domain name under Domain Configurations
    CLIENT_ID = "iot1"
    AWS_IOT_PORT = 8883

    # Define the topic
    # TOPIC = "testing123"    # this topic has a rule set in AWS (Demo591_Rule) to trigger AWS Lambda and SNS to send email based on a script in Lambda
    TOPIC = "Status/DoorRPi"

    # Define the paths to the certificate files
    CA_CERT = "AmazonRootCA1.pem"
    CLIENT_CERT = "e0d1fe9ce48bd96a1a3978fed22fe2b5fea6a831bc8b5b95b25c536800023d95-certificate.pem.crt"
    PRIVATE_KEY = "e0d1fe9ce48bd96a1a3978fed22fe2b5fea6a831bc8b5b95b25c536800023d95-private.pem.key"

    # Configure MQTT Client for AWS IoT
    client = mqtt.Client(client_id=CLIENT_ID)
    client.tls_set(CA_CERT, certfile=CLIENT_CERT, keyfile=PRIVATE_KEY, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)

    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(AWS_IOT_ENDPOINT, AWS_IOT_PORT) # keepalive=60)
    client.loop_start()
    print("Connected to AWS IoT")

    BUTTON_PIN = 5
    LED_PIN = 6
    GPIO.cleanup()
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Pull-up resistor
    GPIO.setup(LED_PIN, GPIO.OUT)
    GPIO.output(LED_PIN, GPIO.LOW)  # Default LED off
    GPIO.remove_event_detect(BUTTON_PIN)
    GPIO.add_event_detect(BUTTON_PIN, GPIO.FALLING, callback=button_callback, bouncetime=300)

    # Data Sampling at 1Hz
    try:
        while True:
            # Read LDR value
            ldr_value = AnalogIn(ads, ADS.P0).value / 32767

            # Read Temperature and Humidity
            while(True):
                try:
                    temperature = dhtDevice.temperature * (9/5) + 32
                    humidity = dhtDevice.humidity
                    break
                except:
                    print("T&H sensor error, measure again...")
                    continue

            if humidity is not None and temperature is not None:
                # Create JSON Payload
                payload = {
                    "temperature": round(temperature, 2),
                    "humidity": round(humidity, 2),
                    "ldr": ldr_value
                }
                
                # Publish to AWS MQTT
                client.publish(MQTT_TOPIC, json.dumps(payload))
                print("Published:", payload)
            else:
                print("Failed to read DHT11 sensor")

            time.sleep(1)  # 1 Hz sampling rate
    except KeyboardInterrupt:
        print("Disconnecting...")
        client.disconnect()
        GPIO.cleanup()

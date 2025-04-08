import paho.mqtt.client as mqtt

# MQTT configuration
MQTT_BROKER = "localhost"  # Change to your MQTT broker address
MQTT_PORT = 1883
MQTT_TOPIC_DATA = "home/room/climate"
MQTT_TOPIC_COMMAND = "home/room/ac/command"

# MQTT callbacks
def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT broker with result code {rc}")
    client.subscribe(MQTT_TOPIC_COMMAND)

def on_message(client, userdata, msg):
    command = msg.payload.decode()
    print(f"Received command: {command}")
    if command == "ON":
        turn_ac_on()
    elif command == "OFF":
        turn_ac_off()

# Create MQTT client
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# Connect to MQTT broker
def connect_mqtt():
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        return True
    except:
        print("Failed to connect to MQTT broker")
        return False

# Publish sensor data
def publish_data(temperature, humidity):
    payload = f'{{"temperature": {temperature}, "humidity": {humidity}}}'
    mqtt_client.publish(MQTT_TOPIC_DATA, payload)
    print(f"Published: {payload}")
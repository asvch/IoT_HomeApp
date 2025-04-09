# to activate virtual env: source kasa-env/bin/activate
# instead of pip install use: python -m pip install python-kasa for ex

import asyncio
import json
import paho.mqtt.client as mqtt
import ssl
from kasa import SmartPlug    # kasa discover in terminal to get plug ip
import logging
from datetime import datetime, timedelta
import json
import RPi.GPIO as GPIO

logging.basicConfig(
    filename="device_usage.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

device_states = {
    "Fan": {"state": "off", "last_changed": None, "on_duration": timedelta()},
    "Light": {"state": "off", "last_changed": None, "on_duration": timedelta()}
}


# Kasa Smart Plug IP Address - get from "kasa discover" command in terminal
FAN_PLUG_IP = "192.168.26.152" 
LIGHT_PLUG_IP = "192.168.26.219" 


CA_CERT = "/home/ajayc/R_Certs/AmazonRootCA1.pem"
CLIENT_CERT = "/home/ajayc/R_Certs/certificate.pem.crt"
PRIVATE_KEY = "/home/ajayc/R_Certs/private.pem.key"

# AWS_IOT_ENDPOINT = "a1s8a3str92yk-ats.iot.us-east-1.amazonaws.com"   # Ajays endpoint
AWS_IOT_ENDPOINT = "abvk6ulxodwj4-ats.iot.us-east-1.amazonaws.com"

# Topics to Subscribe to
TEMP_TOPIC = "sensors/temperature"
LDR_TOPIC = "sensors/ldr"
CONTROL_SETTING_TOPIC = "status_control"
MANUAL_LED = "manual_status_led"
MANUAL_FAN = "manual_status_fan"

CONTROL_MODE = "automatic"  # Default control setting
FAN_STATUS = "off"  # Default fan status
LIGHT_STATUS = "off"  # Default light status

CLIENT_ID = "IoT_Home_Controller"     # NEED TO HAVE DIFFERENT CLIENT ID IF 2 SCRIPTS RUNNING AT ONCE w/ same credentials
AWS_IOT_PORT = 8883

# Temperature threshold
TEMP_THRESHOLD = 80  

# LDR threshold
LDR_THRESHOLD = 0.35             # ADJUST AS REQUIRED

def button_callback(channel):
    global FAN_STATUS
    # fan_status = "off"                # REMEMBER TO CHANGE - ADD GLOBAL FAN & LIGHT STATUS VALUES

    manual_status = "off" if FAN_STATUS == "on" else "on"
    new_status = json.dumps({"fan": manual_status})
    client.publish(MANUAL_FAN, new_status)
    print("Button pressed! Toggled fan status:", manual_status)


async def control_kasa(plug_ip, state, device_name="Unknown", reason="automatic"):
    plug = SmartPlug(plug_ip)
    await plug.update()

    prev_state = device_states[device_name]["state"]
    now = datetime.now()

    if prev_state != state:
        # Calculate ON duration if switching OFF
        if prev_state == "on" and device_states[device_name]["last_changed"]:
            duration = now - device_states[device_name]["last_changed"]
            device_states[device_name]["on_duration"] += duration

        device_states[device_name]["state"] = state
        device_states[device_name]["last_changed"] = now

        logging.info(f"{device_name} turned {state.upper()} due to {reason}")

    if state == "on":
        await plug.turn_on()
    else:
        await plug.turn_off()


def report_usage():
    now = datetime.now()
    for device, info in device_states.items():
        total_duration = timedelta(hours=0.5)  
        on_time = info["on_duration"]

        if info["state"] == "on" and info["last_changed"]:
            on_time += now - info["last_changed"]

        usage_percent = (on_time.total_seconds() / total_duration.total_seconds()) * 100
        print(f"{device} was ON for {usage_percent:.2f}% of the last hour.")


def on_message(client, userdata, msg):

    global CONTROL_MODE

    topic = msg.topic
    # print(f"Raw message received on {msg.topic}: {msg.payload}")

    payload_raw = msg.payload.decode().strip()
    print(f"Message on {msg.topic}: {payload_raw}")

    if not payload_raw:
            print("Empty payload received, skipping...")
            return
    
    payload = json.loads(msg.payload.decode())

    print(f"Received on {topic}: {payload}")

    # Handle control mode change
    if topic == CONTROL_SETTING_TOPIC:
        mode = payload.get("status", "").lower()
        if mode in ["automatic", "manual"]:
            CONTROL_MODE = mode
            print(f"-----------------  Control mode set to: {CONTROL_MODE} -----------------")
        return

    # Automatic Mode Logic
    if CONTROL_MODE == "automatic":
        if topic == TEMP_TOPIC:
            temperature = payload.get("temperature")
            print(report_usage())
            if temperature is not None:
                if temperature > TEMP_THRESHOLD:
                    asyncio.run(control_kasa(FAN_PLUG_IP, "on", "Fan", "temperature threshold exceeded"))
                    client.publish("sensors/fan", json.dumps({"status": "on"}))
                    client.publish("Alert_temp", json.dumps({"Alert": "on"}))
                    print("Fan turned ON - AUTO")
                else:
                    asyncio.run(control_kasa(FAN_PLUG_IP, "off", "Fan", "temperature normal"))
                    client.publish("sensors/fan", json.dumps({"status": "off"}))
                    print("Fan turned OFF - AUTO")

        elif topic == LDR_TOPIC:
            ldr_value = payload.get("brightness")
            print(report_usage())
            if ldr_value is not None:
                if ldr_value > LDR_THRESHOLD:
                    asyncio.run(control_kasa(LIGHT_PLUG_IP, "on", "Light", "low LDR"))
                    client.publish("sensors/led", json.dumps({"status": "on"}))
                    client.publish("Alert_brightness", json.dumps({"Alert": "on"}))
                    print("Light turned ON - AUTO")
                else:
                    asyncio.run(control_kasa(LIGHT_PLUG_IP, "off", "Light", "high LDR"))
                    client.publish("sensors/led", json.dumps({"status": "off"}))
                    print("Light turned OFF - AUTO")

    # Manual Mode Logic
    elif CONTROL_MODE == "manual":
        if topic == MANUAL_FAN:
            manual_fan = payload.get("fan")
            if manual_fan is not None:
                if manual_fan == "on":
                    asyncio.run(control_kasa(FAN_PLUG_IP, "on", "Fan", "manual control"))
                    client.publish("sensors/fan", json.dumps({"status": "on"}))
                    print("Fan turned ON - MANUAL")
                else:
                    asyncio.run(control_kasa(FAN_PLUG_IP, "off", "Fan", "manual control"))
                    client.publish("sensors/fan", json.dumps({"status": "off"}))
                    print("Fan turned OFF - MANUAL")
        
        elif topic == MANUAL_LED:
            manual_led = payload.get("led")
            if manual_led is not None:
                if manual_led == "on":
                    asyncio.run(control_kasa(LIGHT_PLUG_IP, "on", "Light", "manual control"))
                    client.publish("sensors/led", json.dumps({"status": "on"}))
                    print("Light turned ON - MANUAL")
                else:
                    asyncio.run(control_kasa(LIGHT_PLUG_IP, "off", "Light", "manual control"))
                    client.publish("sensors/led", json.dumps({"status": "off"}))
                    print("Light turned OFF - MANUAL")




if __name__ == "__main__":

    # Code for Pi B Button
    BUTTON_PIN = 5

    GPIO.cleanup()
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)  # Pull-up resistor
    GPIO.add_event_detect(BUTTON_PIN, GPIO.FALLING, callback=button_callback, bouncetime=300)

    # Set up MQTT client
    client = mqtt.Client(client_id=CLIENT_ID)
    client.tls_set(CA_CERT, certfile=CLIENT_CERT, keyfile=PRIVATE_KEY, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)
    
    print("Connecting to MQTT broker...")
    client.connect(AWS_IOT_ENDPOINT, AWS_IOT_PORT)
    print("Connected to MQTT broker")
    
    client.publish("HomePi/PiBStatus", json.dumps({"message": "Raspberry Pi B is online"}))
    client.publish("sensors/fan", json.dumps({"status": "off"}))
    client.publish("sensors/led", json.dumps({"status": "off"}))

    client.subscribe(CONTROL_SETTING_TOPIC)    # decides if manual or automatic
    client.subscribe(TEMP_TOPIC)
    client.subscribe(LDR_TOPIC)
    client.subscribe(MANUAL_LED)                  # just subscribe to manual topics now too
    client.subscribe(MANUAL_FAN)
    print("Subscribed to topics")

    client.on_message = on_message


    # Start listening for messages
    client.loop_forever()


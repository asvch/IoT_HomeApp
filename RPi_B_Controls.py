import asyncio
import json
import paho.mqtt.client as mqtt
import ssl
from kasa import SmartPlug    # kasa discover in terminal to get plug ip
import logging
from datetime import datetime, timedelta
import json

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


CA_CERT = "C:/Users/ajayc/Downloads/AmazonRootCA1.pem"
CLIENT_CERT = "C:/Users/ajayc/Downloads/e0d1fe9ce48bd96a1a3978fed22fe2b5fea6a831bc8b5b95b25c536800023d95-certificate.pem.crt"
PRIVATE_KEY = "C:/Users/ajayc/Downloads/e0d1fe9ce48bd96a1a3978fed22fe2b5fea6a831bc8b5b95b25c536800023d95-private.pem.key"

AWS_IOT_ENDPOINT = "a1s8a3str92yk-ats.iot.us-east-1.amazonaws.com"
TEMP_TOPIC = "sensors/temperature"
LDR_TOPIC = "sensors/ldr"
CLIENT_ID = "IoT_Home_Controller"     # NEED TO HAVE DIFFERENT CLIENT ID IF 2 SCRIPTS RUNNING AT ONCE w/ same credentials
AWS_IOT_PORT = 8883

# Temperature threshold
TEMP_THRESHOLD = 68  

# LDR threshold
LDR_THRESHOLD = 1000            # ADJUST AS REQUIRED



# async def control_kasa(plug_ip, state):
#     plug = SmartPlug(plug_ip)
#     await plug.update()

#     if state == "on":
#         await plug.turn_on()
#     else:
#         await plug.turn_off()

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
        total_duration = timedelta(hours=1)  # Example: last 1 hour
        on_time = info["on_duration"]

        if info["state"] == "on" and info["last_changed"]:
            on_time += now - info["last_changed"]

        usage_percent = (on_time.total_seconds() / total_duration.total_seconds()) * 100
        print(f"{device} was ON for {usage_percent:.2f}% of the last hour.")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Received message: {payload}")
        print(report_usage())

        if msg.topic == TEMP_TOPIC:
            temperature = payload.get("temperature")
            if temperature is not None:
                if temperature > TEMP_THRESHOLD:
                    asyncio.run(control_kasa(FAN_PLUG_IP, "on", "Fan", "temperature threshold exceeded"))
                    client.publish("HomePi/FanStatus", json.dumps({"status": "ON"}))
                else:
                    asyncio.run(control_kasa(FAN_PLUG_IP, "off", "Fan", "temperature normal"))
                    client.publish("HomePi/FanStatus", json.dumps({"status": "OFF"}))

        elif msg.topic == LDR_TOPIC:
            ldr_value = payload.get("brightness")
            if ldr_value is not None:
                if ldr_value < LDR_THRESHOLD:
                    asyncio.run(control_kasa(LIGHT_PLUG_IP, "on", "Light", "low LDR"))
                    client.publish("HomePi/LightStatus", json.dumps({"status": "ON"}))
                else:
                    asyncio.run(control_kasa(LIGHT_PLUG_IP, "off", "Light", "high LDR"))
                    client.publish("HomePi/LightStatus", json.dumps({"status": "OFF"}))


        # if msg.topic == TEMP_TOPIC:
        #     temperature = payload.get("temperature")
        #     if temperature is not None:
        #         print(f"Received temperature: {temperature}°F")
        #         if temperature > TEMP_THRESHOLD:
        #             print("Temperature is above threshold! Turning Fan ON.")
        #             # asyncio.run(control_kasa(FAN_PLUG_IP, "on", "Fan", temperature))
        #             asyncio.run(control_kasa(FAN_PLUG_IP, "on"))

        #         else:
        #             print("Temperature is below threshold! Turning Fan OFF.")
        #             # asyncio.run(control_kasa(FAN_PLUG_IP, "off", "Fan", temperature))
        #             asyncio.run(control_kasa(FAN_PLUG_IP, "off"))

        # elif msg.topic == LDR_TOPIC:
        #     ldr_value = payload.get("ldr")
        #     if ldr_value is not None:
        #         print(f"Received LDR value: {ldr_value}")
        #         if ldr_value < LDR_THRESHOLD:
        #             print("LDR value is low! Turning Light ON.")
        #             # asyncio.run(control_kasa(LIGHT_PLUG_IP, "on", "Light", ldr_value))
        #             asyncio.run(control_kasa(LIGHT_PLUG_IP, "on"))
        #         else:
        #             print("LDR value is high! Turning Light OFF.")
        #             # asyncio.run(control_kasa(LIGHT_PLUG_IP, "off", "Light", ldr_value))
        #             asyncio.run(control_kasa(LIGHT_PLUG_IP, "off"))

    except Exception as e:
        print(f"Error processing MQTT message: {e}")


# def on_message(client, userdata, msg):
#     try:
#         payload = json.loads(msg.payload.decode())
#         print(f"Received message: {payload}")
#         temperature = payload.get("temperature", None)            

#         if temperature is not None:
#             print(f"Received temperature: {temperature}°F")

#             if temperature > TEMP_THRESHOLD:
#                 print("Temperature is above threshold! Turning plug ON.")
#                 asyncio.run(control_kasa("on"))
#             else:
#                 print("Temperature is below threshold! Turning plug OFF.")
#                 asyncio.run(control_kasa("off"))
#         else:
#             print("Invalid temperature data received.")

#     except Exception as e:
#         print(f"Error processing MQTT message: {e}")

if __name__ == "__main__":
    # Set up MQTT client
    client = mqtt.Client(client_id=CLIENT_ID)
    client.tls_set(CA_CERT, certfile=CLIENT_CERT, keyfile=PRIVATE_KEY, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)
    
    print("Connecting to MQTT broker...")
    client.connect(AWS_IOT_ENDPOINT, AWS_IOT_PORT)
    print("Connected to MQTT broker")
    
    client.publish("HomePi/PiBStatus", json.dumps({"message": "Raspberry Pi B is online"}))
    client.publish("HomePi/FanStatus", json.dumps({"status": "OFF"}))
    client.publish("HomePi/LightStatus", json.dumps({"status": "OFF"}))

    client.subscribe(TEMP_TOPIC)
    client.subscribe(LDR_TOPIC)
    print("Subscribed to topics")

    # client.on_connect = on_connect
    client.on_message = on_message


    # Start listening for messages
    client.loop_forever()


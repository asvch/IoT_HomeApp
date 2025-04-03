import asyncio
import json
import paho.mqtt.client as mqtt
import ssl
from kasa import SmartPlug    # kasa discover in terminal to get plug ip

# Kasa Smart Plug IP Address - get from "kasa discover" command in terminal
PLUG_IP = "192.168.26.152" 

CA_CERT = "C:/Users/ajayc/Downloads/AmazonRootCA1.pem"
CLIENT_CERT = "C:/Users/ajayc/Downloads/e0d1fe9ce48bd96a1a3978fed22fe2b5fea6a831bc8b5b95b25c536800023d95-certificate.pem.crt"
PRIVATE_KEY = "C:/Users/ajayc/Downloads/e0d1fe9ce48bd96a1a3978fed22fe2b5fea6a831bc8b5b95b25c536800023d95-private.pem.key"

AWS_IOT_ENDPOINT = "a1s8a3str92yk-ats.iot.us-east-1.amazonaws.com"
MQTT_TOPIC = "HomePi/Fan"
CLIENT_ID = "iot1_receiver"     # NEED TO HAVE DIFFERENT CLIENT ID IF 2 SCRIPTS RUNNING AT ONCE w/ same credentials
AWS_IOT_PORT = 8883

# Temperature threshold
TEMP_THRESHOLD = 68  # Fahrenheit

# LDR threshold
# LDR_THRESHOLD = 1000  

async def control_kasa(state):
    """Turns the Kasa smart plug ON or OFF."""
    plug = SmartPlug(PLUG_IP)
    await plug.update()

    if state == "on":
        await plug.turn_on()
        print("Plug turned ON!")
    else:
        await plug.turn_off()
        print("Plug turned OFF!")


def on_message(client, userdata, msg):
    """Callback function when an MQTT message is received."""
    try:
        payload = json.loads(msg.payload.decode())
        print(f"Received message: {payload}")
        temperature = payload.get("temperature", None)            

        if temperature is not None:
            print(f"Received temperature: {temperature}°F")

            if temperature > TEMP_THRESHOLD:
                print("Temperature is above threshold! Turning plug ON.")
                asyncio.run(control_kasa("on"))
            else:
                print("Temperature is below threshold! Turning plug OFF.")
                asyncio.run(control_kasa("off"))
        else:
            print("Invalid temperature data received.")

    except Exception as e:
        print(f"Error processing MQTT message: {e}")

if __name__ == "__main__":
    # Set up MQTT client
    client = mqtt.Client(client_id=CLIENT_ID)
    client.tls_set(CA_CERT, certfile=CLIENT_CERT, keyfile=PRIVATE_KEY, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)
    
    print("Connecting to MQTT broker...")
    client.connect(AWS_IOT_ENDPOINT, AWS_IOT_PORT)
    print("Connected to MQTT broker")
    
    client.subscribe(MQTT_TOPIC)

    # client.on_connect = on_connect
    client.on_message = on_message


    # Start listening for messages
    client.loop_forever()


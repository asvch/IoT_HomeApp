from flask import Flask, jsonify
import paho.mqtt.client as mqtt
import json
import ssl
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

sensor_data = {}

def on_message(client, userdata, message):
    global sensor_data
    try:
        sensor_data = json.loads(message.payload.decode("utf-8"))
        print("Received Data:", sensor_data)
    except json.JSONDecodeError:
        print("Error decoding message:", message.payload)

CA_CERT = "C:/Users/ajayc/Downloads/AmazonRootCA1.pem"
CLIENT_CERT = "C:/Users/ajayc/Downloads/e0d1fe9ce48bd96a1a3978fed22fe2b5fea6a831bc8b5b95b25c536800023d95-certificate.pem.crt"
PRIVATE_KEY = "C:/Users/ajayc/Downloads/e0d1fe9ce48bd96a1a3978fed22fe2b5fea6a831bc8b5b95b25c536800023d95-private.pem.key"

AWS_IOT_ENDPOINT = "a1s8a3str92yk-ats.iot.us-east-1.amazonaws.com"
TOPIC = "HomePi/Fan"
CLIENT_ID = "iot_fan"
AWS_IOT_PORT = 8883

client = mqtt.Client(client_id=CLIENT_ID)
client.tls_set(CA_CERT, certfile=CLIENT_CERT, keyfile=PRIVATE_KEY, cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)

client.connect(AWS_IOT_ENDPOINT, AWS_IOT_PORT)
print("Connected to AWS IoT")

client.subscribe(TOPIC)
print("Subscribed to topic", TOPIC)

client.on_message = on_message
print(sensor_data)

client.loop_start()

@app.route('/sensor-status', methods=['GET'])
def get_sensor_status():
    print(sensor_data)
    return jsonify(sensor_data)

if __name__ == '__main__':
    app.run(debug=True)

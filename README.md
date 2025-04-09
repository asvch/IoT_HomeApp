# IoT Home App

#### RPi_B_Control.py File

To run this code:
1. Create and enter virtual environment: "source kasa-env/bin/activate"
2. Install the following with "python -m pip install ": 
- python-kasa 
- rpi-lgpio 
- paho-mqtt
3. Use "kasa discover" to get the IP addresses of the 2 smart plugs being used, and update the IPs at the top of the code
4. Run "python RPi_B_Control.py" BEFORE starting other RPi_A script

Note: We are using the AWS IoT MQTT broker, so the proper certificate paths and endpoint need to be setup on your end before running. We are also using the SNS service to send emails when in automatic mode when the light or fan have to be turned on due to high temperature or low brightness. 
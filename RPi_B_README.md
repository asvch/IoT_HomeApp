This code is for the Raspberry Pi B of our project that controls the Kasa TP-Link Smart Plugs. The code is setup for both automatic and manual control mode. 
- Automatic mode simply uses the sensor readings to control the fan and the light.
- Manual mode overrides the automatic triggers and the fan and light are only controllable through the buttons on the Web Application.

This Raspberry Pi B also has a breadboard with a button attached to it. That should be able to control the fan by pressing on or off that button. 

This code also tracks the usage of the devices, and publishes the uses metrics to the front end so it can be updated on the web application. The usage is measured every two minutes and tracks for what percentage of those two minutes the devices were on for. 

#### To run code

1. Create and enter virtual environment: "source kasa-env/bin/activate"
2. Install the following with "python -m pip install ": 
- python-kasa 
- rpi-lgpio 
- paho-mqtt
3. Use "kasa discover" to get the IP addresses of the 2 smart plugs being used, and update the IPs at the top of the code
4. Run "python RPi_B_Control.py" BEFORE starting other RPi_A script

Note: We are using the AWS IoT MQTT broker, so the proper certificate paths and endpoint need to be setup on your end before running. We are also using the SNS service to send emails when in automatic mode when the light or fan have to be turned on due to high temperature or low brightness. 
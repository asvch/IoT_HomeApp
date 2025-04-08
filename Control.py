import RPi.GPIO as GPIO

# GPIO setup
LED_PIN = 17  # GPIO pin for LED (AC indicator)
BUTTON_PIN = 27  # GPIO pin for button (manual switch)

GPIO.setmode(GPIO.BCM)
GPIO.setup(LED_PIN, GPIO.OUT)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# AC control functions
def turn_ac_on():
    GPIO.output(LED_PIN, GPIO.HIGH)
    print("AC turned ON")

def turn_ac_off():
    GPIO.output(LED_PIN, GPIO.LOW)
    print("AC turned OFF")
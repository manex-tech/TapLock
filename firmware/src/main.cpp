#include <Arduino.h>

#ifndef TAPLOCK_INPUT_PIN
#define TAPLOCK_INPUT_PIN 27
#endif

// Bench prototype only. GPIO27 uses the ESP32's internal pull-up and is
// activated by connecting the input to GND. Do not apply 5 V to ESP32 GPIO.
constexpr uint32_t DEBOUNCE_MS = 45;
bool lastRaw = HIGH;
bool stableState = HIGH;
uint32_t lastChangeAt = 0;
uint32_t pressCount = 0;

void setup() {
  Serial.begin(115200);
  pinMode(TAPLOCK_INPUT_PIN, INPUT_PULLUP);
  delay(100);
  Serial.println();
  Serial.println("TapLock ESP32 input prototype");
  Serial.printf("GPIO%d active-low; connect to GND for bench test.\n", TAPLOCK_INPUT_PIN);
  Serial.println("A serial event is not cryptographic authorization.");
}

void loop() {
  const bool raw = digitalRead(TAPLOCK_INPUT_PIN);
  const uint32_t now = millis();
  if (raw != lastRaw) {
    lastRaw = raw;
    lastChangeAt = now;
  }
  if ((now - lastChangeAt) >= DEBOUNCE_MS && raw != stableState) {
    stableState = raw;
    if (stableState == LOW) {
      ++pressCount;
      Serial.printf("{\"event\":\"physical_input\",\"count\":%lu,\"millis\":%lu}\n",
                    static_cast<unsigned long>(pressCount),
                    static_cast<unsigned long>(now));
    }
  }
  delay(2);
}
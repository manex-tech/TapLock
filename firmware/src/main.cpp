#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Copy firmware/include/secrets.example.h to secrets.h and fill in Wi-Fi/API settings.
// Never commit secrets.h. Use a LAN-reachable API URL during local testing.
#include "secrets.h"

#ifndef TAPLOCK_INPUT_PIN
#define TAPLOCK_INPUT_PIN 27
#endif

constexpr uint32_t DEBOUNCE_MS = 45;
constexpr uint32_t POLL_INTERVAL_MS = 2000;
constexpr uint32_t HTTP_TIMEOUT_MS = 2500;
constexpr char DEVICE_ID[] = "taplock-devkit-01";

bool lastRaw = HIGH;
bool stableState = HIGH;
bool challengeActive = false;
uint32_t lastChangeAt = 0;
uint32_t lastPollAt = 0;
String activeChallengeId;
String activeActionTitle;

void pollChallenge() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = String(TAPLOCK_API_BASE) + "/api/device/next-challenge?deviceId=" + DEVICE_ID;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(url)) return;
  const int code = http.GET();
  if (code == HTTP_CODE_OK) {
    JsonDocument doc;
    const DeserializationError error = deserializeJson(doc, http.getString());
    if (!error && !doc["challenge"].isNull()) {
      String id = doc["challenge"]["id"] | "";
      if (id.length() && id != activeChallengeId) {
        activeChallengeId = id;
        activeActionTitle = doc["challenge"]["action"]["title"] | "Unknown action";
        challengeActive = true;
        Serial.println();
        Serial.println("=== TAPLOCK CHALLENGE AVAILABLE ===");
        Serial.printf("Challenge: %s\n", activeChallengeId.c_str());
        Serial.printf("Action: %s\n", activeActionTitle.c_str());
        Serial.println("Inspect the action in the dashboard before testing.");
        Serial.println("Connect GPIO27 to GND to record a physical-input event.");
        Serial.println("Prototype only: no signature or NEAR transaction is produced.");
      }
    }
  } else if (code < 0) {
    Serial.printf("Challenge poll failed: %s\n", HTTPClient::errorToString(code).c_str());
  }
  http.end();
}

void submitPhysicalInput() {
  if (!challengeActive || WiFi.status() != WL_CONNECTED) {
    Serial.println("No active challenge or Wi-Fi disconnected; input not submitted.");
    return;
  }
  HTTPClient http;
  const String url = String(TAPLOCK_API_BASE) + "/api/device/input";
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(url)) return;
  http.addHeader("Content-Type", "application/json");
  JsonDocument body;
  body["challengeId"] = activeChallengeId;
  body["deviceId"] = DEVICE_ID;
  String payload;
  serializeJson(body, payload);
  const int code = http.POST(payload);
  const String response = http.getString();
  Serial.printf("API response (%d): %s\n", code, response.c_str());
  if (code == 202 || code == 409 || code == 410) {
    challengeActive = false;
    activeChallengeId = "";
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(TAPLOCK_INPUT_PIN, INPUT_PULLUP);
  delay(150);
  Serial.println();
  Serial.println("TapLock ESP32 Wi-Fi input bridge");
  Serial.printf("Input GPIO%d, active-low. Connect GPIO%d to GND for bench test.\n",
                TAPLOCK_INPUT_PIN, TAPLOCK_INPUT_PIN);
  Serial.println("Connecting to Wi-Fi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(TAPLOCK_WIFI_SSID, TAPLOCK_WIFI_PASSWORD);
  const uint32_t started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 20000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("Wi-Fi connected; IP=%s\n", WiFi.localIP().toString().c_str());
    Serial.printf("API=%s\n", TAPLOCK_API_BASE);
  } else {
    Serial.println("Wi-Fi connection timed out. Check secrets.h and reboot.");
  }
  Serial.println("IMPORTANT: This bridge reports an input event, not cryptographic authorization.");
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
      Serial.println("Physical input detected.");
      submitPhysicalInput();
    }
  }
  if (now - lastPollAt >= POLL_INTERVAL_MS) {
    lastPollAt = now;
    if (WiFi.status() != WL_CONNECTED) WiFi.reconnect();
    pollChallenge();
  }
  delay(2);
}

#pragma once

// Copy this file to secrets.h and replace placeholders.
// Do not commit secrets.h. Add it to .gitignore before filling in credentials.
#define TAPLOCK_WIFI_SSID "YOUR_WIFI_SSID"
#define TAPLOCK_WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Local development: use the computer's LAN IP, not 127.0.0.1 or localhost.
// Cloud deployment: use your HTTPS Render URL.
#define TAPLOCK_API_BASE "http://192.168.1.100:3000"

// Must match the TAPLOCK_DEVICE_TOKEN environment variable configured on the API.
// Use a long random value; do not use this example string in a real deployment.
#define TAPLOCK_DEVICE_TOKEN "REPLACE_WITH_LONG_RANDOM_DEVICE_TOKEN"

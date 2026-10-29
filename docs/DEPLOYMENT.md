# Deployment

## Run locally

1. Install Node.js 20 or newer.
2. Clone the repository and open the project folder.
3. Run `npm install`, then `npm start`.
4. Open `http://localhost:3000`.

Run the test suite with `npm test`.

## Deploy to Render

1. Push the repository to GitHub.
2. In Render, choose **New +** then **Blueprint**.
3. Connect this repository and allow Render to read `render.yaml`.
4. Review the service settings and deploy.
5. Open the generated Render URL and confirm that the dashboard loads.

The hosted API currently stores demo state in process memory. It is reset on restart and is not suitable for production. Do not enter secrets or connect a real wallet. The prototype does not perform NEAR transactions, cryptographically authenticate an ESP32, or verify a signed approval.

## ESP32 firmware

Open `firmware/` in VS Code with PlatformIO. Build and flash the `esp32dev` environment, then open the serial monitor at 115200 baud. The firmware currently emits a local serial event only. It does not communicate with the hosted API.

For a bench test, GPIO27 can be pulled to GND. The input is active-low and uses the internal pull-up. Use 3.3 V logic only; never connect 5 V to an ESP32 GPIO.

## Before a public demo

- Keep the prototype disclaimer visible.
- Use test data only.
- Do not represent physical input as a verified signature.
- Do not claim transaction execution or blockchain integration until implemented and tested.

## Configure ESP32 API authentication

Before using the Wi-Fi firmware, set `TAPLOCK_DEVICE_TOKEN` in the server's environment to a long random secret. Configure the same value in your local ignored `firmware/include/secrets.h`. The example header is a template only.

For Render, add `TAPLOCK_DEVICE_TOKEN` under the service's Environment settings, then redeploy. For remote device communication, use the HTTPS Render URL in `TAPLOCK_API_BASE`. For local testing, use your computer's LAN IP and keep the computer and ESP32 on the same Wi-Fi network.

The shared token is only a basic prototype transport gate. It is not a cryptographic device identity or a substitute for signed approvals.

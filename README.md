# TapLock

**A hardware-backed authorization prototype for NEAR and sensitive digital actions.**

TapLock explores a simple security principle: an online request can prepare a sensitive action, but a separate physical device must confirm intent before the application proceeds. The prototype combines an ESP32-WROOM-32, a web authorization console, a local Node.js API, short-lived challenges, an audit trail, and a NEAR smart-contract verification concept.

> **Current status:** the dashboard and Wi-Fi-connected ESP32 input bridge are implemented. The current firmware records a physical button event; it does not yet create an Ed25519 signature or submit a NEAR contract call. The contract source has not been compiled, deployed, or audited. No real transaction is executed. Do not use this prototype to protect real funds.

## Why TapLock?

Software-only approval can be abused by malicious scripts, compromised sessions, or automated agents. TapLock separates the request from a physical confirmation step. The intended next stage is to bind device signatures to a specific action digest, nonce, expiry, and NEAR network, then verify the signature on-chain.

## Features in this prototype

- Responsive dark authorization dashboard with demo actions and risk labels.
- Short-lived, single-use API challenges.
- ESP32 Wi-Fi polling and authenticated input events.
- Onboard BOOT button as the no-jumper confirmation input on compatible ESP32 DevKit boards.
- Recent audit events and replay/expiry checks in the demo API.
- NEAR Rust contract source for device-key registration and Ed25519 signature verification.
- Explicit prototype boundary: demo approval is not cryptographic authorization and does not execute transactions.

## Hardware

- ESP32-WROOM-32 development board with an onboard BOOT button connected to GPIO0 (common on ESP32 DevKit boards).
- Computer and ESP32 on the same Wi-Fi network for local development.
- No display module or external tactile button is required for this button-input prototype.

**Board variation warning:** confirm your specific board's BOOT button is wired to GPIO0. Press it only after startup. Holding BOOT during reset or power-up can put many ESP32 boards into download mode. If your board does not expose BOOT on GPIO0, adjust `TAPLOCK_INPUT_PIN` and the PlatformIO build flag to match its schematic.

## Run the dashboard

Requirements: Node.js 20 or newer.

```bash
npm install
npm test
npm start
```

Open http://localhost:3000.

## Connect the ESP32

1. Copy `firmware/include/secrets.example.h` to `firmware/include/secrets.h`.
2. Set your Wi-Fi SSID and password.
3. Set `TAPLOCK_API_BASE` to the computer's LAN IP, such as `http://192.168.1.105:3000`. Do not use `localhost` in firmware.
4. Set `TAPLOCK_DEVICE_TOKEN` to the same long random value configured in the server environment.
5. Open `firmware/` in VS Code with PlatformIO, build, and upload.
6. Open Serial Monitor at 115200 baud.
7. Create a challenge in the dashboard and choose to wait for the ESP32.
8. When the Serial Monitor prints the pending challenge, review the action in the dashboard and briefly press the onboard BOOT button.

If the API reports 401, the server's `TAPLOCK_DEVICE_TOKEN` is missing or does not match the firmware token. Keep the server terminal running. Ensure Windows Firewall allows the local Node server to accept connections from your network.

## NEAR contract status

The Rust source under `contract/` is intended to register Ed25519 public keys, validate signed challenge fields, enforce expiry, prevent challenge/nonce reuse, and record an on-chain receipt. It is **not yet connected end-to-end** to the ESP32. The firmware does not yet generate signatures, securely provision a device key, or submit a NEAR transaction. Contract compilation, unit tests, testnet deployment, and end-to-end signature verification remain required milestones.

## Security limitations

- The current shared device token is a transport gate, not cryptographic device identity.
- The firmware currently submits a physical-input event, not a signed authorization.
- The dashboard is not a trusted display. A button press alone does not prove the user reviewed the exact transaction details.
- The server stores demo state in memory; audit events are not durable.
- ESP32-WROOM-32 is not equivalent to a dedicated tamper-resistant security element.
- Do not connect this prototype to real wallets or production credentials.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).

## Hackathon

Built for the NEAR Hackathon, November 1–14, 2026.

## License

MIT. See [LICENSE](LICENSE).

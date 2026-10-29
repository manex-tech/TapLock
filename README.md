# TapLock

**Physical authorization for high-risk digital actions.**

TapLock explores a simple security primitive: an online request can prepare a sensitive action, but a separate physical interaction with an ESP32 must authorize it. A physical button confirms intent; it is not a trusted display and cannot, by itself, prove which transaction the user saw.

## Project status

This repository is the public home for the TapLock NEAR Hackathon prototype. The initial MVP focuses on an ESP32-WROOM-32, a GPIO input, a web dashboard, and a local API for challenge/approval demonstrations.

**Security note:** the demo API is not production-grade authorization. It does not yet provide cryptographic device identity, signed approvals, durable audit storage, or on-chain execution. Do not use it to protect real funds or accounts.

## Hardware

- ESP32-WROOM-32 development board
- One jumper wire from GPIO27 to GND for a temporary input test
- Firmware uses `INPUT_PULLUP`; the input is active-low

No display or tactile push button is assumed. A jumper-to-GND can be used for a controlled bench test, but it is not a finished user interface.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm start
```

Open http://localhost:3000.

Run tests:

```bash
npm test
```

## Firmware

Open `firmware/` in VS Code with PlatformIO. Select the ESP32 Dev Module environment, build, and flash the board. Configure the API endpoint for your network before attempting device-to-server communication.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). A Render Blueprint is included in `render.yaml`. The hosted demo should be treated as a prototype until device authentication and production security controls are implemented.

## Security model

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md). TapLock distinguishes physical confirmation from a trusted display: without a trusted display, a button press cannot establish that the user reviewed the exact action details.

## NEAR Hackathon

Built for the NEAR Hackathon, November 1–14, 2026. The next integration milestone is a narrowly scoped, verifiable authorization flow that can gate a NEAR-related action without exposing private keys to the web application.

## License

MIT. See [`LICENSE`](LICENSE).


## Connected ESP32 demo

The ESP32 firmware can poll the API for a pending challenge and submit a physical-input event over Wi-Fi. This is a hardware-connected prototype, not cryptographic approval.

1. In the deployment environment, set `TAPLOCK_DEVICE_TOKEN` to a long random secret.
2. Copy `firmware/include/secrets.example.h` to `firmware/include/secrets.h` (the latter is ignored by Git).
3. Set your Wi-Fi SSID/password, `TAPLOCK_API_BASE`, and the same device token.
4. For local testing, use your computer's LAN IP in `TAPLOCK_API_BASE`, not localhost. Ensure the computer and ESP32 are on the same network.
5. Open `firmware/` in VS Code with PlatformIO, build and flash, then open Serial Monitor at 115200 baud.
6. Start the web server and create a challenge in the dashboard. Once the ESP32 reports the pending challenge, connect GPIO27 to GND to send the physical-input event.

The device-token header is a basic shared-secret transport gate, not a device signature. Use HTTPS for remote deployments. Do not expose real funds or credentials.

## NEAR contract

The Rust contract source is in `contract/`. It registers device Ed25519 public keys, verifies signatures on-chain, and records one-time approval receipts. It has not been deployed to testnet or independently audited. Contract signing bytes must match the documented message exactly. The current ESP32 bridge does not yet create Ed25519 signatures or submit contract calls, so the on-chain contract is not connected to the hardware demo yet.

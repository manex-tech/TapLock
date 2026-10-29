# TapLock

**A physical authorization layer for NEAR smart-contract actions and autonomous agents.**

TapLock explores a NEAR-native security problem: as AI agents and applications become capable of initiating on-chain actions, how can a person enforce a physical approval boundary before a sensitive action is allowed to proceed?

TapLock pairs an ESP32-WROOM-32 hardware confirmation device with a transaction-aware dashboard and a Rust smart-contract design for verifying device-signed, single-use approvals. The intended authorization binds to the exact action digest, NEAR network, device identity, nonce, and expiry.

> **Prototype status:** the dashboard and Wi-Fi-connected ESP32 input bridge are implemented. The current firmware records a physical button event; it does not yet produce an Ed25519 signature or submit a NEAR contract call. The Rust contract source has not yet been compiled, tested end-to-end, deployed, or audited. No actual NEAR transaction is executed. This is not a production wallet or custody system.

## Why this belongs in the NEAR ecosystem

NEAR is building infrastructure for intelligent agents, autonomous payments, and applications that can move value. TapLock focuses on the safety boundary around those actions: a user-defined policy and physical device should be able to reject or approve a specific action rather than blindly trusting an application session or agent.

The strongest initial fit is **AI Security & Defense**, with a related fit for **Agent Economy** and **Open Innovation**. NEAR Intents and cross-chain execution are possible future integrations, not current features. TapLock will only claim those integrations after a real end-to-end implementation and test.

## Demo concept

1. An application or agent proposes a NEAR action.
2. TapLock creates a short-lived challenge containing the action digest and policy context.
3. The user reviews the action in the dashboard.
4. The user physically confirms on the ESP32 onboard BOOT button.
5. The intended complete flow has the ESP32 sign the exact challenge with its device key.
6. A NEAR smart contract verifies the registered public key, signature, expiry, network binding, and replay protection, then records an on-chain receipt.
7. The calling application proceeds only after checking the verified receipt and its own execution policy.

**Steps 5–7 are planned and not yet implemented end-to-end.** The current prototype's physical input is not cryptographic authorization and must not be represented as a completed on-chain approval.

## What exists now

- Responsive authorization dashboard with sample NEAR-oriented actions and risk labels.
- Node.js API for short-lived challenges and audit events.
- Authenticated ESP32 polling and physical-input event submission.
- Onboard BOOT button input on compatible ESP32 DevKit boards, avoiding a jumper wire for normal interaction.
- Rust NEAR contract source for device-key registration, Ed25519 verification, expiry checks, nonce/challenge replay protection, and approval receipts.
- Documentation that distinguishes working prototype functionality from future integration.

## Hardware

- ESP32-WROOM-32 development board with onboard BOOT button (commonly GPIO0).
- Computer and ESP32 on the same Wi-Fi network for local development.
- No display module or external button required for the current input prototype.

**Board warning:** confirm your exact board's BOOT-button wiring. On many ESP32 DevKit boards BOOT is GPIO0. Holding BOOT while resetting or powering on can enter download mode.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm test
npm start
```

Open http://localhost:3000.

## Connect the ESP32

1. Copy `firmware/include/secrets.example.h` to `firmware/include/secrets.h`.
2. Set the Wi-Fi SSID and password.
3. Set `TAPLOCK_API_BASE` to the computer's LAN IP and port, for example `http://192.168.1.105:3000`. Do not use `localhost` in firmware.
4. Set `TAPLOCK_DEVICE_TOKEN` to match the server environment.
5. Open `firmware/` in VS Code with PlatformIO, build, upload, and open Serial Monitor at 115200 baud.
6. Create a challenge in the dashboard and choose to wait for the ESP32.
7. When the challenge appears in Serial Monitor, review it in the dashboard and briefly press BOOT.

Expected current result: the API records a physical input event. This does **not** yet prove an Ed25519 signature or a NEAR transaction.

## NEAR contract

The Rust source under `contract/` is intended to register device Ed25519 public keys, verify signatures over a canonical challenge message, enforce short expiry, reject reused challenge IDs and nonces, and store receipts. Before claiming it works, the contract must compile and pass tests, be deployed to NEAR testnet, and be exercised with a real signed message from the device.

See [docs/NEAR_INTEGRATION.md](docs/NEAR_INTEGRATION.md) for the target architecture and milestones.

## Security limitations

- The current shared device token is an API access control, not cryptographic device identity.
- Current firmware submits a physical-input event, not a signed authorization.
- The dashboard is not a trusted display; a button press alone does not prove the user reviewed the exact transaction.
- Demo state and audit events are in memory and are not durable.
- ESP32-WROOM-32 is not equivalent to a dedicated tamper-resistant security element.
- No production wallet, mainnet contract, or real-funds workflow is supported.

## Hackathon positioning

Target track: **AI Security & Defense**. Related themes: **Agent Economy** and **Open Innovation**. The project should demonstrate a working security primitive on NEAR, not merely a generic dashboard that mentions NEAR.

The hackathon requires a public repository and a public demo post on X. See [HACKATHON.md](HACKATHON.md) for a reviewer-oriented demo checklist and the official event link.

## License

MIT. See [LICENSE](LICENSE).

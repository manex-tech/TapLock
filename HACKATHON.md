# NEAR HACKATHON — TapLock

## One-line pitch

TapLock is a physical authorization layer for NEAR actions: it is designed to require a human's explicit hardware confirmation before a sensitive application or autonomous agent can proceed with an on-chain action.

## Intended track

**Primary: AI Security & Defense.** TapLock addresses the risk of AI agents and compromised application sessions initiating sensitive actions without meaningful human review.

**Related: Agent Economy and Open Innovation.** The project explores a reusable policy and approval boundary for software agents that can request actions.

Do not claim NEAR Intents, Chain Signatures, NEAR AI Cloud, or cross-chain execution integration unless a working integration is present in the submitted code and shown in the demo. Those are potential extensions, not existing features.

## Problem

Agentic applications can automate useful work, but automation creates a safety question: how does a user retain meaningful control when software can propose sensitive on-chain actions? A normal web confirmation can be triggered by compromised code or a stolen session. TapLock explores separating the request from a physical confirmation and a cryptographic verification step.

## What the prototype should prove

The most important milestone is a real end-to-end testnet proof, not the number of UI screens:

1. A NEAR-specific action is prepared and displayed with network, receiver, method/action, and policy context.
2. TapLock derives a canonical action digest.
3. A short-lived challenge includes a unique ID, nonce, expiry, device ID, and network binding.
4. The user physically confirms on the ESP32.
5. The device signs the canonical message with its private key.
6. The NEAR contract verifies the signature against a registered public key, rejects expired or replayed challenges, and records a receipt.
7. The demo displays the testnet transaction link and receipt.
8. A negative test proves that a tampered action, invalid signature, expired challenge, or replay is rejected.

The current repository does **not** yet complete steps 4–8 cryptographically. Label the current firmware/dashboard bridge as a prototype and do not imply that a real NEAR transaction has occurred.

## Reviewer quick start

1. Clone the public repository.
2. Run `npm install`, `npm test`, and `npm start`.
3. Open `http://localhost:3000`.
4. Configure the ESP32 Wi-Fi/API settings in the ignored local `firmware/include/secrets.h`.
5. Build and upload the firmware with PlatformIO.
6. Create a challenge and follow the serial output to confirm that the device receives it.
7. Press the onboard BOOT button only after the challenge is visible.
8. Observe the audit event.

Expected result in the current prototype: the API records a hardware-input event. It is not a cryptographic authorization or on-chain transaction.

## Evidence checklist before submission

- [ ] Clean install and all Node tests pass.
- [ ] Firmware builds successfully from the public repository.
- [ ] A fresh clone can follow the README without undocumented steps.
- [ ] Contract compiles and contract tests pass.
- [ ] Contract is deployed to NEAR testnet and the contract account is documented.
- [ ] A real device-generated signature is accepted on testnet.
- [ ] Invalid, expired, tampered, and replayed authorizations are rejected.
- [ ] Demo video shows the hardware, dashboard, and verifiable testnet receipt.
- [ ] README accurately distinguishes implemented functionality from roadmap items.
- [ ] Public X demo post explicitly says the project was built for NEAR HACKATHON and includes the demo video.
- [ ] Repository and X post links are ready for the official submission form.

## Official event reference

Check the current rules, tracks, deadlines, and submission instructions at https://nearhackathon.com/. The repository must be public, and the official event page requires a public demo post on X plus the repository link for submission.

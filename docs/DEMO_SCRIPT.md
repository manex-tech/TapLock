# TapLock demo script (3 minutes)

## 1. Explain the problem (30 seconds)

"AI agents and automated apps can prepare actions quickly, but software should not be the only thing authorizing high-impact actions. TapLock explores a separate physical-intent step."

## 2. Show the action queue (30 seconds)

Point out the recipient, amount, network label, and risk. Explain that the high-risk sample is blocked in this prototype.

## 3. Create a challenge (45 seconds)

Choose **Create challenge** on a pending action. Explain that the API creates a random challenge with a 60-second expiry and records its action digest.

The browser asks whether to record a physical-input event. Choosing Yes records the simulated input event. Choosing No runs the clearly labelled demo approval simulation.

## 4. Inspect the audit trail (30 seconds)

Show the challenge and input events. Attempting to reuse a challenge is rejected by its state.

## 5. Be precise about the current boundary (30 seconds)

"The current version is a prototype. It does not cryptographically authenticate the ESP32, verify a signature, connect a NEAR wallet, or execute a transaction. The next milestone is a signed approval bound to the exact transaction digest, nonce, expiry, device identity, and network."

## Hardware bench demonstration

Flash `firmware/` with PlatformIO and open Serial Monitor at 115200 baud. Briefly connect GPIO27 to GND to generate a debounced physical-input event. Do not connect 5 V to an ESP32 GPIO. The serial event is not yet wired to the web API.

## Strong closing line

"TapLock's core idea is simple: prepare digitally, confirm physically, verify cryptographically, and only then execute."
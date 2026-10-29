# TapLock threat model

## Security objective

Demonstrate a workflow in which a digital action creates a short-lived challenge and a physical input is recorded as a separate event before any future authorization decision.

## Assets

- Integrity of action details shown in the interface
- Freshness and uniqueness of authorization challenges
- Integrity and traceability of approval events
- Device identity and any future signing key
- User funds and account credentials (out of scope for this prototype)

## Threats

- Replay or reuse of an old challenge
- A compromised browser fabricating a physical-input request
- A malicious server changing recipient or amount details
- A fake device claiming to be the enrolled ESP32
- Confusing a button press with informed consent to a specific action
- Loss or alteration of in-memory audit records

## Current mitigations

- Challenges expire after 60 seconds.
- Challenge state rejects repeated input events.
- Action fields are hashed to produce a digest for demonstration and inspection.
- The UI and API explicitly report that cryptographic authorization and execution are disabled.
- High-risk sample action is blocked in the demo.

## Known gaps

The API does not authenticate devices or sign messages. The digest is not a signature and is not independently verified. The browser can call demo endpoints. State and audit logs are in memory. There is no trusted display on the hardware, persistent storage, rate limiting, deployment hardening, NEAR wallet integration, or on-chain transaction execution.

A GPIO event only establishes that an input was observed by this firmware. It does not prove which transaction a human reviewed. Production design must bind a device signature to a canonical transaction digest, challenge nonce, expiry, device identity, and chain/network, with independent verification before execution.

## Out of scope

This prototype must not protect real funds, secrets, or production credentials.
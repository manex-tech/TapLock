# TapLock NEAR contract

This contract is the on-chain verification component of the TapLock prototype. It registers Ed25519 public keys, verifies device signatures on-chain using NEAR's env::ed25519_verify, rejects expired challenges and reused nonces, and records an approval receipt keyed by challenge ID.

## Signed message

The device signs the exact UTF-8 bytes:

    taplock:v1|<challenge_id>|<action_digest>|<nonce>|<expires_at_ms>|<device_id>|<chain_id>

The action digest is a 64-character SHA-256 hex digest over a canonical action representation. The signing implementation must use exactly the same field ordering and bytes as the contract.

## Build and test

Install Rust, the wasm target, and cargo-near. Then run:

    cargo test --manifest-path contract/Cargo.toml
    cargo near build --manifest-path contract/Cargo.toml

If your cargo-near version doesn't accept --manifest-path, run the commands from the contract directory.

## Deploy to testnet

Create/use a dedicated NEAR testnet account, then deploy the generated WASM using the current NEAR CLI or cargo-near workflow. Initialize with your owner account ID. Register the device's 32-byte Ed25519 public key. Keep owner credentials off the web server and out of Git.

## Security boundaries

- The owner can register and revoke devices; protect this account.
- The contract verifies the signature and binds it to the exact message, expiry, chain ID, nonce, challenge and action digest.
- It records an approval receipt; it does not transfer funds or execute arbitrary actions.
- Hardware private-key protection depends on firmware, provisioning and physical access. A normal ESP32 dev board is not automatically a secure element.
- Review and test before mainnet use. This prototype is not audited.
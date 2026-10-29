# NEAR integration plan

## Product direction

TapLock is not intended to be a generic hardware dashboard. It is a human-authorization boundary for NEAR actions requested by applications or autonomous agents. The first deliverable should be a narrow, verifiable testnet flow.

## Target architecture

1. **Action proposal:** the app provides a structured action, including NEAR network, receiver/account, function or action description, and a canonical digest of the exact proposal.
2. **Policy check:** the server checks allowed receivers/actions, amount or gas ceilings where applicable, and whether explicit human confirmation is required.
3. **Challenge:** the server creates a unique challenge ID, cryptographically random nonce, expiry, device ID, network ID, and action digest.
4. **Physical intent:** the ESP32 asks for confirmation using its onboard button. A button alone is not considered identity.
5. **Device signature:** firmware signs a canonical byte sequence using a device private key. The key must never be sent to the server. Device key generation, storage, serialization, and signature verification must use a vetted library and matching test vectors.
6. **On-chain verification:** the NEAR contract verifies the registered Ed25519 public key, exact signed message, action digest, network, expiry, and replay protection, then stores an approval receipt.
7. **Execution gate:** the application checks the contract receipt before attempting the corresponding action. The approval contract does not magically authorize arbitrary wallet transactions; wallet/account permissions and transaction execution must be designed explicitly.
8. **Evidence:** show the NEAR testnet account, contract call transaction hash, stored receipt, and negative tests in the demo.

## Canonical message

The contract source currently expects this UTF-8 message shape:

`taplock:v1|<challenge_id>|<action_digest_hex>|<nonce>|<expires_at_ms>|<device_id>|<network_id>`

Do not sign a JSON string whose property order can vary. Construct the exact canonical message, use a SHA-256 digest for the action, and verify with test vectors shared between firmware and contract. Treat every field as untrusted until validated.

## Security requirements

- Use a cryptographically secure random nonce.
- Keep private keys out of source control and API responses.
- Bind signatures to the exact action digest and network to prevent cross-action/cross-network replay.
- Expire challenges quickly and reject duplicate challenge IDs and nonces.
- Test malformed inputs and enforce field-size limits.
- Rate-limit API requests and avoid logging secrets.
- Do not treat a shared HTTP token as a device signature.
- A physical button press does not guarantee the user saw the transaction details on a trusted display.
- The ESP32-WROOM-32 has limitations for tamper-resistant key storage; describe this as a prototype, not a certified hardware wallet.

## Integration status

| Component | Status |
|---|---|
| Dashboard and demo action queue | Implemented prototype |
| Node API challenge and event endpoints | Implemented prototype; needs end-to-end verification |
| ESP32 Wi-Fi and physical input | Implemented prototype |
| ESP32 Ed25519 key generation and signing | Not implemented |
| NEAR contract compile and tests | Not verified |
| NEAR testnet deployment | Not done |
| Real contract receipt linked to a device signature | Not implemented |
| NEAR Intents or Chain Signatures integration | Not implemented; future extension |

## Recommended sequence

1. Run Node tests and fix any failures.
2. Compile the contract using the current supported NEAR Rust toolchain and fix compile/test issues.
3. Implement the device signature with a vetted embedded Ed25519 implementation and shared test vectors.
4. Add a backend relay that submits signed approvals to the deployed testnet contract without ever receiving the device private key.
5. Add integration tests for valid, tampered, expired, and replayed challenges.
6. Add a testnet transaction receipt panel and a repeatable reviewer demo.
7. Only then explore NEAR Intents or other ecosystem integrations if they improve the actual use case.

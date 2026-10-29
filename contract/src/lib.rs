use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::{LookupMap, UnorderedMap, UnorderedSet},
    env, near_bindgen, AccountId, PanicOnDefault, BorshStorageKey,
};
use near_sdk::serde::{Deserialize, Serialize};

#[derive(BorshSerialize, BorshStorageKey)]
enum StorageKey { Devices, Receipts, Nonces }

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Receipt {
    pub challenge_id: String,
    pub action_digest: String,
    pub nonce: String,
    pub device_id: String,
    pub expires_at_ms: u64,
    pub approved_at_ms: u64,
    pub signer_account: AccountId,
}

#[near_bindgen]
#[derive(BorshSerialize, BorshDeserialize, PanicOnDefault)]
pub struct TapLock {
    owner: AccountId,
    devices: LookupMap<String, Vec<u8>>,
    receipts: UnorderedMap<String, Receipt>,
    used_nonces: UnorderedSet<String>,
}

#[near_bindgen]
impl TapLock {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            owner,
            devices: LookupMap::new(StorageKey::Devices),
            receipts: UnorderedMap::new(StorageKey::Receipts),
            used_nonces: UnorderedSet::new(StorageKey::Nonces),
        }
    }

    pub fn register_device(&mut self, device_id: String, public_key: Vec<u8>) {
        self.assert_owner();
        assert!(!device_id.is_empty() && device_id.len() <= 64, "invalid device id");
        assert_eq!(public_key.len(), 32, "Ed25519 public key must be 32 bytes");
        self.devices.insert(device_id, public_key);
    }

    pub fn revoke_device(&mut self, device_id: String) {
        self.assert_owner();
        self.devices.remove(&device_id);
    }

    pub fn record_approval(
        &mut self,
        challenge_id: String,
        action_digest: String,
        nonce: String,
        expires_at_ms: u64,
        device_id: String,
        message: String,
        signature: Vec<u8>,
    ) -> Receipt {
        assert!(!self.receipts.contains_key(&challenge_id), "challenge already recorded");
        assert!(!self.used_nonces.contains(&nonce), "nonce already used");
        let now = env::block_timestamp_ms();
        assert!(expires_at_ms >= now, "challenge expired");
        assert!(expires_at_ms <= now + 120_000, "expiry too far in future");
        assert_eq!(action_digest.len(), 64, "action digest must be 32-byte hex");
        assert_eq!(signature.len(), 64, "Ed25519 signature must be 64 bytes");
        let expected = format!("taplock:v1|{}|{}|{}|{}|{}|{}",
            challenge_id, action_digest, nonce, expires_at_ms, device_id, env::chain_id());
        assert_eq!(message, expected, "signed message does not match approval fields");

        let public_key = self.devices.get(&device_id).expect("device not registered");
        let public_key: [u8; 32] = public_key.try_into().expect("invalid public key length");
        let signature: [u8; 64] = signature.try_into().expect("invalid signature length");
        assert!(env::ed25519_verify(&signature, message.as_bytes(), &public_key), "invalid device signature");

        let receipt = Receipt {
            challenge_id: challenge_id.clone(), action_digest, nonce: nonce.clone(),
            device_id, expires_at_ms, approved_at_ms: now, signer_account: env::signer_account_id(),
        };
        self.used_nonces.insert(nonce);
        self.receipts.insert(challenge_id, receipt.clone());
        env::log_str("TAPLOCK_APPROVAL_VERIFIED");
        receipt
    }

    pub fn get_receipt(&self, challenge_id: String) -> Option<Receipt> {
        self.receipts.get(&challenge_id)
    }

    pub fn get_device_key(&self, device_id: String) -> Option<Vec<u8>> {
        self.devices.get(&device_id)
    }

    pub fn get_owner(&self) -> AccountId { self.owner.clone() }

    fn assert_owner(&self) {
        assert_eq!(env::predecessor_account_id(), self.owner, "owner only");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, AccountId};

    fn account(s: &str) -> AccountId { s.parse().unwrap() }

    #[test]
    fn owner_initializes_contract() {
        let context = VMContextBuilder::new().predecessor_account_id(account("owner.testnet")).build();
        testing_env!(context);
        let contract = TapLock::new(account("owner.testnet"));
        assert_eq!(contract.get_owner(), account("owner.testnet"));
    }
}
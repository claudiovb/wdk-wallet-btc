/**
 * Signer backed by a single raw private key (non-HD).
 *
 * Does not support HD derivation or extended keys. Signs messages and PSBTs directly using
 * the leaf key.
 *
 * @implements {ISignerBtc}
 */
export default class PrivateKeySignerBtc implements ISignerBtc {
    /**
     * Creates a new private key signer.
     *
     * @param {string | Uint8Array | Buffer} privateKey - The raw private key (hex string or 32 bytes).
     * @param {BtcSignerConfig} [config] - The signer configuration.
     * @throws {ValueError} If the private key is not 32 bytes.
     * @throws {ValueError} If an unsupported BIP is specified.
     */
    constructor(privateKey: string | Uint8Array | Buffer, config?: BtcSignerConfig);
    /** @private */
    private _config;
    /** @private */
    private _network;
    /** @private */
    private _account;
    /** @private */
    private _address;
    /**
     * Whether this signer can derive child signers. Always false: a private-key signer is a
     * single standalone account and is bound directly to a wallet account.
     *
     * @type {boolean}
     */
    get isDerivable(): boolean;
    /**
     * The derivation path. Always null for private-key signers.
     *
     * @type {string | null}
     */
    get path(): string | null;
    /**
     * The account's Bitcoin address.
     *
     * @type {string}
     */
    get address(): string;
    /**
     * The name of the network the signer's addresses are encoded for.
     *
     * @type {"bitcoin" | "regtest" | "testnet"}
     */
    get network(): "bitcoin" | "regtest" | "testnet";
    /**
     * The BIP address type of the signer's addresses (44 for P2PKH, 84 for P2WPKH).
     *
     * @type {44 | 84}
     */
    get bip(): 44 | 84;
    /**
     * The account's key pair (public and private keys).
     *
     * @type {KeyPair}
     */
    get keyPair(): KeyPair;
    /**
     * PrivateKeySignerBtc is not a hierarchical signer and cannot derive.
     *
     * @returns {Promise<never>}
     * @throws {InvalidSignerError} Always — private-key signers do not support derivation.
     */
    derive(): Promise<never>;
    /**
     * Returns the account's derived address.
     *
     * @returns {Promise<string>} The account's address.
     */
    getAddress(): Promise<string>;
    /**
     * PrivateKeySignerBtc is not a hierarchical signer and has no extended keys.
     *
     * @returns {Promise<never>}
     * @throws {InvalidSignerError} Always — extended keys require HD derivation.
     */
    getExtendedPublicKey(): Promise<never>;
    /**
     * Signs a message.
     *
     * @param {string} message - The message to sign.
     * @returns {Promise<string>} The message's signature.
     */
    sign(message: string): Promise<string>;
    /**
     * Signs a PSBT (Partially Signed Bitcoin Transaction).
     *
     * @param {Psbt | string} psbt - The PSBT instance or base64 string.
     * @returns {Promise<string>} The signed PSBT in base64 format.
     */
    signPsbt(psbt: Psbt | string): Promise<string>;
    /**
     * Disposes the signer, securely erasing the private key from memory.
     */
    dispose(): void;
}
export type ISignerBtc = import("./signer-btc.js").ISignerBtc;
export type BtcSignerConfig = import("./signer-btc.js").BtcSignerConfig;
export type KeyPair = import("@tetherto/wdk-wallet").KeyPair;
export type InvalidSignerError = import("@tetherto/wdk-wallet").InvalidSignerError;
export type ValueError = import("@tetherto/wdk-wallet").ValueError;
export type Psbt = import("bitcoinjs-lib").Psbt;

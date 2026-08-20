/** @typedef {import('./seed-signer-btc.js').BtcSignerConfig} BtcSignerConfig */
/** @typedef {import('@tetherto/wdk-wallet').KeyPair} KeyPair */
/**
 * Signer backed by a single raw private key (non-HD).
 *
 * Does not support HD derivation, extended keys, or master fingerprint.
 * Signs messages and PSBTs directly using the leaf key.
 *
 * @extends {ISignerBtc}
 */
export default class PrivateKeySignerBtc extends ISignerBtc {
    /**
     * Creates a new private key signer.
     *
     * @param {string | Uint8Array | Buffer} privateKey - The raw private key (hex string or 32 bytes).
     * @param {BtcSignerConfig} [config] - The signer configuration.
     */
    constructor(privateKey: string | Uint8Array | Buffer, config?: BtcSignerConfig);
    /**
     * @private
     * @type {BtcSignerConfig}
     */
    private _config: BtcSignerConfig;
    /** @private */
    private _account;
    /** @private */
    private _address;
    /**
     * Whether this signer can derive child signers. Always false for private-key signers.
     *
     * @type {boolean}
     */
    get isDerivable(): boolean;
    /**
     * The account index. Always undefined for private-key signers.
     *
     * @type {number | undefined}
     */
    get index(): number | undefined;
    /**
     * The derivation path. Always undefined for private-key signers.
     *
     * @type {string | undefined}
     */
    get path(): string | undefined;
    /**
     * The account's key pair (public and private keys).
     *
     * @type {KeyPair}
     */
    get keyPair(): KeyPair;
    /**
     * The signer configuration.
     *
     * @type {BtcSignerConfig}
     */
    get config(): BtcSignerConfig;
    /**
     * The BIP standard of the signer's addresses (44 for P2PKH, 84 for P2WPKH).
     *
     * @type {number}
     */
    get bip(): number;
    /**
     * The account's Bitcoin address.
     *
     * @type {string}
     */
    get address(): string;
    /**
     * Returns the account's derived address.
     * @returns {Promise<string>}
     */
    getAddress(): Promise<string>;
    /**
     * Not supported for private key signers.
     *
     * @returns {Promise<never>}
     * @throws {InvalidSignerError} Always — private-key signers do not support derivation.
     */
    derive(): Promise<never>;
    /**
     * Not available for private key signers.
     *
     * @throws {InvalidSignerError} Always throws since extended keys require HD derivation.
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
export type BtcSignerConfig = import("./seed-signer-btc.js").BtcSignerConfig;
export type KeyPair = import("@tetherto/wdk-wallet").KeyPair;
import { ISignerBtc } from './seed-signer-btc.js';
import { Psbt } from 'bitcoinjs-lib';

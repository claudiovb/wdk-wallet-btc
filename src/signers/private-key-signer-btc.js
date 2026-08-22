'use strict'

// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { networks, Psbt } from 'bitcoinjs-lib'
import { ECPair } from '@bitcoinerlab/descriptors'
import { InvalidSignerError, ValueError } from '@tetherto/wdk-wallet'

// eslint-disable-next-line camelcase
import { sodium_memzero } from 'sodium-universal'

import { normalizeConfig, getAddressFromPublicKey, signMessage, signPsbtWithKey } from './utils.js'

/** @typedef {import('./signer-btc.js').ISignerBtc} ISignerBtc */
/** @typedef {import('./signer-btc.js').BtcSignerConfig} BtcSignerConfig */
/** @typedef {import('@tetherto/wdk-wallet').KeyPair} KeyPair */

/**
 * Signer backed by a single raw private key (non-HD).
 *
 * Does not support HD derivation or extended keys. Signs messages and PSBTs directly using
 * the leaf key.
 *
 * @implements {ISignerBtc}
 */
export default class PrivateKeySignerBtc {
  /**
   * Creates a new private key signer.
   *
   * @param {string | Uint8Array | Buffer} privateKey - The raw private key (hex string or 32 bytes).
   * @param {BtcSignerConfig} [config] - The signer configuration.
   * @throws {ValueError} If the private key is not 32 bytes.
   * @throws {ValueError} If an unsupported BIP is specified.
   */
  constructor (privateKey, config = {}) {
    config = normalizeConfig(config)

    let pkBuf
    if (typeof privateKey === 'string') {
      pkBuf = Buffer.from(privateKey, 'hex')
    } else if (Buffer.isBuffer(privateKey)) {
      pkBuf = privateKey
    } else {
      // Wrap Uint8Array as a Buffer view over the same ArrayBuffer (zero-copy)
      pkBuf = Buffer.from(privateKey.buffer, privateKey.byteOffset, privateKey.byteLength)
    }

    if (pkBuf.length !== 32) {
      throw new ValueError('The private key must be 32 bytes.')
    }
    const network = networks[config.network] || networks.bitcoin
    const account = ECPair.fromPrivateKey(pkBuf)
    /**
     * @private
     * @type {BtcSignerConfig}
     */
    this._config = config
    /** @private */
    this._network = network
    /** @private */
    this._account = account
    /** @private */
    this._address = getAddressFromPublicKey(account.publicKey, network, config.bip)
  }

  /**
   * Whether this signer can derive child signers. Always false: a private-key signer is a
   * single standalone account and is bound directly to a wallet account.
   *
   * @type {boolean}
   */
  get isDerivable () {
    return false
  }

  /**
   * The derivation path. Always null for private-key signers.
   *
   * @type {string | null}
   */
  get path () {
    return null
  }

  /**
   * The account's Bitcoin address.
   *
   * @type {string}
   */
  get address () {
    return this._address
  }

  /**
   * The name of the network the signer's addresses are encoded for.
   *
   * @type {"bitcoin" | "regtest" | "testnet"}
   */
  get network () {
    return this._config.network ?? 'bitcoin'
  }

  /**
   * The BIP address type of the signer's addresses (44 for P2PKH, 84 for P2WPKH).
   *
   * @type {44 | 84}
   */
  get bip () {
    return this._config.bip
  }

  /**
   * The account's key pair (public and private keys).
   *
   * @type {KeyPair}
   */
  get keyPair () {
    return {
      privateKey: this._account ? this._account.privateKey : null,
      publicKey: this._account ? this._account.publicKey : null
    }
  }

  /**
   * PrivateKeySignerBtc is not a hierarchical signer and cannot derive.
   *
   * @returns {Promise<never>}
   * @throws {InvalidSignerError} Always — private-key signers do not support derivation.
   */
  async derive () {
    throw new InvalidSignerError('PrivateKeySignerBtc does not support derivation.')
  }

  /**
   * Returns the account's derived address.
   *
   * @returns {Promise<string>} The account's address.
   */
  async getAddress () {
    return this._address
  }

  /**
   * PrivateKeySignerBtc is not a hierarchical signer and has no extended keys.
   *
   * @returns {Promise<never>}
   * @throws {InvalidSignerError} Always — extended keys require HD derivation.
   */
  async getExtendedPublicKey () {
    throw new InvalidSignerError('Extended public key is unavailable for private-key imported signers.')
  }

  /**
   * Signs a message.
   *
   * @param {string} message - The message to sign.
   * @returns {Promise<string>} The message's signature.
   */
  async sign (message) {
    return signMessage(message, this._account.privateKey, this._config.bip)
  }

  /**
   * Signs a PSBT (Partially Signed Bitcoin Transaction).
   *
   * @param {Psbt | string} psbt - The PSBT instance or base64 string.
   * @returns {Promise<string>} The signed PSBT in base64 format.
   */
  async signPsbt (psbt) {
    const psbtInstance = typeof psbt === 'string' ? Psbt.fromBase64(psbt) : psbt
    return signPsbtWithKey(psbtInstance, this._account, this._config.bip, this._network)
  }

  /**
   * Disposes the signer, securely erasing the private key from memory.
   */
  dispose () {
    if (this._account) {
      sodium_memzero(this._account.privateKey)
    }
    this._account = undefined
  }
}

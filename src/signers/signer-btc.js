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
'use strict'

import { ISigner, NotImplementedError } from '@tetherto/wdk-wallet'

/** @typedef {import('bitcoinjs-lib').Psbt} Psbt */
/** @typedef {import('@tetherto/wdk-wallet').InvalidSignerError} InvalidSignerError */

/**
 * @typedef {Object} BtcSignerConfig
 * @property {"bitcoin" | "regtest" | "testnet"} [network] - The name of the network to use (default: "bitcoin").
 * @property {44 | 84} [bip] - The BIP address type used for key and address derivation.
 *   - 44: [BIP-44 (P2PKH / legacy)](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
 *   - 84: [BIP-84 (P2WPKH / native SegWit)](https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki)
 *   - Default: 84 (P2WPKH).
 */

/**
 * Interface for Bitcoin signers, extending the base `ISigner` from `@tetherto/wdk-wallet`.
 *
 * @interface
 */
export class ISignerBtc extends ISigner {
  /**
   * The account's address, if available.
   *
   * @type {string | undefined}
   */
  get address () {
    throw new NotImplementedError('address')
  }

  /**
   * The name of the network the signer's addresses are encoded for.
   *
   * @type {"bitcoin" | "regtest" | "testnet"}
   */
  get network () {
    throw new NotImplementedError('network')
  }

  /**
   * The BIP address type of the signer's addresses (44 for P2PKH, 84 for P2WPKH).
   *
   * @type {44 | 84}
   */
  get bip () {
    throw new NotImplementedError('bip')
  }

  /**
   * Returns the extended public key (e.g. xpub/tpub).
   *
   * @returns {Promise<string>} The extended public key in base58 format.
   * @throws {InvalidSignerError} If the signer does not support extended keys.
   */
  async getExtendedPublicKey () {
    throw new NotImplementedError('getExtendedPublicKey()')
  }

  /**
   * Signs a PSBT (Partially Signed Bitcoin Transaction).
   *
   * @param {Psbt | string} psbt - The PSBT instance or base64 string.
   * @returns {Promise<string>} The signed PSBT in base64 format.
   */
  async signPsbt (psbt) {
    throw new NotImplementedError('signPsbt(psbt)')
  }
}

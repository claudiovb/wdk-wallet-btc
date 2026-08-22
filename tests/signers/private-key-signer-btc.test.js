import { describe, expect, test } from '@jest/globals'

import { Psbt, networks, address as btcAddress } from 'bitcoinjs-lib'

import PrivateKeySignerBtc from '../../src/signers/private-key-signer-btc.js'

const VALID_PRIVATE_KEY = '15e083525dac99a2a9bba8f14a6eed9704a77c5994b1a9b4d7271ebd353b7966'
const EXPECTED_PUBLIC_KEY = '02f8044c82d6b9dfcfc3e6f3424cb11cc747bb34766bcbef72d2f52f6c4e8e07aa'

const MESSAGE = 'Dummy message to sign.'

// Fixtures for VALID_PRIVATE_KEY with a bip-44 regtest (P2PKH) configuration.
const BIP_44_REGTEST_CONFIG = { bip: 44, network: 'regtest' }
const BIP_44_REGTEST_ADDRESS = 'mjsVx6s5oH9VqwmhfjCyVo6t7APRGY6T8o'
const BIP_44_REGTEST_EXPECTED_SIGNATURE = 'H4RwJWJzRmVkgQDqmTgX0qCbSONLQjvjfXH7ZdKZs5S3BWbpfjqbGdIJQXy/+ppW4Lvaw0wZ/UaDOLhMw5TIDuk='

// Fixtures for VALID_PRIVATE_KEY with the default (bip-84 mainnet) configuration.
const DEFAULT_ADDRESS = 'bc1q9lpn7ks92lekmr6m0gpy4qyzyq8g98nufpddma'

// Fixtures for VALID_PRIVATE_KEY with a bip-84 regtest (P2WPKH) configuration.
const BIP_84_REGTEST_CONFIG = { bip: 84, network: 'regtest' }
const EXPECTED_PSBT_PARTIAL_SIG_PUBKEY = '02f8044c82d6b9dfcfc3e6f3424cb11cc747bb34766bcbef72d2f52f6c4e8e07aa'
const EXPECTED_PSBT_PARTIAL_SIG_SIGNATURE = '3045022100baf90a97ad07d0cd320ad9c4e7028eb52f9f02b4b87bbb399c4883b324e78ff202204ed486957a17a03bc5cf96a13acdf6b05cc7ac18bc1a61d5d29806cd0f8cb78401'

// Foreign (not-ours) regtest address used to add an unrelated PSBT input/output.
const PSBT_FOREIGN_ADDRESS = 'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080'

/**
 * Builds an in-memory PSBT with two SegWit inputs: input 0 is owned by `signer`, input 1 belongs
 * to an unrelated script. Lets us exercise signPsbt fully offline (no UTXO fetch / regtest harness).
 */
function buildMixedPsbt (signer) {
  const network = networks.regtest
  const myScript = btcAddress.toOutputScript(signer.address, network)
  const foreignScript = btcAddress.toOutputScript(PSBT_FOREIGN_ADDRESS, network)
  const psbt = new Psbt({ network })
  psbt.addInput({ hash: '11'.repeat(32), index: 0, witnessUtxo: { script: myScript, value: BigInt(100000) } })
  psbt.addInput({ hash: '22'.repeat(32), index: 1, witnessUtxo: { script: foreignScript, value: BigInt(50000) } })
  psbt.addOutput({ address: PSBT_FOREIGN_ADDRESS, value: BigInt(90000) })
  return psbt
}

describe('PrivateKeySignerBtc', () => {
  describe('constructor', () => {
    test('should create a signer from a hex string', () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY, BIP_44_REGTEST_CONFIG)

      expect(signer.isDerivable).toBe(false)
      expect(signer.path).toBeNull()
      expect(signer.address).toBe(BIP_44_REGTEST_ADDRESS)
      expect(signer.network).toBe('regtest')
      expect(signer.bip).toBe(44)

      signer.dispose()
    })

    test('should create a signer from a Buffer', () => {
      const keyBytes = Buffer.from(VALID_PRIVATE_KEY, 'hex')

      const signer = new PrivateKeySignerBtc(keyBytes, BIP_44_REGTEST_CONFIG)

      expect(signer.address).toBe(BIP_44_REGTEST_ADDRESS)

      signer.dispose()
    })

    test('should create a signer from a Uint8Array', () => {
      const keyBytes = new Uint8Array(Buffer.from(VALID_PRIVATE_KEY, 'hex'))

      const signer = new PrivateKeySignerBtc(keyBytes, BIP_44_REGTEST_CONFIG)

      expect(signer.address).toBe(BIP_44_REGTEST_ADDRESS)

      signer.dispose()
    })

    test('should default to a bip-84 mainnet configuration', () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY)

      expect(signer.address).toBe(DEFAULT_ADDRESS)
      expect(signer.network).toBe('bitcoin')
      expect(signer.bip).toBe(84)

      signer.dispose()
    })

    test('should throw if the private key is too short', () => {
      expect(() => new PrivateKeySignerBtc('aabb'))
        .toThrow('The private key must be 32 bytes.')
    })

    test('should throw if the private key is too long', () => {
      expect(() => new PrivateKeySignerBtc('ff'.repeat(33)))
        .toThrow('The private key must be 32 bytes.')
    })

    test('should throw for unsupported bip specifications', () => {
      expect(() => new PrivateKeySignerBtc(VALID_PRIVATE_KEY, { bip: 1 }))
        .toThrow('Invalid bip specification. Supported bips: 44, 84.')
    })
  })

  describe('keyPair', () => {
    test('should expose the expected key pair bytes', () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY)

      expect(Buffer.from(signer.keyPair.privateKey).toString('hex')).toBe(VALID_PRIVATE_KEY)
      expect(Buffer.from(signer.keyPair.publicKey).toString('hex')).toBe(EXPECTED_PUBLIC_KEY)

      signer.dispose()
    })
  })

  describe('derive', () => {
    test('should throw when calling derive', async () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY)

      await expect(signer.derive()).rejects.toThrow('PrivateKeySignerBtc does not support derivation.')

      signer.dispose()
    })
  })

  describe('getAddress', () => {
    test('should return the address', async () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY, BIP_44_REGTEST_CONFIG)

      const address = await signer.getAddress()

      expect(address).toBe(BIP_44_REGTEST_ADDRESS)

      signer.dispose()
    })
  })

  describe('getExtendedPublicKey', () => {
    test('should throw when requesting an extended public key', async () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY)

      await expect(signer.getExtendedPublicKey()).rejects.toThrow('Extended public key is unavailable for private-key imported signers.')

      signer.dispose()
    })
  })

  describe('sign', () => {
    test('should return the correct signature', async () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY, BIP_44_REGTEST_CONFIG)

      const signature = await signer.sign(MESSAGE)

      expect(signature).toBe(BIP_44_REGTEST_EXPECTED_SIGNATURE)

      signer.dispose()
    })
  })

  describe('signPsbt', () => {
    test('should sign owned inputs and leave foreign inputs untouched', async () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY, BIP_84_REGTEST_CONFIG)
      const psbt = buildMixedPsbt(signer)

      const signed = await signer.signPsbt(psbt)

      const parsed = Psbt.fromBase64(signed)
      expect(parsed.data.inputs[0].partialSig).toHaveLength(1)
      expect(Buffer.from(parsed.data.inputs[0].partialSig[0].pubkey).toString('hex'))
        .toBe(EXPECTED_PSBT_PARTIAL_SIG_PUBKEY)
      expect(Buffer.from(parsed.data.inputs[0].partialSig[0].signature).toString('hex'))
        .toBe(EXPECTED_PSBT_PARTIAL_SIG_SIGNATURE)
      expect(parsed.data.inputs[1].partialSig).toBeUndefined()

      signer.dispose()
    })
  })

  describe('dispose', () => {
    test('should clear secrets on dispose', () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY)

      signer.dispose()

      expect(signer.keyPair.privateKey).toBeNull()
      expect(signer.keyPair.publicKey).toBeNull()
    })

    test('should be safe to call dispose more than once', () => {
      const signer = new PrivateKeySignerBtc(VALID_PRIVATE_KEY)

      signer.dispose()

      expect(() => signer.dispose()).not.toThrow()
    })
  })
})

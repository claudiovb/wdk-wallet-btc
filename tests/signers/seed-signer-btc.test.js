import { describe, expect, test } from '@jest/globals'

import * as bip39 from 'bip39'
import { Psbt, networks, address as btcAddress } from 'bitcoinjs-lib'

import SeedSignerBtc from '../../src/signers/seed-signer-btc.js'

const VALID_SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

const MESSAGE = 'Dummy message to sign.'

// Default account ("m/84'/1'/0'/0/0") for VALID_SEED_PHRASE with the default configuration.
const DEFAULT_PATH = "m/84'/1'/0'/0/0"
const DEFAULT_ADDRESS = 'bc1q8dqnpagwt9rtl7k38nuaa2ahf690avzkn3hdmf'
const DEFAULT_PRIVATE_KEY = '007335c465cb8183b8a43d3f4eb7dbeb65f51e3a94c4a42369f3d2979ffa35fa'
const DEFAULT_PUBLIC_KEY = '02e928d54a04833586b14e9c910884f589aebdc713a055e655c2fa13306c1b4f7f'

// Other accounts of VALID_SEED_PHRASE with the default configuration.
const PATH_005_ADDRESS = 'bc1qzlqkg0jy73dek6pj99lu4qa87v0mqlmjq3czvj'
const CHILD_001_ADDRESS = 'bc1qkr67mkl07s5slnjzsesza3g75qhu4rx6zu3u24'
const PAST_LEAF_ADDRESS = 'bc1qzfcza368u8nfmcfj9358ds4jws3qt0z9tw0mq3'
const CUSTOM_ROOT_ADDRESS = 'bc1qplyls7xzppmc3md439nft763ynylx6yzpkuxcq'
const FROM_M_ADDRESS = 'bc1q908a7wncgavppdhkjl0qncx2889dal3t8km3xe'

// The default account of VALID_SEED_PHRASE with a bip-44 (P2PKH) configuration.
const BIP_44_PATH = "m/44'/1'/0'/0/0"
const BIP_44_ADDRESS = '15MYf3n6zFiF4qJ5xAEbfstZFAniHN92Rx'

// Fixtures of VALID_SEED_PHRASE with a regtest configuration.
const REGTEST_CONFIG = { network: 'regtest' }
const REGTEST_ADDRESS = 'bcrt1q8dqnpagwt9rtl7k38nuaa2ahf690avzkm74nhn'
const REGTEST_XPUB = 'tpubDFzkKtmo97eBEPmF6sPJ4nzJPMYPDHuJPhARSReXWt7XBL6dQ61WTXTB8AtKDznckydrPAWtJRqHwxyvEZXudXxRJrphpU3ahFyiBR88QkQ'
const REGTEST_CHILD_001_XPUB = 'tpubDFzkKtmo97eBGKELLKV8WtugMAEfx7hGyc5ZWWngQZGPVaTv8acKJ64rfFUeLiaCGkA77J3XJ6XSJ4GVKWCydKRTkkNSYG9zB4X1eAuNtuz'
const REGTEST_EXPECTED_SIGNATURE = 'KAVgsxrQT5V4Mhfnk6taeCN1/j8p/sa8S9iNsbsgRb8zbfNOOPXV1w3dQQV0IjboJrlxYuDJnHw5a/E6vRJ+0Ek='

const EXPECTED_PSBT_PARTIAL_SIG_PUBKEY = '02e928d54a04833586b14e9c910884f589aebdc713a055e655c2fa13306c1b4f7f'
const EXPECTED_PSBT_PARTIAL_SIG_SIGNATURE = '3045022100bb13449bdd3b7c10817339e6dd22c276a205c744b5315fc8df94d2ddf1897681022011f945492c4b9607426124f0f0129dd2fb50344990ad93b134e1a06f9307191c01'

const INVALID_PATH_MESSAGE = "Invalid format: Expected /^(m\\/)?(\\d+'?\\/)*\\d+'?$/ but received \"a'/b/c\""

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

describe('SeedSignerBtc', () => {
  describe('constructor', () => {
    test('should create a derivable signer at the default account', () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE)

      expect(signer.isDerivable).toBe(true)
      expect(signer.path).toBe(DEFAULT_PATH)
      expect(signer.address).toBe(DEFAULT_ADDRESS)
      expect(signer.network).toBe('bitcoin')
      expect(signer.bip).toBe(84)

      signer.dispose()
    })

    test('should create a signer from raw seed bytes', () => {
      const seedBytes = bip39.mnemonicToSeedSync(VALID_SEED_PHRASE)

      const signer = new SeedSignerBtc(seedBytes)

      expect(signer.path).toBe(DEFAULT_PATH)
      expect(signer.address).toBe(DEFAULT_ADDRESS)

      signer.dispose()
    })

    test('should create a signer at an explicit path', () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'/0'/0/5")

      expect(signer.path).toBe("m/84'/1'/0'/0/5")
      expect(signer.address).toBe(PATH_005_ADDRESS)

      signer.dispose()
    })

    test('should create a bip-44 signer with a P2PKH address', () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE, undefined, { bip: 44 })

      expect(signer.path).toBe(BIP_44_PATH)
      expect(signer.address).toBe(BIP_44_ADDRESS)
      expect(signer.bip).toBe(44)

      signer.dispose()
    })

    test('should create a derivable signer at an intermediate path', () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'")

      expect(signer.isDerivable).toBe(true)
      expect(signer.path).toBe("m/84'/1'")

      signer.dispose()
    })

    test('should not enforce any path shape', () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE, "m/9'/1")

      expect(signer.path).toBe("m/9'/1")

      signer.dispose()
    })

    test('should throw if the seed phrase is invalid', () => {
      expect(() => new SeedSignerBtc('invalid seed phrase'))
        .toThrow('The seed phrase is invalid.')
    })

    test('should throw if no seed is given', () => {
      expect(() => new SeedSignerBtc())
        .toThrow('Seed is required.')
    })

    test('should throw if the path is invalid', () => {
      expect(() => new SeedSignerBtc(VALID_SEED_PHRASE, "a'/b/c"))
        .toThrow(INVALID_PATH_MESSAGE)
    })

    test('should throw for unsupported bip specifications', () => {
      expect(() => new SeedSignerBtc(VALID_SEED_PHRASE, undefined, { bip: 1 }))
        .toThrow('Invalid bip specification. Supported bips: 44, 84.')
    })
  })

  describe('keyPair', () => {
    test('should expose the expected key pair bytes', () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE)

      expect(Buffer.from(signer.keyPair.privateKey).toString('hex')).toBe(DEFAULT_PRIVATE_KEY)
      expect(Buffer.from(signer.keyPair.publicKey).toString('hex')).toBe(DEFAULT_PUBLIC_KEY)

      signer.dispose()
    })
  })

  describe('derive', () => {
    test('should derive a child signer relative to the signer path', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'")

      const child = await root.derive("0'/0/0")

      expect(child.isDerivable).toBe(true)
      expect(child.path).toBe(DEFAULT_PATH)
      expect(child.address).toBe(DEFAULT_ADDRESS)
      expect(Buffer.from(child.keyPair.privateKey).toString('hex')).toBe(DEFAULT_PRIVATE_KEY)
      expect(Buffer.from(child.keyPair.publicKey).toString('hex')).toBe(DEFAULT_PUBLIC_KEY)

      child.dispose()
      root.dispose()
    })

    test('should derive distinct sibling accounts', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'")

      const child = await root.derive("0'/0/1")

      expect(child.path).toBe("m/84'/1'/0'/0/1")
      expect(child.address).toBe(CHILD_001_ADDRESS)

      child.dispose()
      root.dispose()
    })

    test('should derive past a leaf account', async () => {
      const leaf = new SeedSignerBtc(VALID_SEED_PHRASE)

      const child = await leaf.derive('0')

      expect(child.path).toBe("m/84'/1'/0'/0/0/0")
      expect(child.address).toBe(PAST_LEAF_ADDRESS)

      child.dispose()
      leaf.dispose()
    })

    test('should derive from a custom (non-standard) root', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, "m/9'/1")

      const child = await root.derive('0/0')

      expect(child.path).toBe("m/9'/1/0/0")
      expect(child.address).toBe(CUSTOM_ROOT_ADDRESS)

      child.dispose()
      root.dispose()
    })

    test('should derive under any purpose from a signer at the master path', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, 'm')

      const child = await root.derive("44'/0'/0'/0/0")

      expect(child.path).toBe("m/44'/0'/0'/0/0")
      expect(child.address).toBe(FROM_M_ADDRESS)

      child.dispose()
      root.dispose()
    })

    test('should propagate the configuration to derived children', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'", REGTEST_CONFIG)

      const child = await root.derive("0'/0/0")

      expect(child.network).toBe('regtest')
      expect(child.bip).toBe(84)
      expect(child.address).toBe(REGTEST_ADDRESS)

      child.dispose()
      root.dispose()
    })

    test('should keep a grandchild working after disposing the intermediate signer', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'")
      const intermediate = await root.derive("0'")

      const grandchild = await intermediate.derive('0/0')
      intermediate.dispose()

      expect(grandchild.address).toBe(DEFAULT_ADDRESS)
      expect(Buffer.from(grandchild.keyPair.privateKey).toString('hex')).toBe(DEFAULT_PRIVATE_KEY)

      grandchild.dispose()
      root.dispose()
    })

    test('should throw if the relative path is invalid', async () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE)

      await expect(signer.derive("a'/b/c")).rejects.toThrow(INVALID_PATH_MESSAGE)

      signer.dispose()
    })

    test('should throw when deriving from a disposed signer', async () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE)

      signer.dispose()

      await expect(signer.derive("0'/0/0")).rejects.toThrow('Cannot derive: the signer has been disposed.')
    })
  })

  describe('getAddress', () => {
    test('should return the address', async () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE)

      const address = await signer.getAddress()

      expect(address).toBe(DEFAULT_ADDRESS)

      signer.dispose()
    })
  })

  describe('getExtendedPublicKey', () => {
    test('should return the account tpub on regtest', async () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE, undefined, REGTEST_CONFIG)

      const xpub = await signer.getExtendedPublicKey()

      expect(xpub).toBe(REGTEST_XPUB)

      signer.dispose()
    })

    test('should reflect the derived child account', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'", REGTEST_CONFIG)
      const child = await root.derive("0'/0/1")

      const xpub = await child.getExtendedPublicKey()

      expect(xpub).toBe(REGTEST_CHILD_001_XPUB)

      child.dispose()
      root.dispose()
    })
  })

  describe('sign', () => {
    test('should return the correct signature', async () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE, undefined, REGTEST_CONFIG)

      const signature = await signer.sign(MESSAGE)

      expect(signature).toBe(REGTEST_EXPECTED_SIGNATURE)

      signer.dispose()
    })
  })

  describe('signPsbt', () => {
    test('should sign owned inputs and leave foreign inputs untouched', async () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE, undefined, REGTEST_CONFIG)
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
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE)

      signer.dispose()

      expect(signer.keyPair.privateKey).toBeNull()
      expect(signer.keyPair.publicKey).toBeNull()
      expect(signer.address).toBe(DEFAULT_ADDRESS)
    })

    test('should be safe to call dispose more than once', () => {
      const signer = new SeedSignerBtc(VALID_SEED_PHRASE)

      signer.dispose()

      expect(() => signer.dispose()).not.toThrow()
    })

    test('should not affect the parent when disposing a child', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'")
      const child = await root.derive("0'/0/0")

      child.dispose()

      const sibling = await root.derive("0'/0/1")
      expect(sibling.address).toBe(CHILD_001_ADDRESS)

      sibling.dispose()
      root.dispose()
    })

    test('should not affect derived children when disposing the parent', async () => {
      const root = new SeedSignerBtc(VALID_SEED_PHRASE, "m/84'/1'")
      const child = await root.derive("0'/0/0")

      root.dispose()

      expect(child.address).toBe(DEFAULT_ADDRESS)
      expect(Buffer.from(child.keyPair.privateKey).toString('hex')).toBe(DEFAULT_PRIVATE_KEY)

      child.dispose()
    })
  })
})

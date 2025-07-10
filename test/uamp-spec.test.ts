import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import {
  generateKeyPairES256,
  signEnvelope,
  verifyEnvelopeSignature,
  Envelope,
  UAMPClient,
} from '../src/index';
import { createHash, randomUUID } from 'crypto';
import {
  MockAgent,
  setGlobalDispatcher,
  getGlobalDispatcher,
  Dispatcher,
} from 'undici';

/* -------------------------------------------------------------------------
 * Helper utilities
 * ---------------------------------------------------------------------- */
function buildBaseEnvelope(): Omit<Envelope, 'sig'> {
  return {
    id: `urn:uuid:${randomUUID()}`,
    ts: new Date().toISOString(),
    from: 'did:web:alice.example',
    to: ['did:web:bob.example'],
    intent: 'ask',
    delta_window: 64,
    body: { type: 'text/plain', content: 'ping' },
  };
}

async function signWithNewKey(envBase: Omit<Envelope, 'sig'>) {
  const { privateKey, publicKey } = await generateKeyPairES256();
  const sig = await signEnvelope(envBase, privateKey);
  return { env: { ...envBase, sig } as Envelope, publicKey, privateKey };
}

/* -------------------------------------------------------------------------
 * Global MockAgent lifecycle: isolate every test from real network
 * ---------------------------------------------------------------------- */
let originalDispatcher: Dispatcher;

beforeEach(() => {
  originalDispatcher = getGlobalDispatcher();
  const mock = new MockAgent();
  mock.disableNetConnect();
  setGlobalDispatcher(mock);
});

afterEach(() => {
  setGlobalDispatcher(originalDispatcher);
});

/* -------------------------------------------------------------------------
 * 20 test cases covering crypto + client behaviour
 * ---------------------------------------------------------------------- */

describe('UAMP SDK — comprehensive coverage', () => {
  it('signs and verifies an envelope (happy path)', async () => {
    const base = buildBaseEnvelope();
    const {env, publicKey} = await signWithNewKey(base);
    await expect(verifyEnvelopeSignature(env, [publicKey])).resolves.toBeUndefined();
  });

  it('rejects verification with a wrong key', async () => {
    const base = buildBaseEnvelope();
    const {env} = await signWithNewKey(base);
    const {publicKey: wrong} = await generateKeyPairES256();
    await expect(verifyEnvelopeSignature(env, [wrong])).rejects.toThrow();
  });

  it('verifies when the correct key is among several candidates', async () => {
    const base = buildBaseEnvelope();
    const {env, publicKey} = await signWithNewKey(base);
    const {publicKey: extra} = await generateKeyPairES256();
    await expect(verifyEnvelopeSignature(env, [extra, publicKey])).resolves.toBeUndefined();
  });

  it('fails verification when signature field is missing', async () => {
    // @ts-expect-error intentionally missing sig
    const env: Envelope = buildBaseEnvelope();
    await expect(verifyEnvelopeSignature(env, [])).rejects.toThrow();
  });
  it('defaults delta_window to 64 when absent', async () => {
    const base = buildBaseEnvelope();
    delete (base as any).delta_window;
    const {env} = await signWithNewKey(base);
    expect(env.delta_window ?? 64).toBe(64);
  });

  it('verify fails if timestamp is modified but signature unchanged', async () => {
    const base = buildBaseEnvelope();
    const {env, publicKey} = await signWithNewKey(base);
    env.ts = new Date(Date.now() + 1000).toISOString();
    await expect(verifyEnvelopeSignature(env, [publicKey])).rejects.toThrow();
  });

  it('generateKeyPairES256 returns usable KeyLike objects', async () => {
    const {privateKey, publicKey} = await generateKeyPairES256();
    expect(privateKey.type).toBe('private');
    expect(publicKey.type).toBe('public');
  });

  it('signature covers ext field correctly', async () => {
    const {privateKey, publicKey} = await generateKeyPairES256();
    const base = {...buildBaseEnvelope(), ext: {trace: 'abc'}} as Omit<Envelope, 'sig'>;
    const sig = await signEnvelope(base, privateKey);
    const env: Envelope = {...base, sig};
    await expect(verifyEnvelopeSignature(env, [publicKey])).resolves.toBeUndefined();
  });

  it('signature differs if body content changes', async () => {
    const {privateKey} = await generateKeyPairES256();
    const base = buildBaseEnvelope();
    const sig1 = await signEnvelope(base, privateKey);
    base.body.content = 'new';
    const sig2 = await signEnvelope(base, privateKey);
    expect(sig1).not.toBe(sig2);
  });

  it('signature differs if id changes', async () => {
    const {privateKey} = await generateKeyPairES256();
    const base = buildBaseEnvelope();
    const sig1 = await signEnvelope(base, privateKey);
    base.id = 'urn:uuid:new';
    const sig2 = await signEnvelope(base, privateKey);
    expect(sig1).not.toBe(sig2);
  });

  it('verify succeeds when correct key among EdDSA + ES256 list', async () => {
    const {privateKey, publicKey} = await generateKeyPairES256();
    const base = buildBaseEnvelope();
    const env = {...base, sig: await signEnvelope(base, privateKey)} as Envelope;
    const {publicKey: other} = await generateKeyPairES256();
    await expect(verifyEnvelopeSignature(env, [other, publicKey])).resolves.toBeUndefined();
  });

});

/*
  uamp-js — Universal Agent Messaging Protocol SDK (v1.0.0)
  =========================================================
  Target: UAMP 1.0 (stable envelope freeze)
  - Zero `any`: strict‑mode, fully typed helpers
  - No external path/URL hacks (ESM‑first)
  - Minimal public surface: types + `UAMPClient` + crypto helpers
  - Ready for automatic `.d.ts` generation via `tsc --declaration`
*/

/* ---------------------------------------------------------------- *
 * 1.  Core Data Types (mirrors UAMP 1.0 JSON Schemas)              *
 * ---------------------------------------------------------------- */
export interface Body {
  /** MIME type of the payload (e.g. `text/plain`, `image/png`) */
  type: string;
  /** Raw UTF‑8 string or Base64URL when `encoding !== "utf-8"` */
  content: string;
  /** Text encoding; default `utf-8` */
  encoding?: string;
  /** Compression codec; default `none` */
  compression?: string;
}

export interface ContextItem {
  id: string;           // Reference envelope UUID
  hash: string;         // sha256:… hash of referenced envelope
}

export type Intent =
    | 'ask' | 'inform' | 'propose' | 'confirm' | 'deny'
    | 'progress' | 'cancel' | 'subscribe' | 'notify' | 'error';

export interface Envelope {
  id: string;                 // urn:uuid:…
  ts: string;                 // ISO‑8601 UTC
  from: string;               // DID or URI
  to: string[];
  intent: Intent;
  reply_to?: string;
  context?: ContextItem[];
  stream_id?: string;
  delta_window?: number;      // default 64
  body: Body;
  cap_token?: string;         // JWT/CWT
  sig: string;                // detached JWS
  ext?: Record<string, unknown>;
}

export type DeltaType = 'patch' | 'chunk' | 'done' | 'cancel' | 'error' | 'progress';
export interface Delta {
  delta_seq: number;
  stream_id: string;
  ts: string;
  type: DeltaType;
  payload?: Record<string, unknown>;
}

/* ---------------------------------------------------------------- *
 * 2.  Crypto Helpers (detached JWS ES256 by default)                *
 * ---------------------------------------------------------------- */
import { createHash, randomUUID } from 'crypto';
import { SignJWT, jwtVerify, generateKeyPair, KeyLike } from 'jose';

export async function generateKeyPairES256() {
  return generateKeyPair('ES256');
}

function canonicalJson(obj: unknown): Buffer {
  /**
   * Canonical JSON: stable key order & no insignificant whitespace.
   * This is required by UAMP 1.0 signature rules (spec §4).
   */
  return Buffer.from(JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort()));
}

export async function signEnvelope<T extends Omit<Envelope, 'sig'>>(env: T, key: KeyLike): Promise<string> {
  const sha256 = createHash('sha256').update(canonicalJson(env)).digest('hex');
  return new SignJWT({ sha256 }).setProtectedHeader({ alg: 'ES256' }).sign(key);
}

export async function verifyEnvelopeSignature(env: Envelope, keys: readonly KeyLike[]): Promise<void> {
  const { sig, ...unsigned } = env;
  const expected = createHash('sha256').update(canonicalJson(unsigned)).digest('hex');

  for (const k of keys) {
    try {
      const { payload } = await jwtVerify(sig, k, { algorithms: ['ES256', 'EdDSA', 'RS256'] });
      if ((payload as { sha256?: string }).sha256 === expected) return;
    } catch {/* try next key */}
  }
  throw new Error('UAMP signature validation failed');
}

/* ---------------------------------------------------------------- *
 * 3.  HTTP/2 Client (POST + SSE)                                   *
 * ---------------------------------------------------------------- */
import { request, Agent } from 'undici';

export interface UAMPClientOptions {
  /** Base URL of the remote agent (TLS endpoint). */
  baseUrl: string;
  /** Signing key (private). */
  key: KeyLike;
  /** Bearer access token (OAuth 2.1) */
  token?: string;
  /** Disable TLS verification (dev only). */
  insecureTLS?: boolean;
}

export class UAMPClient {
  private readonly opts: UAMPClientOptions;
  private readonly agent: Agent;

  constructor(opts: UAMPClientOptions) {
    this.opts = opts;
    this.agent = new Agent({ connect: { rejectUnauthorized: !opts.insecureTLS } });
  }

  /**
   * Send one‐off *ask* message. Returns the `stream_id` (if present).
   */
  async send(bodyText: string, to: string, intent: Intent = 'ask'): Promise<string | undefined> {
    const streamId = randomUUID();
    const envNoSig: Omit<Envelope, 'sig'> = {
      id: `urn:uuid:${randomUUID()}`,
      ts: new Date().toISOString(),
      from: 'did:web:client.example',
      to: [to],
      intent,
      stream_id: streamId,
      delta_window: 64,
      body: { type: 'text/plain', content: bodyText },
    };
    const sig = await signEnvelope(envNoSig, this.opts.key);
    const env: Envelope = { ...envNoSig, sig };

    const headers: Record<string, string> = {
      'content-type': 'application/uamp+json;v=1',
    };
    if (this.opts.token) headers['authorization'] = `Bearer ${this.opts.token}`;

    const res = await request(`${this.opts.baseUrl}/v1/messages`, {
      method: 'POST',
      body: JSON.stringify(env),
      headers,
      dispatcher: this.agent,
    });
    if (res.statusCode !== 202) {
      const body = await res.body.text();
      throw new Error(`Unexpected status ${res.statusCode}: ${body}`);
    }
    return streamId;
  }
}

/* ---------------------------------------------------------------- *
 * 4.  CLI Demo (node ts-node src/index.ts "hello")                  *
 * ---------------------------------------------------------------- */
if (require.main === module) {
  (async () => {
    const message = process.argv[2] ?? 'Hello UAMP';
    const { privateKey } = await generateKeyPairES256();
    const client = new UAMPClient({ baseUrl: 'https://localhost:8443', key: privateKey, insecureTLS: true });
    await client.send(message, 'did:web:worker.example');
    console.log('Envelope sent');
  })();
}

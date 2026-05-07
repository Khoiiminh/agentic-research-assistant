import { createHash } from 'crypto';

/** Deterministic UUID-shaped id from a logical key (Qdrant-friendly). */
export function stablePointUuid(key: string): string {
    const d = createHash('sha256').update(key, 'utf8').digest().subarray(0, 16);
    const h = d.toString('hex');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

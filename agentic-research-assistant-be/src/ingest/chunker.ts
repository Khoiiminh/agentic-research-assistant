import * as cheerio from 'cheerio';

/**
 * Extract plain text from HTML-ish RSS content; decodes common entities via the parser.
 */
export function stripHtml(input: string): string {
    if (!input?.trim()) return '';
    const $ = cheerio.load(`<div id="root">${input}</div>`);
    const text = $('#root').text();
    return text.replace(/\s+/g, ' ').trim();
}

const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' ', ''] as const;

/**
 * Recursive-character style splitting: prefer breaks at paragraphs, lines, sentence ends, then spaces.
 */
export function chunkText(
    text: string,
    opts?: { chunkSize?: number; chunkOverlap?: number; separators?: readonly string[] },
): string[] {
    const chunkSize = opts?.chunkSize ?? 800;
    const chunkOverlap = opts?.chunkOverlap ?? 120;
    const separators = opts?.separators ?? DEFAULT_SEPARATORS;

    const cleaned = stripHtml(text);
    if (!cleaned) return [];

    const chunks: string[] = [];
    let start = 0;

    while (start < cleaned.length) {
        const remaining = cleaned.slice(start);
        if (remaining.length <= chunkSize) {
            const tail = remaining.trim();
            if (tail) chunks.push(tail);
            break;
        }

        const window = remaining.slice(0, chunkSize);
        let breakAt = -1;

        for (const sep of separators) {
            if (!sep) continue;
            const idx = window.lastIndexOf(sep);
            const minPos = sep === ' ' ? Math.floor(chunkSize * 0.35) : Math.floor(chunkSize * 0.2);
            if (idx >= minPos) {
                breakAt = idx + sep.length;
                break;
            }
        }

        if (breakAt < 0) breakAt = chunkSize;

        const piece = remaining.slice(0, breakAt).trim();
        if (piece) chunks.push(piece);

        const advance = Math.max(breakAt - chunkOverlap, 1);
        start += advance;
    }

    return chunks;
}

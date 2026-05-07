'use client';

import { useMemo, useRef, useState } from 'react';
import { Button, Container, Group, Stack, Text, TextInput, Title, Anchor, Code } from '@mantine/core';
import { httpClient } from '@/services/api/httpClient';
import { ENDPOINTS } from '@/services/api/endpoints';

type ResearchSource = {
  chunkId: string;
  url?: string;
  title?: string;
  publishedAt?: string;
  score?: number;
  credibilityWeight?: number;
};

type ResearchResponse = {
  answer: string;
  sources: ResearchSource[];
  retrievedCount: number;
  llmUsed: boolean;
  isExtractiveFallback: boolean;
  context?: string;
  snippets?: Array<{ chunkId: string; text: string }>;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ResearchResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const canSubmit = useMemo(() => query.trim().length > 0 && !loading, [query, loading]);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;

    // Cancel previous inflight request (race control)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const myRequestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const res = await httpClient.post<unknown, ResearchResponse>(
        ENDPOINTS.RESEARCH,
        { query: q, topK: 5, applyCredibilityBoost: true },
        { signal: controller.signal },
      );

      // Ignore stale response (out-of-order completion)
      if (myRequestId !== requestIdRef.current) return;
      setData(res);
    } catch (e: any) {
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
      if (myRequestId !== requestIdRef.current) return;
      setError(e?.message ?? 'Request failed');
    } finally {
      if (myRequestId === requestIdRef.current) setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <div>
          <Title order={2}>Research</Title>
          <Text c="dimmed" size="sm">
            Minimal Phase 2 UI: query → retrieval → LLM answer (with citations).
          </Text>
        </div>

        <Group align="flex-end">
          <TextInput
            style={{ flex: 1 }}
            label="Query"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Ask about a topic..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch();
            }}
          />
          <Button onClick={runSearch} loading={loading} disabled={!canSubmit}>
            Search
          </Button>
        </Group>

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        {data && (
          <Stack gap="sm">
            {data.isExtractiveFallback && (
              <Text c="yellow" size="sm">
                AI service unavailable. Displaying raw contextual snippets instead.
              </Text>
            )}

            <div>
              <Text fw={600}>Answer</Text>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{data.answer}</Text>
            </div>

            {data.snippets?.length ? (
              <div>
                <Text fw={600}>Snippets</Text>
                <Stack gap={6}>
                  {data.snippets.map((s) => (
                    <div key={s.chunkId}>
                      <Code>[{s.chunkId}]</Code>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {s.text}
                      </Text>
                    </div>
                  ))}
                </Stack>
              </div>
            ) : null}

            <div>
              <Text fw={600}>Sources ({data.sources.length})</Text>
              <Stack gap={6}>
                {data.sources.map((s) => (
                  <div key={s.chunkId}>
                    <Code>[{s.chunkId}]</Code>{' '}
                    {s.url ? (
                      <Anchor href={s.url} target="_blank" rel="noreferrer">
                        {s.title || s.url}
                      </Anchor>
                    ) : (
                      <Text span>{s.title || 'Unknown source'}</Text>
                    )}
                    {typeof s.score === 'number' ? (
                      <Text span c="dimmed" size="xs">
                        {' '}
                        score={s.score.toFixed(3)}
                      </Text>
                    ) : null}
                  </div>
                ))}
              </Stack>
            </div>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

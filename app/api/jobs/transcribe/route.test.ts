// TDD RED test for transcribe enhancement (Phase 2 clips layer).
// Per superpowers:test-driven-development, claude-api + vercel:ai-sdk for real transcript/summary/chapters.
// Write failing test first.

import { POST } from './route';

describe('POST /api/jobs/transcribe', () => {
  test('rejects invalid job payload', async () => {
    const req = new Request('http://localhost/api/jobs/transcribe', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('processes clip URL with Claude (stub for now): returns transcript, summary, chapters', async () => {
    const req = new Request('http://localhost/api/jobs/transcribe', {
      method: 'POST',
      body: JSON.stringify({ clipId: 'test-clip', url: 'https://blob.example/clip.mp4' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transcript).toBeDefined();
    expect(json.summary).toBeDefined();
    expect(json.chapters).toBeInstanceOf(Array);
    // In real: would call Claude via vercel ai-sdk/gateway for summarization/chapter gen.
  });
});

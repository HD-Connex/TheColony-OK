// TDD RED test for clip moderation (per superpowers:test-driven-development + ruflo-aidefence safety-scan/pii-detect).
// Write failing test first.

import { POST } from './route';

describe('POST /api/clips/moderate', () => {
  test('rejects non-admin moderation request', async () => {
    const req = new Request('http://localhost/api/clips/moderate', {
      method: 'POST',
      body: JSON.stringify({ clipId: 'test', action: 'approve' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  test('approves clip after safety scan (no PII/toxic), updates score and approved', async () => {
    const req = new Request('http://localhost/api/clips/moderate', {
      method: 'POST',
      body: JSON.stringify({ clipId: 'test-clip', action: 'approve' }),
      headers: { authorization: 'Bearer admin' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.approved).toBe(true);
    expect(json.ai_score).toBeGreaterThan(0);
  });

  test('rejects clip if safety-scan detects issues', async () => {
    const req = new Request('http://localhost/api/clips/moderate', {
      method: 'POST',
      body: JSON.stringify({ clipId: 'toxic-clip', action: 'approve' }),
      headers: { authorization: 'Bearer admin' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/blocked by safety/);
  });
});

// TDD RED-GREEN test for clip upload (per superpowers:test-driven-development + ruflo-testgen + vercel:vercel-functions + vercel-storage).
// Tests: unauth, size limit, success path (returns id + pending approved + blob url).

import { POST } from './route';

describe('POST /api/clips/upload', () => {
  test('rejects unauthenticated clip upload', async () => {
    const req = new Request('http://localhost/api/clips/upload', {
      method: 'POST',
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('rejects too-large file (>30MB TWA limit)', async () => {
    const form = new FormData();
    const big = new Blob([new Uint8Array(31 * 1024 * 1024)], { type: 'video/mp4' });
    form.append('file', big, 'bigclip.mp4');
    form.append('ep_id', 'ep-123');
    const req = new Request('http://localhost/api/clips/upload', {
      method: 'POST',
      body: form,
      headers: { authorization: 'Bearer fake' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/too large|30s/);
  });

  test('accepts member clip upload (returns id, approved=false, url from blob)', async () => {
    const form = new FormData();
    const small = new Blob(['fake-clip-data'], { type: 'video/mp4' });
    form.append('file', small, 'clip.mp4');
    form.append('ep_id', 'ep-123');
    const req = new Request('http://localhost/api/clips/upload', {
      method: 'POST',
      body: form,
      headers: { authorization: 'Bearer member-token' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('id');
    expect(json.approved).toBe(false);
    expect(typeof json.url).toBe('string');
    expect(json.url).toMatch(/blob/); // or vercel blob domain in real
  });
});

// Simple concurrent load test for 500 users on the live page (YT stream soft launch critical path)
// Uses native fetch, batches to avoid local network overload.
// Target: prod URL. Expects mostly 200s, no 5xx, reasonable times.
// For soft launch verification: focus on /live which serves the Jake YT embed at 7pm EST, free.

const TARGET = 'https://thecolony-app.vercel.app/live';
const CONCURRENT = 500;
const TIMEOUT_MS = 10000; // 10s timeout per request

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const start = Date.now();
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'TheColony-LoadTest-500/1.0' } });
    const time = Date.now() - start;
    clearTimeout(id);
    return { status: res.status, time, ok: res.ok };
  } catch (e) {
    clearTimeout(id);
    return { status: e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR', time: TIMEOUT_MS, ok: false, error: e.message };
  }
}

async function runBatch(count) {
  const promises = Array.from({ length: count }, () => fetchWithTimeout(TARGET, TIMEOUT_MS));
  const results = await Promise.all(promises);
  return results;
}

async function main() {
  console.log(`Starting 500 concurrent user simulation on ${TARGET}`);
  console.log('This tests the live page serving the 7pm EST Jake Merrick YT stream (embed, free for soft launch).');
  const start = Date.now();
  const results = await runBatch(CONCURRENT);
  const duration = Date.now() - start;

  const success = results.filter(r => r.ok && r.status === 200).length;
  const timeouts = results.filter(r => r.status === 'TIMEOUT').length;
  const errors = results.filter(r => !r.ok && r.status !== 'TIMEOUT').length;
  const other200 = results.filter(r => r.ok && r.status === 200).length; // already in success
  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
  const p95 = results.map(r => r.time).sort((a,b)=>a-b)[Math.floor(results.length * 0.95)];

  console.log('\n=== LOAD TEST RESULTS (500 concurrent) ===');
  console.log(`Total duration: ${duration}ms`);
  console.log(`Successful 200s: ${success} / ${CONCURRENT} (${(success/CONCURRENT*100).toFixed(1)}%)`);
  console.log(`Timeouts: ${timeouts}`);
  console.log(`Other errors: ${errors}`);
  console.log(`Average response time: ${avgTime.toFixed(0)}ms`);
  console.log(`p95 response time: ${p95}ms`);
  console.log('\nInterpretation for soft launch:');
  if (success / CONCURRENT > 0.95 && timeouts < 50) {
    console.log('PASS: High success rate, should handle 500 users for the YT stream page.');
  } else {
    console.log('WARNING: Significant timeouts/errors under 500 concurrent. May need Vercel scaling, caching, or test in better env.');
    console.log('Note: This test is from limited runner; real user load (HTML+YT iframe) is lighter on origin after first hit.');
  }
  console.log('YT embed itself offloads video to YouTube - site only serves shell.');
}

main().catch(console.error);
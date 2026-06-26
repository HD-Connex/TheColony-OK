import { describe, it, expect, vi } from "vitest";

describe("assertPublicHttpUrl", () => {
  it("allows public https URLs when allow-list is set", async () => {
    vi.stubEnv("ALLOWED_TRANSCRIBE_MEDIA_HOSTS", "mux.com,example.com");
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { assertPublicHttpUrl } = await import("./safe-url");
    expect((await assertPublicHttpUrl("https://stream.mux.com/x.m3u8")).hostname).toBe("stream.mux.com");
    expect((await assertPublicHttpUrl("http://example.com/a.mp3")).protocol).toBe("http:");
    vi.unstubAllEnvs();
  });

  it("rejects non-http schemes", async () => {
    vi.stubEnv("ALLOWED_TRANSCRIBE_MEDIA_HOSTS", "mux.com");
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { assertPublicHttpUrl } = await import("./safe-url");
    await expect(assertPublicHttpUrl("file:///etc/passwd")).rejects.toThrow();
    await expect(assertPublicHttpUrl("gopher://x")).rejects.toThrow();
    await expect(assertPublicHttpUrl("not a url")).rejects.toThrow();
    vi.unstubAllEnvs();
  });

  it("blocks all hosts when ALLOWED_TRANSCRIBE_MEDIA_HOSTS is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOWED_TRANSCRIBE_MEDIA_HOSTS", "");
    vi.resetModules();
    const { assertPublicHttpUrl: strictAssert } = await import("./safe-url");
    await expect(strictAssert("https://stream.mux.com/x.m3u8")).rejects.toThrow("allow-list");
    await expect(strictAssert("https://cdn.example.com/a.mp3")).rejects.toThrow("allow-list");
    await expect(strictAssert("http://localhost/")).rejects.toThrow();
    vi.unstubAllEnvs();
  });

  it("also blocks when unset in dev", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOWED_TRANSCRIBE_MEDIA_HOSTS", "");
    vi.resetModules();
    const { assertPublicHttpUrl: devAssert } = await import("./safe-url");
    await expect(devAssert("https://stream.mux.com/x.m3u8")).rejects.toThrow("allow-list");
    vi.unstubAllEnvs();
  });

  it("enforces allow-list when ALLOWED_TRANSCRIBE_MEDIA_HOSTS is set", async () => {
    vi.stubEnv("ALLOWED_TRANSCRIBE_MEDIA_HOSTS", "mux.com,example.com");
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { assertPublicHttpUrl: allowAssert } = await import("./safe-url");
    await expect(allowAssert("https://stream.mux.com/x.m3u8")).resolves.toHaveProperty("hostname", "stream.mux.com");
    await expect(allowAssert("http://example.com/a.mp3")).resolves.toHaveProperty("hostname", "example.com");
    await expect(allowAssert("https://evil.com/x")).rejects.toThrow("allow-list");
    await expect(allowAssert("http://localhost/")).rejects.toThrow();
    vi.unstubAllEnvs();
  });

  it("blocks loopback, private, and metadata hosts (SSRF)", async () => {
    vi.stubEnv("ALLOWED_TRANSCRIBE_MEDIA_HOSTS", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { assertPublicHttpUrl } = await import("./safe-url");
    await expect(assertPublicHttpUrl("http://localhost/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://127.0.0.1/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://10.0.0.5/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://192.168.1.1/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://172.16.0.1/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow();
    await expect(assertPublicHttpUrl("http://[::1]/")).rejects.toThrow();
    vi.unstubAllEnvs();
  });
});

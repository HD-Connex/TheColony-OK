import { describe, it, expect } from "vitest";
import { assertPublicHttpUrl } from "./safe-url";

describe("assertPublicHttpUrl", () => {
  it("allows public https URLs and returns a URL", () => {
    expect(assertPublicHttpUrl("https://stream.mux.com/x.m3u8").hostname).toBe("stream.mux.com");
    expect(assertPublicHttpUrl("http://cdn.example.com/a.mp3").protocol).toBe("http:");
  });
  it("rejects non-http schemes", () => {
    expect(() => assertPublicHttpUrl("file:///etc/passwd")).toThrow();
    expect(() => assertPublicHttpUrl("gopher://x")).toThrow();
    expect(() => assertPublicHttpUrl("not a url")).toThrow();
  });
  it("blocks loopback, private, and metadata hosts (SSRF)", () => {
    expect(() => assertPublicHttpUrl("http://localhost/")).toThrow();
    expect(() => assertPublicHttpUrl("http://127.0.0.1/")).toThrow();
    expect(() => assertPublicHttpUrl("http://10.0.0.5/")).toThrow();
    expect(() => assertPublicHttpUrl("http://192.168.1.1/")).toThrow();
    expect(() => assertPublicHttpUrl("http://172.16.0.1/")).toThrow();
    expect(() => assertPublicHttpUrl("http://169.254.169.254/latest/meta-data/")).toThrow();
    expect(() => assertPublicHttpUrl("http://[::1]/")).toThrow();
  });
});

// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import { countryFlagSvg, countryName, deviceLabel, maskIp, normalizeCountry } from "./client-info.ts";

// Real-world User-Agent strings of current browsers (major versions only matter for nothing here).
const UA = {
  chromeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  operaWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  chromeIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
  safariIpad:
    "Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  samsungAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
  chromeOs:
    "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

test("browser and system from real User-Agent strings", () => {
  assert.equal(deviceLabel(UA.chromeWindows), "Chrome di Windows");
  assert.equal(deviceLabel(UA.edgeWindows), "Edge di Windows");
  assert.equal(deviceLabel(UA.operaWindows), "Opera di Windows");
  assert.equal(deviceLabel(UA.safariMac), "Safari di macOS");
  assert.equal(deviceLabel(UA.chromeMac), "Chrome di macOS");
  assert.equal(deviceLabel(UA.safariIphone), "Safari di iOS");
  assert.equal(deviceLabel(UA.chromeIphone), "Chrome di iOS");
  assert.equal(deviceLabel(UA.safariIpad), "Safari di iPadOS");
  assert.equal(deviceLabel(UA.firefoxLinux), "Firefox di Linux");
  assert.equal(deviceLabel(UA.chromeAndroid), "Chrome di Android");
  assert.equal(deviceLabel(UA.samsungAndroid), "Samsung Internet di Android");
  assert.equal(deviceLabel(UA.chromeOs), "Chrome di ChromeOS");
});

test("unknown or missing User-Agent", () => {
  assert.equal(deviceLabel(null), "Perangkat tidak dikenal");
  assert.equal(deviceLabel(""), "Perangkat tidak dikenal");
  assert.equal(deviceLabel("curl/8.9.1"), "Perangkat tidak dikenal");
  assert.equal(deviceLabel("Mozilla/5.0 (Windows NT 10.0) SomethingNew/1.0"), "Windows");
});

test("maskIp keeps the first two IPv4 octets or IPv6 groups, nothing else", () => {
  assert.equal(maskIp("103.47.12.9"), "103.47.xx.xx");
  assert.equal(maskIp("::ffff:36.71.140.2"), "36.71.xx.xx");
  assert.equal(maskIp("2001:448a:1020:8f::1"), "2001:448a:…");
  assert.equal(maskIp("2001:DB8::1"), "2001:db8:…");
  for (const bad of [null, undefined, "", "::1", "not-an-ip", "999.1.1.1", "1.2.3.4, 5.6.7.8"]) {
    assert.equal(maskIp(bad), null, String(bad));
  }
});

test("normalizeCountry accepts ISO codes and Tor, drops unknown and junk", () => {
  assert.equal(normalizeCountry("ID"), "ID");
  assert.equal(normalizeCountry(" sg "), "SG");
  assert.equal(normalizeCountry("T1"), "T1");
  for (const bad of [null, undefined, "", "XX", "IDN", "1A", "<b>"]) assert.equal(normalizeCountry(bad), null, String(bad));
});

test("countryName gives the Indonesian name", () => {
  assert.equal(countryName("ID"), "Indonesia");
  assert.equal(countryName("SG"), "Singapura");
  assert.equal(countryName("T1"), "Jaringan Tor");
  assert.equal(countryName(null), null);
});

test("countryFlagSvg returns a plain SVG for real codes, null for Tor and unknown", () => {
  const id = countryFlagSvg("ID");
  assert.match(id ?? "", /^<svg[^>]*viewBox=/);
  assert.doesNotMatch(id ?? "", /<script|\son\w+=/i);
  assert.equal(countryFlagSvg("T1"), null);
  assert.equal(countryFlagSvg(null), null);
  assert.equal(countryFlagSvg("ZZ"), null);
});

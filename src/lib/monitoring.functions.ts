function isSafePublicUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    
    const host = parsed.hostname.toLowerCase();
    // Block loopback, RFC 1918 private subnets, and cloud metadata (169.254.x)
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// In runSiteDiagnostics handler:
if (!isSafePublicUrl(data.url)) {
  throw new Error("Invalid destination: Private, local, and metadata endpoints are prohibited.");
}

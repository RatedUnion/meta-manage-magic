import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const IPV4 =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6 =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|::(ffff(:0{1,4})?:)?((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d))$/;

export type IpVersion = "IPv4" | "IPv6";

export type IpResult = {
  query: string;
  version: IpVersion;
  reference: string;
  fields: { label: string; value: string }[];
};

export function detectIpVersion(value: string): IpVersion | null {
  const v = value.trim();
  if (IPV4.test(v)) return "IPv4";
  if (IPV6.test(v)) return "IPv6";
  return null;
}

export const lookupIp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().trim().min(2).max(64) }).parse(input),
  )
  .handler(async ({ data }): Promise<IpResult> => {
    const query = data.query.trim();
    const version = detectIpVersion(query);
    if (!version) {
      throw new Error("Enter a valid IPv4 or IPv6 address.");
    }

    const res = await fetch(`https://ipwho.is/${encodeURIComponent(query)}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error("Lookup service unavailable. Try again shortly.");
    const json = (await res.json()) as Record<string, unknown>;
    if (json["success"] === false) {
      throw new Error(String(json["message"] ?? "No records found for that address."));
    }

    const conn = (json["connection"] ?? {}) as Record<string, unknown>;
    const tz = (json["timezone"] ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (v === undefined || v === null || v === "" ? "—" : String(v));

    let hash = 11;
    for (const ch of query) hash = (hash * 33 + ch.charCodeAt(0)) % 99991;

    return {
      query,
      version,
      reference: `DUA-NET-${String(hash).padStart(5, "0")}`,
      fields: [
        { label: "Type", value: version },
        { label: "Country", value: `${str(json["country"])} ${str(json["flag"] && (json["flag"] as Record<string, unknown>)["emoji"])}`.trim() },
        { label: "Region", value: str(json["region"]) },
        { label: "City", value: str(json["city"]) },
        { label: "Postal", value: str(json["postal"]) },
        { label: "Latitude", value: str(json["latitude"]) },
        { label: "Longitude", value: str(json["longitude"]) },
        { label: "Timezone", value: str(tz["id"]) },
        { label: "Local time", value: str(tz["current_time"]) },
        { label: "ISP", value: str(conn["isp"]) },
        { label: "Organisation", value: str(conn["org"]) },
        { label: "ASN", value: conn["asn"] ? `AS${String(conn["asn"])}` : "—" },
        { label: "Domain", value: str(conn["domain"]) },
      ],
    };
  });

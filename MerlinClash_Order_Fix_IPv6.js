/**
 * Sub-Store -> MerlinClash order fix + IPv6-safe rules
 *
 * Important:
 * - This script keeps port before proxies for MerlinClash subscription import.
 * - It keeps all real config after proxies so MerlinClash's preprocessing does not cut it off.
 * - IPv6 transparent proxy itself must still be enabled in MerlinClash's IPv6 switch.
 */
function main(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("MerlinClash_Order_Fix_IPv6: invalid Mihomo config object");
  }

  if (config.port === undefined || config.port === null) {
    config.port = 7890;
  }

  if (!Array.isArray(config.proxies)) {
    throw new Error("MerlinClash_Order_Fix_IPv6: proxies array not found");
  }

  // Add IPv6 local/private direct rules before all other routing rules.
  // These avoid sending loopback, ULA and link-local IPv6 traffic to the proxy.
  if (!Array.isArray(config.rules)) {
    config.rules = [];
  }

  const ipv6LocalRules = [
    "IP-CIDR6,::1/128,全球直连,no-resolve",
    "IP-CIDR6,fc00::/7,全球直连,no-resolve",
    "IP-CIDR6,fe80::/10,全球直连,no-resolve"
  ];

  const existing = new Set(config.rules);
  const toAdd = ipv6LocalRules.filter(rule => !existing.has(rule));
  config.rules = [...toAdd, ...config.rules];

  // MerlinClash import quirk:
  // port must be before proxies; everything that must survive preprocessing
  // should be at or after proxies.
  const preferredOrder = [
    "port",
    "proxies",
    "proxy-providers",
    "proxy-groups",
    "rule-providers",
    "rules"
  ];

  const ordered = {};

  for (const key of preferredOrder) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      ordered[key] = config[key];
    }
  }

  // Preserve every remaining top-level key after the core sections.
  for (const key of Object.keys(config)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) {
      ordered[key] = config[key];
    }
  }

  console.log(
    "MerlinClash_Order_Fix_IPv6: " +
    "port=" + ordered.port +
    ", proxies=" + ordered.proxies.length +
    ", proxy-groups=" +
    (Array.isArray(ordered["proxy-groups"]) ? ordered["proxy-groups"].length : 0) +
    ", rules=" + ordered.rules.length
  );

  return ordered;
}

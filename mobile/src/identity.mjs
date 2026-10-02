export function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

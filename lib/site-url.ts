export function getBaseUrl() {
  return process.env.PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3112";
}

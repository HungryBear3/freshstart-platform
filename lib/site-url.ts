export const SITE_URL = "https://www.freshstart-il.com"

export function absoluteSiteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString()
}

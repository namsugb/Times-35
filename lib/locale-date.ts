import { enUS, ja, ko } from "date-fns/locale"

export function getDateFnsLocale(locale: string) {
  if (locale === "ja") return ja
  if (locale === "en") return enUS
  return ko
}

export function getLocalePrefix(pathname: string, fallback = "ko") {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return ["ko", "en", "ja"].includes(firstSegment) ? `/${firstSegment}` : `/${fallback}`
}

export function maskPhone(phone?: string | null) {
  if (!phone) {
    return "Не указан";
  }

  if (phone.trim().startsWith("+7")) {
    return "+7 *** **-**";
  }

  return "*** *** **-**";
}

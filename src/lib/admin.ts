export const ADMIN_EMAILS = ["yammertaurus@gmail.com"];

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

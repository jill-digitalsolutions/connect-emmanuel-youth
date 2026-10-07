// Supabase Auth identifies people by email. Accounts created with just a
// username get a stand-in address that is never emailed (so "Confirm email"
// must be off in Supabase for these accounts).
export function usernameEmail(username: string) {
  return `${username.toLowerCase()}@connect-emmanuel.app`;
}

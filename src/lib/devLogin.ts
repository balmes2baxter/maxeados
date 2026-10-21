// El login sin Google se activa solo cuando la app apunta a un Supabase local
// (127.0.0.1 / localhost). NEXT_PUBLIC_DEV_LOGIN=true|false fuerza el valor.
export function isDevLoginEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_DEV_LOGIN;
  if (flag === "true") return true;
  if (flag === "false") return false;
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return host === "127.0.0.1" || host === "localhost";
  } catch {
    return false;
  }
}

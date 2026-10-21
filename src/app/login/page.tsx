import { GoogleButton } from "./google-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between bg-zinc-950 px-6 py-12 text-white">
      <div />
      <div className="w-full max-w-sm text-center">
        <p className="text-6xl">🏋️‍♂️</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight">
          MAX<span className="text-lime-400">EADOS</span>
        </h1>
        <p className="mt-3 text-zinc-400">
          Lleva la máquina al tope. Compite por fuerza relativa.
        </p>
        <div className="mt-6 inline-block rounded-full border border-lime-400/40 bg-lime-400/10 px-4 py-1 text-sm font-semibold text-lime-300">
          Pozo mensual · $100.000 COP
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {error && (
          <p className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
            No pudimos iniciar sesión. Intenta de nuevo.
          </p>
        )}
        <GoogleButton />
        <p className="text-center text-xs text-zinc-500">
          Al continuar aceptas las reglas de la temporada.
        </p>
      </div>
    </main>
  );
}

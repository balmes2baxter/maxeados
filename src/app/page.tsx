import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./onboarding/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, body_weight_kg, weight_verified, role, onboarded")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded) redirect("/onboarding");

  const { data: machines } = await supabase
    .from("machines")
    .select("id, name, muscle_group, max_weight_kg")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="min-h-dvh bg-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Hola,</p>
            <h1 className="text-2xl font-black">{profile.full_name}</h1>
          </div>
          <form action={signOut}>
            <button className="text-sm text-zinc-500 underline">Salir</button>
          </form>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Peso corporal</p>
            <p className="text-2xl font-bold">{profile.body_weight_kg} kg</p>
            <p className={`text-xs ${profile.weight_verified ? "text-lime-400" : "text-amber-400"}`}>
              {profile.weight_verified ? "✓ Verificado" : "Pendiente de verificar"}
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Rol</p>
            <p className="text-2xl font-bold">{profile.role === "ADMIN" ? "Juez" : "Atleta"}</p>
          </div>
        </section>

        <h2 className="mt-8 mb-3 text-lg font-bold">Circuito oficial</h2>
        <ul className="space-y-2">
          {machines?.map((m, i) => (
            <li key={m.id} className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3">
              <div>
                <p className="font-semibold">
                  {i + 1}. {m.name}
                </p>
                <p className="text-xs text-zinc-500">{m.muscle_group}</p>
              </div>
              <span className="font-mono text-lime-400">{m.max_weight_kg} kg</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

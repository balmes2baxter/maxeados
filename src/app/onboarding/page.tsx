import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarded")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded) redirect("/");

  return (
    <main className="min-h-dvh bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-sm">
        <h1 className="text-3xl font-black">Completa tu perfil</h1>
        <p className="mt-2 mb-8 text-zinc-400">
          Necesitamos tu peso corporal para calcular tu fuerza relativa.
        </p>
        <OnboardingForm defaultName={profile?.full_name ?? ""} />
      </div>
    </main>
  );
}

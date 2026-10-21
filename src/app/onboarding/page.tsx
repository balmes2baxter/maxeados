import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { parseAvatar, randomAvatar } from "@/lib/avatar";
import { Onboarding } from "./Onboarding";
import { PixelLoader } from "@/components/PixelLoader";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<PixelLoader />}>
      <OnboardingContent />
    </Suspense>
  );
}

async function OnboardingContent() {
  // Avatar aleatorio inicial y sesión: siempre en la petición, nunca en el prerender.
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboarded) redirect("/");
  return (
    <Onboarding
      initialAvatar={user.avatar ? parseAvatar(user.avatar) : randomAvatar()}
      initialName={user.full_name ?? ""}
      initialPhone={user.phone ?? ""}
      initialWeight={user.body_weight_kg ?? undefined}
    />
  );
}

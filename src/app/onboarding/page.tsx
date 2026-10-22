import { Suspense } from "react";
import { PixelLoader } from "@/components/PixelLoader";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { formatCop, getActiveSeason, getShop } from "@/lib/data";
import { stripLocked } from "@/lib/shop";
import { parseAvatar, randomAvatar } from "@/lib/avatar";
import { Onboarding } from "./Onboarding";

async function OnboardingPageContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/salir");
  if (user.onboarded) redirect("/");
  const [season, shop] = await Promise.all([getActiveSeason(), getShop(user.id)]);
  const locked = shop.locked.map((l) => l.id);
  return (
    <Onboarding
      initialAvatar={stripLocked(user.avatar ? parseAvatar(user.avatar) : randomAvatar(), locked)}
      initialName={user.full_name ?? ""}
      initialPhone={user.phone ?? ""}
      initialWeight={user.body_weight_kg ?? undefined}
      prize={season ? formatCop(season.prize_amount_cop) : "$100.000"}
      locked={shop.locked}
    />
  );
}

// La sesión se lee dentro de un <Suspense>: la navegación muestra el esqueleto al instante.
export default function OnboardingPage() {
  return (
    <Suspense fallback={<PixelLoader />}>
      <OnboardingPageContent />
    </Suspense>
  );
}

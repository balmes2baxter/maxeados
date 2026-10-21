import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { parseAvatar, randomAvatar } from "@/lib/avatar";
import { Onboarding } from "./Onboarding";

export default async function OnboardingPage() {
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

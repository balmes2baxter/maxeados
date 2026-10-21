"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PixelIcon } from "@/components/PixelIcon";
import { sfx, toast } from "@/components/fx";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    sfx("select");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (error) {
      setLoading(false);
      sfx("error");
      toast({ title: "NO SE PUDO ENTRAR", body: error.message, icon: "cross", tone: "danger" });
    }
  }

  return (
    <button onClick={signIn} disabled={loading} className="px-btn w-full">
      <PixelIcon name="door" size={18} /> {loading ? "Conectando..." : "Entrar con Google"}
    </button>
  );
}

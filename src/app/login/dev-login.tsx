"use client";

import { useActionState } from "react";
import { signInDev } from "@/actions/auth";

export function DevLogin() {
  const [state, action, pending] = useActionState(signInDev, undefined);
  return (
    <details className="px-box p-3">
      <summary className="font-pixel cursor-pointer text-[10px] text-pink">▶ Modo desarrollo</summary>
      <form action={action} className="mt-3 flex flex-col gap-1">
        <label className="px-label" htmlFor="dev-name">Nombre</label>
        <input id="dev-name" name="name" className="px-input" placeholder="Tu nombre" defaultValue="Atleta Demo" />
        <label className="px-label mt-2" htmlFor="dev-email">Correo</label>
        <input id="dev-email" name="email" type="email" required className="px-input" defaultValue="atleta@maxeados.dev" />
        <p className="text-base text-muted">Juez de prueba: juez@maxeados.dev</p>
        {state?.error && <p className="anim-shake text-xl text-danger">⚠ {state.error}</p>}
        <button className="px-btn px-btn-pink mt-3" disabled={pending}>{pending ? "Entrando..." : "Entrar sin Google"}</button>
      </form>
    </details>
  );
}

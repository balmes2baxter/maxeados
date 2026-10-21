"use client";

import { useActionState, useState } from "react";
import { signInDev } from "@/actions/auth";
import { sfx } from "@/components/fx";

const QUICK = [
  { label: "Atleta nuevo", name: "", email: "" },
  { label: "Valentina · demo", name: "Valentina Ríos", email: "valentina@demo.maxeados" },
  { label: "Juez", name: "Juez Maxeados", email: "juez@maxeados.dev" },
];

export function DevLogin() {
  const [state, action, pending] = useActionState(signInDev, undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="px-box px-box-accent flex flex-col gap-1 p-3" style={{ ["--accent" as string]: "#ff3ea5" }}>
      <p className="font-pixel text-[10px] text-pink">ENTRAR EN LOCAL</p>
      <p className="text-lg leading-tight text-muted">Sin Google: escribe un correo cualquiera y se crea tu cuenta en el Supabase local.</p>
      <div className="mt-1 flex flex-wrap">
        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            className={`px-chip cursor-pointer ${email === q.email && (q.email || name === "") ? "!bg-pink !text-ink" : ""}`}
            onClick={() => {
              sfx("select");
              setName(q.name);
              setEmail(q.email);
            }}
          >
            {q.label}
          </button>
        ))}
      </div>
      <label className="px-label mt-2" htmlFor="dev-name">Nombre</label>
      <input id="dev-name" name="name" className="px-input" placeholder="Tu nombre de atleta" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="px-label mt-2" htmlFor="dev-email">Correo</label>
      <input
        id="dev-email"
        name="email"
        type="email"
        required
        className="px-input"
        placeholder="tu@correo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {state?.error && <p className="anim-shake text-xl text-danger">⚠ {state.error}</p>}
      <button className="px-btn px-btn-pink mt-3" disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitAttempt } from "@/actions/game";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { sfx } from "@/components/fx";
import { MAX_COUNTED_REPS, countedReps, machineScore } from "@/lib/scoring";

export function AttemptForm({
  userId,
  machineId,
  maxWeightKg,
  bodyWeightKg,
  best,
  avatar,
  disabledReason,
}: {
  userId: string;
  machineId: string;
  maxWeightKg: number;
  bodyWeightKg: number;
  best: number | null;
  avatar: unknown;
  disabledReason: string | null;
}) {
  const [reps, setReps] = useState(10);
  const [state, dispatch, pending] = useActionState(submitAttempt, undefined);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Si hay archivo, se sube directo a Storage (bucket evidence/{userId}/...) y se envía la ruta.
  const action = async (fd: FormData) => {
    setUploadError(null);
    fd.delete("file");
    if (mode === "file") {
      if (!file) {
        sfx("error");
        setUploadError("Elige un video o foto de tu serie.");
        return;
      }
      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${userId}/${machineId}-${Date.now()}.${ext}`;
      const { error } = await createClient().storage.from("evidence").upload(path, file, { contentType: file.type });
      setUploading(false);
      if (error) {
        sfx("error");
        setUploadError(`No se pudo subir el archivo: ${error.message}`);
        return;
      }
      fd.set("evidencePath", path);
      fd.set("evidenceType", file.type.startsWith("image/") ? "photo" : "video");
      fd.delete("evidenceUrl");
    }
    dispatch(fd);
  };
  const busy = pending || uploading;
  const score = machineScore(maxWeightKg, bodyWeightKg, reps);
  const counted = countedReps(reps);
  const isPb = best === null || score > best;

  useEffect(() => {
    if (state?.error) sfx("error");
  }, [state]);

  const bump = (d: number) => {
    sfx("blip");
    setReps((r) => Math.max(1, Math.min(50, r + d)));
  };

  return (
    <form action={action} className="px-box px-box-accent flex flex-col gap-3 p-4" style={{ ["--accent" as string]: "#39ff14" }}>
      <input type="hidden" name="machineId" value={machineId} />
      <input type="hidden" name="reps" value={reps} />
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-[11px] text-neon">NUEVO INTENTO</h2>
        {isPb && !disabledReason && <span className="px-chip anim-pop" style={{ ["--chip" as string]: "#ff3ea5", ["--chip-fg" as string]: "#140c1c" }}>¡Récord personal!</span>}
      </div>

      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <PixelAvatar avatar={avatar} size={96} pose={busy ? "flex" : "idle"} />
        </div>
        <div className="flex flex-1 flex-col items-center">
          <p className="px-label">Repeticiones</p>
          <div className="flex items-center">
            <button type="button" className="px-btn px-btn-ghost px-btn-sm" onClick={() => bump(-1)} aria-label="Menos">−</button>
            <span key={reps} className="font-pixel anim-pop w-16 text-center text-3xl text-bone">{reps}</span>
            <button type="button" className="px-btn px-btn-ghost px-btn-sm" onClick={() => bump(1)} aria-label="Más">+</button>
          </div>
          <div className="mt-1 flex gap-[3px]" aria-hidden>
            {Array.from({ length: MAX_COUNTED_REPS }, (_, i) => (
              <span key={i} className="h-3 w-2 transition-colors duration-200" style={{ background: i < counted ? "var(--color-neon)" : "var(--color-line)" }} />
            ))}
          </div>
          {reps > MAX_COUNTED_REPS && <p className="text-base text-pink">Solo cuentan {MAX_COUNTED_REPS} reps</p>}
        </div>
      </div>

      <div className="bg-ink p-3 text-center">
        <p className="px-label">Puntaje estimado</p>
        <p className="text-lg text-muted">
          ({maxWeightKg} ÷ {bodyWeightKg}) × (1 + {counted}/30)
        </p>
        <p key={score} className="font-pixel anim-pop text-2xl text-gold">{score.toFixed(2)}</p>
      </div>

      <div className="flex">
        {(["file", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { sfx("blip"); setMode(m); }}
            className={`px-btn px-btn-sm flex-1 ${mode === m ? "px-btn-cyan" : "px-btn-ghost"}`}
            disabled={!!disabledReason}
          >
            {m === "file" ? "Subir video" : "Pegar enlace"}
          </button>
        ))}
      </div>
      {mode === "file" ? (
        <label className={`flex cursor-pointer items-center gap-3 bg-ink p-3 transition-colors hover:bg-panel-2 ${disabledReason ? "pointer-events-none opacity-50" : ""}`}>
          <PixelIcon name="video" size={28} />
          <span className="flex-1 truncate text-xl">{file ? file.name : "Toca para elegir video o foto"}</span>
          {file && <span className="font-pixel text-[8px] text-muted">{(file.size / 1048576).toFixed(1)} MB</span>}
          <input
            type="file"
            name="file"
            accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp,image/heic"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > 100 * 1048576) {
                sfx("error");
                setUploadError("El archivo supera 100 MB.");
                return;
              }
              sfx("select");
              setFile(f);
            }}
          />
        </label>
      ) : (
        <input
          name="evidenceUrl"
          type="url"
          required
          className="px-input"
          placeholder="https://youtube.com/... · Drive · Instagram"
          disabled={!!disabledReason}
          aria-label="Enlace del video"
        />
      )}
      <p className="-mt-2 text-base text-muted">Que se vea la pila completa y el rango completo de cada rep.</p>
      {uploading && (
        <div className="px-bar">
          <span className="anim-blink" style={{ width: "100%", ["--fill" as string]: "var(--color-cyan)" }} />
        </div>
      )}
      {uploadError && <p className="anim-shake text-xl text-danger">⚠ {uploadError}</p>}

      {state?.error && <p className="anim-shake text-xl text-danger">⚠ {state.error}</p>}
      {disabledReason ? (
        <p className="flex items-center gap-2 bg-panel-2 p-2 text-xl text-cyan">
          <PixelIcon name="hourglass" size={18} /> {disabledReason}
        </p>
      ) : (
        <button className="px-btn px-btn-gold text-sm" disabled={busy}>
          {uploading ? "Subiendo video..." : pending ? "Enviando..." : "¡MAXEAR!"}
        </button>
      )}
    </form>
  );
}

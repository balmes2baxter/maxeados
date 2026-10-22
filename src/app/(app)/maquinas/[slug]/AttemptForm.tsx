"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitAttempt } from "@/actions/game";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { sfx } from "@/components/fx";
import { MAX_COUNTED_REPS, machineScore } from "@/lib/scoring";
import { distanceM, formatDistance } from "@/lib/geo";

type Gym = { name: string | null; lat: number; lng: number; radius: number } | null;
type Geo =
  | { state: "locating" }
  | { state: "ok" | "far"; lat: number; lng: number; dist: number }
  | { state: "denied" | "insecure" | "unavailable" };

/** Pide la ubicación y la compara con la del gimnasio. */
function useGymCheck(gym: Gym, enabled: boolean) {
  const [geo, setGeo] = useState<Geo>({ state: "locating" });
  // Solo actualiza el estado desde los callbacks del GPS (nunca de forma síncrona en el efecto).
  const locate = useCallback(() => {
    if (!gym || !enabled) return;
    if (!navigator.geolocation) {
      setTimeout(() => setGeo({ state: "unavailable" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const dist = distanceM(p.coords.latitude, p.coords.longitude, gym.lat, gym.lng);
        setGeo({ state: dist <= gym.radius ? "ok" : "far", lat: p.coords.latitude, lng: p.coords.longitude, dist });
      },
      (e) =>
        setGeo({
          state: !window.isSecureContext ? "insecure" : e.code === e.PERMISSION_DENIED ? "denied" : "unavailable",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, [gym, enabled]);
  useEffect(() => {
    locate();
  }, [locate]);
  const retry = () => {
    setGeo({ state: "locating" });
    locate();
  };
  return { geo, locate: retry };
}

export function AttemptForm({
  userId,
  machineId,
  maxWeightKg,
  bodyWeightKg,
  lastKg,
  best,
  avatar,
  gym,
  allowSimulatedGeo,
  disabledReason,
}: {
  userId: string;
  machineId: string;
  maxWeightKg: number;
  bodyWeightKg: number;
  lastKg: number | null;
  best: number | null;
  avatar: unknown;
  gym: Gym;
  allowSimulatedGeo: boolean;
  disabledReason: string | null;
}) {
  const [reps, setReps] = useState(8);
  const [kg, setKg] = useState(String(lastKg ?? Math.round(maxWeightKg * 0.5)));
  const [state, dispatch, pending] = useActionState(submitAttempt, undefined);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);
  const { geo, locate } = useGymCheck(gym, !disabledReason);

  const kgNum = Number(kg);
  const kgValid = Number.isFinite(kgNum) && kgNum > 0 && kgNum <= maxWeightKg;
  const atGym = geo.state === "ok" || simulated;
  const blocked = disabledReason ?? (!atGym ? "Solo desde el gym" : null);

  // Si hay archivo, se sube directo a Storage (bucket evidence/{userId}/...) y se envía la ruta.
  const action = async (fd: FormData) => {
    setUploadError(null);
    fd.delete("file");
    if (!kgValid) {
      sfx("error");
      setUploadError(`El peso debe estar entre 1 y ${maxWeightKg} kg.`);
      return;
    }
    if (mode === "file") {
      if (!file) {
        sfx("error");
        setUploadError("Elige un video o foto de tu serie.");
        return;
      }
      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${userId}/${machineId}-${crypto.randomUUID()}.${ext}`;
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
  const isPb = kgValid && (best === null || machineScore(kgNum, bodyWeightKg, reps) > best);

  useEffect(() => {
    if (state?.error) sfx("error");
  }, [state]);

  const bumpReps = (d: number) => {
    sfx("blip");
    setReps((r) => Math.max(1, Math.min(MAX_COUNTED_REPS, r + d)));
  };
  const bumpKg = (d: number) => {
    sfx("blip");
    setKg((v) => String(Math.max(2.5, Math.min(maxWeightKg, (Number(v) || 0) + d))));
  };

  return (
    <form action={action} className="px-box px-box-accent flex flex-col gap-3 p-4">
      <input type="hidden" name="machineId" value={machineId} />
      <input type="hidden" name="reps" value={reps} />
      {geo.state === "ok" && !simulated && (
        <>
          <input type="hidden" name="lat" value={geo.lat} />
          <input type="hidden" name="lng" value={geo.lng} />
        </>
      )}
      {simulated && <input type="hidden" name="geoSimulated" value="1" />}

      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-[11px] text-bone">NUEVO INTENTO</h2>
        {isPb && !disabledReason && <span className="px-chip anim-pop" style={{ ["--chip" as string]: "var(--color-gold)", ["--chip-fg" as string]: "var(--color-ink)" }}>Récord personal</span>}
      </div>

      {/* Ubicación */}
      {!disabledReason && <GeoStatus geo={geo} gymName={gym?.name ?? null} simulated={simulated} allowSimulated={allowSimulatedGeo} onRetry={locate} onSimulate={() => { sfx("select"); setSimulated(true); }} />}

      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <PixelAvatar avatar={avatar} size={96} pose={busy ? "flex" : "idle"} />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-col items-center">
            <label className="px-label" htmlFor="liftedKg">Peso que moviste</label>
            <div className="flex items-center">
              <button type="button" className="px-btn px-btn-ghost px-btn-sm" onClick={() => bumpKg(-2.5)} aria-label="Menos peso">−</button>
              <input
                id="liftedKg"
                name="liftedKg"
                inputMode="decimal"
                value={kg}
                onChange={(e) => setKg(e.target.value.replace(",", "."))}
                className="px-input font-pixel !w-24 !px-1 text-center !text-lg"
                aria-describedby="kg-hint"
              />
              <button type="button" className="px-btn px-btn-ghost px-btn-sm" onClick={() => bumpKg(2.5)} aria-label="Más peso">+</button>
            </div>
            <p id="kg-hint" className={`text-base ${kgValid ? "text-muted" : "text-danger"}`}>máx {maxWeightKg} kg</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="px-label">Repeticiones</p>
            <div className="flex items-center">
              <button type="button" className="px-btn px-btn-ghost px-btn-sm" onClick={() => bumpReps(-1)} aria-label="Menos reps">−</button>
              <span key={reps} className="font-pixel anim-pop w-16 text-center text-2xl text-bone">{reps}</span>
              <button type="button" className="px-btn px-btn-ghost px-btn-sm" onClick={() => bumpReps(1)} aria-label="Más reps">+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {(["file", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { sfx("blip"); setMode(m); }}
            className={`px-btn px-btn-sm flex-1 ${mode === m ? "px-btn-on" : "px-btn-ghost"}`}
            disabled={!!disabledReason}
          >
            {m === "file" ? "Subir video" : "Pegar enlace"}
          </button>
        ))}
      </div>
      {mode === "file" ? (
        <label className={`flex cursor-pointer items-center gap-3 bg-ink p-3 transition-colors hover:bg-panel-2 ${disabledReason ? "pointer-events-none opacity-50" : ""}`}>
          <PixelIcon name="video" size={28} />
          <span className="flex-1 truncate text-xl">{file ? file.name : "Grabar video"}</span>
          {file && <span className="font-pixel text-[8px] text-muted">{(file.size / 1048576).toFixed(1)} MB</span>}
          <input
            type="file"
            name="file"
            accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp,image/heic"
            capture="environment"
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
      {uploading && (
        <div className="px-bar">
          <span className="anim-blink" style={{ width: "100%", ["--fill" as string]: "var(--color-neon)" }} />
        </div>
      )}
      {uploadError && <p className="anim-shake text-xl text-danger">⚠ {uploadError}</p>}

      {state?.error && <p className="anim-shake text-xl text-danger">⚠ {state.error}</p>}
      {blocked ? (
        <p className="flex items-center gap-2 bg-panel-2 p-2 text-xl text-muted">
          <PixelIcon name="hourglass" size={18} /> {blocked}
        </p>
      ) : (
        <button className="px-btn text-sm" disabled={busy}>
          {uploading ? "Subiendo video..." : pending ? "Enviando..." : "¡Enviar al juez!"}
        </button>
      )}
    </form>
  );
}

function GeoStatus({
  geo,
  gymName,
  simulated,
  allowSimulated,
  onRetry,
  onSimulate,
}: {
  geo: Geo;
  gymName: string | null;
  simulated: boolean;
  allowSimulated: boolean;
  onRetry: () => void;
  onSimulate: () => void;
}) {
  const where = gymName ?? "el gimnasio";
  if (simulated)
    return <p className="bg-panel-2 p-2 text-lg text-gold">📍 Simulada (modo local)</p>;
  const msg =
    geo.state === "locating" ? "Ubicándote..."
    : geo.state === "ok" ? `En ${where}`
    : geo.state === "far" ? `A ${formatDistance(geo.dist)} del gym`
    : geo.state === "denied" ? "Activa la ubicación"
    : geo.state === "insecure" ? "Ubicación no disponible (http)"
    : "Sin ubicación";
  const ok = geo.state === "ok";
  return (
    <div className={`flex flex-col gap-1 bg-panel-2 p-2 ${ok ? "" : "text-muted"}`}>
      <p className={`flex items-center gap-2 text-lg ${ok ? "text-neon" : ""}`}>
        <span className={geo.state === "locating" ? "anim-blink" : ""}>📍</span> {msg}
      </p>
      {!ok && geo.state !== "locating" && (
        <div className="flex flex-wrap">
          <button type="button" className="px-btn px-btn-sm px-btn-ghost" onClick={onRetry}>Reintentar</button>
          {allowSimulated && (
            <button type="button" className="px-btn px-btn-sm px-btn-ghost" onClick={onSimulate}>Simular</button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { setGymLocation } from "@/actions/game";
import { sfx } from "@/components/fx";

export function GymForm({ name, lat, lng, radius }: { name: string | null; lat: number | null; lng: number | null; radius: number }) {
  const [state, action, pending] = useActionState(setGymLocation, undefined);
  const [coords, setCoords] = useState({ lat: lat?.toString() ?? "", lng: lng?.toString() ?? "" });
  const [locError, setLocError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const useMine = () => {
    setLocError(null);
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocError("Este navegador no da la ubicación aquí (necesita https). Pega las coordenadas desde Google Maps.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        sfx("select");
        setLocating(false);
        setCoords({ lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) });
      },
      () => {
        setLocating(false);
        setLocError("No pudimos leer tu ubicación. Revisa el permiso del navegador.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  // Acepta "6.2442, -75.5812" pegado de Google Maps en cualquiera de los dos campos.
  const onType = (v: string, field: "lat" | "lng") => {
    const m = v.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) setCoords({ lat: m[1], lng: m[2] });
    else setCoords((c) => ({ ...c, [field]: v }));
  };

  return (
    <form action={action} className="flex flex-col gap-1">
      <label className="px-label" htmlFor="g-name">Nombre del gimnasio</label>
      <input id="g-name" name="gymName" className="px-input" defaultValue={name ?? ""} placeholder="Gym piloto" maxLength={100} />
      <button type="button" className="px-btn px-btn-ghost mt-2" onClick={useMine} disabled={locating}>
        📍 {locating ? "Ubicando..." : "Usar mi ubicación actual"}
      </button>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="px-label" htmlFor="g-lat">Latitud</label>
          <input id="g-lat" name="lat" inputMode="decimal" className="px-input !text-lg" value={coords.lat} onChange={(e) => onType(e.target.value, "lat")} required />
        </div>
        <div>
          <label className="px-label" htmlFor="g-lng">Longitud</label>
          <input id="g-lng" name="lng" inputMode="decimal" className="px-input !text-lg" value={coords.lng} onChange={(e) => onType(e.target.value, "lng")} required />
        </div>
      </div>
      <label className="px-label" htmlFor="g-radius">Radio permitido (m)</label>
      <input id="g-radius" name="radius" type="number" min={30} max={2000} step={10} className="px-input" defaultValue={radius} required />
      {locError && <p className="text-lg text-muted">{locError}</p>}
      {state?.error && <p className="anim-shake text-xl text-danger">⚠ {state.error}</p>}
      <button className="px-btn mt-2" disabled={pending}>{pending ? "Guardando..." : "Guardar ubicación"}</button>
    </form>
  );
}

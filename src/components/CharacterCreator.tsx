"use client";

import { useState } from "react";
import { PixelAvatar } from "./PixelAvatar";
import { PixelIcon } from "./PixelIcon";
import { sfx, toast } from "./fx";
import { itemId, stripLocked } from "@/lib/shop";
import {
  BACK,
  BOTTOMS,
  BUILDS,
  CLOTH_COLORS,
  EXPRESSIONS,
  EXTRAS,
  FACIAL,
  HAIR_COLORS,
  HAIRS,
  HAND,
  HEADGEAR,
  NECK,
  SKIN_TONES,
  TOGGLES,
  TOPS,
  randomAvatar,
  type Avatar,
} from "@/lib/avatar";

type Tab = "cuerpo" | "pelo" | "ropa" | "cabeza" | "extras";
const TABS: { id: Tab; label: string }[] = [
  { id: "cuerpo", label: "Cuerpo" },
  { id: "pelo", label: "Pelo" },
  { id: "ropa", label: "Ropa" },
  { id: "cabeza", label: "Cara" },
  { id: "extras", label: "Extras" },
];

export function CharacterCreator({
  value,
  onChange,
  locked = [],
}: {
  value: Avatar;
  onChange: (a: Avatar) => void;
  /** Artículos premium sin comprar: se ven con candado y precio. */
  locked?: { id: string; price: number }[];
}) {
  const priceOf = new Map(locked.map((l) => [l.id, l.price]));
  const [tab, setTab] = useState<Tab>("cuerpo");
  const [flex, setFlex] = useState(false);
  const [bump, setBump] = useState(0);
  // Tipo de giro 3D: un cambio puntual voltea al personaje; el dado le da la vuelta completa.
  const [turn, setTurn] = useState<"turn-3d" | "spin-3d">("turn-3d");
  const [tabDir, setTabDir] = useState<1 | -1>(1);

  const set = <K extends keyof Avatar>(k: K, v: Avatar[K]) => {
    sfx("select");
    setTurn("turn-3d");
    setBump((b) => b + 1);
    onChange({ ...value, [k]: v });
  };

  const styleRow = <K extends keyof Avatar>(k: K, opts: Record<string, string>) => (
    <div className="flex flex-wrap gap-1">
      {Object.entries(opts).map(([id, label]) => {
        const active = value[k] === id;
        const price = priceOf.get(itemId(String(k), id));
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (price === undefined) return set(k, id as Avatar[K]);
              sfx("error");
              toast({ title: `${label}: ${price} fichas`, body: "Cómpralo en la tienda.", icon: "lock", tone: "gold" });
            }}
            className={`tilt-3d relative flex w-[74px] flex-col items-center gap-1 p-1 ${active ? "px-box px-box-accent is-on" : "px-box opacity-80 hover:opacity-100"}`}
            aria-pressed={active}
            aria-label={price !== undefined ? `${label}, bloqueado, ${price} fichas` : label}
          >
            <span className={price !== undefined ? "opacity-40 grayscale" : ""}>
              <PixelAvatar avatar={{ ...value, [k]: id }} size={52} animate={false} shadow={false} />
            </span>
            {price !== undefined && (
              <span className="absolute inset-x-0 top-5 flex flex-col items-center">
                <PixelIcon name="lock" size={18} />
                <span className="font-pixel bg-ink px-1 text-[7px] text-gold">{price}</span>
              </span>
            )}
            <span className="font-pixel text-[7px] leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );

  const swatches = <K extends keyof Avatar>(k: K, colors: readonly string[]) => (
    <div className="flex flex-wrap gap-2 px-1">
      {colors.map((c, i) => {
        const active = value[k] === i;
        return (
          <button
            key={c}
            type="button"
            onClick={() => set(k, i as Avatar[K])}
            className="size-9 transition-transform duration-150 hover:scale-110"
            style={{
              background: c,
              boxShadow: active
                ? "0 0 0 3px #140c1c, 0 0 0 6px #f2f2f2"
                : "0 0 0 3px #140c1c, inset -3px -3px 0 rgba(0,0,0,.3)",
              transform: active ? "translateY(-3px)" : undefined,
            }}
            aria-label={`Color ${i + 1}`}
            aria-pressed={active}
          />
        );
      })}
    </div>
  );

  const toggle = (k: keyof typeof TOGGLES, label: string) => (
    <button
      type="button"
      onClick={() => set(k, !value[k])}
      className={`px-btn px-btn-sm ${value[k] ? "" : "px-btn-ghost"}`}
      aria-pressed={value[k]}
    >
      {value[k] ? "✔" : "✕"} {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Vestidor: vista previa */}
      <div className="px-box stage-3d relative flex h-[280px] items-end justify-center overflow-hidden" style={{ background: "linear-gradient(#271d38 0 70%, #1a1226 70%)" }}>
        <div className="absolute inset-x-0 top-[70%] h-1 bg-line" />
        <div className="platform-3d" aria-hidden />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          <span className="px-chip" style={{ ["--chip" as string]: "var(--color-neon)", ["--chip-fg" as string]: "var(--color-ink)" }}>Vestidor</span>
        </div>
        <div key={bump} className={`relative mb-6 ${turn}`}>
          <PixelAvatar avatar={value} size={210} pose={flex ? "flex" : "idle"} />
        </div>
        <div className="absolute right-2 top-2 flex flex-col">
          <button
            type="button"
            className="px-btn px-btn-sm px-btn-ghost"
            onClick={() => {
              sfx("coin");
              setTurn("spin-3d");
              setBump((b) => b + 1);
              onChange(stripLocked(randomAvatar(), priceOf.keys()));
            }}
            title="Aleatorio"
          >
            <PixelIcon name="dice" size={16} />
          </button>
          <button
            type="button"
            className={`px-btn px-btn-sm ${flex ? "px-btn-on" : "px-btn-ghost"}`}
            onClick={() => {
              sfx(flex ? "blip" : "success");
              setFlex((f) => !f);
            }}
            title="Pose"
          >
            💪
          </button>
        </div>
      </div>

      <div className="flex gap-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              if (t.id === tab) return;
              sfx("blip");
              setTabDir(TABS.findIndex((x) => x.id === t.id) > TABS.findIndex((x) => x.id === tab) ? 1 : -1);
              setTab(t.id);
            }}
            className={`px-btn px-btn-sm flex-1 !px-1 ${tab === t.id ? "px-btn-on" : "px-btn-ghost"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className={`flex flex-col gap-3 ${tabDir > 0 ? "cube-in-right" : "cube-in-left"}`}>
        {tab === "cuerpo" && (
          <>
            <p className="px-label">Contextura</p>
            {styleRow("build", BUILDS)}
            <p className="px-label">Tono de piel</p>
            {swatches("skin", SKIN_TONES)}
            <p className="px-label">Expresión</p>
            {styleRow("expression", EXPRESSIONS)}
          </>
        )}
        {tab === "pelo" && (
          <>
            <p className="px-label">Peinado</p>
            {styleRow("hair", HAIRS)}
            <p className="px-label">Color</p>
            {swatches("hairColor", HAIR_COLORS)}
            <p className="px-label">Cara</p>
            {styleRow("facial", FACIAL)}
          </>
        )}
        {tab === "ropa" && (
          <>
            <p className="px-label">Arriba</p>
            {styleRow("top", TOPS)}
            {value.top !== "descubierto" && swatches("topColor", CLOTH_COLORS)}
            <p className="px-label">Abajo</p>
            {styleRow("bottom", BOTTOMS)}
            {swatches("bottomColor", CLOTH_COLORS)}
            <p className="px-label">Tenis</p>
            {swatches("shoeColor", CLOTH_COLORS)}
          </>
        )}
        {tab === "cabeza" && (
          <>
            <p className="px-label">Cabeza</p>
            {styleRow("headgear", HEADGEAR)}
            <p className="px-label">Cara</p>
            {styleRow("extra", EXTRAS)}
            <p className="px-label">Color de accesorios</p>
            {swatches("gearColor", CLOTH_COLORS)}
          </>
        )}
        {tab === "extras" && (
          <>
            <p className="px-label">Cuello</p>
            {styleRow("neck", NECK)}
            <p className="px-label">En la mano</p>
            {styleRow("hand", HAND)}
            <p className="px-label">Espalda</p>
            {styleRow("back", BACK)}
            <p className="px-label">Color de accesorios</p>
            {swatches("gearColor", CLOTH_COLORS)}
            <p className="px-label">Equipo de gym</p>
            <div className="flex flex-wrap gap-1">
              {(Object.entries(TOGGLES) as [keyof typeof TOGGLES, string][]).map(([k, label]) => (
                <span key={k}>{toggle(k, label)}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

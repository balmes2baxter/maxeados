"use client";

import { useState } from "react";
import { PixelAvatar } from "./PixelAvatar";
import { PixelIcon } from "./PixelIcon";
import { sfx } from "./fx";
import {
  BOTTOMS,
  BUILDS,
  CLOTH_COLORS,
  EXTRAS,
  FACIAL,
  HAIR_COLORS,
  HAIRS,
  HEADGEAR,
  SKIN_TONES,
  TOPS,
  randomAvatar,
  type Avatar,
} from "@/lib/avatar";

type Tab = "cuerpo" | "pelo" | "ropa" | "extras";
const TABS: { id: Tab; label: string }[] = [
  { id: "cuerpo", label: "Cuerpo" },
  { id: "pelo", label: "Pelo" },
  { id: "ropa", label: "Ropa" },
  { id: "extras", label: "Extras" },
];

export function CharacterCreator({ value, onChange }: { value: Avatar; onChange: (a: Avatar) => void }) {
  const [tab, setTab] = useState<Tab>("cuerpo");
  const [flex, setFlex] = useState(false);
  const [bump, setBump] = useState(0);

  const set = <K extends keyof Avatar>(k: K, v: Avatar[K]) => {
    sfx("select");
    setBump((b) => b + 1);
    onChange({ ...value, [k]: v });
  };

  const styleRow = <K extends keyof Avatar>(k: K, opts: Record<string, string>) => (
    <div className="flex flex-wrap gap-1">
      {Object.entries(opts).map(([id, label]) => {
        const active = value[k] === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => set(k, id as Avatar[K])}
            className={`flex w-[74px] flex-col items-center gap-1 p-1 transition-transform duration-150 ${active ? "px-box px-box-accent -translate-y-1" : "px-box opacity-80 hover:opacity-100"}`}
            aria-pressed={active}
          >
            <PixelAvatar avatar={{ ...value, [k]: id }} size={52} animate={false} shadow={false} />
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

  const toggle = (k: "belt" | "wristbands", label: string) => (
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
      <div className="px-box relative flex h-[260px] items-end justify-center overflow-hidden" style={{ background: "linear-gradient(#271d38 0 70%, #1a1226 70%)" }}>
        <div className="absolute inset-x-0 top-[70%] h-1 bg-line" />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          <span className="px-chip" style={{ ["--chip" as string]: "#39ff14", ["--chip-fg" as string]: "#140c1c" }}>Vestidor</span>
        </div>
        <div key={bump} className="mb-6" style={{ animation: "squish 360ms cubic-bezier(0.34,1.56,0.64,1)" }}>
          <PixelAvatar avatar={value} size={210} pose={flex ? "flex" : "idle"} />
        </div>
        <div className="absolute right-2 top-2 flex flex-col">
          <button
            type="button"
            className="px-btn px-btn-sm px-btn-gold"
            onClick={() => {
              sfx("coin");
              setBump((b) => b + 1);
              onChange(randomAvatar());
            }}
            title="Aleatorio"
          >
            <PixelIcon name="dice" size={16} />
          </button>
          <button
            type="button"
            className={`px-btn px-btn-sm ${flex ? "px-btn-pink" : "px-btn-ghost"}`}
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
              sfx("blip");
              setTab(t.id);
            }}
            className={`px-btn px-btn-sm flex-1 !px-1 ${tab === t.id ? "px-btn-cyan" : "px-btn-ghost"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="anim-rise flex flex-col gap-3">
        {tab === "cuerpo" && (
          <>
            <p className="px-label">Contextura</p>
            {styleRow("build", BUILDS)}
            <p className="px-label">Tono de piel</p>
            {swatches("skin", SKIN_TONES)}
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
        {tab === "extras" && (
          <>
            <p className="px-label">Cabeza</p>
            {styleRow("headgear", HEADGEAR)}
            <p className="px-label">Color de accesorios</p>
            {swatches("gearColor", CLOTH_COLORS)}
            <p className="px-label">Detalle</p>
            {styleRow("extra", EXTRAS)}
            <p className="px-label">Equipo de gym</p>
            <div className="flex flex-wrap">
              {toggle("belt", "Cinturón")}
              {toggle("wristbands", "Muñequeras")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

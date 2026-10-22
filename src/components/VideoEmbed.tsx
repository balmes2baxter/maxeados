export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
      return u.searchParams.get("v");
    }
  } catch {}
  return null;
}

export function VideoEmbed({ url, kind }: { url: string; kind?: string | null }) {
  const yt = youtubeId(url);
  if (yt) {
    return (
      <div className="relative aspect-video w-full bg-ink">
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}`}
          title="Video del intento"
          loading="lazy"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (kind === "photo" || /\.(jpe?g|png|webp|heic)(\?|$)/i.test(url)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="Evidencia del intento" className="w-full bg-ink object-contain" />;
  }
  if (kind === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url)) {
    return <video src={url} controls preload="metadata" className="aspect-video w-full bg-ink" />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex aspect-video w-full items-center justify-center bg-ink text-xl text-bone underline-offset-4 hover:underline">
      ▶ Abrir video en otra pestaña
    </a>
  );
}

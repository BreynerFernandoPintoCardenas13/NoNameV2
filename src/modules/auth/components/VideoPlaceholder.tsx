/** Espacio reservado para el video explicativo de la API KEY. */
export function VideoPlaceholder() {
  return (
    <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-xl border border-white/10 bg-black/20 p-1 shadow-lg">
      <video
        src="/videos/guia.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="aspect-video w-full rounded-lg object-cover"
      />
    </div>
  );
}

import { HeroCard } from "@/components/landing/HeroCard";

export const HERO_CARDS = [
  { front: "A QUE ME AYUDA?", back: "OPTIMIZAR" },
  { front: "TIENE IA?", back: "VINCULADO CON CLAUDE" },
  { front: "QUE ES?", back: "TU ASISTENTE PERSONAL" },
  { front: "RECUERDA?", back: "GUARDA NOTAS" },
] as const;

type HeroCardsProps = {
  /** Se llama con el texto "back" de la tarjeta al entrar, y con `null` al salir. */
  onActiveTextChange: (text: string | null) => void;
};

/** Fila de mini tarjetas del Hero, pegada al borde derecho — el hover no cambia su propio texto, actualiza el titular. */
export function HeroCards({ onActiveTextChange }: HeroCardsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-4 pr-8 lg:shrink-0 lg:flex-nowrap">
      {HERO_CARDS.map((card) => (
        <HeroCard
          key={card.front}
          label={card.front}
          onHoverChange={(hovered) => onActiveTextChange(hovered ? card.back : null)}
        />
      ))}
    </div>
  );
}

import { TiltedCard } from "@/components/effects/tilted-card";
import { inter } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export type HeroCardProps = {
  label: string;
  onHoverChange?: (hovered: boolean) => void;
  className?: string;
};

/** Mini tarjeta glass del Hero — tilt 3D al mouse (TiltedCard); el hover actualiza el titular del Hero. */
export function HeroCard({ label, onHoverChange, className }: HeroCardProps) {
  return (
    <TiltedCard
      containerHeight="94px"
      containerWidth="132px"
      rotateAmplitude={10}
      scaleOnHover={2}
      showMobileWarning={false}
      showTooltip={false}
      className={cn("shrink-0", className)}
      onHoverChange={onHoverChange}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[5px] bg-white/[0.30] p-3 text-center backdrop-blur-xl">
        <span className={cn(inter.className, "text-[11px] tracking-[0.02em] text-white/85")}>
          {label}
        </span>
      </div>
    </TiltedCard>
  );
}

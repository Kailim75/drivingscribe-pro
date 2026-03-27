import { useCountUp } from "@/hooks/useCountUp";

interface AnimatedCurrencyProps {
  value: number;
  className?: string;
}

export function AnimatedCurrency({ value, className }: AnimatedCurrencyProps) {
  const { formatted } = useCountUp({
    end: value,
    duration: 900,
    decimals: 2,
    suffix: "\u202f€",
  });

  return <span className={className}>{formatted}</span>;
}

interface AnimatedNumberProps {
  value: number;
  className?: string;
  suffix?: string;
}

export function AnimatedNumber({ value, className, suffix = "" }: AnimatedNumberProps) {
  const { formatted } = useCountUp({
    end: value,
    duration: 700,
    decimals: 0,
    suffix,
  });

  return <span className={className}>{formatted}</span>;
}

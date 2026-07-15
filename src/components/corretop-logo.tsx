import type { ComponentProps } from "react";

type CorreTopLogoProps = Omit<ComponentProps<"img">, "alt" | "src"> & {
  alt?: string;
};

export function CorreTopLogo({ className, alt = "CorreTop", ...props }: CorreTopLogoProps) {
  return <img src="/corretop_logo.svg" alt={alt} className={className} {...props} />;
}

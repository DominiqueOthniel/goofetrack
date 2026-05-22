import { cn } from '@/lib/utils';

/** Logo applicatif — fichier servi depuis `public/logotruck.png`. */
export const APP_LOGO_SRC = `${import.meta.env.BASE_URL}logotruck.png`;

type AppLogoVariant = 'login' | 'sidebar' | 'header' | 'compact' | 'hero';

/**
 * Le fichier a un ratio légèrement horizontal. Les cadres gardent ce ratio
 * pour éviter de couper le fond violet ou de tasser le picto camion.
 */
const variantConfig: Record<
  AppLogoVariant,
  { wrapper: string; img: string }
> = {
  login: {
    wrapper: cn(
      'inline-flex items-center justify-center rounded-2xl p-1.5 sm:p-2',
      'bg-white/10 ring-2 ring-white/25 shadow-2xl backdrop-blur-sm',
    ),
    img: cn(
      'block object-contain object-center select-none',
      'h-auto max-h-[8rem] sm:max-h-36 w-auto max-w-[min(14rem,54vw)]',
      'rounded-xl',
    ),
  },
  sidebar: {
    wrapper: cn(
      'inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden',
      'h-10 w-12 px-0.5',
      'bg-white/10 ring-1 ring-white/20 shadow-sm',
    ),
    img: cn('h-full w-full object-contain object-center select-none'),
  },
  header: {
    wrapper: cn(
      'inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden',
      'h-9 w-11 sm:h-10 sm:w-12 px-0.5',
      'bg-muted/50 dark:bg-white/10 ring-1 ring-border/80',
    ),
    img: cn('h-full w-full object-contain object-center select-none'),
  },
  compact: {
    wrapper: cn(
      'inline-flex items-center justify-center rounded-md overflow-hidden h-7 w-8',
      'bg-muted/40 ring-1 ring-border/60',
    ),
    img: cn('max-h-full max-w-full object-contain object-center p-px select-none'),
  },
  hero: {
    wrapper: cn(
      'inline-flex items-center justify-center rounded-xl p-1.5',
      'bg-muted/30 ring-1 ring-border/50 shadow-sm',
    ),
    img: cn(
      'block object-contain object-center select-none',
      'max-h-20 sm:max-h-24 w-auto max-w-[8rem]',
      'rounded-lg',
    ),
  },
};

export function AppLogo({
  variant = 'sidebar',
  className,
  alt = 'Truck Track — gestion de flotte',
}: {
  variant?: AppLogoVariant;
  className?: string;
  alt?: string;
}) {
  const { wrapper, img } = variantConfig[variant];

  return (
    <span className={cn(wrapper, className)}>
      <img
        src={APP_LOGO_SRC}
        alt={alt}
        className={img}
        loading={variant === 'login' ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        fetchPriority={variant === 'login' ? 'high' : undefined}
      />
    </span>
  );
}

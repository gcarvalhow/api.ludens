import { cn } from 'cn';

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({
  className,
}: LogoIconProps) {
  return (
    <img
      src="/images/logo-icon.png"
      alt=""
      className={cn('object-contain', className)}
    />
  );
}

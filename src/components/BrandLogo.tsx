import Image from 'next/image';

export const BRAND_LOGO_SRC = '/splitease-logo.png';

export function BrandLogo({ size }: { size: number }) {
  return (
    <Image className="brand-mark" src={BRAND_LOGO_SRC} alt="" width={size} height={size} />
  );
}

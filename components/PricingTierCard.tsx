type Props = {
  name: string;
  price?: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
  featuredLabel?: string;
};

export default function PricingTierCard({
  name,
  price,
  tagline,
  features,
  ctaLabel,
  ctaHref,
  featured = false,
  featuredLabel,
}: Props) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-xl bg-white p-8 ${
        featured ? 'border-2 border-accent shadow-lg' : 'border border-border'
      }`}
    >
      {featured && featuredLabel && (
        <span className='absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-dark px-3 py-1 text-xs font-medium uppercase tracking-wider text-white'>
          {featuredLabel}
        </span>
      )}

      <h3 className='font-serif text-xl font-bold text-charcoal'>{name}</h3>
      {price && (
        <p className='mt-3 font-serif text-3xl font-bold text-charcoal sm:text-4xl lg:text-[2.75rem]'>
          {price}
        </p>
      )}
      <p className='mt-3 leading-relaxed text-warm-gray'>{tagline}</p>

      <ul className='mt-6 flex-1 space-y-3'>
        {features.map((feature, i) => (
          <li key={i} className='flex items-start gap-3 text-sm leading-relaxed text-warm-gray'>
            <svg
              aria-hidden='true'
              className='mt-0.5 h-5 w-5 flex-shrink-0 text-accent'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2.5}
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a href={ctaHref} className='btn-primary mt-8 w-full'>
        {ctaLabel}
      </a>
    </div>
  );
}

import Link from 'next/link';

type Props = {
  locale: 'en' | 'es';
  client: string;
  category: string;
  color: string;
  breadcrumbWork: string;
};

export default function CaseStudyHero({ locale, client, category, color, breadcrumbWork }: Props) {
  return (
    <header className='border-b border-border bg-cream'>
      <div className='mx-auto max-w-5xl px-4 pb-14 pt-10'>
        <nav aria-label='Breadcrumb' className='text-sm text-warm-gray'>
          <ol className='flex items-center gap-2'>
            <li>
              <Link
                href={`/${locale}#work`}
                className='rounded transition-colors hover:text-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
              >
                {breadcrumbWork}
              </Link>
            </li>
            <li aria-hidden='true'>/</li>
            <li aria-current='page' className='text-charcoal'>
              {client}
            </li>
          </ol>
        </nav>

        <p className='mt-8 text-xs font-medium uppercase tracking-widest text-accent-dark'>
          {category}
        </p>
        <h1 className='mt-3 font-serif text-4xl font-bold leading-tight text-charcoal sm:text-5xl lg:text-6xl'>
          {client}
        </h1>

        <div
          className='mt-10 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border'
          style={{ backgroundColor: `${color}1F` }}
          role='img'
          aria-label={`${client} placeholder hero`}
        >
          <div className='h-2 w-32 rounded-full' style={{ backgroundColor: color }} />
        </div>
      </div>
    </header>
  );
}

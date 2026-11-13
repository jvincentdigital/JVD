import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-04-06');

  return [
    {
      url: `${siteUrl}/en`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/es`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...(['en', 'es'] as const).map((locale) => ({
      url: `${siteUrl}/${locale}/free-accessibility-check`,
      lastModified: new Date('2026-11-12'),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}

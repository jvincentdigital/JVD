'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { track } from '@vercel/analytics';
import { ContactForm, type ContactFieldDef } from '@jvd/ui/sections';
import ScrollReveal from './ScrollReveal';

export default function Contact() {
  const t = useTranslations('contact');
  const searchParams = useSearchParams();
  const preselected = searchParams.get('service') ?? '';

  const fields: ContactFieldDef[] = useMemo(
    () => [
      {
        kind: 'input',
        name: 'name',
        label: t('form.name.label'),
        required: true,
        autoComplete: 'name',
        requiredErrorMessage: t('form.name.error'),
      },
      {
        kind: 'input',
        name: 'email',
        type: 'email',
        label: t('form.email.label'),
        required: true,
        autoComplete: 'email',
        requiredErrorMessage: t('form.email.error'),
        invalidErrorMessage: t('form.email.error'),
      },
      {
        kind: 'input',
        name: 'business',
        label: t('form.business.label'),
        autoComplete: 'organization',
      },
      {
        kind: 'select',
        name: 'service',
        label: t('form.service.label'),
        options: [
          { value: '', label: t('serviceOptions.placeholder') },
          { value: 'website', label: t('serviceOptions.website') },
          { value: 'shopify', label: t('serviceOptions.shopify') },
          { value: 'brand', label: t('serviceOptions.brand') },
          { value: 'accessibility', label: t('serviceOptions.accessibility') },
          { value: 'retainer', label: t('serviceOptions.retainer') },
          { value: 'local-presence', label: t('serviceOptions.localPresence') },
          { value: 'not-sure', label: t('serviceOptions.notSure') },
        ],
      },
      {
        kind: 'textarea',
        name: 'message',
        label: t('form.message.label'),
        required: true,
        minLength: 10,
        requiredErrorMessage: t('form.message.error'),
      },
    ],
    [t],
  );

  async function handleSubmit(data: Record<string, string>) {
    const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? 'xrerbdlw';
    const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: data.name,
        _replyto: data.email,
        business: data.business,
        service: data.service,
        message: data.message,
        _gotcha: data.gotcha,
      }),
    });
    if (!res.ok) {
      track('contact_form_failed', { reason: 'server_error' });
      throw new Error('contact_form_submit_failed');
    }
    track('contact_form_submitted', { service: data.service || 'unspecified' });
  }

  return (
    <section id='contact' className='bg-dark px-4 py-20'>
      <div className='mx-auto max-w-2xl'>
        <ScrollReveal>
          <h2 className='text-center font-serif text-3xl font-bold text-cream sm:text-4xl'>
            {t('heading')}
          </h2>
          <p className='mt-4 text-center text-lg text-cream/70'>{t('subheading')}</p>
        </ScrollReveal>
        <ScrollReveal>
          <ContactForm
            tone='dark'
            fields={fields}
            initialValues={preselected ? { service: preselected } : undefined}
            honeypotField={{ name: 'gotcha', label: 'Leave this field empty' }}
            requiredNote={t('form.required_note')}
            submitLabel={t('form.submit.default')}
            submitLoadingLabel={t('form.submit.loading')}
            successHeading={t('successHeading')}
            successMessage={t('form.success')}
            resetLabel={t('sendAnother')}
            genericErrorMessage={t('form.generic_error')}
            footer={
              <a
                href='https://wa.me/17877174203'
                target='_blank'
                rel='noopener noreferrer'
                className='rounded underline transition-colors hover:text-cream focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark'
              >
                {t('whatsapp')}
              </a>
            }
            className='mt-12'
            onSubmit={handleSubmit}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}

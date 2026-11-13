'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { track } from '@vercel/analytics';
import { ContactForm, type ContactFieldDef } from '@jvd/ui/sections';
import { IMPACTS, ruleKey, type Summary } from '@/lib/a11y-check/summary';

// Same spam guard as the main contact form: people need a few seconds to type.
export const MIN_FILL_MS = 3000;

const LEAD_AFTER_ERROR = [
  'unreachable',
  'timeout',
  'too_large',
  'too_complex',
  'not_html',
  'scan_failed',
];
const ERROR_CODES = [...LEAD_AFTER_ERROR, 'invalid_url', 'blocked', 'rate_limited', 'busy'];

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'error'; code: string; typed: string }
  | { kind: 'result'; page: string; typed: string; thin: boolean; summary: Summary };

export default function A11yChecker() {
  const t = useTranslations('checker');
  const locale = useLocale();
  const [url, setUrl] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const resultRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.kind === 'result' || state.kind === 'error') resultRef.current?.focus();
  }, [state]);

  async function check(event: FormEvent) {
    event.preventDefault();
    const typed = url.trim();
    if (!typed) return setState({ kind: 'error', code: 'invalid_url', typed });
    setState({ kind: 'checking' });
    try {
      const res = await fetch('/api/a11y-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: typed }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({
          kind: 'result',
          page: data.page,
          typed,
          thin: data.thin,
          summary: data.summary,
        });
        track('a11y_check_done', { problems: data.summary.problems });
      } else {
        const code = ERROR_CODES.includes(data.error) ? data.error : 'scan_failed';
        setState({ kind: 'error', code, typed });
        track('a11y_check_failed', { reason: code });
      }
    } catch {
      setState({ kind: 'error', code: 'scan_failed', typed });
    }
  }

  const checking = state.kind === 'checking';
  const showLead =
    state.kind === 'result' || (state.kind === 'error' && LEAD_AFTER_ERROR.includes(state.code));

  return (
    <div className='space-y-10'>
      <form
        onSubmit={check}
        noValidate
        className='rounded-xl border border-border bg-white p-5 sm:p-8'
      >
        <label htmlFor='site-url' className='block font-semibold text-charcoal'>
          {t('form.label')}
        </label>
        <p id='site-url-hint' className='mt-1 text-sm text-warm-gray'>
          {t('form.hint')}
        </p>
        <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
          <input
            id='site-url'
            name='url'
            type='text'
            inputMode='url'
            autoComplete='url'
            autoCapitalize='none'
            spellCheck={false}
            placeholder={t('form.placeholder')}
            aria-describedby='site-url-hint'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className='min-h-12 w-full flex-1 rounded-lg border border-border bg-cream px-4 text-base text-charcoal placeholder:text-warm-gray focus:border-accent-dark focus:outline-none focus:ring-2 focus:ring-accent'
          />
          <button
            type='submit'
            disabled={checking}
            className='inline-flex min-h-12 items-center justify-center rounded-lg bg-accent-dark px-6 font-medium text-white transition-colors hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-wait disabled:opacity-80'
          >
            {checking ? t('form.loading') : t('form.submit')}
          </button>
        </div>
        <p role='status' className='mt-3 min-h-6 text-sm text-warm-gray'>
          {checking ? t('form.checking') : ''}
        </p>
      </form>

      {state.kind === 'error' && (
        <section
          aria-labelledby='check-result'
          className='rounded-xl border border-border bg-white p-5 sm:p-8'
        >
          <h2
            id='check-result'
            ref={resultRef}
            tabIndex={-1}
            className='font-sans text-lg font-semibold text-charcoal'
          >
            {t(`errors.${state.code}`)}
          </h2>
        </section>
      )}

      {state.kind === 'result' && (
        <Result
          headingRef={resultRef}
          page={state.page}
          thin={state.thin}
          summary={state.summary}
        />
      )}

      {(state.kind === 'result' || state.kind === 'error') && <QuickCheckNote />}

      {showLead && (
        <LeadForm
          key={state.typed}
          website={state.typed}
          locale={locale}
          afterError={state.kind === 'error'}
          summary={state.kind === 'result' ? state.summary : null}
          page={state.kind === 'result' ? state.page : null}
        />
      )}
    </div>
  );
}

function Result({
  page,
  thin,
  summary,
  headingRef,
}: {
  page: string;
  thin: boolean;
  summary: Summary;
  headingRef: React.RefObject<HTMLHeadingElement>;
}) {
  const t = useTranslations('checker');
  return (
    <section
      aria-labelledby='check-result'
      className='rounded-xl border border-border bg-white p-5 sm:p-8'
    >
      <h2
        id='check-result'
        ref={headingRef}
        tabIndex={-1}
        className='break-words font-serif text-2xl font-bold text-charcoal sm:text-3xl'
      >
        {t('result.heading', { page })}
      </h2>
      <p className='mt-3 text-lg leading-relaxed text-charcoal'>
        {summary.problems === 0
          ? t('result.none')
          : t('result.found', { problems: summary.problems, places: summary.places })}
      </p>
      {thin && <p className='mt-3 leading-relaxed text-warm-gray'>{t('result.thin')}</p>}

      {summary.problems > 0 && (
        <>
          <h3 className='mt-8 font-sans text-base font-semibold text-charcoal'>
            {t('result.byImpactHeading')}
          </h3>
          <dl className='mt-3 divide-y divide-border border-y border-border'>
            {IMPACTS.map((impact) => {
              const row = summary.byImpact[impact];
              return (
                <div key={impact} className='flex items-start justify-between gap-4 py-3'>
                  <dt>
                    <span className='font-semibold text-charcoal'>
                      {t(`impact.${impact}.name`)}
                    </span>
                    <span className='block text-sm text-warm-gray'>
                      {t(`impact.${impact}.help`)}
                    </span>
                  </dt>
                  <dd className='shrink-0 text-right text-charcoal'>
                    <span className='font-semibold tabular-nums'>
                      {t('result.problems', { count: row.problems })}
                    </span>
                    {row.problems > 0 && (
                      <span className='block text-sm tabular-nums text-warm-gray'>
                        {t('result.places', { count: row.places })}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          <h3 className='mt-8 font-sans text-base font-semibold text-charcoal'>
            {t('result.topHeading', { count: summary.top.length })}
          </h3>
          <ol className='mt-3 space-y-4'>
            {summary.top.map((p, i) => (
              <li key={p.rule} className='flex gap-3'>
                <span aria-hidden='true' className='font-semibold tabular-nums text-accent-dark'>
                  {i + 1}.
                </span>
                <div>
                  <p className='leading-relaxed text-charcoal'>{t(`rules.${ruleKey(p.rule)}`)}</p>
                  <p className='mt-1 text-sm text-warm-gray'>
                    {t(`impact.${p.impact}.name`)} · {t('result.places', { count: p.places })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function QuickCheckNote() {
  const t = useTranslations('checker');
  return (
    <section
      aria-labelledby='quick-note'
      className='rounded-xl border border-border bg-cream p-5 sm:p-8'
    >
      <h2 id='quick-note' className='font-serif text-xl font-bold text-charcoal sm:text-2xl'>
        {t('note.heading')}
      </h2>
      <p className='mt-3 leading-relaxed text-warm-gray'>{t('note.body')}</p>
      <h3 className='mt-6 font-sans text-base font-semibold text-charcoal'>
        {t('note.cannotHeading')}
      </h3>
      <ul className='mt-3 list-disc space-y-2 pl-5 leading-relaxed text-warm-gray marker:text-accent-dark'>
        {(t.raw('note.cannot') as string[]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function LeadForm({
  website,
  locale,
  afterError,
  summary,
  page,
}: {
  website: string;
  locale: string;
  afterError: boolean;
  summary: Summary | null;
  page: string | null;
}) {
  const t = useTranslations('checker');
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const fields: ContactFieldDef[] = useMemo(
    () => [
      {
        kind: 'input',
        name: 'website',
        label: t('lead.website'),
        required: true,
        autoComplete: 'url',
        requiredErrorMessage: t('lead.websiteError'),
      },
      {
        kind: 'input',
        name: 'email',
        type: 'email',
        label: t('lead.email'),
        required: true,
        autoComplete: 'email',
        requiredErrorMessage: t('lead.emailError'),
        invalidErrorMessage: t('lead.emailError'),
      },
    ],
    [t],
  );

  async function send(data: Record<string, string>) {
    if (data.gotcha || Date.now() - shownAt.current < MIN_FILL_MS) {
      track('a11y_lead_blocked', { reason: data.gotcha ? 'honeypot' : 'too_fast' });
      return;
    }
    // Straight from the browser to the site's existing Formspree form, like the
    // contact form. The email never passes through our server or its logs.
    const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? 'xrerbdlw';
    const found = summary
      ? `Checked ${page}: ${summary.problems} kinds of problems in ${summary.places} places. Top: ${summary.top.map((p) => p.rule).join(', ') || 'none'}.`
      : 'The quick check could not open the page.';
    const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Free accessibility check: full audit request',
        _replyto: data.email,
        email: data.email,
        website: data.website,
        service: 'accessibility',
        source: 'free-accessibility-check',
        language: locale,
        message: `Asked for the full audit from the free quick check. ${found}`,
        _gotcha: data.gotcha,
      }),
    });
    if (!res.ok) {
      track('a11y_lead_failed', { reason: 'server_error' });
      throw new Error('a11y_lead_submit_failed');
    }
    track('a11y_lead_sent');
  }

  return (
    <section
      aria-labelledby='lead-heading'
      className='rounded-xl border border-accent-dark bg-white p-5 sm:p-8'
    >
      <h2 id='lead-heading' className='font-serif text-2xl font-bold text-charcoal sm:text-3xl'>
        {t('lead.heading')}
      </h2>
      <p className='mt-3 leading-relaxed text-warm-gray'>
        {afterError ? t('lead.bodyAfterError') : t('lead.body')}
      </p>
      <ContactForm
        tone='light'
        fields={fields}
        initialValues={{ website }}
        honeypotField={{ name: 'gotcha', label: t('lead.honeypot') }}
        requiredNote={t('lead.requiredNote')}
        submitLabel={t('lead.submit')}
        submitLoadingLabel={t('lead.loading')}
        successHeading={t('lead.successHeading')}
        successMessage={t('lead.success')}
        resetLabel={t('lead.reset')}
        genericErrorMessage={t('lead.error')}
        footer={<span>{t('lead.privacy')}</span>}
        className='mt-6 [&_button[type=submit]]:[--accent:158_100%_24%]'
        onSubmit={send}
      />
    </section>
  );
}

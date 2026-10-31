import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Contact, { MIN_FILL_MS } from '../components/Contact';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../components/ScrollReveal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const fillField = async (label: RegExp | string, value: string) => {
  const input = screen.getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
};

// The form ignores submits sent faster than a person could type (spam guard).
// Freeze the clock at mount, then jump past the minimum before the user acts.
let now = 0;
const renderContact = () => {
  now = 0;
  render(<Contact />);
  now = MIN_FILL_MS;
};

describe('Contact form', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows validation errors for empty / short / invalid fields', async () => {
    renderContact();
    await userEvent.click(screen.getByRole('button', { name: /form\.submit/i }));

    expect(await screen.findByText('form.name.error')).toBeInTheDocument();
    expect(screen.getByText('form.email.error')).toBeInTheDocument();
    expect(screen.getByText('form.message.error')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects malformed emails', async () => {
    renderContact();
    await fillField(/form\.name\.label/, 'Jane');
    await fillField(/form\.email\.label/, 'not-an-email');
    await fillField(/form\.message\.label/, 'A long enough message.');
    await userEvent.click(screen.getByRole('button', { name: /form\.submit/i }));

    expect(await screen.findByText('form.email.error')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits successfully and shows the success state', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    renderContact();

    await fillField(/form\.name\.label/, 'Jane Doe');
    await fillField(/form\.email\.label/, 'jane@example.com');
    await fillField(/form\.message\.label/, 'Hello, I would like a website.');
    await userEvent.click(screen.getByRole('button', { name: /form\.submit/i }));

    expect(await screen.findByText('successHeading')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.name).toBe('Jane Doe');
    expect(body._replyto).toBe('jane@example.com');
    expect(body._gotcha).toBe('');
  });

  it('shows error state when the server rejects', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    renderContact();

    await fillField(/form\.name\.label/, 'Jane Doe');
    await fillField(/form\.email\.label/, 'jane@example.com');
    await fillField(/form\.message\.label/, 'Hello, I would like a website.');
    await userEvent.click(screen.getByRole('button', { name: /form\.submit/i }));

    expect(await screen.findByText('form.generic_error')).toBeInTheDocument();
  });

  it('shows error state on network failure', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('offline'));
    renderContact();

    await fillField(/form\.name\.label/, 'Jane Doe');
    await fillField(/form\.email\.label/, 'jane@example.com');
    await fillField(/form\.message\.label/, 'Hello, I would like a website.');
    await userEvent.click(screen.getByRole('button', { name: /form\.submit/i }));

    expect(await screen.findByText('form.generic_error')).toBeInTheDocument();
  });

  it('does not send when the honeypot is filled, but shows success', async () => {
    renderContact();

    const gotcha = document.getElementById('contact-gotcha') as HTMLInputElement;
    await userEvent.type(gotcha, 'spammy');

    await fillField(/form\.name\.label/, 'Jane Doe');
    await fillField(/form\.email\.label/, 'jane@example.com');
    await fillField(/form\.message\.label/, 'Hello, I would like a website.');
    await userEvent.click(screen.getByRole('button', { name: /form\.submit/i }));

    expect(await screen.findByText('successHeading')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not send a submit that comes faster than a person could type', async () => {
    renderContact();
    now = MIN_FILL_MS - 1;

    await fillField(/form\.name\.label/, 'Jane Doe');
    await fillField(/form\.email\.label/, 'jane@example.com');
    await fillField(/form\.message\.label/, 'Hello, I would like a website.');
    await userEvent.click(screen.getByRole('button', { name: /form\.submit/i }));

    expect(await screen.findByText('successHeading')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});

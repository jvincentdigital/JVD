import { notFound } from 'next/navigation';

// Unknown paths under a locale (/en/anything) render the localized not-found
// page inside the locale layout, so the 404 keeps its <html lang> and <title>.
export default function CatchAll() {
  notFound();
}

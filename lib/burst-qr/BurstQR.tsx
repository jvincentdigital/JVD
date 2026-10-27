'use client';

// Thin React wrapper for burst-qr.js (Next.js App Router). The engine and three.js load only in the
// browser, after mount, so this is safe to render on the server. Copy next to burst-qr.js.
import { useEffect, useRef } from 'react';
import type {
  BurstObjectBuilder,
  BurstPalette,
  BurstQR as BurstQRApi,
  BurstStyle,
} from './burst-qr';

type Props = {
  link: string;
  object: BurstObjectBuilder;
  palette?: BurstPalette;
  style?: BurstStyle;
  label?: string;
  className?: string;
  onToggle?: (open: boolean) => void;
  /** Gives you the engine (toggle, toPNG, ...) once it is ready. */
  onReady?: (api: BurstQRApi | null) => void;
  onError?: (err: Error) => void;
};

export default function BurstQR({
  link,
  object,
  palette,
  style = 'realistic',
  label,
  className,
  onToggle,
  onReady,
  onError,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const api = useRef<BurstQRApi | null>(null);
  const latest = useRef({ link, object, palette, style, onToggle, onReady, onError });
  latest.current = { link, object, palette, style, onToggle, onReady, onError };

  // create once, destroy on unmount
  useEffect(() => {
    let alive = true;
    const p = latest.current;
    import('./burst-qr.js')
      .then(({ createBurstQR }) =>
        createBurstQR(el.current!, {
          link: p.link,
          object: p.object,
          palette: p.palette,
          style: p.style,
          label,
          onToggle: (open) => latest.current.onToggle?.(open),
        }),
      )
      .then((made) => {
        if (!alive) return made.destroy();
        api.current = made;
        made.setStyle(latest.current.style); // in case it changed while loading
        latest.current.onReady?.(made);
      })
      .catch((err: Error) => latest.current.onError?.(err));
    return () => {
      alive = false;
      api.current?.destroy();
      api.current = null;
      latest.current.onReady?.(null);
    };
  }, [label]);

  useEffect(() => api.current?.setStyle(style), [style]);
  useEffect(() => {
    try {
      api.current?.setLink(link);
    } catch (err) {
      latest.current.onError?.(err as Error);
    }
  }, [link]);
  useEffect(() => api.current?.setObject(object, palette), [object, palette]);

  return <div ref={el} className={className} />;
}

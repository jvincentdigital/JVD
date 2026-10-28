'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-cream px-4'>
      <div className='text-center'>
        <p className='font-serif text-6xl font-bold text-accent-dark'>Oops</p>
        <h2 className='mt-4 font-serif text-2xl font-bold text-charcoal sm:text-3xl'>
          Something went wrong
        </h2>
        <p className='mt-3 text-lg text-warm-gray'>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className='mt-8 inline-block rounded-lg bg-accent-dark px-8 py-3 font-medium text-white transition-colors hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2'
        >
          Try again
        </button>
      </div>
    </div>
  );
}

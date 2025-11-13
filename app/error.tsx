'use client';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="max-w-md w-full shadow-md p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <button
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
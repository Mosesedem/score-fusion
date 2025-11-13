import { notFound } from 'next/navigation';
import Link from 'next/link';

// Optional: You can throw notFound() here if you want to auto-trigger, but typically
// it's thrown in other pages/layouts. This file just renders the UI.

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen ">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-2xl font-bold  mb-4">404 - Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
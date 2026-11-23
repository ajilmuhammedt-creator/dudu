// src/app/error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE] p-4">
      <div className="card p-8 max-w-md w-full text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#D8262B]">Something went wrong</h2>
        <p className="text-xs text-[#6B7280]">{error.message || 'An unexpected error occurred.'}</p>
        <button onClick={() => reset()} className="btn btn-secondary text-xs px-5">
          Try Again
        </button>
      </div>
    </div>
  );
}

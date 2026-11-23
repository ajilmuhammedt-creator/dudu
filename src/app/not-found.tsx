// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE] p-4">
      <div className="card p-8 max-w-md w-full text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-bold text-[#1F2328]">Page Not Found</h2>
        <p className="text-xs text-[#6B7280]">
          The page you requested does not exist.
        </p>
        <Link href="/" className="btn btn-primary text-xs px-5 inline-flex">
          Back to Parent Dashboard
        </Link>
      </div>
    </div>
  );
}

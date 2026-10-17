import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p>Page not found</p>
      <Link className="text-blue-600" href="/">
        Go Home
      </Link>
    </div>
  );
}

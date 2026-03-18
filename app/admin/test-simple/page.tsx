// Force dynamic rendering to avoid any caching issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// This page uses root layout but is simple
export default function TestSimplePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        ✅ Simple Test Page - Working!
      </h1>
      <p className="mb-2">If you can see this, the routing is working.</p>
      <p className="mb-2">URL: /admin/test-simple</p>
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-700">
          This page uses the root layout and should work without hydration errors.
        </p>
      </div>
    </div>
  );
}

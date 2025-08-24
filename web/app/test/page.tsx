export default function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Test Page</h1>
        <p className="text-xl">If you can see this, routing is working!</p>
        <p className="text-sm mt-4">Build time: {new Date().toISOString()}</p>
      </div>
    </div>
  );
}

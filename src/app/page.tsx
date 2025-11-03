export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          The Village Hub
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Internal Communications Platform
        </p>
        <p className="text-sm text-muted-foreground">
          Project initialization complete. Run <code className="bg-muted px-2 py-1 rounded">npm install</code> and <code className="bg-muted px-2 py-1 rounded">npm run dev</code> to get started.
        </p>
      </div>
    </main>
  );
}

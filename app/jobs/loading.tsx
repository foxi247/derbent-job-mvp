export default function JobsLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      <section className="surface h-52 animate-pulse p-5 md:h-56 md:p-7" />
      <section className="surface h-40 animate-pulse p-4" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="surface h-52 animate-pulse p-4" />
        ))}
      </section>
    </div>
  );
}


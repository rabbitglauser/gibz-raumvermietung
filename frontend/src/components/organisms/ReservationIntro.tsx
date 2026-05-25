export default function ReservationIntro() {
  return (
    <section className="flex flex-col justify-center">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-900">
        Schritt 1 von 2
      </p>

      <h1 className="mt-5 break-words text-5xl font-bold tracking-tight text-slate-900">
        Raumreservation
      </h1>

      <p className="mt-7 max-w-[460px] text-base leading-7 text-slate-600">
        Buchen Sie moderne Räumlichkeiten für Ihre Schulungen, Workshops oder
        Meetings am Gewerblich-industriellen Bildungszentrum Zug.
      </p>

      <div className="mt-12 space-y-6 text-base text-slate-600">
        <div className="flex items-center gap-5">
          <span className="text-blue-900">▣</span>
          <span>Flexible Terminwahl</span>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-blue-900">♟</span>
          <span>Kapazitäten bis 100 Personen</span>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-blue-900">☼</span>
          <span>Helle, moderne Architektur</span>
        </div>
      </div>
    </section>
  );
}
export default function ReservationForm() {
  return (
    <section className="w-full max-w-[560px] border border-slate-300 bg-white px-8 py-8 md:px-10 md:py-10">
      <form className="space-y-7">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Datum
            </span>
            <input
              type="text"
              defaultValue="11/20/2024"
              className="h-12 w-full border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Raum
            </span>
            <select className="h-12 w-full border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none">
              <option>Konferenzraum B.04</option>
              <option>Seminarraum S104</option>
              <option>Aula 1.005</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Startzeit
            </span>
            <input
              type="text"
              defaultValue="09:00 AM"
              className="h-12 w-full border border-red-500 bg-white px-4 text-slate-900 outline-none"
            />
            <span className="text-xs font-bold text-red-600">
              ⓘ Raum ist zu dieser Zeit nicht verfügbar
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Endzeit
            </span>
            <input
              type="text"
              defaultValue="11:00 AM"
              className="h-12 w-full border border-red-500 bg-white px-4 text-slate-900 outline-none"
            />
          </label>
        </div>

        <hr className="border-slate-200" />

        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Vollständiger Name
          </span>
          <input
            type="text"
            placeholder="Vorname Nachname"
            className="h-12 w-full border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              E-Mail Adresse
            </span>
            <input
              type="email"
              placeholder="beispiel@email.ch"
              className="h-12 w-full border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Telefonnummer
            </span>
            <input
              type="tel"
              placeholder="+41 00 000 00 00"
              className="h-12 w-full border border-slate-300 bg-slate-50 px-4 text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        <button
          type="submit"
          className="h-14 w-full bg-blue-900 text-lg font-bold uppercase tracking-[0.18em] text-white"
        >
          Reservierung senden →
        </button>

        <p className="text-center text-xs text-slate-500">
          Mit dem Klick bestätigen Sie unsere{" "}
          <span className="font-bold underline">AGB</span>.
        </p>
      </form>
    </section>
  );
}
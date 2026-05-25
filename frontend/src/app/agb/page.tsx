import type { Metadata } from "next";

import { Footer, Header } from "@/components/organisms";

export const metadata: Metadata = {
  title: "AGB Raumreservation | GIBZ",
  description: "Allgemeine Bedingungen für Raumreservationen am GIBZ.",
};

const sections = [
  {
    title: "1. Geltungsbereich",
    body: "Diese Bedingungen gelten für Anfragen und Reservationen von Räumen am GIBZ. Eine Reservation wird erst verbindlich, wenn sie durch das GIBZ geprüft und bestätigt wurde.",
  },
  {
    title: "2. Anfrage und Bestätigung",
    body: "Die Angaben im Reservationsformular müssen vollständig und korrekt sein. Das GIBZ kann Rückfragen stellen, Anfragen ablehnen oder alternative Räume und Zeiten vorschlagen.",
  },
  {
    title: "3. Nutzung der Räume",
    body: "Die Räume dürfen nur für den angegebenen Zweck genutzt werden. Einrichtungen, Mobiliar und technisches Material sind sorgfältig zu behandeln und nach der Veranstaltung im vereinbarten Zustand zu hinterlassen.",
  },
  {
    title: "4. Änderungen und Annullation",
    body: "Änderungen oder Annullationen müssen so früh wie möglich gemeldet werden. Bei kurzfristigen Änderungen kann das GIBZ nicht garantieren, dass Raum, Technik, Bestuhlung oder Verpflegung angepasst werden können.",
  },
  {
    title: "5. Verpflegung und Technik",
    body: "Bestellte Verpflegung, technische Unterstützung, Regiezeiten und Zusatzmaterial werden anhand der gemeldeten Angaben vorbereitet. Spätere Anpassungen sind nur nach Verfügbarkeit möglich.",
  },
  {
    title: "6. Kosten und Rechnungsstellung",
    body: "Allfällige Kosten richten sich nach Raum, Veranstaltertyp, Dauer und bestellten Zusatzleistungen. Die Rechnungsstellung erfolgt an die im Formular angegebene Adresse.",
  },
  {
    title: "7. Haftung",
    body: "Veranstaltende haften für Schäden, die durch unsachgemässe Nutzung oder durch Teilnehmende entstehen. Schäden oder Störungen sind dem GIBZ umgehend zu melden.",
  },
  {
    title: "8. Datenbearbeitung",
    body: "Die angegebenen Daten werden für die Bearbeitung der Reservation, interne Organisation, Rückfragen und allfällige Rechnungsstellung verwendet.",
  },
];

export default function AgbPage() {
  return (
    <>
      <Header />

      <main className="flex-1 bg-white">
        <article className="mx-auto max-w-[900px] px-4 py-10 sm:py-12">
          <div className="text-[11px] font-semibold tracking-[0.12em] text-[#00539b]">
            RAUMRESERVATION
          </div>
          <h1 className="mt-2 text-[32px] font-bold leading-tight text-[#003b73] sm:text-[36px]">
            Allgemeine Bedingungen
          </h1>
          <p className="mt-4 max-w-[720px] text-[15px] leading-relaxed text-[#5f6872]">
            Diese AGB sind ein Arbeitsentwurf für die Raumreservation am GIBZ
            und können durch die definitive Schul- oder Verwaltungsfassung
            ersetzt werden.
          </p>

          <div className="mt-10 grid gap-7">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-[18px] font-bold text-[#003b73]">
                  {section.title}
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#334155]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <section className="mt-10 border-t border-[#d6dde5] pt-6">
            <h2 className="text-[18px] font-bold text-[#003b73]">Kontakt</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#334155]">
              Bei Fragen zur Reservation oder zu diesen Bedingungen wenden Sie
              sich an das Sekretariat des GIBZ:
              <a
                href="mailto:sekretariat.gibz@zg.ch"
                className="ml-1 font-semibold text-[#003b73] underline underline-offset-2"
              >
                sekretariat.gibz@zg.ch
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </>
  );
}

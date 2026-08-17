import { theme } from "../styles/theme";

export function ProjectsView() {
  return (
    <>
      <header className="mb-8">
        <p className={theme.eyebrow}>Projects</p>

        <h2 className={`${theme.title} ${theme.brushUnderline}`}>
          Projects
        </h2>

        <p className="mt-3 text-sm font-semibold text-[color:var(--tm-muted)]">
          Οργάνωσε μεγάλα κομμάτια δουλειάς και σύνδεσέ τα αργότερα με tasks
          μέσω mentions όπως <span className="font-bold">@tenka_muso</span>.
        </p>
      </header>

      <section className={theme.card}>
        <p className={theme.eyebrow}>Coming next</p>

        <h3 className={`${theme.sectionTitle} mt-2`}>
          Project workspace
        </h3>

        <p className="mt-4 text-sm font-semibold text-[color:var(--tm-muted)]">
          Στο επόμενο βήμα θα μπει φόρμα δημιουργίας project και λίστα με τα
          αποθηκευμένα projects από Firestore.
        </p>
      </section>
    </>
  );
}
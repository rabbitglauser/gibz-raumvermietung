r"""Build a print-ready PDF of docs/PROJECT_DOCUMENTATION.md.

Pipeline: Markdown -> styled HTML -> headless-Chrome --print-to-pdf.
Run from the repo root with the backend venv python:

    .\backend\.venv\Scripts\python.exe scripts\build-docs-pdf.py
"""

import re
import subprocess
from datetime import date
from pathlib import Path

import markdown

REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_MD = REPO_ROOT / "docs" / "PROJECT_DOCUMENTATION.md"
OUT_HTML = REPO_ROOT / "docs" / "PROJECT_DOCUMENTATION.html"
OUT_PDF = REPO_ROOT / "docs" / "PROJECT_DOCUMENTATION.pdf"
REPO_URL = "https://github.com/rabbitglauser/gibz-raumvermietung"

CHROME_CANDIDATES = [
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
]

# Static replacement for the ```mermaid``` architecture block so it renders in
# the PDF without JS or network access.
ARCH_DIAGRAM_HTML = """
<div class="arch">
  <div class="arch-row">
    <div class="node">Browser<br><span>Kunde &amp; Mitarbeitende</span></div>
    <div class="arrow">&rarr;</div>
    <div class="node">Next.js Frontend<br><span>Port 3000</span></div>
    <div class="arrow">&rarr;<br><small>REST-API</small></div>
    <div class="node">FastAPI Backend<br><span>Port 8000</span></div>
  </div>
  <div class="arch-row arch-down">
    <div class="node side">MongoDB 8<br><span>Port 27017 &middot; Volume mongodb_data</span></div>
    <div class="node side">SMTP-Server<br><span>Erinnerungs-E-Mails</span></div>
  </div>
  <p class="arch-caption">Backend &rarr; MongoDB (AsyncMongoClient) sowie Backend &rarr; SMTP (Erinnerungen).</p>
</div>
"""

CSS = """
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body {
  font-family: "Segoe UI", Arial, sans-serif;
  font-size: 11pt; line-height: 1.5; color: #1a1a1a; margin: 0;
}
h1 { font-size: 20pt; color: #b1011f; margin: 0 0 4pt; }
h2 { font-size: 15pt; color: #b1011f; border-bottom: 1.5pt solid #b1011f;
     padding-bottom: 3pt; margin: 22pt 0 8pt; }
h3 { font-size: 12.5pt; color: #333; margin: 14pt 0 4pt; }
p, li { margin: 4pt 0; }
ul, ol { margin: 4pt 0 8pt 18pt; }
code { font-family: Consolas, "Courier New", monospace; font-size: 9.5pt;
       background: #f3f3f3; padding: 1pt 3pt; border-radius: 3px; }
pre { background: #f6f8fa; border: 0.75pt solid #ddd; border-radius: 5px;
      padding: 8pt 10pt; overflow-x: auto; page-break-inside: avoid; }
pre code { background: none; padding: 0; font-size: 9pt; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt;
        page-break-inside: avoid; }
th, td { border: 0.75pt solid #ccc; padding: 5pt 7pt; text-align: left;
         vertical-align: top; }
th { background: #f3f3f3; }
tr:nth-child(even) td { background: #fafafa; }

.titlepage { height: 247mm; display: flex; flex-direction: column;
             justify-content: center; page-break-after: always; }
.titlepage .accent { width: 70pt; height: 5pt; background: #b1011f; margin-bottom: 18pt; }
.titlepage h1 { font-size: 30pt; line-height: 1.15; }
.titlepage .sub { font-size: 14pt; color: #444; margin-top: 6pt; }
.titlepage .meta { margin-top: 40pt; font-size: 11pt; color: #333; }
.titlepage .meta div { margin: 3pt 0; }

.arch { border: 0.75pt solid #ddd; border-radius: 6px; padding: 14pt;
        background: #fcfcfc; margin: 10pt 0; page-break-inside: avoid; }
.arch-row { display: flex; align-items: center; justify-content: center; gap: 8pt;
            flex-wrap: wrap; }
.arch-down { margin-top: 14pt; gap: 24pt; }
.node { border: 1pt solid #b1011f; border-radius: 6px; padding: 8pt 12pt;
        text-align: center; font-weight: 600; background: #fff; min-width: 95pt; }
.node span { display: block; font-weight: 400; font-size: 8.5pt; color: #666; margin-top: 2pt; }
.node.side { border-color: #888; }
.arrow { color: #b1011f; font-weight: 700; font-size: 13pt; text-align: center; }
.arrow small { font-weight: 400; color: #666; font-size: 7.5pt; }
.arch-caption { text-align: center; font-size: 9pt; color: #666; margin: 12pt 0 0; }
"""


def find_chrome() -> Path:
    for candidate in CHROME_CANDIDATES:
        if candidate.exists():
            return candidate
    raise SystemExit("No Chrome/Edge executable found for PDF rendering.")


def build_html() -> str:
    text = SRC_MD.read_text(encoding="utf-8")

    # Drop the leading H1 (we render our own title page) and swap the mermaid block.
    text = re.sub(r"^#\s+.*\n", "", text, count=1)
    text = re.sub(
        r"```mermaid.*?```", "@@ARCH_DIAGRAM@@", text, count=1, flags=re.DOTALL
    )

    body = markdown.markdown(
        text, extensions=["tables", "fenced_code", "sane_lists"]
    )
    body = body.replace("<p>@@ARCH_DIAGRAM@@</p>", ARCH_DIAGRAM_HTML)

    today = date.today().strftime("%d.%m.%Y")
    titlepage = f"""
<section class="titlepage">
  <div class="accent"></div>
  <h1>Raumvermietung GIBZ<br>Projektdokumentation</h1>
  <div class="sub">Digitale Raumreservation f&uuml;r Aula 1.005, Seminarraum 2.112
  und Seminarraum 5.003/004</div>
  <div class="meta">
    <div><strong>Modul 165</strong> &ndash; NoSQL-Datenbanken einsetzen</div>
    <div>Frühlingssemester 2026</div>
    <div>Repository: {REPO_URL}</div>
    <div>Stand: {today}</div>
  </div>
</section>
"""

    return (
        "<!doctype html><html lang='de'><head><meta charset='utf-8'>"
        f"<style>{CSS}</style></head><body>{titlepage}{body}</body></html>"
    )


def main() -> None:
    OUT_HTML.write_text(build_html(), encoding="utf-8")
    chrome = find_chrome()
    if OUT_PDF.exists():
        OUT_PDF.unlink()
    subprocess.run(
        [
            str(chrome),
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={OUT_PDF}",
            OUT_HTML.as_uri(),
        ],
        check=True,
        timeout=120,
    )
    if not OUT_PDF.exists():
        raise SystemExit("Chrome did not produce a PDF.")
    print(f"PDF written: {OUT_PDF} ({OUT_PDF.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

# Rechner Pro — Google Calculator mit unbegrenztem Verlauf & Export

Ein intuitiver, an die originale Android-Google-Rechner-App ("Google Calculator") angelehnter Rechner mit unbegrenzter Verlaufsspeicherung, vollständiger deutscher Lokalisierung (Dezimalkomma, Tausenderpunkte, deutsche Menüs) und umfassenden Exportfunktionen für alle gängigen Dateiformate.

### User Review & Critical Decisions

> [!IMPORTANT]
> Basierend auf Ihren Angaben in Phase 1 sind folgende Kernentscheidungen festgelegt:

- **Rechnerumfang**: Fokussierter Grundrechner (Addition, Subtraktion, Multiplikation, Division, Prozentrechnung, Vorzeichenwechsel `±`, Klammern `( )`, Löschtaste `⌫` und `AC`), exakt wie das Primärlayout des Google Rechners auf Android.
- **Zahlenformatierung**: Standardmäßig deutsche Notation (`1.234,56` mit Komma als Dezimaltrenner und Punkt als Tausendertrennzeichen), mit einem Umschalter in den Einstellungen für internationale Notation (`1,234.56`).
- **Verlauf ohne Zeitbeschränkung**: Vollständige lokale Speicherung im Browser-Speicher (`localStorage`), kein automatisches Löschen nach Tagen/Wochen, durchsuchbar und filterbar.
- **Exportformate**: Unterstützung für alle Standardformate: CSV (Excel-kompatibles deutsches Semikolon-Trennzeichen), TXT (lesbares Rechenprotokoll), druckbares PDF (formatiertes Protokoll mit Datum und Zeitstempel) sowie JSON (für strukturierte Weiterverarbeitung).
- **Native Android PWA**: Material Design 3 / Material You Farbpalette, haptisches Feedback (Vibration auf Android-Geräten), Android Statusbar-Farbharmonie und vollständige PWA-Installierbarkeit auf dem Homescreen.

---

### 1. Overview & Core Concept

- **Was die App bietet**: Ein exakter Zwilling des modernen Google Android Calculators ("Material You"-Design), optimiert für deutschsprachige Anwender, Schüler, Handwerker, Buchhalter und Alltagsnutzer.
- **Das Kernproblem**: Der Standard-Google-Rechner speichert Berechnungen nur begrenzt, bietet keine Exportfunktion für Steuerbelege oder Protokolle und ist oft fest an englische Trennzeichen gekoppelt.
- **Kernwert**: Vertraute, blitzschnelle Bedienung mit riesigen Zifferntasten, Sofort-Ergebnisvorschau ("Live-Preview"), lückenloser Berechnungshistorie ("Verlauf"), Notizfunktion pro Rechnung und 1-Klick-Export nach CSV, TXT, PDF und JSON.

---

### 2. User Experience & Visual Design

#### A. Ästhetische Identität & Material You Design
- **Farbpalette (Material Design 3 Android Theme)**:
  - Primärleinwand / Canvas: Sanftes dunkles Nachtschiefer (`#121316` / `#1E1F24`) für den Dark Mode (Standard auf modernen Pixels) bzw. kühles Sand-Weiß (`#F8F9FA` / `#F0F4F9`) für den Light Mode.
  - Tastenfarben (Pixel Material You):
    - Zifferntasten `0–9`, `,`: Sanfte Tonal-Oberfläche (`bg-stone-800/80` dunkel, `bg-white` hell).
    - Grundoperatoren `÷`, `×`, `−`, `+`, `=`: Akzentuierte Pillen/Kreise in Google-Pastellblau / Jade (`bg-sky-600` oder `bg-amber-500` für `=`, `bg-slate-700/80` für Operatoren).
    - Sonderfunktionstasten `AC`, `⌫`, `%`, `±`, `( )`: Dezenter Kontrastton für schnelle Orientierung.
- **Typografie & Display**:
  - Großzügige, dynamisch skalierende Ziffernanzeige (Google Sans / Plus Jakarta Sans) mit `tabular-nums` für perfekte vertikale Ausrichtung.
  - Zwei-Zeilen-Display: Oben der scrollbare Gesamtausdruck (`145 + 32,50 × 4`), unten in Echtzeit die dynamische Ergebnisvorschau (`= 275`) in grau, die bei Druck auf `=` zum Hauptergebnis wird.
- **Taktiles Feedback & Animationen**:
  - Sanfter Android-Ripple-Effekt beim Antippen jeder Taste.
  - Haptische Vibration (`navigator.vibrate(12)` auf unterstützten Android-Geräten).
  - Volle Tastaturunterstützung (Numpad, Enter, Backspace, Komma `,` oder Punkt `.`).

#### B. Navigations- & Verlaufs-Workflow
- **Android Top-Bar**:
  - Drei-Punkte-Menü `⋮` mit Optionen: *Verlauf exportieren*, *Verlauf leeren*, *Zahlenformat (DE/EN)*, *App installieren*.
  - Verlauf-Icon / Wischgeste nach unten zum Öffnen des Verlaufs-Sheets ("BottomSheet").
- **Verlaufsansicht ("Verlauf")**:
  - Gruppiert nach Zeiträumen ("Heute", "Gestern", "Diese Woche", "Älter").
  - Jeder Eintrag zeigt: Mathematischer Ausdruck, formatiertes Ergebnis, exakter Zeitstempel (z. B. `19. Okt., 14:32`).
  - Interaktionen: Antippen lädt den Ausdruck oder das Ergebnis wieder in den Rechner; optionales Hinzufügen einer kurzen Notiz (z. B. "Material Einkauf"); Mülleimer-Icon zum Löschen einzelner Einträge.
- **Export-Dialog**:
  - Modal mit Formatauswahl: **CSV** (mit deutschem Trennzeichen `;`), **TXT** (Berechnungsliste), **PDF** (druckfertiges Beleg-Protokoll mit Kopfzeile und Summen) und **JSON**.
  - Direkter Datei-Download oder "In Zwischenablage kopieren".

---

### 3. Key Product Decisions & Trade-Offs

- **Entscheidung 1: Mathematische Auswertung mit robuster Parser-Logik**
  - *Gewählter Ansatz*: Eigener token-basierter Shunting-Yard-Parser bzw. sichere AST-Evaluation ohne fehleranfälliges oder unsicheres `eval()`.
  - *Warum*: Korrekte Beachtung der Punkt-vor-Strich-Regel (`×` und `÷` vor `+` und `−`), saubere Klammerauflösung, Prozentrechnung wie im Google Rechner (`200 + 10% = 220` bzw. `200 × 10% = 20`) und Vermeidung von IEEE-754 Rundungsfehlern (z. B. `0.1 + 0.2 = 0.3` statt `0.30000000000000004`).
- **Entscheidung 2: Lokale Persistenz mit `localStorage` & unbegrenztem Speicher**
  - *Gewählter Ansatz*: Client-seitiges Storage-Modul mit JSON-Serialisierung und Backup-Export/Import.
  - *Warum*: Keinerlei Login-Zwang, 100% DSGVO-konform, blitzschnell und offlinefähig im Flugmodus oder auf Baustellen ohne Netz.
- **Entscheidung 3: Echtes deutsches Zahlenformat (Komma-Eingabe)**
  - *Gewählter Ansatz*: Sowohl die Bildschirmtaste `,` als auch die Numpad-Taste `,` / `.` schreiben das deutsche Komma; intern wird transparent für mathematische Berechnungen geparst und mit `Intl.NumberFormat('de-DE')` formatiert.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Rechner Pro App                       │
│  ┌─────────────────────── Top-Bar ───────────────────────┐  │
│  │ [Logo / Rechner]             [Verlauf] [Export] [⋮]   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌────────────────────── Display ────────────────────────┐  │
│  │ Verlauf-Vorschau (klein)                              │  │
│  │ Aktueller Ausdruck: 1.250 + 350,50 × 2                │  │
│  │ Live-Ergebnisvorschau: = 1.951                        │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────── Tastenfeld ──────────────────────┐  │
│  │   AC   │   ( )  │    %   │    ÷    │                  │  │
│  │    7   │    8   │    9   │    ×    │  Material You    │  │
│  │    4   │    5   │    6   │    −    │  Touch-Pills     │  │
│  │    1   │    2   │    3   │    +    │  & Haptik        │  │
│  │    ±   │    0   │    ,   │    =    │                  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌───────────────────────────────┐     ┌───────────────────────────────┐
│     History & Storage Core    │     │      Export Generator         │
│  - Unbegrenzte Speicherung    │     │  - CSV (deutsches ;)          │
│  - Zeitstempel & Notizen      │     │  - TXT (Rechenprotokoll)      │
│  - Suchfilter & Wiederaufruf  │     │  - PDF (Drucklayout A4)       │
│  - localStorage Persistenz    │     │  - JSON (Raw Data)            │
└───────────────────────────────┘     └───────────────────────────────┘
```

#### Datenmodell (`CalculationHistoryItem`)
```typescript
interface CalculationHistoryItem {
  id: string;
  expression: string;         // z. B. "1.500 + 250,50 × 3"
  result: number;             // 2251.5
  formattedResult: string;    // "2.251,5"
  timestamp: number;          // UNIX Timestamp in ms
  note?: string;              // Optionale Notiz des Nutzers
}
```

#### Geplante Komponentenstruktur
1. `src/types/calculator.ts`: Datenstrukturen, Export-Typen und Formatierungsoptionen.
2. `src/utils/mathEngine.ts`: Sicherer mathematischer Parser für Rechenausdrücke mit deutscher Kommasetzung, Prioritäten und Prozentrechnung.
3. `src/utils/formatter.ts`: Zahlenformatierung (`Intl.NumberFormat('de-DE')` vs. `en-US`), Datumsformatierung nach DIN 5008 / deutscher Konvention.
4. `src/utils/exporter.ts`: CSV-, TXT-, JSON- und PDF-Export-Generatoren.
5. `src/components/Display.tsx`: Großes, auto-skalierendes Display mit Live-Ergebnis.
6. `src/components/Keypad.tsx`: Android Material You Tastenfeld mit Touch-Feedback und Haptik.
7. `src/components/HistoryDrawer.tsx`: Ausziehbarer Verlauf mit Gruppierung nach Tagen, Notizfeld und Einzelaktionen.
8. `src/components/ExportModal.tsx`: Dialog zur Formatauswahl mit Download und Clipboard-Option.
9. `src/components/SettingsModal.tsx`: Einstellungen (Zahlenformat, Tastentöne/Vibration, Dezimalstellen).
10. `public/manifest.json`: PWA-Manifest für die native Android-Installation.

---

### Verification Plan

- [ ] **Berechnungsgenauigkeit**: Test von Addition, Subtraktion, Multiplikation, Division, Vorrangregeln (`2 + 3 * 4 = 14`), Klammern und Prozentrechnung (`100 + 19% = 119`).
- [ ] **Dezimaltrennzeichen**: Eingabe von `12,5 + 3,5 = 16`, korrekte Darstellung mit Komma.
- [ ] **Verlauf**: Jeder Klick auf `=` legt einen Eintrag mit Timestamp an; Neustart des Browsers behält alle Einträge bei.
- [ ] **Export**:
  - CSV generiert Datei mit Trennzeichen `;` und `UTF-8 BOM` für sauberes Öffnen in Microsoft Excel / LibreOffice.
  - TXT generiert sauberes, deutsches Rechenprotokoll.
  - PDF öffnet formatiertes Drucklayout mit Zeitstempel und Summenzeile.
  - JSON liefert vollständigen Datensatz.
- [ ] **Android PWA & Responsive Design**: Test im mobilen Hochformat und Desktop-Modus, responsive Tasten, keine Layoutüberläufe.
- [ ] **Build-Prüfung**: `compile_applet` ohne TypeScript- oder Bundler-Fehler.

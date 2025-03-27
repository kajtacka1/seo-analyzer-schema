# Průvodce pro vývojáře

Tento dokument obsahuje informace pro vývojáře, kteří chtějí přispět k rozvoji rozšíření SEO Analýza Schema nebo jej upravit pro vlastní potřeby.

## Architektura rozšíření

Rozšíření je založeno na standardní architektuře Chrome Extension s využitím Manifest V3. Obsahuje tyto hlavní komponenty:

1. **Popup (UI)** - Uživatelské rozhraní zobrazované po kliknutí na ikonu rozšíření
2. **Content Script** - Skript injektovaný do webových stránek, který extrahuje data
3. **Background Script** - Služba na pozadí pro správu komunikace mezi různými částmi rozšíření

### Klíčové soubory

- `manifest.json` - Konfigurační soubor rozšíření
- `popup.html` a `popup.js` - UI rozšíření a logika zobrazení dat
- `content.js` - Skript pro extrakci dat z webových stránek
- `background.js` - Skript běžící na pozadí
- `css/styles.css` - Styly pro uživatelské rozhraní

## Komunikační tok

1. Po kliknutí na ikonu rozšíření se načte `popup.html`
2. `popup.js` kontaktuje `background.js` pro kontrolu, zda běží content script v aktivním tabu
3. Pokud content script neběží, `background.js` jej injektuje do stránky
4. `popup.js` posílá zprávu `content.js` s požadavkem na data stránky
5. `content.js` analyzuje stránku a vrátí data
6. `popup.js` zpracuje data a zobrazí je v UI

## SEO analýza

Rozšíření provádí analýzu několika klíčových oblastí:

### Nadpisy (H1-H4)

Content script používá `document.querySelectorAll()` pro nalezení všech nadpisů, kontrolu jejich viditelnosti a získání stylových informací.

```javascript
function getHeadings() {
  const headings = {};
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
    const elements = document.querySelectorAll(tag);
    headings[tag] = [];
    
    elements.forEach(element => {
      // Kontrola viditelnosti
      const style = window.getComputedStyle(element);
      const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      
      headings[tag].push({
        text: element.innerText.trim(),
        visible: isVisible,
        computed: {
          fontSize: style.fontSize,
          color: style.color
        }
      });
    });
  });
  
  return headings;
}
```

### Meta informace

Extrahuje všechny meta tagy a další důležité SEO prvky:

```javascript
function getMetaInfo() {
  const meta = {};
  
  // Titulek
  meta.title = document.title || '';
  
  // Meta tagy
  const metaTags = document.querySelectorAll('meta');
  meta.tags = {};
  
  metaTags.forEach(tag => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    const content = tag.getAttribute('content');
    
    if (name && content) {
      meta.tags[name] = content;
    }
  });
  
  // Canonical, Robots, OpenGraph...
  // ... další kód ...
  
  return meta;
}
```

### Klíčová slova

Analyzuje text stránky a počítá výskyty klíčových slov s filtrováním nerelevantních slov:

```javascript
function getKeywords() {
  // Získáme text z hlavního obsahu stránky
  const bodyText = document.body.innerText;
  
  // Odstranění interpunkce a konverze na malá písmena
  const cleanText = bodyText.toLowerCase().replace(/[^\w\sáčďéěíňóřšťúůýž]/g, '');
  
  // Rozdělení na slova
  const allWords = cleanText.split(/\s+/);
  
  // Filtrování stop slov a počítání výskytů
  // ... další kód ...
  
  return {
    keywords: keywordArray.slice(0, 20), // Top 20 klíčových slov
    totalWords: allWords.length,
    uniqueWords: Object.keys(wordCounts).length
  };
}
```

### Strukturovaná data (Schema)

Detekuje tři formáty strukturovaných dat:

```javascript
function getStructuredData() {
  // JSON-LD
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  const jsonLdData = [];
  
  // ... kód pro zpracování JSON-LD ...
  
  // Microdata
  const microdataElements = document.querySelectorAll('[itemscope]');
  const microdataData = [];
  
  // ... kód pro zpracování Microdata ...
  
  // RDFa
  const rdfaElements = document.querySelectorAll('[typeof]');
  const rdfaData = [];
  
  // ... kód pro zpracování RDFa ...
  
  return {
    jsonLd: jsonLdData,
    microdata: microdataData,
    rdfa: rdfaData
  };
}
```

## Vysvetlování strukturovaných dat

Klíčovou funkcionalitou rozšíření je vysvětlování složitých strukturovaných dat pro netechnické uživatele:

```javascript
function explainSchemaType(schemaType, container, format) {
  const schemaExplanations = {
    'Product': {
      title: 'Produkt',
      explanation: '...',
      benefits: [...]
    },
    // ... další typy schémat ...
  };
  
  // Získání vysvětlení a zobrazení
  let explanation = schemaExplanations[schemaType] || {
    title: schemaType,
    explanation: `...`,
    benefits: [...]
  };
  
  // ... kód pro generování HTML vysvětlení ...
  
  container.innerHTML = html;
}
```

## Výpočet SEO skóre

Rozšíření počítá celkové SEO skóre na základě různých faktorů:

```javascript
function calculateSeoScore(data) {
  let score = 0;
  let maxScore = 0;
  
  // Hodnocení H1
  if (data.headings.h1 && data.headings.h1.length > 0) {
    score += 10;
    if (data.headings.h1.length === 1) {
      score += 5; // Bonus za přesně jeden H1
    }
  }
  maxScore += 15;
  
  // ... hodnocení dalších faktorů ...
  
  // Výpočet konečného skóre
  const finalScore = Math.round((score / maxScore) * 100);
  return finalScore;
}
```

## Rozšíření funkcionality

### Přidání nového typu schématu

Pro přidání vysvětlení nového typu schématu upravte funkci `explainSchemaType` v souboru `popup.js`:

```javascript
const schemaExplanations = {
  // ... existující schémata ...
  
  'NovyTypSchematu': {
    title: 'Název typu',
    explanation: 'Vysvětlení pro obyčejné uživatele...',
    benefits: [
      'První výhoda',
      'Druhá výhoda',
      'Třetí výhoda'
    ]
  },
};
```

### Úprava zobrazení UI

Všechny styly jsou definovány v souboru `css/styles.css`. Pro úpravu vzhledu stačí upravit příslušné CSS selektory.

## Testování rozšíření

1. Načtěte rozšíření v režimu pro vývojáře (chrome://extensions/)
2. Otevřete DevTools přímo pro rozšíření kliknutím na "Inspect views: popup.html"
3. Používejte console.log pro ladění a zobrazení zpráv

## Distribuce

Pro vytvoření distribučního balíčku:

1. Ujistěte se, že všechny soubory jsou aktuální
2. Vytvořte ZIP archiv všech souborů kromě `.git` složky a dalších vývojářských souborů
3. ZIP lze nahrát do Chrome Web Store nebo distribuovat pro manuální instalaci
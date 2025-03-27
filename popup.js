// Popup script pro SEO Analýza Schema
document.addEventListener('DOMContentLoaded', function() {
  console.log('SEO Analýza Schema popup script načten');
  
  // Záložky
  setupTabs();
  
  // Kontrola, zda content script běží, případně ho injektujeme
  checkContentScript(function(result) {
    if (result.status === 'ok') {
      // Content script běží, načteme data
      loadPageData();
    } else if (result.systemPage) {
      // Systémová stránka, nemůžeme injektovat
      showSystemPageError();
    } else {
      // Jiná chyba
      showError('Chyba při komunikaci s aktivní stránkou. ' + result.message);
    }
  });
});

// Funkce pro nastavení přepínání záložek
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Deaktivace všech záložek
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Aktivace vybrané záložky
      button.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
}

// Kontrola, zda content script běží, případně ho injektujeme
function checkContentScript(callback) {
  chrome.runtime.sendMessage({action: 'checkContentScript'}, callback);
}

// Zobrazení chyby pro systémové stránky
function showSystemPageError() {
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.innerHTML = `
      <div class="section">
        <h3 class="section-title">Tato stránka nemůže být analyzována</h3>
        <p>Systémové stránky prohlížeče (chrome://, edge://, about:) nelze analyzovat z důvodů bezpečnostních omezení prohlížeče.</p>
        <p>Přejděte na běžnou webovou stránku pro použití této funkce.</p>
      </div>
    `;
  });
  
  document.getElementById('seoScore').textContent = '-';
  document.getElementById('seoScore').style.backgroundColor = '#6c757d';
}

// Zobrazení obecné chyby
function showError(message) {
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.innerHTML = `
      <div class="section">
        <h3 class="section-title">Chyba při analýze stránky</h3>
        <p>${message}</p>
      </div>
    `;
  });
  
  document.getElementById('seoScore').textContent = '-';
  document.getElementById('seoScore').style.backgroundColor = '#e74c3c';
}

// Zobrazení snackbar notifikace
function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.className = 'show';
  
  setTimeout(() => {
    snackbar.className = snackbar.className.replace('show', '');
  }, 3000);
}

// Načtení dat stránky
function loadPageData() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || !tabs.length) {
      showError('Nepodařilo se získat aktivní tab.');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getPageData'}, function(response) {
      if (chrome.runtime.lastError) {
        showError('Nepodařilo se komunikovat s content scriptem: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (!response) {
        showError('Nebyla obdržena odpověď od content scriptu.');
        return;
      }
      
      // Zpracování načtených dat
      processPageData(response);
    });
  });
}

// Zpracování dat stránky
function processPageData(data) {
  // Skrytí načítání
  document.querySelectorAll('.loading').forEach(el => el.style.display = 'none');
  document.querySelectorAll('[id$="-content"]').forEach(el => el.style.display = 'block');
  
  // Nadpisy
  renderHeadings(data.headings);
  
  // Meta informace
  renderMetaInfo(data.metaInfo);
  
  // Klíčová slova
  renderKeywords(data.keywordsData);
  
  // Strukturovaná data
  renderSchema(data.structuredData);
  
  // Výpočet SEO skóre
  const score = calculateSeoScore(data);
  renderSeoScore(score);
}

// Výpočet SEO skóre
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
  
  // Hodnocení struktury nadpisů
  if (data.headings.h2 && data.headings.h2.length > 0) {
    score += 5;
    if (data.headings.h3 && data.headings.h3.length > 0) {
      score += 5; // Bonus za použití H3
    }
  }
  maxScore += 10;
  
  // Hodnocení meta title
  if (data.metaInfo.title) {
    const titleLength = data.metaInfo.title.length;
    if (titleLength > 20 && titleLength < 70) {
      score += 10; // Ideální délka
    } else if (titleLength > 10 && titleLength < 100) {
      score += 5; // Akceptovatelná délka
    }
  }
  maxScore += 10;
  
  // Hodnocení meta description
  if (data.metaInfo.tags && data.metaInfo.tags.description) {
    const descLength = data.metaInfo.tags.description.length;
    if (descLength > 50 && descLength < 160) {
      score += 10; // Ideální délka
    } else if (descLength > 25 && descLength < 200) {
      score += 5; // Akceptovatelná délka
    }
  }
  maxScore += 10;
  
  // Hodnocení canonical
  if (data.metaInfo.canonical) {
    score += 5;
  }
  maxScore += 5;
  
  // Hodnocení klíčových slov
  if (data.keywordsData.keywords && data.keywordsData.keywords.length > 0) {
    score += 5;
    
    // Bonus za hustotu klíčových slov
    if (data.keywordsData.keywords[0].density < 5) {
      score += 5; // Ne příliš vysoká hustota
    }
  }
  maxScore += 10;
  
  // Hodnocení za počet slov
  if (data.keywordsData.totalWords > 300) {
    score += 10;
  } else if (data.keywordsData.totalWords > 100) {
    score += 5;
  }
  maxScore += 10;
  
  // Hodnocení strukturovaných dat
  if ((data.structuredData.jsonLd && data.structuredData.jsonLd.length > 0) || 
      (data.structuredData.microdata && data.structuredData.microdata.length > 0) || 
      (data.structuredData.rdfa && data.structuredData.rdfa.length > 0)) {
    score += 10;
  }
  maxScore += 10;
  
  // OG meta tagy
  let ogTagsCount = 0;
  if (data.metaInfo.openGraph) {
    ogTagsCount = Object.keys(data.metaInfo.openGraph).length;
    if (ogTagsCount >= 3) {
      score += 10;
    } else if (ogTagsCount > 0) {
      score += 5;
    }
  }
  maxScore += 10;
  
  // Výpočet konečného skóre
  const finalScore = Math.round((score / maxScore) * 100);
  return finalScore;
}

// Zobrazení SEO skóre
function renderSeoScore(score) {
  const scoreElement = document.getElementById('seoScore');
  scoreElement.textContent = score;
  
  // Barva podle hodnoty skóre
  if (score >= 80) {
    scoreElement.style.backgroundColor = '#2ecc71'; // Zelená
  } else if (score >= 60) {
    scoreElement.style.backgroundColor = '#f39c12'; // Oranžová
  } else {
    scoreElement.style.backgroundColor = '#e74c3c'; // Červená
  }
}

// Zobrazení nadpisů
function renderHeadings(headings) {
  const container = document.getElementById('headings-content');
  if (!headings) {
    container.innerHTML = '<div class="section"><p class="missing">Na této stránce nebyly nalezeny žádné nadpisy.</p></div>';
    return;
  }
  
  let html = '';
  
  // Sekce pro H1
  const h1Count = headings.h1 ? headings.h1.length : 0;
  let h1Status = 'status-error';
  if (h1Count === 1) {
    h1Status = 'status-ok';
  } else if (h1Count > 1) {
    h1Status = 'status-warning';
  }
  
  html += `
    <div class="section">
      <h3 class="section-title">
        H1 <span class="status-indicator ${h1Status}"></span>
      </h3>
      <p>Počet: ${h1Count} (optimální: 1)</p>
      <ul class="heading-list">
  `;
  
  if (h1Count === 0) {
    html += `<li class="heading-item missing">Na stránce chybí nadpis H1!</li>`;
  } else {
    headings.h1.forEach(heading => {
      const visibilityClass = heading.visible ? '' : 'missing';
      const visibilityText = heading.visible ? '' : ' (skrytý)';
      html += `<li class="heading-item ${visibilityClass}">${heading.text}${visibilityText}</li>`;
    });
  }
  
  html += `
      </ul>
    </div>
  `;
  
  // Sekce pro H2-H4
  ['h2', 'h3', 'h4'].forEach(tag => {
    const count = headings[tag] ? headings[tag].length : 0;
    
    html += `
      <div class="section">
        <h3 class="section-title">
          ${tag.toUpperCase()} 
          <small>(${count})</small>
        </h3>
        <ul class="heading-list">
    `;
    
    if (count === 0) {
      html += `<li class="heading-item missing">Na stránce nejsou žádné nadpisy ${tag.toUpperCase()}.</li>`;
    } else {
      headings[tag].forEach(heading => {
        const visibilityClass = heading.visible ? '' : 'missing';
        const visibilityText = heading.visible ? '' : ' (skrytý)';
        html += `<li class="heading-item ${visibilityClass}">${heading.text}${visibilityText}</li>`;
      });
    }
    
    html += `
        </ul>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Zobrazení meta informací
function renderMetaInfo(metaInfo) {
  const container = document.getElementById('meta-content');
  if (!metaInfo) {
    container.innerHTML = '<div class="section"><p class="missing">Na této stránce nebyly nalezeny žádné meta informace.</p></div>';
    return;
  }
  
  let html = '';
  
  // Title
  const titleLength = metaInfo.title ? metaInfo.title.length : 0;
  let titleStatus = 'status-error';
  if (titleLength >= 10 && titleLength <= 70) {
    titleStatus = 'status-ok';
  } else if (titleLength > 0) {
    titleStatus = 'status-warning';
  }
  
  html += `
    <div class="section">
      <h3 class="section-title">
        Title <span class="status-indicator ${titleStatus}"></span>
      </h3>
      <div class="meta-item">
        <div>
          <div class="meta-heading">Titulek stránky (${titleLength} znaků)</div>
          <div class="meta-value">${metaInfo.title || '<span class="missing">Chybí</span>'}</div>
        </div>
      </div>
    </div>
  `;
  
  // Meta description
  const description = metaInfo.tags && metaInfo.tags.description;
  const descLength = description ? description.length : 0;
  let descStatus = 'status-error';
  if (descLength >= 50 && descLength <= 160) {
    descStatus = 'status-ok';
  } else if (descLength > 0) {
    descStatus = 'status-warning';
  }
  
  html += `
    <div class="section">
      <h3 class="section-title">
        Meta Description <span class="status-indicator ${descStatus}"></span>
      </h3>
      <div class="meta-item">
        <div>
          <div class="meta-heading">Popis stránky (${descLength} znaků)</div>
          <div class="meta-value">${description || '<span class="missing">Chybí</span>'}</div>
        </div>
      </div>
    </div>
  `;
  
  // Canonical
  const canonical = metaInfo.canonical;
  const canonicalStatus = canonical ? 'status-ok' : 'status-error';
  
  html += `
    <div class="section">
      <h3 class="section-title">
        Canonical URL <span class="status-indicator ${canonicalStatus}"></span>
      </h3>
      <div class="meta-item">
        <div>
          <div class="meta-heading">Kanonická URL</div>
          <div class="meta-value">${canonical || '<span class="missing">Chybí</span>'}</div>
        </div>
      </div>
    </div>
  `;
  
  // Open Graph
  const ogTags = metaInfo.openGraph;
  const ogCount = ogTags ? Object.keys(ogTags).length : 0;
  let ogStatus = 'status-error';
  if (ogCount >= 3) {
    ogStatus = 'status-ok';
  } else if (ogCount > 0) {
    ogStatus = 'status-warning';
  }
  
  html += `
    <div class="section">
      <h3 class="section-title">
        Open Graph <span class="status-indicator ${ogStatus}"></span>
      </h3>
      <div class="meta-list">
  `;
  
  if (ogCount === 0) {
    html += `<div class="meta-item missing">Žádné Open Graph meta tagy nebyly nalezeny.</div>`;
  } else {
    for (const [key, value] of Object.entries(ogTags)) {
      html += `
        <div class="meta-item">
          <div>
            <div class="meta-heading">${key}</div>
            <div class="meta-value">${value}</div>
          </div>
        </div>
      `;
    }
  }
  
  html += `
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// Zobrazení klíčových slov
function renderKeywords(keywordsData) {
  const container = document.getElementById('keywords-content');
  if (!keywordsData || !keywordsData.keywords || keywordsData.keywords.length === 0) {
    container.innerHTML = '<div class="section"><p class="missing">Na této stránce nebyla nalezena žádná klíčová slova.</p></div>';
    return;
  }
  
  let html = `
    <div class="section">
      <h3 class="section-title">Statistika obsahu</h3>
      <p>Celkový počet slov: <strong>${keywordsData.totalWords}</strong></p>
      <p>Počet unikátních slov: <strong>${keywordsData.uniqueWords}</strong></p>
    </div>
  `;
  
  html += `
    <div class="section">
      <h3 class="section-title">Nejčastější slova</h3>
      <ul class="keyword-list">
  `;
  
  keywordsData.keywords.forEach(keyword => {
    html += `
      <li class="keyword-item">
        <span>${keyword.word}</span>
        <span>${keyword.count}x (${keyword.density}%)</span>
      </li>
    `;
  });
  
  html += `
      </ul>
    </div>
  `;
  
  container.innerHTML = html;
}

// Zobrazení strukturovaných dat
function renderSchema(structuredData) {
  const container = document.getElementById('schema-content');
  if (!structuredData || 
      ((!structuredData.jsonLd || structuredData.jsonLd.length === 0) && 
       (!structuredData.microdata || structuredData.microdata.length === 0) && 
       (!structuredData.rdfa || structuredData.rdfa.length === 0))) {
    container.innerHTML = '<div class="section"><p class="missing">Na této stránce nebyla nalezena žádná strukturovaná data.</p></div>';
    return;
  }
  
  let html = '';
  
  // JSON-LD
  if (structuredData.jsonLd && structuredData.jsonLd.length > 0) {
    html += `
      <div class="section">
        <h3 class="section-title">JSON-LD</h3>
        <p>Počet JSON-LD bloků: ${structuredData.jsonLd.length}</p>
    `;
    
    structuredData.jsonLd.forEach((item, index) => {
      if (item.error) {
        html += `
          <div>
            <p class="missing">Chyba v JSON-LD #${index + 1}: ${item.message}</p>
            <pre>${item.rawData}</pre>
          </div>
        `;
        return;
      }
      
      let schemaType = 'Nespecifikovaný typ';
      if (item['@type']) {
        schemaType = Array.isArray(item['@type']) ? item['@type'].join(', ') : item['@type'];
      }
      
      html += `
        <div>
          <p><strong>Typ schématu:</strong> <span class="schema-type">${schemaType}</span></p>
          <pre>${formatJSON(item)}</pre>
          <button class="explain-btn" data-schema-type="${Array.isArray(item['@type']) ? item['@type'][0] : item['@type']}" data-schema-format="jsonld">Vysvětlit schéma</button>
          <div class="explanation-container"></div>
        </div>
      `;
    });
    
    html += `
      </div>
    `;
  }
  
  // Microdata
  if (structuredData.microdata && structuredData.microdata.length > 0) {
    html += `
      <div class="section">
        <h3 class="section-title">Microdata</h3>
        <p>Počet Microdata bloků: ${structuredData.microdata.length}</p>
    `;
    
    structuredData.microdata.forEach(item => {
      const type = item.type || 'Nespecifikovaný typ';
      const typeParts = type.split('/');
      const schemaType = typeParts[typeParts.length - 1] || type;
      
      html += `
        <div>
          <p><strong>Typ schématu:</strong> <span class="schema-type">${schemaType}</span></p>
          <pre>${formatJSON(item.properties)}</pre>
          <button class="explain-btn" data-schema-type="${schemaType}" data-schema-format="microdata">Vysvětlit schéma</button>
          <div class="explanation-container"></div>
        </div>
      `;
    });
    
    html += `
      </div>
    `;
  }
  
  // RDFa
  if (structuredData.rdfa && structuredData.rdfa.length > 0) {
    html += `
      <div class="section">
        <h3 class="section-title">RDFa</h3>
        <p>Počet RDFa bloků: ${structuredData.rdfa.length}</p>
    `;
    
    structuredData.rdfa.forEach(item => {
      const type = item.type || 'Nespecifikovaný typ';
      
      html += `
        <div>
          <p><strong>Typ schématu:</strong> <span class="schema-type">${type}</span></p>
          <pre>${formatJSON(item.properties)}</pre>
          <button class="explain-btn" data-schema-type="${type}" data-schema-format="rdfa">Vysvětlit schéma</button>
          <div class="explanation-container"></div>
        </div>
      `;
    });
    
    html += `
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // Přidání event listenerů pro tlačítka vysvětlení
  document.querySelectorAll('.explain-btn').forEach(button => {
    button.addEventListener('click', function() {
      const container = this.nextElementSibling;
      const schemaType = this.getAttribute('data-schema-type');
      const schemaFormat = this.getAttribute('data-schema-format');
      
      if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
      }
      
      if (schemaFormat === 'jsonld') {
        explainJsonLdSchema(schemaType, container);
      } else {
        explainSchemaType(schemaType, container, schemaFormat);
      }
      
      container.style.display = 'block';
    });
  });
}

// Formátování JSON pro zobrazení
function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

// Vysvětlení JSON-LD schématu
function explainJsonLdSchema(schemaType, container) {
  if (!schemaType) {
    container.innerHTML = '<p class="missing">Nelze identifikovat typ schématu pro vysvětlení.</p>';
    return;
  }
  
  // Odstranění "http://schema.org/" nebo "https://schema.org/" z typu schématu
  let cleanType = schemaType;
  if (schemaType.includes('schema.org/')) {
    cleanType = schemaType.split('schema.org/')[1];
  }
  
  explainSchemaType(cleanType, container, 'jsonld');
}

// Vysvětlení typu schématu pro běžné uživatele
function explainSchemaType(schemaType, container, format) {
  const schemaExplanations = {
    'Product': {
      title: 'Produkt',
      explanation: 'Toto schéma označuje, že stránka obsahuje informace o produktu jako je název, cena, dostupnost, hodnocení, recenze a další vlastnosti.',
      benefits: [
        'Zobrazení produktových informací přímo ve výsledcích vyhledávání',
        'Možnost zobrazení hvězdiček s hodnocením produktu',
        'Zvýšení pravděpodobnosti, že produkt bude zobrazen ve srovnávačích zboží'
      ]
    },
    'Recipe': {
      title: 'Recept',
      explanation: 'Toto schéma označuje, že stránka obsahuje kuchařský recept včetně ingrediencí, doby přípravy, postupu, kalorických hodnot a dalších vlastností.',
      benefits: [
        'Zobrazení receptu s obrázkem a hodnocením ve výsledcích vyhledávání',
        'Možnost zobrazení doby přípravy, obtížnosti a kalorické hodnoty',
        'Zařazení do speciálních výsledků pro recepty ve vyhledávání'
      ]
    },
    'LocalBusiness': {
      title: 'Místní podnikání',
      explanation: 'Toto schéma označuje informace o místním podnikání nebo provozovně, jako je název, adresa, telefonní číslo, otevírací doba a další údaje.',
      benefits: [
        'Zobrazení v místních výsledcích vyhledávání s mapou',
        'Možnost zobrazení otevírací doby a dalších detailů přímo ve vyhledávání',
        'Integrace s Mapami Google a dalšími mapovými službami'
      ]
    },
    'Article': {
      title: 'Článek',
      explanation: 'Toto schéma označuje, že stránka obsahuje článek nebo publikaci, včetně informací o autorovi, datu publikace, obsahu a dalších vlastnostech.',
      benefits: [
        'Lepší zobrazení ve výsledcích vyhledávání s informacemi o autorovi a datu',
        'Možnost zobrazení ve speciálních sekcích jako Google News',
        'Snadnější indexace obsahu pro vyhledávací roboty'
      ]
    },
    'Person': {
      title: 'Osoba',
      explanation: 'Toto schéma označuje informace o osobě, jako je jméno, věk, povolání, sociální sítě a další biografické údaje.',
      benefits: [
        'Přesnější indexace informací o osobě',
        'Možnost zobrazení ve výsledcích vyhledávání při hledání specifické osoby',
        'Propojení s dalšími schématy jako Article, Event, Organization'
      ]
    },
    'Organization': {
      title: 'Organizace',
      explanation: 'Toto schéma označuje informace o organizaci, společnosti nebo instituci, včetně názvu, adresy, kontaktních údajů a dalších vlastností.',
      benefits: [
        'Zobrazení podnikových informací ve výsledcích vyhledávání',
        'Možnost zobrazení loga firmy a kontaktních údajů',
        'Propojení s dalšími schématy jako Event, Person, Product'
      ]
    },
    'FAQPage': {
      title: 'Stránka s častými dotazy',
      explanation: 'Toto schéma označuje, že stránka obsahuje seznam otázek a odpovědí (FAQ). Umožňuje vyhledávačům identifikovat a zvýraznit tyto otázky a odpovědi.',
      benefits: [
        'Možnost zobrazení rozbalovacích otázek a odpovědí přímo ve výsledcích vyhledávání',
        'Zvýšení viditelnosti ve výsledcích při hledání specifických otázek',
        'Větší prostor ve výsledcích vyhledávání'
      ]
    },
    'Event': {
      title: 'Událost',
      explanation: 'Toto schéma označuje informace o události, jako je název, datum, místo konání, účastníci a další vlastnosti.',
      benefits: [
        'Zobrazení v kalendáři událostí ve vyhledávání',
        'Možnost zobrazení detailů události přímo ve výsledcích',
        'Integrace s kalendářovými a mapovými službami'
      ]
    },
    'VideoObject': {
      title: 'Video',
      explanation: 'Toto schéma označuje, že stránka obsahuje video, včetně informací o názvu, popisu, době trvání, miniaturách a dalších vlastnostech.',
      benefits: [
        'Zobrazení náhledu videa ve výsledcích vyhledávání',
        'Možnost zobrazení délky videa a data publikace',
        'Zvýšení pravděpodobnosti zobrazení v sekci Video ve vyhledávání'
      ]
    },
    'BreadcrumbList': {
      title: 'Drobečková navigace',
      explanation: 'Toto schéma označuje drobečkovou navigaci, která zobrazuje hierarchii stránky v rámci webu. Pomáhá uživatelům a vyhledávačům pochopit strukturu webu.',
      benefits: [
        'Zobrazení struktury stránek ve výsledcích vyhledávání',
        'Lepší navigace pro uživatele přímo z výsledků vyhledávání',
        'Lepší pochopení hierarchie stránek vyhledávači'
      ]
    }
  };
  
  // Základní zpracování, pokud nenajdeme specifický typ
  let explanation = schemaExplanations[schemaType] || {
    title: schemaType,
    explanation: `Toto schéma označuje strukturovaná data typu ${schemaType}. Strukturovaná data pomáhají vyhledávačům lépe porozumět obsahu stránky.`,
    benefits: [
      'Lepší indexace obsahu vyhledávači',
      'Možnost zobrazení rozšířených výsledků ve vyhledávání',
      'Vyšší pravděpodobnost relevantního zobrazení ve výsledcích vyhledávání'
    ]
  };
  
  let formatText = '';
  if (format === 'jsonld') {
    formatText = 'JSON-LD je preferovaný formát strukturovaných dat doporučovaný Googlem a dalšími vyhledávači.';
  } else if (format === 'microdata') {
    formatText = 'Microdata je formát vkládaný přímo do HTML kódu pomocí atributů itemscope, itemtype a itemprop.';
  } else if (format === 'rdfa') {
    formatText = 'RDFa je formát založený na atributech v HTML, který podporuje více slovníků strukturovaných dat.';
  }
  
  let html = `
    <div class="explanation-title">${explanation.title}</div>
    <div class="explanation-content">
      <p>${explanation.explanation}</p>
      <p>${formatText}</p>
      <p><strong>Výhody pro SEO:</strong></p>
      <ul class="schema-benefits">
  `;
  
  explanation.benefits.forEach(benefit => {
    html += `<li>${benefit}</li>`;
  });
  
  html += `
      </ul>
    </div>
  `;
  
  container.innerHTML = html;
}
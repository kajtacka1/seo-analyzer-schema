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
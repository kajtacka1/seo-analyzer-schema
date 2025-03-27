// Content script pro SEO Analýza Schema
console.log('SEO Analýza Schema content script naběhl');

// Funkce pro získání obsahů všech nadpisů
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

// Funkce pro získání meta informací
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
  
  // Canonical
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  meta.canonical = canonicalLink ? canonicalLink.getAttribute('href') : '';
  
  // Robots
  meta.robots = meta.tags['robots'] || '';
  
  // OpenGraph
  meta.openGraph = {};
  Object.keys(meta.tags).forEach(key => {
    if (key.startsWith('og:')) {
      meta.openGraph[key] = meta.tags[key];
    }
  });
  
  return meta;
}

// Funkce pro získání klíčových slov z obsahu stránky
function getKeywords() {
  // Získáme text z hlavního obsahu stránky (bez skriptů, stylů, atd.)
  const bodyText = document.body.innerText;
  
  // Odstranění interpunkce a konverze na malá písmena
  const cleanText = bodyText.toLowerCase().replace(/[^\w\sáčďéěíňóřšťúůýž]/g, '');
  
  // Rozdělení na slova
  const allWords = cleanText.split(/\s+/);
  
  // Filtrování krátkých slov a stop slov
  const stopWords = new Set(['a', 'aby', 'ale', 'ani', 'až', 'bez', 'by', 'co', 'či', 'do', 'i', 'jako', 'je', 'jeho', 'její', 'jejich', 'jen', 'ji', 'jsem', 'jsou', 'k', 'ke', 'když', 'na', 'nad', 'nebo', 'o', 'od', 'pak', 'po', 'pod', 'podle', 'pokud', 'pro', 'proto', 'před', 's', 'se', 'si', 'sám', 'tak', 'také', 'tam', 'tento', 'the', 'to', 'toho', 'tohle', 'tom', 'tu', 'tedy', 'tím', 'u', 'už', 'v', 've', 'však', 'z', 'za', 'zde', 'ze', 'že']);
  
  const filteredWords = allWords.filter(word => word.length > 2 && !stopWords.has(word));
  
  // Počítání výskytů slov
  const wordCounts = {};
  filteredWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Převod na pole
  const keywordArray = Object.keys(wordCounts).map(word => ({
    word,
    count: wordCounts[word],
    density: (wordCounts[word] / filteredWords.length * 100).toFixed(2)
  }));
  
  // Seřazení sestupně podle počtu
  keywordArray.sort((a, b) => b.count - a.count);
  
  return {
    keywords: keywordArray.slice(0, 20), // Top 20 klíčových slov
    totalWords: allWords.length,
    uniqueWords: Object.keys(wordCounts).length
  };
}

// Funkce pro získání strukturovaných dat
function getStructuredData() {
  // Hledání JSON-LD
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  const jsonLdData = [];
  
  jsonLdScripts.forEach(script => {
    try {
      const content = JSON.parse(script.innerHTML);
      jsonLdData.push(content);
    } catch (e) {
      jsonLdData.push({
        error: true,
        message: e.message,
        rawData: script.innerHTML.substring(0, 200) + '...'
      });
    }
  });
  
  // Hledání Microdata
  const microdataElements = document.querySelectorAll('[itemscope]');
  const microdataData = [];
  
  microdataElements.forEach(element => {
    const itemType = element.getAttribute('itemtype');
    const itemId = element.getAttribute('itemid');
    const properties = {};
    
    const propEls = element.querySelectorAll('[itemprop]');
    propEls.forEach(propEl => {
      const propName = propEl.getAttribute('itemprop');
      let propValue;
      
      if (propEl.tagName === 'META') {
        propValue = propEl.getAttribute('content');
      } else if (propEl.tagName === 'IMG') {
        propValue = propEl.getAttribute('src');
      } else if (propEl.tagName === 'A') {
        propValue = propEl.getAttribute('href');
      } else if (propEl.tagName === 'TIME') {
        propValue = propEl.getAttribute('datetime') || propEl.innerText;
      } else {
        propValue = propEl.innerText;
      }
      
      properties[propName] = propValue;
    });
    
    microdataData.push({
      type: itemType,
      id: itemId,
      properties
    });
  });
  
  // Hledání RDFa
  const rdfaElements = document.querySelectorAll('[typeof]');
  const rdfaData = [];
  
  rdfaElements.forEach(element => {
    const type = element.getAttribute('typeof');
    const about = element.getAttribute('about');
    const properties = {};
    
    const propEls = element.querySelectorAll('[property]');
    propEls.forEach(propEl => {
      const propName = propEl.getAttribute('property');
      let propValue;
      
      if (propEl.getAttribute('content')) {
        propValue = propEl.getAttribute('content');
      } else {
        propValue = propEl.innerText;
      }
      
      properties[propName] = propValue;
    });
    
    rdfaData.push({
      type,
      about,
      properties
    });
  });
  
  return {
    jsonLd: jsonLdData,
    microdata: microdataData,
    rdfa: rdfaData
  };
}

// Obsluha zpráv z popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script obdržel zprávu:', request);
  
  // Ping pro kontrolu, zda content script běží
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return;
  }
  
  // Získání dat stránky
  if (request.action === 'getPageData') {
    const headings = getHeadings();
    const metaInfo = getMetaInfo();
    const keywordsData = getKeywords();
    const structuredData = getStructuredData();
    
    sendResponse({
      headings,
      metaInfo,
      keywordsData,
      structuredData,
      url: window.location.href,
      lastUpdated: new Date().toISOString()
    });
    return;
  }
  
  // Odpovíme, že zprávu jsme obdrželi, ale nerozumíme jí
  sendResponse({ error: 'Neznámá akce' });
});

// Informace o načtení
console.log('SEO Analýza Schema content script připraven k použití');
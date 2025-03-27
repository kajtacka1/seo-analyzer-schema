// Background script pro SEO Analýza Schema
console.log('SEO Analýza Schema background script loaded');

// Při instalaci rozšíření
chrome.runtime.onInstalled.addListener(function() {
  console.log('SEO Analýza Schema rozšíření nainstalováno');
});

// Naslouchání na zprávy
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Kontrola, zda content script běží v aktivním tabu
  if (request.action === 'checkContentScript') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || !tabs.length) {
        sendResponse({status: 'error', message: 'Nepodařilo se získat aktivní tab'});
        return;
      }
      
      const activeTab = tabs[0];
      
      // Nemůžeme injektovat do chrome:// URL, extensions:// URL, atd.
      if (activeTab.url.startsWith('chrome://') || 
          activeTab.url.startsWith('chrome-extension://') || 
          activeTab.url.startsWith('edge://') || 
          activeTab.url.startsWith('about:')) {
        sendResponse({
          status: 'error', 
          message: 'Nelze injektovat content script do tohoto typu stránky',
          systemPage: true
        });
        return;
      }
      
      // Zkusíme poslat ping do content scriptu
      chrome.tabs.sendMessage(activeTab.id, {action: 'ping'}, function(response) {
        // Pokud dostaneme odpověď, content script běží
        if (response && !chrome.runtime.lastError) {
          sendResponse({status: 'ok', message: 'Content script je aktivní'});
          return;
        }
        
        // Pokud ne, zkusíme ho injektovat
        chrome.scripting.executeScript(
          {
            target: {tabId: activeTab.id},
            files: ['content.js']
          },
          function(results) {
            if (chrome.runtime.lastError) {
              sendResponse({
                status: 'error', 
                message: 'Nepodařilo se injektovat content script: ' + chrome.runtime.lastError.message
              });
            } else {
              sendResponse({
                status: 'ok', 
                message: 'Content script byl právě injektován'
              });
            }
          }
        );
      });
    });
    
    // Vracíme true pro asynchronní zpracování
    return true;
  }
  
  // Oznamujeme, že jsme zprávu obdrželi, ale nemůžeme ji zpracovat
  sendResponse({status: 'unknown_action'});
  return true;
});
# Instalační příručka pro SEO Analýza Schema

Tento dokument obsahuje podrobné pokyny pro instalaci rozšíření SEO Analýza Schema do vašeho prohlížeče.

## Instalace z Chrome Web Store (brzy)

*Bude k dispozici v budoucnu*

## Manuální instalace pro vývojáře a testery

### Předpoklady

- Google Chrome nebo jiný Chromium prohlížeč (Edge, Brave, atd.)
- Oprávnění k instalaci nepodepsaných rozšíření

### Krok 1: Získání kódu

Existují dvě možnosti, jak získat kód rozšíření:

#### Možnost A: Stažení ZIP archivu

1. Navštivte repozitář na GitHubu: https://github.com/kajtacka1/seo-analyzer-schema
2. Klikněte na zelené tlačítko "Code"
3. Vyberte "Download ZIP"
4. Rozbalte stažený ZIP soubor do libovolné složky

#### Možnost B: Klonování repozitáře

Pokud máte nainstalovaný Git, můžete repozitář naklonovat:

```bash
git clone https://github.com/kajtacka1/seo-analyzer-schema.git
cd seo-analyzer-schema
```

### Krok 2: Instalace do Chrome

1. Otevřete prohlížeč Chrome
2. Do adresního řádku zadejte: `chrome://extensions/`
3. Zapněte "Režim pro vývojáře" v pravém horním rohu
4. Klikněte na tlačítko "Načíst rozbalené"
5. Vyberte složku se zdrojovým kódem rozšíření (rozbalený ZIP nebo naklonovaný repozitář)

### Krok 3: Ověření instalace

1. V pravém horním rohu prohlížeče by se měla objevit ikona rozšíření SEO Analýza Schema
2. Klikněte na ikonu pro otevření rozšíření
3. Mělo by se zobrazit rozhraní s několika záložkami (Nadpisy, Meta info, Klíčová slova, Strukturovaná data)

### Krok 4: Aktualizace rozšíření

Pro aktualizaci manuálně nainstalovaného rozšíření:

1. Stáhněte a rozbalte novou verzi kódu z GitHubu
2. Přejděte na `chrome://extensions/`
3. Najděte SEO Analýza Schema a klikněte na ikonu "Aktualizovat" (kruhová šipka)
4. Alternativně můžete rozšíření nejprve odebrat a poté znovu nainstalovat

## Řešení potíží

### Rozšíření není viditelné

- Ujistěte se, že jste povolili Režim pro vývojáře
- Zkontrolujte, zda jste vybrali správnou složku s rozbalen��mi soubory
- Restartujte prohlížeč a zkuste znovu

### Rozšíření nefunguje správně

- Zkontrolujte konzoli vývojářských nástrojů (F12) pro případné chybové zprávy
- Ujistěte se, že používáte nejnovější verzi prohlížeče
- Zkuste rozšíření odinstalovat a znovu nainstalovat

### Rozšíření nefunguje na některých stránkách

- Rozšíření nemůže fungovat na stránkách jako chrome:// nebo edge://
- Některé webové stránky mohou omezovat spouštění skriptů třetích stran
- Ujistěte se, že má rozšíření oprávnění pro přístup ke stránce
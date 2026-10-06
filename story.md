# Vyhledávání příspěvků

## User story

Jako přihlášený uživatel, který smí vidět příspěvky ve feedu,
chci zadat hledaný text a zobrazit pouze odpovídající příspěvky,
abych našel příspěvek, který jsem viděl dříve.

## Acceptance criteria

- [ ] Nad feedem, v řádku s nadpisem „Latest quacks“, je ikona lupy.
- [ ] Po kliknutí na lupu se přímo nad feedem plynule rozbalí vyhledávací pole s viditelným popiskem „Search quacks“, kurzor je rovnou v něm a lupa se změní v křížek.
- [ ] Před zadáním dotazu se nezobrazují žádné příspěvky, jen věta „Matching quacks will show up here as you type.“
- [ ] Vyhledávání probíhá průběžně při psaní bez nutnosti potvrzení klávesou Enter.
- [ ] Jeden dotaz hledá současně v textu příspěvku i v autorovi.
- [ ] Vyhledávání autora prochází jeho zobrazované jméno i uživatelské jméno.
- [ ] Shoda nerozlišuje velká a malá písmena.
- [ ] Shoda ignoruje diakritiku.
- [ ] Shoda může být pouze částí slova.
- [ ] Výsledky obsahují jen příspěvky, které uživatel smí vidět.
- [ ] Výsledky jsou vyhledané v celém feedu, ne pouze v právě načtené dávce.
- [ ] Pokud dotazu neodpovídá žádný příspěvek, zobrazí se věta „No quacks match “<dotaz>”.“
- [ ] Nenápadné tlačítko `Clear` vpravo ve vyhledávacím poli se objeví až po napsání prvního znaku; vymaže dotaz, ponechá vyhledávání otevřené a vrátí kurzor do pole.
- [ ] Feed se načítá po dávkách při scrollování na konec stránky.
- [ ] Pokud počet výsledků vyhledávání přesáhne jednu dávku, další výsledky se načtou při scrollování na konec.
- [ ] Při načítání další dávky se zobrazí indikátor načítání, aby byl stav zřejmý i při pomalém připojení.
- [ ] Vyhledávání používá krátké technické zpoždění po posledním stisku klávesy, aby se při psaní neposílal požadavek pro každý znak.
- [ ] Dokud se čeká na výsledky, točí se v poli místo lupy indikátor; při upřesňování dotazu zůstávají předchozí výsledky viditelné (ztlumené), dokud nedorazí nové.
- [ ] V případě chyby načítání se zobrazí srozumitelná chyba a možnost načtení zopakovat.
- [ ] Kliknutí mimo vyhledávací plochu (řádek s lupou, pole a výsledky) vyhledávání zavře a zobrazí běžný feed; kliknutí na výsledek ho nezavře.
- [ ] Klávesa Esc nebo kliknutí na křížek vyhledávání zavře a zobrazí běžný feed.
- [ ] Po zavření a opětovném otevření je vyhledávací pole prázdné.
- [ ] Se zapnutým systémovým nastavením „omezit pohyb“ se pole zobrazí a skryje bez animace.

## Mimo scope

- Řazení nebo filtrování podle jiných vlastností než textu a autora.
- Pokročilé operátory, našeptávání a zvýrazňování nalezeného textu.
- Samostatná stránka s výsledky vyhledávání.
- Hledání v příspěvcích, ke kterým uživatel nemá přístup.
- Přesná velikost načítané dávky; zvolí se podle výkonu a běžné velikosti obrazovky.
- Uložení dotazu do URL (sdílení hledání, zachování po obnovení stránky).
- Klávesová zkratka pro otevření hledání a zobrazení počtu výsledků.

## Rozhodnutí UX a implementace

- Autor se hledá podle zobrazovaného jména i uživatelského jména.
- Feed i výsledky používají stránkování s přiměřenou dávkou; konkrétní počet je technické rozhodnutí.
- Další výsledky se při hledání načítají stejně jako další položky běžného feedu.
- `Clear` vymaže dotaz a ponechá vyhledávací pole aktivní. Hledání zavře kliknutí mimo vyhledávací plochu, Esc nebo křížek.
- Vyhledávací plocha je řádek s lupou, pole i výsledky — kliknutí na nalezený příspěvek tedy hledání nezavře.
- Lupa i pole jsou přímo nad feedem (ne u nadpisu stránky), aby dotaz a výsledky byly vedle sebe a formulář pro nový příspěvek mezi nimi nepřekážel.
- Texty v rozhraní jsou anglicky jako zbytek aplikace. Prázdný stav výsledků zní: „No quacks match “<dotaz>”.“
- Vyhledávání reaguje průběžně s krátkým debounce zpožděním (250 ms).
- Animace jsou krátké (do 200 ms) a respektují systémové nastavení „omezit pohyb“.

## Mimořádné stavy

- Při otevření hledání bez dotazu se nezobrazují žádné výsledky, jen věta „Matching quacks will show up here as you type.“
- Při dotazu bez shody se zobrazí „No quacks match “<dotaz>”.“
- Při načítání se zobrazí indikátor načítání.
- Při chybě se zobrazí chyba a možnost načíst výsledky znovu.

## Definition of done

- Story je ověřitelná v prohlížeči podle acceptance criteria.
- Funkce respektuje stejná přístupová práva jako běžný feed.
- Při review ve třech krocích nejsou nalezeny nevyřešené červené vlajky.
- Pokud implementace přinese opakované review pravidlo, doplní se do `CLAUDE.md`; jinak se žádné nové pravidlo nepřidává.

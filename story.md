# Vyhledávání příspěvků

## User story

Jako přihlášený uživatel, který smí vidět příspěvky ve feedu,
chci zadat hledaný text a zobrazit pouze odpovídající příspěvky,
abych našel příspěvek, který jsem viděl dříve.

## Acceptance criteria

- [ ] Nad feedem je ikona lupy.
- [ ] Po kliknutí na lupu se zobrazí vyhledávací pole; před zadáním dotazu se nezobrazují žádné příspěvky.
- [ ] Vyhledávání probíhá průběžně při psaní bez nutnosti potvrzení klávesou Enter.
- [ ] Jeden dotaz hledá současně v textu příspěvku i v autorovi.
- [ ] Vyhledávání autora prochází jeho zobrazované jméno i uživatelské jméno.
- [ ] Shoda nerozlišuje velká a malá písmena.
- [ ] Shoda ignoruje diakritiku.
- [ ] Shoda může být pouze částí slova.
- [ ] Výsledky obsahují jen příspěvky, které uživatel smí vidět.
- [ ] Výsledky jsou vyhledané v celém feedu, ne pouze v právě načtené dávce.
- [ ] Pokud dotazu neodpovídá žádný příspěvek, zobrazí se jasné sdělení, že nebyly nalezeny žádné výsledky.
- [ ] Nenápadné tlačítko `Clear` vpravo ve vyhledávacím poli vymaže dotaz, ale ponechá vyhledávání otevřené.
- [ ] Feed se načítá po dávkách při scrollování na konec stránky.
- [ ] Pokud počet výsledků vyhledávání přesáhne jednu dávku, další výsledky se načtou při scrollování na konec.
- [ ] Při načítání další dávky se zobrazí indikátor načítání, aby byl stav zřejmý i při pomalém připojení.
- [ ] Vyhledávání používá krátké technické zpoždění po posledním stisku klávesy, aby se při psaní neposílal požadavek pro každý znak.
- [ ] V případě chyby načítání se zobrazí srozumitelná chyba a možnost načtení zopakovat.
- [ ] Kliknutí mimo vyhledávací plochu vyhledávání zavře a zobrazí běžný feed.

## Mimo scope

- Řazení nebo filtrování podle jiných vlastností než textu a autora.
- Pokročilé operátory, našeptávání a zvýrazňování nalezeného textu.
- Samostatná stránka s výsledky vyhledávání.
- Hledání v příspěvcích, ke kterým uživatel nemá přístup.
- Přesná velikost načítané dávky; zvolí se podle výkonu a běžné velikosti obrazovky.

## Rozhodnutí UX a implementace

- Autor se hledá podle zobrazovaného jména i uživatelského jména.
- Feed i výsledky používají stránkování s přiměřenou dávkou; konkrétní počet je technické rozhodnutí.
- Další výsledky se při hledání načítají stejně jako další položky běžného feedu.
- `Clear` vymaže dotaz a ponechá vyhledávací pole aktivní. Kliknutí mimo pole hledání zavře.
- Prázdný stav výsledků zní: „Žádné příspěvky neodpovídají hledání.“
- Vyhledávání reaguje průběžně s krátkým debounce zpožděním.

## Mimořádné stavy

- Při otevření hledání bez dotazu se nezobrazují žádné výsledky.
- Při dotazu bez shody se zobrazí „Žádné příspěvky neodpovídají hledání.“
- Při načítání se zobrazí indikátor načítání.
- Při chybě se zobrazí chyba a možnost načíst výsledky znovu.

## Definition of done

- Story je ověřitelná v prohlížeči podle acceptance criteria.
- Funkce respektuje stejná přístupová práva jako běžný feed.
- Při review ve třech krocích nejsou nalezeny nevyřešené červené vlajky.
- Pokud implementace přinese opakované review pravidlo, doplní se do `AGENTS.md`; jinak se žádné nové pravidlo nepřidává.

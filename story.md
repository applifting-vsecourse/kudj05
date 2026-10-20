# Mazání příspěvků a filtr „Moje“

## User story

Jako autor příspěvků
chci smazat své příspěvky a vidět ve feedu jen ty svoje,
abych mohl uklidit, co jsem napsal.

## Acceptance criteria

### Mazání

- [ ] U každého mého příspěvku je tlačítko „Delete“ (ikona koše s textem). U cizích příspěvků není.
- [ ] Po kliknutí na „Delete“ se aplikace zeptá: dialog „Delete this quack?“ s tlačítky „Cancel“ a „Delete“. Dokud nepotvrdím, nic se nesmaže.
- [ ] „Cancel“ (i Escape) dialog zavře a příspěvek zůstane.
- [ ] Po potvrzení příspěvek zmizí z feedu, z „Mine“ i z výsledků vyhledávání, a to bez reloadu stránky. U příspěvku s anketou zmizí i anketa a její hlasy.
- [ ] Smazaný příspěvek je pryč i po reloadu a vidí ho tak i ostatní účty.
- [ ] Když se smazání nepodaří (např. bez připojení), příspěvek zůstane a objeví se hláška „Couldn't delete the quack. Try again.“
- [ ] Cizí příspěvek nesmaže nikdo, ani přímým voláním API: `DELETE /api/quacks/:id` na cizí příspěvek vrátí 403 a nic se nesmaže.
- [ ] Nepřihlášený dostane na `DELETE /api/quacks/:id` 401; neexistující příspěvek vrátí 404.

### Filtr

- [ ] Nad feedem jsou dvě záložky: „All“ (výchozí) a „Mine“. Jdou ovládat klávesnicí (šipky, Tab) a mají viditelný focus.
- [ ] „Mine“ ukazuje jen moje příspěvky; „All“ všechny jako dosud.
- [ ] Filtr se řídí přihlášením, ne parametrem: v URL ani v těle požadavku není žádné `userId`, jen `mine=true`.
- [ ] Vyhledávání funguje v obou záložkách: v „Mine“ hledá jen mezi mými příspěvky.
- [ ] Když nemám žádný příspěvek, „Mine“ napíše „You haven't posted any quacks yet.“ a nabídne tlačítko „Write your first quack“, které přesune kurzor do formuláře „New quack“.
- [ ] Nepřihlášený se k feedu nedostane, stejně jako dnes.

## Mimo scope

- Úprava příspěvku, hromadné mazání, vrácení smazaného (koš, „Undo“).
- Mazání cizích příspěvků moderátorem nebo adminem.
- Filtr podle jiného autora, počet příspěvků na záložce.
- Zapamatování zvolené záložky po reloadu.

## Rozhodnutí UX a implementace

- Mazání je nevratné, proto se ptáme `AlertDialog` z UI kitu (ne `Dialog`): vyžaduje rozhodnutí, nezavře se kliknutím mimo. Tlačítko „Delete“ v dialogu je `destructive`.
- Pravidlo „smazat smí jen autor“ platí na serveru: autor se bere ze session a je součástí samotného `DELETE ... WHERE id AND userId`, takže se nedá předběhnout ani souběhem. Tlačítko v UI je jen pohodlí.
- Smazání příspěvku smaže v databázi i jeho odpovědi ankety a hlasy (`ON DELETE CASCADE`), nic se nemigruje ani nepočítá ručně.
- Filtr „Mine“ je `GET /api/quacks?mine=true`; kdo jsem, určuje session.
- Texty v rozhraní jsou anglicky, ikony z lucide s textovým popiskem, žádné emoji.

## Mimořádné stavy

- Žádný můj příspěvek: „Mine“ má vlastní prázdný stav s nabídkou napsat první.
- Smazal jsem svůj poslední příspěvek v „Mine“: zobrazí se tentýž prázdný stav.
- Příspěvek mezitím smazal jiný z mých oken: smazání v druhém okně vrátí 404, hláška o neúspěchu a feed se po refetchi srovná.
- Načítání a chyba načtení: stávající stavy feedu, platí i pro „Mine“.

## Definition of done

- Dva účty v produkci (normální a anonymní okno): autor vidí „Delete“, aplikace se zeptá, příspěvek zmizí; druhý účet „Delete“ u cizího příspěvku nevidí.
- Přes Swagger: `DELETE` cizího příspěvku vrátí 403, po odhlášení 401.
- „Mine“ ukazuje jen moje a v požadavku není `userId`.
- Každou změnu umím vysvětlit.
- Nové pravidlo v `CLAUDE.md`, nebo důvod, proč se není co naučit.

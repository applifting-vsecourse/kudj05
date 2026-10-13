# Ankety v příspěvcích

## User story

Jako přihlášený uživatel, který se chce na něco zeptat ostatních,
chci k příspěvku přidat několik odpovědí, ze kterých si každý jednu vybere,
abych hned viděl, kolik lidí co zvolilo, a nikdo nemusel počítat odpovědi ručně.

## Acceptance criteria

### Založení ankety

- [ ] Ve formuláři „New quack“ je tlačítko „Add poll“ s ikonou. Po kliknutí se pod textem příspěvku objeví dvě pole s viditelnými popisky „Option 1“ a „Option 2“ a kurzor je v prvním z nich.
- [ ] Tlačítko „Add option“ přidá další pole, nejvýš do čtyř; při čtyřech polích tlačítko zmizí.
- [ ] Třetí a čtvrté pole lze odebrat tlačítkem s ikonou (`aria-label` „Remove option 3“); pod dvě pole se jít nedá.
- [ ] Tlačítko „Remove poll“ pole skryje a příspěvek se odešle jako obyčejný quack bez ankety.
- [ ] Prázdné pole odpovědi při odeslání zobrazí pod polem „Fill in this option“ a nic se neodešle.
- [ ] Odpověď delší než 80 znaků zobrazí pod polem „Keep it under 80 characters“.
- [ ] Dvě stejné odpovědi (bez ohledu na velikost písmen a mezery na okrajích) zobrazí pod druhou z nich „Options have to differ“.
- [ ] Text příspěvku je i u ankety povinný (je to otázka) a platí pro něj stávající pravidla. Náladu lze k anketě přidat jako dosud.
- [ ] Během odesílání je tlačítko „Quack“ neaktivní a ukazuje indikátor; po úspěchu se formulář vrátí do výchozího stavu bez polí ankety.
- [ ] Odeslaný příspěvek se objeví ve feedu s anketou: odpovědi jsou ve stejném pořadí, jak byly zadány, u každé je 0 a pod nimi „No votes yet“.

### Zobrazení ankety

- [ ] Anketa se zobrazuje pod textem příspěvku v běžném feedu i ve výsledcích vyhledávání.
- [ ] U každé odpovědi je její text, počet hlasů a nenápadný pruh, jehož šířka odpovídá podílu hlasů.
- [ ] Počty jsou vidět vždy, i když jsem ještě nehlasoval.
- [ ] Pod odpověďmi je součet: „No votes yet“, „1 vote“ nebo „N votes“. Součet se vždy rovná součtu čísel u odpovědí.
- [ ] Odpověď, kterou jsem zvolil, je označena ikonou a textem „Your vote“; po reloadu označení zůstane.
- [ ] Příspěvek bez ankety vypadá stejně jako dosud.

### Hlasování

- [ ] Kliknutí na odpověď ji označí jako mou a zvýší její počet i součet o 1 okamžitě, bez čekání na server.
- [ ] Kliknutí na jinou odpověď hlas přesune: původní odpověď má o 1 méně, nová o 1 více, součet se nemění.
- [ ] Kliknutí na mou zvolenou odpověď hlas zruší: počet i součet klesnou o 1 a označení zmizí.
- [ ] Hlasovat může i autor ankety.
- [ ] Jeden účet má v anketě nejvýš jeden hlas, i když kliká rychle za sebou nebo hlasuje ze dvou záložek současně; po reloadu je započítán jen poslední výběr.
- [ ] Druhý účet po reloadu vidí hlas prvního účtu započtený; po změně hlasu vidí po reloadu změněné počty.
- [ ] Počty se obnoví i bez reloadu při návratu na záložku prohlížeče.
- [ ] Když se hlas nepodaří uložit (např. bez připojení), počty i označení se vrátí do stavu před kliknutím a přímo pod anketou se zobrazí „Your vote wasn’t saved. Try again.“ Hláška zmizí při dalším pokusu o hlas.
- [ ] Odpovědi jdou ovládat klávesnicí (Tab, Enter/mezerník) a mají viditelný focus.

## Mimo scope

- Živé aktualizace cizích hlasů bez akce uživatele (websocket, pravidelné dotazování).
- Seznam, kdo jak hlasoval; ankety jsou anonymní, vidím jen součty a svůj hlas.
- Výběr více odpovědí najednou.
- Uzavření ankety, časový limit, úprava nebo smazání ankety po odeslání.
- Procenta u odpovědí.
- Hledání v textech odpovědí (vyhledávání dál prochází text příspěvku a autora).
- Samostatná stránka nebo přehled anket, notifikace o hlasech.
- Měření, jak moc se ankety používají (zjistí se pohledem do feedu / databáze).

## Rozhodnutí UX a implementace

- Anketa je součást quacku: text quacku je otázka, quack má nejvýš jednu anketu.
- 2 až 4 odpovědi, každá 1–80 znaků po oříznutí mezer, bez duplicit.
- Počty jsou viditelné vždy. Zobrazuje se počet a pruh, ne procenta — zaokrouhlená procenta nedávají vždy 100 %.
- Počty se nikde neukládají jako číslo; vždy se počítají z uložených hlasů, takže se nemohou rozejít se skutečností.
- Pravidlo „jeden člověk, jeden hlas“ vynucuje databáze, ne jen aplikace.
- Hlas je optimistický: UI se změní hned, po odpovědi serveru se přepíše tím, co vrátil server, a feed se znovu načte.
- Dokud se hlas ukládá, další klik v téže anketě se nepřijímá (odpovědi jsou krátce neaktivní), aby se požadavky nepředbíhaly.
- Chyba hlasu je text přímo u ankety, ne toast — je u věci, které se týká, a nezmizí sama.
- Texty v rozhraní jsou anglicky, ikony z lucide s textovým popiskem, žádné emoji.
- Odpovědi jsou `ToggleGroup` z UI kitu (typ `single`, který umí i odznačení), ne ručně psané tlačítko.

## Mimořádné stavy

- Anketa bez hlasů: u všech odpovědí 0, pruhy prázdné, „No votes yet“.
- Feed bez jediné ankety: nic se nemění, žádný zvláštní prázdný stav.
- Načítání a chyba načtení feedu: stávající stavy feedu, anketa nemá vlastní.
- Neuložený hlas: návrat do původního stavu a hláška pod anketou.
- Hlas pro odpověď, která do ankety nepatří, nebo pro quack bez ankety (jen přímým voláním API): server odmítne, nic se neuloží.

## Definition of done

- Dva účty v produkci: jeden se zeptá, druhý hlasuje, první po reloadu hlas vidí.
- Změna hlasu změní počty pro všechny.
- Formuláře projdou kontrolou podle `DESIGN.md` (sekce Forms), žádné červené vlajky.
- Každou změnu umím vysvětlit.
- Nové pravidlo v `CLAUDE.md`, nebo důvod, proč se není co naučit.
- Nastavení i ankety jsou v `main`, nasazené a oznámené v Seminars.

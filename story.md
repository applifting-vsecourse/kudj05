# Moderace: admin smaže cizí příspěvek

## User story

Jako admin Quackeru
chci smazat jakýkoli příspěvek, i cizí,
abych mohl odstranit nevhodné quacky, když je jejich autor smazat nechce.

Admin je účet s rolí `admin` (ze seedu `admin@example.com` / `adminpassword`). Nově přibývá role `moderator`, která smí mazat stejně jako admin, ale nic víc.

## Acceptance criteria

### Mazání adminem a moderátorem

- [ ] Přihlášený admin vidí tlačítko „Delete“ u každého příspěvku ve feedu, v „Mine“ i ve výsledcích vyhledávání.
- [ ] Moderátor (ze seedu `pondadmin@example.com` / `password5`) vidí „Delete“ u každého příspěvku stejně jako admin.
- [ ] U cizího příspěvku se dialog ptá jménem autora: „Delete @CaffeinatedDuck's quack?“ s tlačítky „Cancel“ a „Delete“. U vlastního příspěvku zůstává „Delete this quack?“.
- [ ] Po potvrzení cizí příspěvek zmizí bez reloadu a je pryč i po reloadu pro všechny účty, včetně ankety a hlasů.
- [ ] Admin i moderátor smažou cizí příspěvek i přímo přes API (Swagger): `DELETE /api/quacks/:id` vrátí 204.

### Ostatní se nic nemění

- [ ] Běžný uživatel (např. `deepduckthoughts@example.com`) vidí „Delete“ jen u svých příspěvků.
- [ ] Běžný uživatel dostane na `DELETE /api/quacks/:id` cizího příspěvku 403 a nic se nesmaže, i přes Swagger.
- [ ] Nepřihlášený dostane 401, neexistující příspěvek vrátí 404 (i adminovi).
- [ ] Autor své příspěvky maže dál jako dosud.

### Statistiky (jen admin)

- [ ] V uživatelském menu admina je odkaz „Stats“ (ikona s textem), který vede na stránku `/stats`. Běžný uživatel ani moderátor odkaz nevidí.
- [ ] Stránka „Stats“ ukazuje čtyři čísla: „Users“, „Quacks“, „Polls“, „Votes“. Když v databázi nic není, ukazuje nuly.
- [ ] `GET /api/stats` vrátí adminovi 200, běžnému uživateli a moderátorovi 403, nepřihlášenému 401.
- [ ] Kdo není admin a otevře `/stats` přímo, uvidí „You don't have access to this page.“ místo čísel.

## Mimo scope

- Upozornění autora, důvod smazání, záznam o tom, kdo co smazal (audit log), obnovení smazaného.
- Úprava cizích příspěvků, blokování nebo mazání uživatelů.
- Přidělování rolí v aplikaci: role se nastaví v seedu nebo v Prisma Studiu.
- Další statistiky (nejaktivnější autoři, grafy, časové řady).

## Rozhodnutí UX a implementace

- Kdo smí mazat, rozhoduje server ze session: `isOwner || isAdmin || isModerator`, jinak `ForbiddenException`. Role se bere z `@User()`, nikdy z URL ani z těla požadavku. Tlačítko v UI je jen pohodlí.
- Mazání autorem zůstává `DELETE ... WHERE id AND userId`. Admin a moderátor mažou podle `id`, smazání neexistujícího řádku je 404.
- Role `moderator` je nová hodnota enumu `UserRole` v `schema.prisma` s migrací.
- Statistiky jsou `GET /api/stats` chráněné `@Roles('admin')` a `RolesGuard`. Čísla se počítají z řádků (`count`), nic se neukládá.
- Odkaz „Stats“ je skrytý podle `user.role === "admin"`; skutečnou ochranou je 403 z API.
- Texty v rozhraní jsou anglicky, ikony z lucide s textovým popiskem, žádné emoji.
- Testy: unit test služby (cizí uživatel dostane `ForbiddenException`, admin a moderátor projdou) a E2E test (admin smaže cizí příspěvek, běžný uživatel dostane 403).

## Mimořádné stavy

- Admin maže příspěvek, který mezitím smazal autor: 404, hláška „Couldn't delete the quack. Try again.“ a feed se po refetchi srovná.
- Prázdná databáze: stránka „Stats“ ukazuje nuly.
- Statistiky se nepodaří načíst: „Couldn't load stats.“

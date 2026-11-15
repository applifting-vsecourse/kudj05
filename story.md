# Odpovědi na quacky

## Požadavek

> "People discuss under quacks by posting a new quack that starts with '@name …', and nobody can tell what anyone is replying to. I want people to reply to a quack and see the replies under it. Replies belong to the people who wrote them: if an author deletes a quack that already has replies, the replies must not disappear with it. At the same time, when someone deletes their quack, its content has to really disappear from the app."

## User story

Jako přihlášený uživatel Quackeru
chci odpovědět přímo na konkrétní quack a vidět odpovědi pod ním,
aby bylo jasné, kdo na co reaguje, a nemusel jsem psát nový quack začínající „@jméno“.

Jako autor
chci svůj quack smazat tak, aby jeho text z aplikace opravdu zmizel,
a přitom nesmazat odpovědi, které pod ním napsali jiní.

## Acceptance criteria

### Odpovídání

- [ ] Každý quack ve feedu má pod textem tlačítko „Reply“; když už má odpovědi, ukazuje počet: „1 reply“ / „3 replies“.
- [ ] Kliknutí rozbalí pod quackem vlákno: odpovědi od nejstarší po nejnovější a pod nimi formulář s polem „Your reply“ (placeholder „Quack back...“) a tlačítkem „Reply“.
- [ ] Odpověď má 1–280 znaků, stejně jako quack. Prázdná nebo delší odpověď ukáže chybu pod polem („Write something first“ / „Keep it under 280 characters“) a nic se neodešle; server totéž ověřuje znovu (400).
- [ ] Po odeslání se odpověď objeví ve vlákně a počet u quacku se zvýší bez reloadu; formulář se vyprázdní, tlačítko je během odesílání neaktivní.
- [ ] Autor odpovědi se bere ze session, nikdy z těla požadavku.
- [ ] Odpověď sama ve feedu jako samostatný quack není, je jen ve vlákně pod rodičem. Na odpověď se odpovídat nedá (jedna úroveň): API vrátí 400.
- [ ] Vlákno má všechny tři stavy: načítání, prázdné („No replies yet. Be the first to reply.“) a chybu s „Try again“.

### Mazání

- [ ] Smazání quacku (autor, admin, moderátor — pravidla z týdne 5 se nemění) z něj udělá „náhrobek“: text, nálada, anketa i hlasy jsou pryč z databáze, řádek zůstává jen proto, aby odpovědi měly pod čím viset.
- [ ] Smazaný quack s odpověďmi zůstane ve feedu na svém místě jako „This quack was deleted.“ — bez textu, autora, data, nálady i ankety, bez tlačítka „Delete“ a bez formuláře na odpověď. Odpovědi pod ním zůstávají a jdou rozbalit.
- [ ] Smazaný quack bez odpovědí z feedu úplně zmizí. Když později zmizí i jeho poslední odpověď, zmizí i náhrobek.
- [ ] Odpověď jde smazat stejně jako quack („Delete“ u odpovědi, stejná oprávnění); zmizí z vlákna a počet se sníží.
- [ ] Text smazaného quacku nebo odpovědi se nenajde nikde: ve feedu, v „Mine“, ve vlákně ani ve vyhledávání (ani podle jména autora).
- [ ] `DELETE /api/quacks/:id` na už smazaný quack vrací 404, odpověď na smazaný quack (`POST /api/quacks/:id/replies`) taky 404, hlasování v anketě smazaného quacku 404.
- [ ] Statistiky adminovi nepočítají smazané quacky.

## Mimo scope

- Odpovědi na odpovědi (vnořená vlákna), zmínky `@jméno` s odkazem, notifikace.
- Úprava odpovědi, anketa nebo nálada v odpovědi.
- Hledání v textu odpovědí — vyhledávání dál prochází jen quacky ve feedu.
- Stránkování vlákna (odpovědí bude pod jedním quackem desítky, ne tisíce).
- Obnovení smazaného obsahu a audit log.

## Rozhodnutí

### 1. Odpověď je quack s rodičem (`Quack.parentId`), ne samostatná tabulka

- **Zvoleno:** sloupec `parentId` na tabulce `quack` (vztah na sebe sama). Odpověď je quack: má autora, text, datum, dá se smazat stejnou cestou a se stejnými oprávněními.
- **Zamítnuto — tabulka `reply`:** duplikovala by autora, text, mazání, oprávnění i náhrobky. Každé pravidlo pro quacky (mazání, moderace, vyhledávání) by se psalo dvakrát.
- **Zamítnuto — jen text „@jméno“ s odkazem bez vazby:** to je dnešní stav, který product owner nechce; nedá se z něj spolehlivě načíst „všechny odpovědi na tenhle quack“.

### 2. Smazání = náhrobek: obsah se vymaže, řádek zůstane (viz [ADR 0001](docs/adr/0001-delete-content-keep-row.md))

- **Zvoleno:** `DELETE` nastaví `deletedAt`, vymaže `text` a `mood` a smaže možnosti ankety (hlasy jdou s nimi kaskádou) — jedním příkazem v transakci. Platí pro každý quack i odpověď, ať má odpovědi nebo ne.
- **Zamítnuto — skutečný `DELETE` s kaskádou na odpovědi:** odpovědi by zmizely s rodičem, požadavek to výslovně zakazuje.
- **Zamítnuto — skutečný `DELETE` a `parentId` na `NULL`:** odpovědi zůstanou, ale ztratí kontext — z „odpovědi“ se stane samostatný quack ve feedu, který nedává smysl.
- **Zamítnuto — soft delete jen s `deletedAt` a ponechaným textem:** text by zůstal v databázi a stačil by jeden zapomenutý `where`, aby se objevil ve vyhledávání. Požadavek chce, aby obsah opravdu zmizel.
- **Zamítnuto — skutečný `DELETE`, když quack nemá odpovědi, jinak náhrobek:** dvě cesty kódu pro jednu akci a závod s odpovědí, která dorazí mezi kontrolou a smazáním.

### 3. Databáze nedovolí smazat rodiče odpovědí

- `parentId` má `ON DELETE RESTRICT`. Když se někdy objeví kód, který quack s odpověďmi skutečně smaže, databáze ho odmítne místo tichého smazání odpovědí.
- Kontrolní omezení `quack_deleted_has_no_text` (`deletedAt IS NULL OR text = ''`) hlídá, že smazaný quack nikdy nemá text.
- **Zamítnuto — `ON DELETE SET NULL` / `CASCADE`:** viz rozhodnutí 2.

### 4. Počet odpovědí se počítá z řádků

- `replyCount` je `COUNT` nesmazaných odpovědí v každém dotazu na feed, nikam se neukládá (konvence z `CLAUDE.md`). Index `(parentId, createdAt)` drží počítání i načtení vlákna levné.
- **Zamítnuto — sloupec `replyCount` na quacku:** musel by se udržovat při každé odpovědi i smazání a dva souběžné požadavky by ho rozhodily.

### 5. Jedna úroveň odpovědí

- Odpovídat jde jen na quack, který sám není odpovědí; hlídá to služba (400). Datový model (`parentId`) vnořená vlákna později unese bez migrace.
- **Zamítnuto — libovolná hloubka hned teď:** UI pro stromy a rekurzivní dotazy jsou práce navíc pro něco, co product owner nechtěl.

### 6. Kam to v kódu přistane

- Backend: modul `quack` — `QuackRepository` (feed bez odpovědí, `replyCount`, vlákno, náhrobek), `QuacksService` (`getReplies`, `createReply`, mazání), `QuacksController` (`GET`/`POST /api/quacks/:id/replies`). Modul `stats` počítá jen nesmazané quacky.
- Frontend: `features/quack` — schéma (`isDeleted`, `replyCount`, `user` může být `null`), `QuackItem` (náhrobek, tlačítko „Reply“), nové `QuackReplies` + `ReplyForm`, `useDeleteQuack` (náhrobek místo odebrání, vlákna).
- API pro smazaný quack vrací `isDeleted: true`, `text: ""`, `mood`, `poll`, `user` i `userId` jako `null` — kdo ho napsal, je taky obsah.

## Kontrola modelu

1. **Dá se všechno přečíst jednoduchými dotazy?**
   - Feed: `quack WHERE parentId IS NULL AND (deletedAt IS NULL OR EXISTS nesmazaná odpověď) ORDER BY createdAt DESC` + `COUNT` nesmazaných odpovědí.
   - Mine / vyhledávání: totéž s `deletedAt IS NULL`.
   - Vlákno: `quack WHERE parentId = :id AND deletedAt IS NULL ORDER BY createdAt ASC`.
   - Odpověď: `INSERT quack (parentId, userId, text)` po kontrole, že rodič existuje, není smazaný a není odpovědí.
2. **Je něco uložené dvakrát?** Ne. Počet odpovědí se počítá, autor je jen `userId`.
3. **Co se stane při smazání quacku?** Řádek zůstane jako náhrobek bez textu a nálady, možnosti ankety a hlasy se smažou (kaskáda), odpovědi zůstanou beze změny. Skutečný `DELETE` rodiče odpovědí databáze odmítne (`RESTRICT`). Smazání uživatele dál maže jeho quacky kaskádou — pokud na ně někdo odpověděl, `RESTRICT` ho zastaví (mazání účtů v aplikaci zatím není).
4. **Projde migrace na produkční databázi s daty?** Ano: dva nové nullable sloupce (`parentId`, `deletedAt`) bez výchozí hodnoty, cizí klíč, index a `CHECK`, který všechny stávající řádky splňují (`deletedAt` je u nich `NULL`). Nic se nepřepisuje.

## Navržené schéma

```prisma
model Quack {
  id        String    @id @default(cuid())
  // Empty once the quack is deleted: the row stays only so its replies keep their parent.
  text      String    @db.Text
  mood      Mood?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @default(now()) @updatedAt
  // Set when the quack is deleted; text, mood and poll are wiped in the same write.
  deletedAt DateTime?

  // A reply points at the quack it answers; null = a quack in the feed.
  // Restrict: a quack with replies is never removed for real, see docs/adr/0001.
  parent   Quack?  @relation("Replies", fields: [parentId], references: [id], onDelete: Restrict)
  parentId String?
  replies  Quack[] @relation("Replies")

  pollOptions PollOption[]

  @@index([userId])
  @@index([parentId, createdAt])
  @@map("quack")
}
```

Migrace navíc přidává `CHECK ("deletedAt" IS NULL OR "text" = '')`.

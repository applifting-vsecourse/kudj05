# Plán: ankety v příspěvcích

Story: [`story.md`](story.md). Větev: `task-4`.

## 1. Datový model

Dvě nové tabulky. Samostatná tabulka `poll` není: anketa nemá žádný vlastní údaj (otázka je text quacku, neuzavírá se), takže „quack má anketu“ znamená „quack má řádky v `poll_option`“.

```
user ──1:N── quack ──1:N── poll_option ──1:N── poll_vote ──N:1── user
                 (0 nebo 2–4 odpovědi)      (max. 1 na dvojici quack + user)
```

### `poll_option` — jedna odpověď ankety

| Sloupec    | Typ           | Poznámka                          |
| ---------- | ------------- | --------------------------------- |
| `id`       | text, PK      | cuid                              |
| `quackId`  | text, FK      | → `quack.id`, `ON DELETE CASCADE` |
| `text`     | `varchar(80)` | text odpovědi                     |
| `position` | `smallint`    | pořadí 0–3, jak je autor zadal    |

- `UNIQUE (quackId, position)` — pořadí je jednoznačné a dává i index pro načtení odpovědí quacku.
- `UNIQUE (id, quackId)` — sám o sobě nadbytečný (`id` je PK), existuje jen jako cíl složeného cizího klíče z `poll_vote`.

### `poll_vote` — hlas jednoho člověka v jedné anketě

| Sloupec     | Typ         | Poznámka                         |
| ----------- | ----------- | -------------------------------- |
| `quackId`   | text        | část PK, část složeného FK       |
| `userId`    | text, FK    | → `user.id`, `ON DELETE CASCADE` |
| `optionId`  | text        | část složeného FK                |
| `createdAt` | `timestamp` | default `now()`                  |
| `updatedAt` | `timestamp` | mění se při přesunu hlasu        |

- **`PRIMARY KEY (quackId, userId)`** — tohle je „jeden člověk, jeden hlas“. Druhý řádek pro stejnou dvojici databáze odmítne, ať přijde odkudkoli (dvojklik, dvě záložky, chyba v kódu).
- **`FOREIGN KEY (optionId, quackId) → poll_option (id, quackId)`, `ON DELETE CASCADE`** — hlas může ukazovat jen na odpověď, která patří do téže ankety. Bez složeného klíče by šlo uložit hlas s `quackId` jedné ankety a `optionId` jiné a obejít tím primární klíč.
- `INDEX (optionId)` — pro počítání hlasů u odpovědi.

### Proč takhle

- **Změna hlasu je `UPDATE` jednoho řádku** (upsert podle PK), ne smazání a vložení. Neexistuje okamžik se dvěma nebo žádným hlasem.
- **Počty se neukládají.** Žádný sloupec `voteCount`; počet je `COUNT(*)` nad `poll_vote`. Uložený čítač by se musel při každé změně upravit na dvou místech a při souběhu by se rozešel — přesně chyba, kterou story řeší.
- **Smazání uživatele nebo quacku** po sobě uklidí kaskádou, stejně jako u `quack` dnes.

### Co databáze nevynucuje (hlídá DTO + service)

- Minimum 2 a maximum 4 odpovědi; odpovědi se zakládají s quackem v jedné transakci (nested create), takže quack s jednou odpovědí nevznikne.
- Neprázdný text a zákaz duplicit bez ohledu na velikost písmen.

### Prisma

```prisma
model PollOption {
  id       String     @id @default(cuid())
  quack    Quack      @relation(fields: [quackId], references: [id], onDelete: Cascade)
  quackId  String
  text     String     @db.VarChar(80)
  position Int        @db.SmallInt
  votes    PollVote[]

  @@unique([quackId, position])
  @@unique([id, quackId])
  @@map("poll_option")
}

model PollVote {
  quackId   String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  option    PollOption @relation(fields: [optionId, quackId], references: [id, quackId], onDelete: Cascade)
  optionId  String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @default(now()) @updatedAt

  @@id([quackId, userId])
  @@index([optionId])
  @@map("poll_vote")
}
```

Do `Quack` přibude `pollOptions PollOption[]`, do `User` `pollVotes PollVote[]`.

## 2. Endpointy

Vše pod `/api/quacks`, za `AuthenticatedUserGuard`; uživatel se bere ze session, nikdy z těla požadavku.

Tvar ankety v odpovědích (`poll` je `null` u quacku bez ankety):

```json
{
  "options": [
    { "id": "…", "text": "Pizza", "voteCount": 3 },
    { "id": "…", "text": "Sushi", "voteCount": 1 }
  ],
  "myOptionId": "…"
}
```

Součet se neposílá — klient sečte `voteCount`, takže se nemůže lišit od čísel u odpovědí. `myOptionId` je `null`, když jsem nehlasoval.

| Metoda a cesta                     | Tělo                                            | Odpověď                                                                                   | Změna     |
| ---------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- | --------- |
| `GET /api/quacks`                  | —                                               | 200, stránka quacků, každý má `poll`                                                      | rozšíření |
| `POST /api/quacks`                 | `{ text, mood?, poll?: { options: string[] } }` | 201 quack s `poll`; 400 při neplatných odpovědích                                         | rozšíření |
| `PUT /api/quacks/:quackId/vote`    | `{ optionId }`                                  | 200 aktuální `poll`; 400 odpověď nepatří do ankety; 404 quack neexistuje nebo nemá anketu | nový      |
| `DELETE /api/quacks/:quackId/vote` | —                                               | 200 aktuální `poll`; 404 jako výše                                                        | nový      |

- `PUT` místo `POST`: „můj hlas v této anketě je X“ je idempotentní — opakovaný požadavek nic nepokazí. První hlas i změna hlasu jsou stejné volání.
- `DELETE` je také idempotentní: zrušení neexistujícího hlasu vrátí 200.
- Oba vracejí celou anketu s čerstvými počty ze serveru, takže klient po hlasu zobrazí pravdu i s hlasy ostatních.
- Souběh dvou `PUT` stejného uživatele: upsert může narazit na PK (`P2002`); service ho jednou zopakuje, tentokrát jako update.

## 3. Pořadí stavby

Jeden řez = vygenerovat → review podle checklistu → commit. Každý řez nechává `pnpm check-all` zelený.

1. **Databáze.** `schema.prisma`, migrace, seed (jedna anketa s několika hlasy). Ověření: migrace projde a druhý hlas téhož uživatele i hlas s cizí `optionId` databáze odmítne. Nejdřív, protože všechno ostatní na modelu stojí a později se mění nejdráž.
2. **Backend – čtení.** Doména `Poll`, mapování v repository (počty přes `_count`, můj hlas podle uživatele ze session), `poll` v `QuackResponseDto`, `GET /api/quacks` dostane přihlášeného uživatele. Testy service.
3. **Backend – hlasování.** `PUT` a `DELETE …/vote`, DTO, chyby 400/404, opakování při `P2002`. Testy: první hlas, přesun, zrušení, cizí odpověď, quack bez ankety.
4. **Backend – založení.** `CreateQuackDto.poll` (2–4, 1–80 znaků, bez duplicit), nested create v repository. Testy validace.
5. **Frontend – zobrazení.** zod schéma `poll`, komponenta `QuackPoll` v `QuackItem` (zatím jen čtení): počty, pruh, součet, „Your vote“. Testy komponenty včetně ankety bez hlasů.
6. **Frontend – hlasování.** `useVote`: optimistická úprava cache feedu i vyhledávání, při chybě návrat a hláška u ankety, po dokončení invalidace. Testy: okamžitá změna, přesun, zrušení, chyba.
7. **Frontend – formulář.** „Add poll“ v `QuackForm` (`useFieldArray`), validace pod poli, „Add option“ / „Remove option“ / „Remove poll“. Testy formuláře.
8. **Dokončení.** Projít acceptance criteria v prohlížeči, kontrola formulářů podle `DESIGN.md`, návrh pravidla do `CLAUDE.md` (nebo důvod, proč žádné), PR do `main`, ověření v produkci dvěma účty.

Hlasování (3, 6) je před založením (4, 7): je to nejrizikovější část a díky seedu se dá zkoušet dřív, než existuje formulář.

## 4. Na co se dívat při review

- Počet hlasů se nikde nezapisuje, jen počítá.
- `userId` hlasu pochází jen ze session.
- Optimistická úprava a návrat při chybě mění stejná místa v cache (běžný feed i všechna otevřená hledání).
- Odpovědi ankety jsou `ToggleGroup` z kitu, chybové texty anglicky, žádná natvrdo zapsaná barva ani stín.

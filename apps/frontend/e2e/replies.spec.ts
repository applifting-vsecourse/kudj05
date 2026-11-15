import { expect, test, type Page } from "@playwright/test"

import { API, postQuack, signIn } from "./helpers"

const AUTHOR = { email: "caffeinatedduck@example.com", password: "password1" }
const REPLIER = { email: "deepduckthoughts@example.com", password: "password2" }

async function postReply(page: Page, quackId: string, text: string): Promise<string> {
  const response = await page.request.post(`${API}/quacks/${quackId}/replies`, { data: { text } })
  expect(response.status()).toBe(201)
  return ((await response.json()) as { id: string }).id
}

test("a reply shows up under the quack it answers", async ({ browser }) => {
  const stamp = Date.now()
  const author = await browser.newPage()
  await signIn(author, AUTHOR.email, AUTHOR.password)
  await postQuack(author, `Lunch at the reeds? ${stamp}`)

  const replier = await browser.newPage()
  await signIn(replier, REPLIER.email, REPLIER.password)
  const quack = replier.getByRole("article").filter({ hasText: `Lunch at the reeds? ${stamp}` })
  await quack.getByRole("button", { name: "Reply" }).first().click()
  await quack.getByRole("textbox", { name: "Your reply" }).fill(`Count me in ${stamp}`)
  await quack.getByRole("button", { name: "Reply" }).last().click()

  await expect(quack.getByText(`Count me in ${stamp}`)).toBeVisible()
  await expect(quack.getByRole("button", { name: "1 reply" })).toBeVisible()
  // the reply lives in the thread, not as a quack of its own in the feed
  await replier.reload()
  await expect(replier.getByText(`Count me in ${stamp}`)).toHaveCount(0)
})

test("deleting a quack keeps its replies and wipes its text everywhere", async ({ browser }) => {
  const stamp = Date.now()
  const secret = `Delete me for real ${stamp}`
  const author = await browser.newPage()
  await signIn(author, AUTHOR.email, AUTHOR.password)
  const quackId = await postQuack(author, secret)

  const replier = await browser.newPage()
  await signIn(replier, REPLIER.email, REPLIER.password)
  await postReply(replier, quackId, `My reply stays ${stamp}`)

  await author.reload()
  const quack = author.getByRole("article").filter({ hasText: secret })
  await quack.getByRole("button", { name: "Delete" }).first().click()
  await author.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
  await expect(author.getByText(secret)).toHaveCount(0)

  // feed: a tombstone holds the reply
  await replier.reload()
  const tombstone = replier
    .getByRole("article")
    .filter({ hasText: "This quack was deleted." })
    .filter({ has: replier.getByRole("button", { name: "1 reply" }) })
    .first()
  await expect(tombstone).toBeVisible()
  await expect(replier.getByText(secret)).toHaveCount(0)
  await tombstone.getByRole("button", { name: "1 reply" }).click()
  await expect(replier.getByText(`My reply stays ${stamp}`)).toBeVisible()

  // API: no text in the feed, the thread, or a search
  const feed = await (await replier.request.get(`${API}/quacks?limit=50`)).text()
  expect(feed).not.toContain(secret)
  const search = await (
    await replier.request.get(`${API}/quacks?search=${encodeURIComponent(secret)}`)
  ).json()
  expect(search.items).toHaveLength(0)
  const thread = await (await replier.request.get(`${API}/quacks/${quackId}/replies`)).text()
  expect(thread).not.toContain(secret)
  expect(thread).toContain(`My reply stays ${stamp}`)

  // gone means gone: no second delete and no new replies
  expect((await author.request.delete(`${API}/quacks/${quackId}`)).status()).toBe(404)
  const late = await replier.request.post(`${API}/quacks/${quackId}/replies`, {
    data: { text: "too late" },
  })
  expect(late.status()).toBe(404)
})

test("a reply can't be replied to", async ({ browser }) => {
  const author = await browser.newPage()
  await signIn(author, AUTHOR.email, AUTHOR.password)
  const quackId = await postQuack(author, `Thread ${Date.now()}`)
  const replyId = await postReply(author, quackId, "first")

  const response = await author.request.post(`${API}/quacks/${replyId}/replies`, {
    data: { text: "deeper" },
  })
  expect(response.status()).toBe(400)
})

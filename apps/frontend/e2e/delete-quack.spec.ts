import { expect, test } from "@playwright/test"

import { API, postQuack, signIn } from "./helpers"

const AUTHOR = { email: "caffeinatedduck@example.com", password: "password1" }
const OTHER = { email: "deepduckthoughts@example.com", password: "password2" }
const ADMIN = { email: "admin@example.com", password: "adminpassword" }
const MODERATOR = { email: "pondadmin@example.com", password: "password5" }

test("nobody can delete someone else's quack", async ({ browser }) => {
  const author = await browser.newPage()
  await signIn(author, AUTHOR.email, AUTHOR.password)
  const quackId = await postQuack(author, `Not yours ${Date.now()}`)

  const other = await browser.newPage()
  await signIn(other, OTHER.email, OTHER.password)
  const response = await other.request.delete(`${API}/quacks/${quackId}`)
  expect(response.status()).toBe(403)

  // still there: the author can delete it themselves
  const cleanup = await author.request.delete(`${API}/quacks/${quackId}`)
  expect(cleanup.status()).toBe(204)
})

test("a signed-out visitor gets 401", async ({ browser }) => {
  const author = await browser.newPage()
  await signIn(author, AUTHOR.email, AUTHOR.password)
  const quackId = await postQuack(author, `Signed out ${Date.now()}`)

  const anonymous = await browser.newPage()
  const response = await anonymous.request.delete(`${API}/quacks/${quackId}`)
  expect(response.status()).toBe(401)

  await author.request.delete(`${API}/quacks/${quackId}`)
})

test("admin can delete someone else's quack", async ({ browser }) => {
  const text = `Spam ${Date.now()}`
  const author = await browser.newPage()
  await signIn(author, AUTHOR.email, AUTHOR.password)
  await postQuack(author, text)

  const admin = await browser.newPage()
  await signIn(admin, ADMIN.email, ADMIN.password)
  const quack = admin.getByRole("article").filter({ hasText: text })
  await expect(quack).toBeVisible()

  await quack.getByRole("button", { name: "Delete" }).click()
  const dialog = admin.getByRole("alertdialog")
  await expect(dialog).toContainText("Delete @CaffeinatedDuck's quack?")
  await dialog.getByRole("button", { name: "Delete" }).click()

  await expect(quack).toHaveCount(0)
  await admin.reload()
  await expect(admin.getByRole("article").filter({ hasText: text })).toHaveCount(0)
})

test("a moderator can delete someone else's quack", async ({ browser }) => {
  const author = await browser.newPage()
  await signIn(author, AUTHOR.email, AUTHOR.password)
  const quackId = await postQuack(author, `Spam for the moderator ${Date.now()}`)

  const moderator = await browser.newPage()
  await signIn(moderator, MODERATOR.email, MODERATOR.password)
  const response = await moderator.request.delete(`${API}/quacks/${quackId}`)
  expect(response.status()).toBe(204)
})

test("only the admin gets stats", async ({ browser }) => {
  const admin = await browser.newPage()
  await signIn(admin, ADMIN.email, ADMIN.password)
  expect((await admin.request.get(`${API}/stats`)).status()).toBe(200)

  const moderator = await browser.newPage()
  await signIn(moderator, MODERATOR.email, MODERATOR.password)
  expect((await moderator.request.get(`${API}/stats`)).status()).toBe(403)
})

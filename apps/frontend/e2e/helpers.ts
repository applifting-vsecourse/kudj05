import { expect, type Page } from "@playwright/test"

export const API = process.env.E2E_API_URL ?? "http://localhost:4050/api"

// One page holds one session, so each user signs in on a page of their own.
export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await expect(page).toHaveURL(/\/quacks/)
}

// Posts through the API with the page's session cookie, so the seed stays untouched.
export async function postQuack(page: Page, text: string): Promise<string> {
  const response = await page.request.post(`${API}/quacks`, { data: { text } })
  expect(response.status()).toBe(201)
  return ((await response.json()) as { id: string }).id
}

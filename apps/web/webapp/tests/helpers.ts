import { expect, type Locator, type Page } from "@playwright/test";

export function uniqueEmail(prefix = "ui-smoke") {
  return `${prefix}+${Date.now()}@example.com`;
}

export function getPanels(page: Page) {
  return {
    auth: page.locator("section", { has: page.getByRole("heading", { name: "Auth" }) }),
    products: page.locator("section", { has: page.getByRole("heading", { name: "Products" }) }),
    cart: page.locator("section", { has: page.getByRole("heading", { name: "Cart" }) }),
    addresses: page.locator("section", { has: page.getByRole("heading", { name: "Addresses" }) }),
    orders: page.locator("section", {
      has: page.getByRole("heading", { name: "Orders and Payment" }),
    }),
  };
}

export async function registerUser(authPanel: Locator, email = uniqueEmail()) {
  await authPanel.getByRole("button", { name: "Register" }).click();
  await authPanel.getByLabel("Name").fill("UI Smoke");
  await authPanel.getByLabel("Phone").fill("9999999999");
  await authPanel.getByLabel("Email").fill(email);
  await authPanel.getByLabel("Password").fill("Aa1!aaaa");

  return { email, password: "Aa1!aaaa" };
}

export async function submitRegister(page: Page, authPanel: Locator) {
  const registerResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/auth/register") && response.request().method() === "POST",
  );

  await authPanel.getByRole("button", { name: "Create account" }).click();
  const registerResponse = await registerResponsePromise;
  expect(registerResponse.status(), await registerResponse.text()).toBe(201);
  await expect(authPanel.getByRole("button", { name: "Logout" })).toBeVisible();
}

export async function loginUser(page: Page, authPanel: Locator, email: string, password: string) {
  await authPanel.getByRole("button", { name: "Login" }).click();
  await authPanel.getByLabel("Email").fill(email);
  await authPanel.getByLabel("Password").fill(password);

  const loginResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/auth/login") && response.request().method() === "POST",
  );

  await authPanel.getByRole("button", { name: "Login" }).last().click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status(), await loginResponse.text()).toBe(200);
  await expect(authPanel.getByRole("button", { name: "Logout" })).toBeVisible();
}

export async function refreshProducts(page: Page, productsPanel: Locator) {
  const productsResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/products") && response.request().method() === "GET",
  );
  await productsPanel.getByRole("button", { name: "Refresh" }).click();
  const productsResponse = await productsResponsePromise;
  expect(productsResponse.status()).toBe(200);
}

export async function addFirstProductToCart(page: Page, productsPanel: Locator, cartPanel: Locator) {
  await refreshProducts(page, productsPanel);
  const addButtons = productsPanel.getByRole("button", { name: "Add to cart" });
  expect(await addButtons.count()).toBeGreaterThan(0);
  await addButtons.first().click();
  await expect(page.locator(".notice")).toContainText(/Item added to cart|Only \d+ items in stock/i);
  await expect(cartPanel.getByText("Subtotal:")).toBeVisible();
}

export async function saveAddress(addressPanel: Locator, page: Page) {
  await addressPanel.getByLabel("Full name").fill("UI Smoke");
  await addressPanel.getByLabel("Phone").fill("9999999999");
  await addressPanel.getByLabel("Line 1").fill("123 Test Street");
  await addressPanel.getByLabel("City").fill("Bengaluru");
  await addressPanel.getByLabel("State").fill("Karnataka");
  await addressPanel.getByLabel("Postal code").fill("560001");

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/orders/address") && response.request().method() === "POST",
  );

  await addressPanel.getByRole("button", { name: "Save address" }).click();
  const response = await responsePromise;
  expect(response.status(), await response.text()).toBe(201);
  await expect(page.locator(".notice.success")).toContainText(/Address saved/i);
}

export async function placeOrder(page: Page, ordersPanel: Locator) {
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/orders") && response.request().method() === "POST",
  );
  await ordersPanel.getByRole("button", { name: "Place order from cart" }).click();
  const response = await responsePromise;
  expect([201, 400, 409], await response.text()).toContain(response.status());
  await expect(page.locator(".notice")).toContainText(/Order placed|Cart is empty|Not enough stock/i);
  return response.status();
}

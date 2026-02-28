import { expect, test } from "@playwright/test";
import {
  addFirstProductToCart,
  getPanels,
  loginUser,
  registerUser,
  submitRegister,
} from "./helpers";

test("auth relogin and cart quantity/clear flow", async ({ page }) => {
  await page.goto("/");
  const panels = getPanels(page);

  const credentials = await registerUser(panels.auth);
  await submitRegister(page, panels.auth);

  await panels.auth.getByRole("button", { name: "Logout" }).click();
  await expect(panels.auth.getByRole("button", { name: "Create account" })).toBeVisible();

  await loginUser(page, panels.auth, credentials.email, credentials.password);
  await addFirstProductToCart(page, panels.products, panels.cart);

  const updateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/cart/items/") && response.request().method() === "PATCH",
  );
  await panels.cart.locator('input[type="number"]').first().fill("1");
  await panels.cart.getByRole("button", { name: "Update" }).first().click();
  const updateResponse = await updateResponsePromise;
  expect(updateResponse.status(), await updateResponse.text()).toBe(200);
  await expect(page.locator(".notice.success")).toContainText(/Cart item updated/i);

  const clearResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/cart/clear") && response.request().method() === "DELETE",
  );
  await panels.cart.getByRole("button", { name: "Clear cart" }).click();
  const clearResponse = await clearResponsePromise;
  expect(clearResponse.status(), await clearResponse.text()).toBe(200);
  await expect(panels.cart.getByText("Cart is empty.")).toBeVisible();
});

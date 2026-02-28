import { expect, test } from "@playwright/test";
import {
  addFirstProductToCart,
  getPanels,
  placeOrder,
  registerUser,
  saveAddress,
  submitRegister,
} from "./helpers";

test("frontend feature smoke: auth, catalog, cart, address, order, payment trigger", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Commerce Console" })).toBeVisible();

  const panels = getPanels(page);

  await registerUser(panels.auth);
  await submitRegister(page, panels.auth);

  await addFirstProductToCart(page, panels.products, panels.cart);
  await saveAddress(panels.addresses, page);
  await placeOrder(page, panels.orders);

  const detailButtons = panels.orders.getByRole("button", { name: "Details" });
  if ((await detailButtons.count()) > 0) {
    await detailButtons.first().click();
    await expect(page.getByText("Order detail:", { exact: false })).toBeVisible();
  }

  const payButtons = panels.orders.getByRole("button", { name: "Pay now" });
  if ((await payButtons.count()) > 0) {
    await page.evaluate(() => {
      window.Razorpay = class {
        private options: {
          modal?: { ondismiss?: () => void };
        };

        constructor(options: { modal?: { ondismiss?: () => void } }) {
          this.options = options;
        }

        open() {
          this.options.modal?.ondismiss?.();
        }
      };
    });

    await payButtons.first().click();
    await expect(page.locator(".notice.error")).toContainText(/Payment cancelled|failed|invalid/i);
  }
});

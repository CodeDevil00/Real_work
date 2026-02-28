import { expect, test } from "@playwright/test";
import {
  addFirstProductToCart,
  getPanels,
  placeOrder,
  registerUser,
  saveAddress,
  submitRegister,
} from "./helpers";

test("payment success path updates frontend flow with mocked gateway endpoints", async ({ page }) => {
  await page.goto("/");
  const panels = getPanels(page);

  await registerUser(panels.auth, `ui-payment+${Date.now()}@example.com`);
  await submitRegister(page, panels.auth);

  await addFirstProductToCart(page, panels.products, panels.cart);
  await saveAddress(panels.addresses, page);
  const orderStatus = await placeOrder(page, panels.orders);
  expect(orderStatus).toBe(201);

  await page.route("**/payments/create-order", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        keyId: "rzp_test_mock",
        razorpayOrderId: "order_mock_123",
        amount: 100,
        currency: "INR",
        appOrderId: "mock-app-order-id",
      }),
    });
  });

  await page.route("**/payments/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Payment verified. Order marked PAID." }),
    });
  });

  await page.evaluate(() => {
    window.Razorpay = class {
      private options: {
        handler: (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => Promise<void> | void;
      };

      constructor(options: {
        handler: (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => Promise<void> | void;
      }) {
        this.options = options;
      }

      async open() {
        await this.options.handler({
          razorpay_order_id: "order_mock_123",
          razorpay_payment_id: "pay_mock_123",
          razorpay_signature: "sig_mock_123",
        });
      }
    };
  });

  const payButton = panels.orders.getByRole("button", { name: "Pay now" }).first();
  await payButton.click();

  await expect(page.locator(".notice.success")).toContainText(/Payment verified. Order marked paid/i);
});

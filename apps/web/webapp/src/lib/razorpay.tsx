import { api, authHeader } from "./api";

type CreateOrderResponse = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  appOrderId: string;
};

type VerifyPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function payWithRazorpay(appOrderId: string, token: string): Promise<void> {
  const { data } = await api.post<CreateOrderResponse>(
    "/payments/create-order",
    { orderId: appOrderId },
    authHeader(token),
  );

  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    throw new Error("Razorpay SDK was not loaded.");
  }

  await new Promise<void>((resolve, reject) => {
    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "E-Commerce",
      description: "Order Payment",
      order_id: data.razorpayOrderId,
      handler: async (response: VerifyPayload) => {
        try {
          await api.post(
            "/payments/verify",
            {
              appOrderId: data.appOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            authHeader(token),
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled by user.")),
      },
      theme: { color: "#1d4ed8" },
    };

    const instance = new Razorpay(options);
    instance.on?.("payment.failed", (event: { error?: { description?: string } }) => {
      reject(new Error(event.error?.description || "Payment failed."));
    });
    instance.open();
  });
}

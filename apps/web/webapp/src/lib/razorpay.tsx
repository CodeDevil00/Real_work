import {api, authHeader} from "./api";

type CreateOrderResp = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  appOrderId: string;
};

export async function payWithRazorpay(appOrderId: string, token: string) {
  // 1) create Razorpay order from backend
  const { data } = await api.post<CreateOrderResp>(
    "/payments/create-order",
    { orderId: appOrderId },
    authHeader(token)
  );

  // 2) open Razorpay Checkout
  const options = {
    key: data.keyId,
    amount: data.amount,
    currency: data.currency,
    name: "E-Commerce",
    description: "Order Payment",
    order_id: data.razorpayOrderId,

    handler: async function (response: any) {
      // 3) verify payment on backend
      await api.post(
        "/payments/verify",
        {
          appOrderId: data.appOrderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        },
        authHeader(token)
      );

      alert("✅ Payment successful! Order marked PAID.");
      // optionally refresh page / refetch order
    },

    modal: {
      ondismiss: function () {
        alert("Payment popup closed");
      },
    },

    theme: { color: "#111827" },
  };

  if (!window.Razorpay) {
    alert("Razorpay SDK not loaded. Check index.html script tag.");
    return;
  }

  const rzp = new window.Razorpay(options);
  rzp.open();
}
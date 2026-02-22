import { useState } from "react";
import { getApiErrorMessage } from "../lib/api";
import { payWithRazorpay } from "../lib/razorpay";

type Props = {
  orderId: string;
  token: string;
  onSuccess?: () => void | Promise<void>;
  onError?: (message: string) => void;
};

export default function PayNowButton({ orderId, token, onSuccess, onError }: Props) {
  const [isPaying, setIsPaying] = useState(false);

  async function startPayment() {
    if (!token) {
      onError?.("Please login before payment.");
      return;
    }

    setIsPaying(true);
    try {
      await payWithRazorpay(orderId, token);
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      onError?.(getApiErrorMessage(error));
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <button onClick={() => void startPayment()} disabled={isPaying}>
      {isPaying ? "Processing..." : "Pay now"}
    </button>
  );
}

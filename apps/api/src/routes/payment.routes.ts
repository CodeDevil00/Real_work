// const express = require("express");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const { z } = require("zod");
// const prisma = require("../prisma");
// const auth = require("../middleware/auth.middleware");


import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { z , ZodError } from "zod";
import prisma from "../prisma";
import auth from "../middleware/auth.middleware";
import { mustGetEnv } from "../utils/env";


const router = express.Router();
router.use(auth);

const razorpay = new Razorpay({
  key_id: mustGetEnv("RAZORPAY_KEY_ID"),
  key_secret:mustGetEnv("RAZORPAY_KEY_SECRET"),
});

router.post("/create-order", async (req, res) => {
  try {
    const schema = z.object({
      orderId: z.string().min(1),
    });

    const { orderId } = schema.parse(req.body);
    const userId = req.user?.id;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, total: true, status: true },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "PAID") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // Prisma Decimal safe conversion
    const totalStr = order.total?.toString?.() ?? String(order.total);
    const total = Number(totalStr);
    const amountInPaise = Math.round(total * 100);

    //guard: Razorpay requires positive integer amount
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        message: "Invalid order total for Razorpay",
        totalStr,
        amountInPaise,
      });
    }

    //guard: keys must exist
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: "Razorpay keys missing in .env",
      });
    }

    const rpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
    //   receipt: `rcpt_${order.id}`,
      receipt: `o_${order.id.slice(0, 10)}`,
      notes: { appOrderId: order.id },
    });

    return res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      appOrderId: order.id,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      console.error("Create-order error:", err);
      return res.status(500).json({
        message: "Create-order failed",
        error: err.issues[0]?.message || String(err),
      });
    }

  }
});

// 2) POST /payments/verify
// body: { appOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
router.post("/verify", async (req, res) => {
  const schema = z.object({
    appOrderId: z.string().min(1),
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  });

  const data = schema.parse(req.body);
  const userId = req.user?.id;

  // Verify the signature
  const signPayload = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", mustGetEnv("RAZORPAY_KEY_SECRET"))
    .update(signPayload)
    .digest("hex");

  if (expectedSignature !== data.razorpay_signature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  // Mark order as PAID (only if belongs to the logged in user)
  const updated = await prisma.order.updateMany({
    where: { id: data.appOrderId, userId, status: "PENDING" },
    data: { status: "PAID" },
  });

  if (updated.count === 0) {
    return res
      .status(404)
      .json({ message: "Order not found or already updated" });
  }

  res.json({ message: "Payment verified. Order marked PAID." });
});

// module.exports = router;

export default router;
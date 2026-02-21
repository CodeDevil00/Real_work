// const express = require("express");
// const { z } = require("zod");
// const prisma = require("../prisma");
// const auth = require("../middleware/auth.middleware");


import express from "express";
import { z } from "zod";
import prisma from "../prisma";
import auth from "../middleware/auth.middleware";


const router = express.Router();
router.use(auth);

// Helper: get user's cart with items + product
async function getFullCart(userId : string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,     // Int (paise)
              stockQty: true,
            },
          },
        },
      },
    },
  });
  return cart;
}

// 1) POST /orders/address  -> create a new address (simple)
router.post("/address", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const schema = z.object({
      fullName: z.string().min(2),
      phone: z.string().min(8).max(15),
      line1: z.string().min(2),
      line2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      postalCode: z.string().min(3),
      country: z.string().optional(),
      isDefault: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    // if default, unset old default
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId, 
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 ?? null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country ?? "India",
        isDefault: data.isDefault ?? false,
      },
    });

    return res.status(201).json({ message: "Address created", address });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation Error", errors: err.issues });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// 2) GET /orders/addresses -> list my addresses
router.get("/addresses", async (req, res) => {
  const userId = req.user?.id;
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  res.json({ addresses });
});

// 3) POST /orders  -> create order from cart + addressId
router.post("/", async (req, res) => {
  try {
    const schema = z.object({
      addressId: z.string().min(1),
    });

    const { addressId } = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Validate address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });
    if (!address) return res.status(404).json({ message: "Address not found" });

    const cart = await getFullCart(userId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Check stock
    for (const item of cart.items) {
      if (item.quantity > item.product.stockQty) {
        return res.status(400).json({
          message: `Not enough stock for ${item.product.title}`,
        });
      }
    }

    // total in paise (Int)
    const totalInt = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0
    );

    // store as Decimal string
    const totalDecimal = (totalInt / 100).toFixed(2);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId, // ✅ now string
          addressId,
          status: "PENDING",
          total: totalDecimal,
          items: {
            create: cart.items.map((it) => ({
              productId: it.product.id,
              quantity: it.quantity,
              unitPrice: (it.product.price / 100).toFixed(2),
            })),
          },
        },
        include: { items: true },
      });

      // Reduce stock
      for (const it of cart.items) {
        await tx.product.update({
          where: { id: it.product.id },
          data: { stockQty: { decrement: it.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    return res.status(201).json({ message: "Order placed (PENDING)", order: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation Error", errors: err.issues });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// 4) GET /orders -> list my orders
router.get("/", async (req, res) => {
  const userId = req.user?.id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  res.json({ orders });
});

// 5) GET /orders/:id -> order detail
router.get("/:id", async (req, res) => {
  const userId = req.user?.id;
  const orderId = req.params.id;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      address: true,
      items: {
        include: {
          product: {
            select: { id: true, title: true, images: true, brand: true },
          },
        },
      },
    },
  });

  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json({ order });
});

// module.exports = router;

export default router;
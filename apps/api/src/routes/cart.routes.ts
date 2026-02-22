// const express = require('express');
// const {z} = require('zod');
// const prisma = require('../prisma');
// const auth = require('../middleware/auth.middleware');

import express from "express";
import { z } from "zod";
import prisma from "../prisma";
import auth from "../middleware/auth.middleware";

const router = express.Router();

// all cart routes require auth
router.use(auth);

// helper: get or create cart for user
async function getOrCreateCart(userId : string) {
    let cart = await prisma.cart.findUnique({
        where: { userId },
        select: {id: true , userId: true},
    });

    if(!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            select: {id: true , userId: true},
        });
}
return cart;
}

// GET /cart -> full cart with items + product
router.get("/", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const cart = await getOrCreateCart(userId);

    const fullcart = await prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            mrp: true,
                            images: true,
                            stockQty: true,
                            brand: true,
                    },
                },
            },
        },
    },
    });

    if (!fullcart) {
        return res.status(404).json({ message: "Cart not found" });
    }

    // compute totals 
    const subtotal = fullcart.items.reduce((sum, it) => sum + it.quantity * it.product.price, 0);

    res.json({ cart: fullcart, subtotal });
});

//  POST /cart/items -> { productId, quantity}

router.post("/items", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const schema = z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50).default(1),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation Error", errors: parsed.error.issues });
    }

    const { productId, quantity } = parsed.data;

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, stockQty: true },
    });

    if(!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    const cart = await getOrCreateCart(userId);

    const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if(existing) {
        const newQty = existing.quantity + quantity;

        if(newQty > product.stockQty) {
            return res.status(400).json({ error: `Only ${product.stockQty} items in stock` });
        }

        const updated = await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: newQty },
        });

        return res.status(200).json({ message: "Cart updated", item: updated });
    }

    if(quantity > product.stockQty) {
        return res.status(400).json({ error: `Only ${product.stockQty} items in stock` });
    }

    const item = await prisma.cartItem.create({
        data: {
            cartId: cart.id,
            productId,
            quantity,
        },
    });

    return res.status(201).json({ message: "Item added to cart", item });
});

// PATCH /cart/items/:itemId -> { quantity }

router.patch("/items/:itemId", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const schema = z.object({
        quantity: z.number().int().min(1).max(50),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation Error", errors: parsed.error.issues });
    }

    const { quantity } = parsed.data;

    const { itemId } = req.params;

    // ensure item belongs to user's cart
    const cart = await getOrCreateCart(userId);

    const item = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { product: { select: { stockQty: true } } },
    });

    if(!item || item.cartId !== cart.id) {
        return res.status(404).json({ error: "Cart item not found" });
    }

    if(quantity > item.product.stockQty) {
        return res.status(400).json({ error: `Only ${item.product.stockQty} items in stock` });
    }

    const updated = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
    });

    res.json({ message: "Cart item updated", item: updated });
});

// DELETE /cart/items/:itemId -> remove item from cart

router.delete("/items/:itemId", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { itemId } = req.params;

    const cart = await getOrCreateCart(userId);

    const item = await prisma.cartItem.findUnique({
        where: { id: itemId },
    });
    if(!item || item.cartId !== cart.id) {
        return res.status(404).json({ error: "Cart item not found" });
    }

    await prisma.cartItem.delete({
        where: { id: itemId },
    });

    res.json({ message: "Cart item removed" });
});

// optional : DELETE /cart/clear

router.delete("/clear", async (req, res) => {

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const cart = await getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
    });

    res.json({ message: "Cart cleared" });
});

// module.exports = router;

export default router;

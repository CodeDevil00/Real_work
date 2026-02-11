const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const { ca } = require('zod/v4/locales');

const router = express.Router();

// eveyrthing under /admin requires auth and admin role
router.use(auth, role("admin"));

// POST /admin/categories

router.post("/categories", async (req, res) => {
    const schema = z.object({
        name: z.string().min(2),
        slug: z.string().min(2)
    });

    const data = schema.parse(req.body);

    const category = await prisma.category.create({ data ,
        select: { id: true, name: true, slug: true }
    });

    res.status(201).json({ category });
});

// post /admin/products

router.post("/products", async (req, res) => {
    const schema = z.object({
        title: z.string().min(2),
        description: z.string().optional(),
        price: z.number().int().nonnegative(),
        mrp:z.number().int().nonnegative().optional(),
        stockQty: z.number().int().nonnegative().optional(),
        brand: z.string().optional(),
        images:z.array(z.string()).optional(),
        categoryId: z.string().optional()
    });

    const body = schema.parse(req.body);

    const product = await prisma.product.create({
        data: {
            ...body,
            images: body.images || [],
            stockQty: body.stockQty ?? 0,
        },
    });

    res.status(201).json({ product });
});

module.exports = router;
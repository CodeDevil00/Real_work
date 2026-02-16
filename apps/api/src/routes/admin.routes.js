const express = require("express");
const { z } = require("zod");
const prisma = require("../prisma");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { ca } = require("zod/v4/locales");
const slugify = require("../utils/slugify");

const router = express.Router();

// eveyrthing under /admin requires auth and admin role
router.use(auth, role("admin"));

// POST /admin/categories

router.post("/categories", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
  });

  try {
    const data = schema.parse(req.body);

    const category = await prisma.category.create({
      data,
      select: { id: true, name: true, slug: true },
    });

    res.status(201).json({ category });
  } catch (err) {
    if (err?.issues) {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// post /admin/products

router.post("/products", async (req, res) => {
  const schema = z.object({
    title: z.string().min(2),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().int().nonnegative(),
    mrp: z.number().int().nonnegative().optional(),
    stockQty: z.number().int().nonnegative().optional(),
    brand: z.string().optional(),
    images: z.array(z.string()).optional(),
    categoryId: z.string().optional(),
  });

  try {
    const body = schema.parse(req.body);
    const baseSlug = slugify(body.slug || body.title);

    // ensure unique slug: base, base-2, base-3, etc

    let slug = baseSlug;
    let i = 2;

    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const product = await prisma.product.create({
      data: {
        title: body.title,
        slug,
        description: body.description,
        price: body.price,
        mrp: body.mrp,
        stockQty: body.stockQty ?? 0,
        brand: body.brand,
        images: body.images || [],
        categoryId: body.categoryId,
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    return res.status(201).json({ product });
  } catch (err) {
    if (err?.issues) {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.issues });
    }
    console.error(err);

    // if slug uqiueness check failed
    if (err.code === "P2002" && err.meta?.target?.includes("slug")) {
      return res
        .status(409)
        .json({ message: "Slug already in use, try a different one" });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;

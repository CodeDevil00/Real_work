const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

// GET /products?search=&categorySlug=&minPrice=&maxPrice=&sort=newest|price_asc|price_desc&page=1&limit=12

router.get("/", async (req, res) => {
  const {
    search = "",
    categorySlug,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      minPrice ? { price: { gte: parseInt(minPrice, 10) } } : {},
      maxPrice ? { price: { lte: parseInt(maxPrice, 10) } } : {},
      categorySlug ? { category: { slug: categorySlug } } : {},
    ],
  };

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// GET /products/:id
router.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ product });
});

module.exports = router;

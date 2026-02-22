import express, { Request, Response } from "express";
import prisma from "../prisma";

const router = express.Router();

// GET /products?search=&categorySlug=&minPrice=&maxPrice=&sort=newest|price_asc|price_desc&page=1&limit=12
router.get("/", async (req: Request, res: Response) => {
  const {
    search = "",
    categorySlug,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
  } = req.query as {
    search?: string;
    categorySlug?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string | number;
    limit?: string | number;
  };

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 12, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { brand: { contains: search, mode: "insensitive" as const } },
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
      ? ({ price: "asc" } as const)
      : sort === "price_desc"
      ? ({ price: "desc" } as const)
      : ({ createdAt: "desc" } as const);

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

  return res.json({
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
router.get("/:id", async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!id) return res.status(400).json({ message: "Product id is required" });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  if (!product) return res.status(404).json({ message: "Product not found" });
  return res.json({ product });
});

export default router;

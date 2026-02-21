// const express = require("express")
// const prisma = require("../prisma");
// const { json } = require("zod");

import express from "express";
import prisma from "../prisma";
import { z } from "zod";


const router = express.Router();

// GET /categories 

router.get("/", async (req, res) => {
    const categories = await prisma.category.findMany({
        orderBy : { name: "asc" },
        select: {id: true, name: true, slug: true}
    });
    res.json({ categories });
});

// module.exports = router;

export default router;
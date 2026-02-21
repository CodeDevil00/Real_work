// const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const { z } = require("zod");
// const prisma = require("../prisma");
// const authMiddleware = require("../middleware/auth.middleware");

import express, { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../prisma";
import authMiddleware from "../middleware/auth.middleware";
import { mustGetEnv } from "../utils/env";



// const router = express.Router();
const router: Router = express.Router();

const JWT_SECRET = mustGetEnv("JWT_SECRET");


// User registration
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must be at most 64 characters")
  .regex(/[a-z]/, "Password must include at least 1 lowercase letter")
  .regex(/[A-Z]/, "Password must include at least 1 uppercase letter")
  .regex(/[0-9]/, "Password must include at least 1 number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least 1 special character")
  .refine((val) => !/\s/.test(val), "Password must not contain spaces");

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8).max(15),
  email: z.string().email(),
  password: strongPassword,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// POST /auth/register

router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name || null,
        phone: phone || null,
      },

      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res
      .status(201)
      .json({ message: "Registered Succesfully", user, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.issues });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation Error", errors: err.issues });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /auth/me (protected route)

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// module.exports = router;
export default router;
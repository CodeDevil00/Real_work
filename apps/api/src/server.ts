// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan'); 

// require('dotenv').config();

// const authRoutes = require('./routes/auth.routes');

// const categoryRoutes = require('./routes/category.routes');
// const productRoutes = require('./routes/product.routes');
// const adminRoutes = require('./routes/admin.routes');

// const cartRoutes = require('./routes/cart.routes');

// const orderRoutes = require('./routes/order.routes');

// const paymentRoutes = require('./routes/payment.routes');

// const app = express();

// app.use(cors());
// app.use(helmet());
// app.use(morgan("dev"));
// app.use(express.json());

// //health check route
// app.get("/health", (req, res) => {
//     res.status(200).json({ status: "OK" , message: "API is running" });

// });

// // Auth routes
// app.use("/auth", authRoutes);

// // Category routes
// app.use("/categories", categoryRoutes);

// // Product routes
// app.use("/products", productRoutes);

// // Admin routes
// app.use("/admin", adminRoutes);

// // Cart routes
// app.use("/cart", cartRoutes);

// // Order routes
// app.use("/orders", orderRoutes);

// // payment routes
// app.use("/payments", paymentRoutes);

// // 404 handler
// app .use((req, res) => {
//     res.status(404).json({ error: "Route not found" });
// });

// //port
// const PORT = process.env.PORT || 5000;

// // start server
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authMiddleware from "./middleware/auth.middleware";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import productRoutes from "./routes/product.routes";
import adminRoutes from "./routes/admin.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
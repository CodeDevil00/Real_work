const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan'); 

require('dotenv').config();

const authRoutes = require('./routes/auth.routes');


const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

//health check route
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" , message: "API is running" });

});

// Auth routes
app.use("/auth", authRoutes);

// 404 handler
app .use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

//port
const PORT = process.env.PORT || 5000;

// start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
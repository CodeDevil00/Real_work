const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan'); 

require('dotenv').config();


const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

//health check route
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" , message: "API is running" });

});

//port
const PORT = process.env.PORT || 5000;

// start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
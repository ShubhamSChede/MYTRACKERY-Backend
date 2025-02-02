require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expense'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/journal', require('./routes/journal'));

const PORT = process.env.PORT || 5000;

// Keep-alive function
const keepAlive = () => {
  const appUrl = "https://expensetrackerbackend-j2tz.onrender.com";
  axios
    .get(appUrl)
    .then((response) => {
      console.log(`Pinged ${appUrl} successfully.`);
    })
    .catch((error) => {
      console.log(`Error pinging the server: ${error.message}`);
    });
};

// Start the keep-alive function on server start
const startKeepAlive = () => {
  keepAlive(); // Send an initial ping
  // Set the function to run every 14 minutes (840 seconds)
  setInterval(keepAlive, 840 * 1000); // 840 seconds = 14 minutes
};

// Start the server and keep-alive mechanism
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startKeepAlive(); // Start the keep-alive mechanism after server starts
});
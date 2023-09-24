// Import required modules and packages
const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Set the port

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define routes and middleware
app.get('/', (req, res) => {
  res.send('Hello, World!');
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

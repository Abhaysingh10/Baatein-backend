// Import required modules and packages
const express = require("express");
const mysql = require("mysql2");
const app = express();
const port = process.env.PORT || 3000; // Set the port

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a connection to the MySQL database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "baatein",
});

// Define routes and middleware
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const login = (callback, data) => {
  db.query(`select * from users where user_email = "${data?.email}"`, function (err, results, fields) {
    try {
      if (err) {
        callback({ messge: "Internal server error!", code: 500 });
        return;
      }
      if (results.length === 0) {
        callback({ message: "User not found!", code: 401 });
        return
      }
      callback({ message: data, code: 200 });
    } catch (error) {
      callback({message: error, code: 500})
      return
    }
  });
};

app.post("/login", (req, res) => {
  login((data) => {
    const {message, code} = data
    res.status(code).send(message);
  }, req?.body);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

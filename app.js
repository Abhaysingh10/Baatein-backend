// Import required modules and packages
const express = require("express");
const mysql = require("mysql2");
const app = express();
const { colours } = require("nodemon/lib/config/defaults");
const port = 3000; // Set the port
var cors = require("cors");
let user = [];
let loggedInUser;
// var http = require("http");
// var server = http.createServer(app);
// var io = require("socket.io")(server, {
//   cors:{
//     origin:"http:localhost:3001",
//     credentials:false
//   }
// });

const { Server } = require("socket.io");
const { createServer } = require("http");
var server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    credentials: false,
  },
});

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Create a connection to the MySQL database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "baatein",
});
// const io = socketIo(server)

io.sockets.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log(`User disconnected with ID: ${socket.id}`);
    const socketIdToRemove = socket.id; // Replace with the socketId you want to remove
    const newArray = user.filter((obj) => obj.socketId !== socketIdToRemove);
    user = newArray;
    // You can perform any necessary cleanup or actions here.
  });

  socket.on("abhay", (data) => {

    console.log("abhaycalled",user);
    loggedInUser = data?.name;
    user.push({ socketId: socket.id, user: data?.name });
    // broadCaseOnlineUsers();
  });
  var counter = 0
  function broadCaseOnlineUsers() {
    counter++
    console.log("called", loggedInUser)
    socket.broadcast.emit("online", user);
    
  if (counter == 3) {
    clearInterval(msg)
    counter = 0
  }
  }

  var msg = setInterval(broadCaseOnlineUsers, 13000)
  console.log("counter called outside", counter)


  console.log("Users", user);
});

// Define routes and middleware
app.get("/", (req, res) => {
  res.send("");
});

const login = (callback, data) => {
  db.query(
    `select * from users where user_email = "${data?.email}"`,
    function (err, results, fields) {
      try {
        if (err) {
          callback({ messge: "Internal server error!", code: 500 });
          return;
        }
        if (results.length === 0) {
          callback({ message: "User not found!", code: 401 });
          return;
        }
        callback({ message: data, code: 200 });
      } catch (error) {
        callback({ message: error, code: 500 });
        return;
      }
    }
  );
};

app.post("/login", (req, res) => {
  login((data) => {
    const { message, code } = data;
    res.status(code).send(message);
  }, req?.body);
});

const getAllUsers = (callback) => {
  db.query(`select * from users where first_name = 'willy'`, (err, result) => {
    if (err) {
    }
    callback({ status: 200, data: result });
  });
};

app.get("/get-all-users", (req, res) => {
  getAllUsers((data) => {
    res.send(data);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  db.connect(function (err) {
    if (err) throw err;
    console.log("db connected");
  });
});

// Import required modules and packages
const express = require("express");
const app = express();
const { colours } = require("nodemon/lib/config/defaults");
const port = 3000; // Set the port
var cors = require("cors");
let user = [];

const { Server } = require("socket.io");
const { createServer } = require("http");
const { connected } = require("process");
const { connectDB, getAllUsers, checkUserExit, addUser, login } = require("./DatabaseConnection/db");
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


io.sockets.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log(`User disconnected with ID: ${socket.id}`);
    const socketIdToRemove = socket.id; // Replace with the socketId you want to remove
    const newArray = user.filter((obj) => obj.socketId !== socketIdToRemove);
    user = newArray;
    // You can perform any necessary cleanup or actions here.
  });

  socket.on("abhay", (data) => {
    user.push({ socketId: socket.id, user: data?.name });
    broadCaseOnlineUsers();
  });

  socket.on('private-message', ({socketId, message})=>{
    // console.log(message, socketId)
    conversation.push(message)
    console.log(conversation)
    io.to(socketId).emit('private-message', {message:conversation })
    io.to(socket.id).emit('private-message', {message:conversation })


  })
  function broadCaseOnlineUsers() {
    io.emit("online", user);
  }
});

app.get("/", (req, res) => {
  res.send("Hello world !");
});

app.post('/add-user', (req, res)=>{
  addUser((data)=>{
    const { statusCode, msg } = data
    res.status(statusCode).send(msg)
  }, req.body)
  
})


app.post("/login", (req, res) => {
  // console.log(req.body)
  login((data) => {
    const { message, code } = data;
    res.status(code).send(message);
  }, req?.body);
});

app.get("/get-all-users", (req, res) => {
  getAllUsers((data) => {
    res.send(data);
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  connectDB()
});

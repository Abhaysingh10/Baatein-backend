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
const { connectDB, getAllUsers, checkUserExit, addUser, login, getUserInfo, addFriend, friendsList, storeMessage, fetchMessage } = require("./DatabaseConnection/db");
var server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    credentials: false,
  },
});

const conversation = []

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// Middleware for getting username while handshake
io.use((socket, next) => {
  const ownerInfo = socket.handshake.auth.ownerInfo
  if (!ownerInfo) {
    return next(new Error("Invalid owner information."))
  }
  // console.log("ownerInfo",ownerInfo)
  socket.ownerInfo = ownerInfo
  next()
})


io.sockets.on("connection", (socket) => {
  console.log("user connected", socket.id)
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
      users.push({
        userID: id,
        user: socket.ownerInfo,
      });
    broadCastOnlineUsers(users)
  }


    socket.on('private message', async(data)=>{
    const {content, to, senderId, receiverId} = data
    await storeMessage(()=>{

      socket.to(to).emit("private-message-received", {
        content:content,
        senderId: senderId,
        receiverID:receiverId
      });
    }, senderId, receiverId, content)
  })


  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id)
    const socketIdToRemove = socket.id; // Replace with the socketId you want to remove
    const newArray = user.filter((obj) => obj.socketId !== socketIdToRemove);
    user = newArray;
  });

  function broadCastOnlineUsers(users) {
    // console.log("users",users)
    io.emit("connected-users", users);
  }

});

app.get("/", (req, res) => {
  res.send("Hello world !");
});

app.post('/add-user', (req, res)=>{
  addUser((data)=>{
    const { message, code } = data;
    console.log(data)
    res.status(code).send(message)
  }, req.body)
  
})

app.post('/add-friend', (req, res)=>{
  addFriend((data)=>{
    res.status(data?.code).send(data?.message)
  }, req.body)
})

app.post('/get-friends-list', (req, res)=>{
   const {owner_id} = req?.body
   friendsList((data)=>{
      res.status(data?.code).send(data?.message)
   }, owner_id)
})

app.post('/fetch-messages',(req, res)=>{
  const {senderId, receiverId} = req.body
  fetchMessage((data)=>{
      res.status(data?.statusCode).send(data?.message)
  }, senderId, receiverId)  

})
 
app.post("/login", (req, res) => {
  // console.log(req.body)
  login((data) => {
    const { message, code } = data;
    res.status(code).send(message[0]);
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

// Import required modules and packages
const express = require("express");
const app = express();
const Redis = require("ioredis");
const {
  v1: uuidv1,
  v4: uuidv4,
} = require('uuid');
const port = 3000; // Set the port
const cors = require("cors");
const { InMemorySessionStore } = require('./sessionStore.js');
const sessionStore = new InMemorySessionStore()

let user = [];

const { Server } = require("socket.io");
const { createServer } = require("http");
const { connected } = require("process");
const { connectDB, getAllUsers, checkUserExit, addUser, login, getUserInfo, addFriend, friendsList, storeMessage, fetchMessage } = require("./DatabaseConnection/db");
const server = createServer(app);
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
  const sessionID = socket.handshake.auth.sessionID
  console.log("sessionID",sessionID)
  if (sessionID) {
    //find existing sessionID
    const session = sessionStore.findSession(sessionID)
    if (session) {
      socket.ownerInfo = session.ownerInfo
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username
      return next()
    }
  }
  const username = socket.handshake.auth.ownerInfo.first_name
  console.log("username",username)
  if (!username) {
    return next(new Error("Invalid owner information."))
  }
  socket.ownerInfo = socket.handshake.auth.ownerInfo
  socket.sessionID = uuidv1()
  socket.userID = uuidv4()
  socket.username = username
  next()
})

io.sockets.on("connection", (socket) => {

  socket.join(socket.userID)
  // console.log("all sockets", io.allSockets())
  // const {i} = socket
  // Saving session data in session store in backend
  sessionStore.saveSession(socket.sessionID, {
    ownerInfo: socket.ownerInfo,
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // Saving the session ID in localStorage frontend
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
    username: socket.username,
    ownerInfo:socket.ownerInfo

  });

  const allSessionData = sessionStore.findAllSession()

  // Saving users in an array for frontend to display as online
  const users = [];
  // for (let [id, socket] of io.of("/").sockets) {
  sessionStore.findAllSession().forEach((session) => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.conncted,
      user: session.ownerInfo
    });
    broadCastOnlineUsers(users)
  });


  socket.on('private message', async (data) => {
    const { content, to, senderId, receiverId, messageType, timestamp } = data
    await storeMessage(() => {
    }, senderId, receiverId, content)
    console.log(" content",to, senderId, receiverId)
    socket.to(to).emit("private-message-received", {
      content: content,
      senderId: senderId,
      receiverID: receiverId,
      messageType:messageType,
      timestamp:timestamp
    });
  })

  socket.on('offer', async(offer, targetUser) => {
    console.log("offer", offer)
    console.log("targetSocketId", targetUser)
    socket.to(targetUser.userID).emit('offer', offer, socket.id);
  });

  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      socket.broadcast.emit("user disconnected", socket.userID);
      // update the connection status of the session
      // sessionStore.removeSession(socket.sessionID)
      sessionStore.saveSession(socket.sessionID, {
        ownerInfo: socket.ownerInfo,
        userID: socket.userID,
        username: socket.username,
        connected: false,
      });
      const socketIdToRemove = socket.id; // Replace with the socketId you want to remove
      const newArray = user.filter((obj) => obj.socketId !== socketIdToRemove);
      user = newArray;
      
  const allSessionData = sessionStore.findAllSession()
  // console.log("allSessionData in disconnect", allSessionData)
    }
  });

  function broadCastOnlineUsers(users) {
    // console.log("users",users)
    io.emit("connected-users", users);
  }

});

app.get("/", (req, res) => {
  res.send("Hello world !");
});

app.post('/add-user', (req, res) => {
  console.log("req",req.body)
  addUser((data) => {
    const { message, statusCode } = data;
    console.log(data)
    res.status(statusCode).send(message)
  }, req.body)

})

app.post('/add-friend', (req, res) => {
  addFriend((data) => {
    res.status(data.code).send(data.message)
  }, req.body)
})

app.post('/get-friends-list', (req, res) => {
  const { owner_id } = req.body
  friendsList((data) => {
    res.status(data.code).send(data.message)
  }, owner_id)
})

app.post('/fetch-messages', (req, res) => {
  const { senderId, receiverId, limit, offset } = req.body
  fetchMessage((data) => {
    res.status(data.statusCode).send(data)
  }, senderId, receiverId, limit, offset)

})

app.post("/login", (req, res) => {
  // console.log(req.body)
  login((data) => {
    const { message, code } = data;
    res.status(code).send(message[0]);
  }, req.body);
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

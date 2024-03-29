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
const {putObject} = require('./S3/index.js');
const sessionStore = new InMemorySessionStore()

let user = [];

const { Server } = require("socket.io");
const { createServer } = require("http");
const { connected, off } = require("process");
const { connectDB, getAllUsers, checkUserExit, addUser, login, getUserInfo, addFriend, friendsList, storeMessage, fetchMessage } = require("./DatabaseConnection/db");
const { default: axios } = require("axios");
const server = createServer(app); 
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    credentials: false,
  },
  maxReceivedFrameSize: 131072,
  maxReceivedMessageSize: 10 * 1024 * 1024 * 1024
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
  const username = socket.handshake.auth.ownerInfo?.first_name
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
    const { content, fileName, to, senderId, receiverId, messageType, timestamp } = data
    // console.log("message", messageType, content)
    if (messageType == 'image') {
      let url =  await putObject(`baatein-uploads/${fileName}`, 'image/jpg');
      axios.put(url, content, {
        headers:{
          'Content-Type': 'image/jpg'
        }
      }).then((res)=>{
        console.log("response", res.status)
      })
    }
    if (messageType == 'text') {
      await storeMessage(() => {
      }, senderId, receiverId,  messageType)
      console.log(" content", messageType)
      socket.to(to).emit("private-message-received", {
        content: content,
        senderId: senderId,
        receiverID: receiverId,
        messageType:messageType,
        timestamp:timestamp
      });
    }


  })

  socket.on('offer', async(offer, targetUser) => {
    console.log("offer", offer)
    console.log("targetSocketId", targetUser)
    socket.to(targetUser.userID).emit('offer', offer, socket.id);
  });

  socket.on('offerVideo', data =>{
    const {offer, recepientSocketId, senderSocketId} = data
    socket.to(recepientSocketId).emit("offerVideo", {"offer": offer, "senderSocketId":senderSocketId})
  })
  
  socket.on('answerVideo', data =>{
    const {answer,  recepientSocketId, senderSocketId} = data
    socket.to(senderSocketId).emit("answerVideo", {"answer":answer, "recepientSocketId":recepientSocketId})
  })

  const candidatesCollection = [];

  socket.on('candidate', data =>{
    // console.log("candidates", data)
    candidatesCollection.push(data.candidate)
  })
  
  socket.on('addIce', (data) =>{
    const {recepientSocketId, senderSocketId} = data
    console.log("senderSockerId", senderSocketId)
    console.log("recepientSocketId", recepientSocketId)
    // socket.to(senderSocketId).emit('addIce', {"iceCandidate": candidatesCollection} )
    socket.to(recepientSocketId).emit("addIce", {"iceCandidate": candidatesCollection})
  })

  socket.on('answerIce', data =>{
    console.log("data", data)
    const { answerIce, senderSocketId} = data
    socket.to(senderSocketId).emit('answerIce', answerIce)
  })

  

  socket.on("disconnect", async () => {
    console.log("disconnected !!")
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

const express = require("express");
const mysql = require("mysql2");
const util = require('util')
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "baatein",
});
const queryAsync = util.promisify(db.query).bind(db)



const connectDB = () => {
  db.connect(function (err) {
    if (err) throw err;
    console.log("db connected");
  });
};

const storeMessage = async (callback, senderID, receiverID, content) => {
  try {
    const result = await db.promise().query(`INSERT INTO baatein.messages (senderID, receiverID, content, timestamp) VALUES ('${senderID}', '${receiverID}', '${content}', NOW())`);
    if (result.affectedRows > 0) {
      callback( { message: 'Message stored successfully', status: 200 });
    } else {
      callback({ message: 'Message could not be stored', status: 500 });
    }
  } catch (error) {
    console.log(error)
  }
};

const fetchMessage = async(callback,senderId, receiverId ) => { 
  console.log(senderId, receiverId)
  try {
    const query = `SELECT *
    FROM baatein.messages
    WHERE (senderId = ${senderId} AND receiverID = ${receiverId}) OR (senderId = ${receiverId} AND receiverID = ${senderId})
    ORDER BY MessageID ASC
    LIMIT 100 OFFSET 0`

    db.promise().query(query).then((result, error)=>{
      if (error) {}
      callback({message:result[0], statusCode:200})
    });

  } catch (error) {
    
  }
 }

const checkUserExit = async (data) => {

  return new Promise((resolve, reject) => {
    const query = `select * from baatein.users where first_name = '${data?.first_name}'`
    db.query(query, (err, result) => {
      if (err) {
        // callback({statusCode: 404,msg: err})
        reject()
      }
      if (result?.length == 0) {
        resolve(false)
        // callback({statusCode:200, msg:"No data found"})
      } else {
        resolve(true)
        // callback({statusCode:200, msg:result})
      }

    })
  })
}

const addUser = async (callback, data) => {
  const { first_name, last_name, email, gender, ip_address, password } = data?.params
  const query = `insert into baatein.users (first_name, password) values ('${first_name}',
   '${password}')`

   console.log("query", query)

  if (await checkUserExit(data?.params)) {
    callback({ message: "User already exit !", code: 204 });
  } else {
    db.query(query, (err, result) => {
      console.log("result in else", result)
      if (!err) {
        callback({ statusCode: 200, msg: result })
      }
      if (err) {

      }
    })
  }
}

const addFriend = async (callback, data) => {
  const {owner_id, friend_id} = data
  const query = `insert into baatein.friendships (owner_id, friend_id) values ('${owner_id}', '${friend_id}') `
  db.query(query, (err, result, fields)=>{
    if (err) {
      console.log(err)
    }
    callback({ message: result.info, code: 200 })
  })
}

const getAllUsers = (callback) => {
  db.query(`select * from users where first_name = 'willy'`, (err, result) => {
    if (err) {
    }
    // callback({ status: 200, data: result });
  });
};

const fetchUserId = (id) =>{
  return new Promise((resolve, reject)=>{
    const query = `select * from baatein.users where id = ${id}`
    db.query(query, (err, result)=>{
      if (err) {
      }
      console.log("result", result)
    })
  })
}

const friendsList = (callback, owner_id) => { 
    const query = `SELECT friend_id FROM baatein.friendships where owner_id = '${owner_id}';`
    return new Promise((resolve, reject)=>{
      db.query(query, (err, result, fields)=>{
        if (err) {reject(callback({message:err, code: 500}))}
        resolve(callback({ message: result, code: 200 }))

      })
    })
 }

const getUserInfo = (data) => { 
  const query = `select * from baatein.users where first_name = '${data?.name}'`
    return new Promise((resolve, reject)=>{
      db.query(query,(err, result)=>{
        if (err) {
          console.log(err)
        }
        resolve(result)
      })
    }).catch((ex)=>{console.log('ex in getUserInfo')})
 }

const login = (callback, data) => {
  db.query(
    `select * from users where first_name = "${data?.params?.first_name}"`,
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
        callback({ message: results, code: 200 });
      } catch (error) {
        callback({ message: error, code: 500 });
        return;
      }
    }
  );
};

module.exports = { getAllUsers, 
  login, 
  connectDB, 
  checkUserExit, 
  addUser,
  getUserInfo, addFriend, friendsList, storeMessage, fetchMessage };

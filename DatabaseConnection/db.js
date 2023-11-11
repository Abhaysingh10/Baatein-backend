const express = require("express");
const mysql = require("mysql2");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "baatein",
});

const connectDB = () => {
  db.connect(function (err) {
    if (err) throw err;
    console.log("db connected");
  });
};

const checkUserExit = (data) => { 
  db.query(`select * from baatein.users where first_name = '${data?.username}'`,(err, result)=>{
    console.log(result)
    if (err) {
        // callback({statusCode: 404,msg: err})
    }
        
    if (result?.length==0) {
            return false
            // callback({statusCode:200, msg:"No data found"})
        }else{
            return true
            // callback({statusCode:200, msg:result})
        }
    
  })  
}

const addUser = (callback, data) => {
    const {first_name, last_name, email, gender, ip_address} = data
    const query = `insert into baatein.users (first_name, last_name, email, gender) values ('${first_name}', 
         '${last_name}', '${email}', '${gender}')`
    console.log("query", query)
        if(checkUserExit(data)){
        console.log("in if")
        callback({statusCode:200,msg:"User already exit !"})
    }else{
        db.query(query, (err, result)=>{
        console.log("result", result)
                if (!err) {
                    callback({statusCode:"200", msg:result})
                }
                if (err) {
                    
                }
            })
        console.log("in else",data)
    }
  }

const getAllUsers = (callback) => {
  db.query(`select * from users where first_name = 'willy'`, (err, result) => {
    if (err) {
    }
    // callback({ status: 200, data: result });
  });
};

const login = (callback, data) => {
console.log(data?.params?.first_name)
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
        callback({ message: data, code: 200 });
      } catch (error) {
        callback({ message: error, code: 500 });
        return;
      }
    }
  );
};

const adduser = (data) => {
  db.query(
    `insert into users(first_name, last_name, email, gender, ip_address) values`
  );
};

module.exports = {getAllUsers, login, adduser, connectDB, checkUserExit, addUser};

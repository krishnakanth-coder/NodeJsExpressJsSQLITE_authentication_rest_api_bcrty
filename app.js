const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndRunServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server up and running");
    });
  } catch (e) {
    console.log(`DB error message= ${e.message}`);
  }
};
initializeDBAndRunServer();

//API1 register user password > 5
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const selectUserQuery = `
        SELECT * FROM USER
          where 
          username = "${username}" ;`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length >= 5) {
      const hashPassword = await bcrypt.hash(password, 10);
      const createUserQuery = `
            INSERT INTO USER
              (username,name,password,gender,location)
            VALUES
              ("${username}","${name}","${hashPassword}","${gender}","${location}")
          `;
      const dbResponse = await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
    //console.log(password.length);
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API2 LOGIN
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `
        SELECT * FROM USER
          where 
          username = "${username}" ;`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, dbUser.password);
    if (passwordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API3 change-password;

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  //console.log(username, oldPassword, newPassword);
  const currentHashPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `
        SELECT * FROM USER
          where username = "${username}"`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser !== undefined) {
    const passwordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (passwordMatch === true) {
      if (newPassword.length >= 5) {
        const updateUserQuery = `
                    UPDATE user
                    SET 
                      username = "${username} ",
                      password = "${currentHashPassword}"
                    WHERE
                      username ="${username}";`;
        const updateUser = await db.run(updateUserQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;

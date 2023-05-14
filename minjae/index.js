// index.js
const express = require('express');
const app = express();

// DB connection with pg(using postgresql)
const { Client } = require("pg");
const client = new Client({
  user: "vraptor",
  host: "192.168.0.5",
  database: "vraptor",
  password: "vraptor123!",
  port: 5432,
});

// for parsing application/json
app.use(express.json());

const user = [];

app.get('/', function (req, res) {
    client.connect();
    client.query("SELECT * FROM test").then(res => {
        console.log(res.rows);
        client.end();
    }).catch(e => 
      console.error(e.stack)
    );
    return res.send('hello world');
})

app.get('/user', function (req, res) {
  return res.send(user);
})

app.post('/user', function (req, res) {
  console.log(req.body);
  user.push(req.body);
  return res.send(user);
})

app.listen(3000, function () {
    console.log('server listening on port 3000');
})
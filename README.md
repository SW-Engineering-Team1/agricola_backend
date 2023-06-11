<h1 align="center">
  <br>
  <img src="https://lookout-spiele.de/upload/en_agricolare.html_CoverImage.jpg" alt="Markdownify" width="200">
  <br>
  Agricola online game - Backend Repository
  <br>
</h1>

<h2 align="center">Environment</h2>
<p align="center">
  <img src="https://img.shields.io/badge/github-181717?style=for-the-badge&logo=github&logoColor=white">
  <img src="https://img.shields.io/badge/git-F05032?style=for-the-badge&logo=git&logoColor=white">
  <img src="https://img.shields.io/badge/vscode-007ACC?style=for-the-badge&logo=Visual Studio Code&logoColor=white">
</p>

<h2 align="center">Stack</h2>
<p align="center">
  <img src="https://img.shields.io/badge/javascript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white">
  <img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
  <img src="https://img.shields.io/badge/socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white">
  <img src="https://img.shields.io/badge/express-000000?style=for-the-badge&logo=express&logoColor=white">
</p>

<h2 align="center">Communication</h2>
<p align="center">
  <img src="https://img.shields.io/badge/notion-000000?style=for-the-badge&logo=notion&logoColor=blue">
  <img src="https://img.shields.io/badge/slack-4A154B?style=for-the-badge&logo=slack&logoColor=white">
  <img src="https://img.shields.io/badge/kakaotalk-FFCD00?style=for-the-badge&logo=kakaotalk&logoColor=black">
</p>

![screenshot](./readme_src/agricola.gif)

<hr>

<div>
  <h2 align="center">Index</h2>
  <p align="center">
    <a href="#repository-structure">Repository Structure</a> /
    <a href="#how-to-start">How To Start</a> /
    <a href="#contributor">Contributor</a> /
    <a href="#how-to-contribute">How To Contribute</a> 
  </p>
<div>

<hr>

## Repository Structure

```bash
.
├── README.md
├── app.js
├── config # Some configs for project
│   ├── baseResponseStatus.js
│   ├── config.js
│   ├── response.js
│   └── secretKey.js
├── controllers # Controller which get requests from frontend
│   ├── actionSocketController.js
│   ├── gameSocketController.js
│   ├── roomController.js
│   ├── roomSocketController.js
│   └── userController.js
├── middlewares # For middlewares - In this case, for Sign up/in
│   └── auth.js
├── migrations # Migration files for backup using sequelize
│   ├── 20230514164610-Users.js
│   ├── 20230515074818-game_room.js
│   └── 20230517152458-UserGameRoom.js
├── models // Data models
│   ├── Card.js
│   ├── GameRoom.js
│   ├── GameStatus.js
│   ├── User.js
│   ├── UserGameRoom.js
│   └── index.js
├── modules # Files and modules which are used entire project
│   ├── jwt.js
│   └── utility.js
├── package-lock.json
├── package.json
├── pr_checklist.md
├── readme_src
│   └── agricola.gif
├── routes
│   ├── roomRoute.js
│   └── userRoute.js
├── services # Files where entire service logics in
│   ├── gameService.js
│   ├── roomService.js
│   └── userService.js
└── test # Files for unit test
    └── test.js

```

## How To Start

> **Prerequiste:** _installation of node_ and have _mysql database access information_

```bash
# Make database access information file at the top of project
[ .env ]
MYSQL_USERNAME= ${user name}
MYSQL_PASSWORD= ${userpassword}
MYSQL_DATABASE= ${database name}
MYSQL_HOST= ${address of database}
MYSQL_PORT= ${port of database}

var dotenv = require('dotenv')

dotenv.config()



# Install dependencies required to run project
$ npm install

# Run the app
$ node app.js

```

## Contributor

|     | name       | main task         | github address                    | contact             |
| --- | ---------- | ----------------- | --------------------------------- | ------------------- |
|     | Gayeon Bae | Backend Developer | https://github.com/BaeGayeon      | gying09@gmail.com   |
|     | Minjae Kim | Backend Developer | https://github.com/Minjae-vincent | alswo9853@gmail.com |
|     |            |                   |                                   |                     |

## How to contribute

If you have a suggestion that would make this better, please fork the repo and create a pull request.

1. Fork the Project
2. Create your Feature Branch (git checkout -b feature/AmazingFeature)
3. Commit your Changes (git commit -m 'Add some AmazingFeature')
4. Push to the Branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

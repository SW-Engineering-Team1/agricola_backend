const express = require('express');
const app = express();
const morgan = require('morgan');
const http = require('http').Server(app);
const io = require('socket.io')(http);
// const socketController = require('./controllers/socketController')(io);

var userRouter = require('./routes/userRoute');
var roomRouter = require('./routes/roomRoute');

require('./models/index');

app.set('port', process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(morgan('dev'));

app.use('/user', userRouter);
app.use('/room', roomRouter);

http.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기 중');
});

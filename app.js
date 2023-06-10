const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const http = require('http').Server(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });
const roomSocketController = require('./controllers/roomSocketController')(io);
const gameSocketController = require('./controllers/gameSocketController')(io);
const actionSocketController = require('./controllers/actionSocketController')(
  io
);

var userRouter = require('./routes/userRoute');

require('./models/index');

const corsOptions = {
  origin: '*',
  credentials: true,
};

app.use(cors(corsOptions));

app.set('port', process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(morgan('dev'));

app.use('/user', userRouter);

http.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기 중');
});

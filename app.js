const express = require('express');
const app = express();
const morgan = require('morgan');

var userRouter = require('./routes/userRoute');
var roomRouter = require('./routes/roomRoute');

require('./models/index');

app.set('port', process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(morgan('dev'));

app.use('/user', userRouter);
app.use('/room', roomRouter);

app.get('/', (req, res) => {
    res.send('Hello!');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});

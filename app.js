const express = require('express');
const app = express();

var userRouter = require('./routes/userRoute');

require('./models/index');

app.set('port', process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/user', userRouter);

app.get('/', (req, res) => {
    res.send('Hello!');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});

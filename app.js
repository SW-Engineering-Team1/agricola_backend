const express = require('express');
const app = express();

require('./models/index');

app.set('port', process.env.PORT || 3000);

app.get('/', (req, res) => {
    res.send('Hello!');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});

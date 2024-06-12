var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var port = process.env.PORT || 3000;
app.listen(port);

app.use('/assets', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.get('/:id', function (req, res) {
    res.render('index', { ID: req.params.id });
});
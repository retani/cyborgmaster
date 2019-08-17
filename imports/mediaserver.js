var express = require('express');
var app = express();
var port = 8080

// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });

app.use(express.static(local_media_path));

app.listen(port, function () {
  console.log('Media server listening on port ' + port);
});

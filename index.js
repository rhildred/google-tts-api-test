var fs = require('fs');
var request = require('request');

var download = function (url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var sendReq = request.get(url);

    // verify response code
    sendReq.on('response', function (response) {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }
    });

    // check for request errors
    sendReq.on('error', function (err) {
        fs.unlink(dest);
        return cb(err.message);
    });

    sendReq.pipe(file);

    file.on('finish', function () {
        file.close(cb);  // close() is async, call cb after close completes.
    });

    file.on('error', function (err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        return cb(err.message);
    });
};

var googleTTS = require('google-tts-api');


var express = require('express');
var app = express();
var sStaticDir = __dirname + "/www";
app.use(express.static(sStaticDir));
// Handle 404 - Keep this as a last route
app.use(function (req, res, next) {
    var sText = req.query.q;
    var sPath = sStaticDir + req._parsedUrl.pathname;
    googleTTS(sText, 'en', 1)   // speed normal = 1 (default), slow = 0.24
        .then(function (url) {
            download(url, sPath, function () {
                fs.createReadStream(sPath).pipe(res);                

            });
        })
        .catch(function (err) {
            console.error(err.stack);
        });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
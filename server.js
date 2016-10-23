/**
 * Created by GGGin on 2015/12/9.
 */

var express = require('express');
var app = express();
var cryptor = require('./cryptor.js');
var config = require('./config.js');

var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// parse application/json
//var jsonParser = bodyParser.json();
//app.use(bodyParser.json())

var cookieParser = require("cookie-parser");
app.use(cookieParser());

var Token = require('./token');

function goodTokens(token, callback) {
    Token.find({ token: token }).exec(function(err, data) {
        if (err) console.error(err);
        var good = false;
        data.forEach(function(token) {
            if (token.created < Date.now() - 1000 * 60 * 60 * 25 * 7 * 2) { //2 weeks
                token.remove();
            } else {
                if (good === false) {
                    callback(null, token);
                    good = true;
                }
            }
        });
        if (good === false) {
            callback("error!", null);
        }
    });
}

var objects = require("./object.js");

var mongoose = require('mongoose');
mongoose.connect(config.DB_PATH);
mongoose.model('User', objects.User);
mongoose.model('Server', objects.Server);
mongoose.model('ShadowSockService', objects.ShadowSockService);

var KEY = "c5760$%^1d6191202487a94d4()_2d1a";

var cry = require('./cryptor.js');
var fs = require('fs');

function authorize(req, res, next) {
    if (req.cookies && req.cookies.mytoken) {
        goodTokens(req.cookies.mytoken, function(err, token) {
            if (err) {
                res.sendStatus(403);
            } else {
                next();
            }
        });
    }
}

app.use('/pick-info', authorize);
app.use('/logout', authorize);

app.get('/logout', function(req, res) {
    res.cookie('mytoken', null);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ result: true }));
});

app.use("/login", urlencodedParser);

app.post('/login', function(req, res) {
    var user = req.body['username'];
    var pwd = req.body['password'];
    mongoose.model('User').findOne({ name: user }, function(err, doc) {
        if (err || doc === null) {
            res.sendStatus(403);
            return;
        }
        var authenticated = cryptor.SHA256(doc.salt + pwd) === doc.password;
        if (authenticated) {
            var token = require('uuid').v1();
            res.cookie('mytoken', token);
            Token.create({ token: token, userName: user });
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ result: true }));
        } else {
            res.sendStatus(403);
        }
    });
});


app.get('/pick-info', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    try {
        console.log(req.cookies.mytoken);
        goodTokens(req.cookies.mytoken, function(err, token) {
            console.log(token);
            if (err) {
                throw "error";
            } else {
                mongoose.model('User').findOne({ name: token.userName }, function(err, user) {
                    if (err) throw "error";
                    mongoose.model('ShadowSockService').findOne({ user: user }).exec(function(err, x) {
                        if (err) throw "error";
                        if (!x) {
                            res.sendStatus(403);
                            return;
                        }
                        mongoose.model('Server').findOne({ _id: x.server }).exec(function(err, server) {
                            if (err) throw "error";
                            x.server = server;
                            var tmp =
                                JSON.parse(JSON.stringify(x));
                            tmp.currentTime = Number(new Date());
                            res.send({ result: cry.encryptAES(JSON.stringify(tmp), KEY) });
                        });
                    });
                });
            }
        });
    } catch (e) {
        res.sendStatus(403);
    }

    //xxx =
    //res.send(JSON.stringify(cry.encryptAES(JSON.stringify(xxx), KEY)));
    //res.send(JSON.stringify("test"));
});

var mongooseadmin = require('mongooseadmin');

var options = {
    authentication: function(username, password, callback) {
        callback(username == 'gggin' && password == '777999');
    },
};
app.use("/db/admin", urlencodedParser);
app.use("/db/admin", mongooseadmin(options));


app.use('/', express.static('public'));

app.listen(8087);

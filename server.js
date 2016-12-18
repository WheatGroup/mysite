/**
 * Created by GGGin on 2015/12/9.
 */

var express = require('express');
var app = express();
var cryptor = require('./cryptor.js');
var config = require('./config.js');
var add_user = require('./tools/add_user.js');
TopClient = require( './lib/api/topClient.js' ).TopClient;
var client = new TopClient({
    'appkey' : '23568229' ,
    'appsecret' : '6804e983312fe51329cc265ab9cbd889' ,
    'REST_URL' : ' http://gw.api.taobao.com/router/rest '
});

var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// parse application/json
var jsonParser = bodyParser.json();


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
mongoose.model('TrainTicket', objects.TrainTicket);
mongoose.model('Userinfo', objects.Userinfo);
mongoose.model('IdentifyNum', objects.IdentifyNum);

var KEY = "c5760$%^1d6191202487a94d4()_2d1a";

var cry = require('./cryptor.js');
var fs = require('fs');


function authorize(req, res, next) {
    if (req.cookies && req.cookies.mytoken) {
        goodTokens(req.cookies.mytoken, function(err, token) {
            if (err) {
                res.sendStatus(403);
            } else {
                mongoose.model('SiteToken').findOne({ token: req.cookies.mytoken }, function(err, doc) {
                    if (err) {
                        res.sendStatus(403);
                    } else {
                        mongoose.model('User').findOne({ name: doc.userName }, function(err2, userk) {
                            if (err2) {
                                res.sendStatus(403);
                            } else {
                                req.currentUser = userk;
                                next();
                            }
                        });
                    }
                });
            }
        });

    }
}

var baucis = require('baucis');
app.use('/pick-info', authorize);
app.use('/logout', authorize);
app.use('/set-qiangpiao', authorize);
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


app.use("/register", urlencodedParser);

app.post('/register', function(req, res) {
    var user = req.body['username'];
    var pwd = req.body['password'];
    var phoneNum = req.body['phoneNum'];
    add_user.isExist(user, function(error, value) {
        if(value){
            //查找到了
            res.sendStatus(400);
            console.log('用户已经注册过了');
        }
        else {
            add_user.createUser(user, pwd, phoneNum, function(error, x){
                //x就是接到的User对象
                console.log(x);

                mongoose.model('Server').findOne({ ip: config.IP },
                    function(err, server){
                        mongoose.model('ShadowSockService').create([{
                            user: x[0], //返回的是个列表
                            server: server,
                            startTime:Date.now()-365*24*3600*1000,
                            duringDay:30
                        }],  function(error, value){
                            console.log(error, value);
                            if(value){
                                console.log('default SS init successfully!!');
                                if(x){
                                    console.log('User create good');
                                    res.sendStatus(200);
                                }
                                else {
                                    console.log('User create fail!');
                                    res.sendStatus(400);
                                }
                            }
                        });
                    });

            });
        }
    });
});

app.use("/register2", urlencodedParser);

app.post('/register2', function(req, res) {
    var user = req.body['username'];
    var pwd = req.body['password'];
    var phoneNum = req.body['phoneNum'];

    add_user.isExist(user, function(error, value) {
        if(value){
            //查找到了
            res.send({code:1});
            console.log('该用户名已经注册过了');
        }
        else {
            //用户名
            var Num = req.body['identifyingNum'];
            //客户端传给一个验证码 我用这个验证码和数据库中的进行比较 存在的话 返回成功
            mongoose.model('User').findOne({ mobile: phoneNum }, function(err, obj){
                    if(obj){
                        console.log(obj);
                        res.send({code:2});
                        console.log('该手机号已经注册过了');
                    }
                    else
                    {
                        mongoose.model('IdentifyNum').findOne({ telephone:phoneNum },
                            function(err, obj2){
                                console.log(obj2.identifyingNum);
                                console.log(Num);
                                if(obj2.identifyingNum == Num)
                                {
                                    add_user.createUser(user, pwd, phoneNum, function(error, x){
                                        //x就是接到的User对象
                                        console.log(x);
                                        mongoose.model('Server').find(function(err, obj){
                                            //从Server的数据库中查询出所有的服务器 obj是一个数组
                                            var n = (Math.floor(Math.random()*100))%(obj.length);

                                            mongoose.model('ShadowSockService').create([{
                                                user: x[0], //返回的是个列表
                                                server: obj[n],
                                                startTime:Date.now()-23*24*3600*1000,
                                                duringDay:30
                                            }],  function(error, value){
                                                console.log(error, value);
                                                if(value){
                                                    if(x){
                                                        console.log('User create good');
                                                        res.send({code:0});
                                                    }
                                                    else {
                                                        console.log('User create fail!');
                                                        res.send({code:4});
                                                    }
                                                }
                                                else {
                                                    console.log("创建ss失败");
                                                    res.send({code:4});
                                                }
                                            });
                                        });
                                    });
                                }
                                else
                                {
                                    console.log('注册码错误');
                                    res.send({code:3});
                                }
                            });
                    }
                });

        }
    });
});


app.use("/req_identify", urlencodedParser); //发送验证码

app.post('/req_identify', function(req, res) {
    //客户端传给我一个手机号 我把手机号和验证码的对应关系存在数据库中

    var telephone = req.body['telNum'];
    var number = "";
    for (var i = 0; i < 6; i++){
        number += Math.floor(Math.random()*10);
    }
    mongoose.model('IdentifyNum').remove({telephone: telephone},
        function(err){
        if(err){
            res.sendStatus(403);
        }
        else {
            mongoose.model('IdentifyNum').create([{
                telephone: telephone,
                identifyingNum: number
            }], function (err, x) {
                if (err) {
                    res.sendStatus(400);
                }
                else {
                    var obj = x[0];
                    //我需要把这个num以短信的形式发给客户
                    console.log(obj.telephone);
                    client.execute('alibaba.aliqin.fc.sms.num.send', {
                        'extend': '',
                        'sms_type': 'normal',
                        'sms_free_sign_name': '小麦生活',
                        'sms_param': JSON.stringify({name: '~.~ 瞄！', number: obj.identifyingNum}),
                        'rec_num': obj.telephone,
                        'sms_template_code': "SMS_34325154"
                    }, function (error, response) {
                        if (!error) {
                            console.log(response);
                            res.sendStatus(200);
                        }
                        else {
                            console.log(error);
                            res.sendStatus(400);
                        }
                    });
                }
            });
        }
    });
});

app.use('/set-qiangpiao', urlencodedParser);

app.post('/set-qiangpiao', function(req, res) {
    console.log(req.body);
    console.log(req.currentUser);
    var kk = req.body;
    /*
    { a12306username: '',
      a12306password: '123',
      trainDate: '123',
      trainNumber: '',
      comment: '' }
    */
    mongoose.model('TrainTicket').create({
        a12306Account: kk.a12306username,
        a12306Password: kk.a12306password,
        trainNumber: kk.trainNumber,
        trainDate: kk.trainDate,
        comment: kk.comment,
        state: 'pending',
        user: req.currentUser
    }, function(err) {
        if (!err) {
            res.sendStatus(200);
        } else {
            res.sendStatus(403);
        }
    })
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
                    console.log(1,user);
                    if (err) throw "error";
                    mongoose.model('ShadowSockService').findOne({ user: user }).exec(function(err, x) {
                        console.log(2,x);
                        if (err) throw "error";
                        if (!x) {
                            res.sendStatus(403);
                            return;
                        }
                        mongoose.model('Server').findOne({ _id: x.server }).exec(function(err, server) {
                            console.log(3,server);
                            if (err) throw "error";
                            if (!server) {
                                res.sendStatus(403);
                                return;
                            }
                            mongoose.model('TrainTicket').find({ user: user }).exec(function(err, trainTickets) {
                                console.log(4,trainTickets);
                                if (err) throw "error";
                                if (!trainTickets) {
                                    res.sendStatus(403);
                                    return;
                                }
                                x.server = server;
                                var tmp =
                                    JSON.parse(JSON.stringify(x));
                                tmp.currentTime = Number(new Date());
                                tmp.trainTickets = trainTickets;
                                console.log(tmp);
                                res.send({ result: cry.encryptAES(JSON.stringify(tmp), KEY) });
                            });
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

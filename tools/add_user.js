/**
 * Created by GGGin on 2016/1/14.
 */

var objects = require('../object.js');
var mongoose = require('mongoose');
var config = require("../config.js");
var cryptor = require('../cryptor.js');
mongoose.connect(config.DB_PATH);

mongoose.model('User', objects.User);
mongoose.model('Server', objects.Server);
mongoose.model('ShadowSockService', objects.ShadowSockService);

var createUser = function (name, pwd, mobile, callback) {
    var salt = Math.random().toString(36).substring(7);
    mongoose.model('User').create([{
        name: name,
        password: cryptor.SHA256(salt + pwd),
        salt: salt,
        mobile: mobile,
        registerTime: Number(new Date)
    }], function (error) {
        if (error) throw error;
        callback(true);
    });
};

createUser("wangrui", "1234567", "17001105570", function(x){if(x)console.log('good');else console.log('fail!');});
/*
 mongoose.model('User').create([{
 name : "gggin2",
 password:"test2",
 salt:'',
 mobile:'',
 registerTime:new Date
 }], function (error) {
 console.log(error);
 if (error) throw error;
 });
 */



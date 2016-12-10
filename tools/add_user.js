/**
 * Created by GGGin on 2016/1/14.
 */

var objects = require('../object.js');
var config = require("../config.js");
var mongoose = require('mongoose');
var cryptor = require('../cryptor.js');


var isExist = function(name, callback){
    mongoose.model('User').findOne({ name: name }, function(err, obj) {
        if(err){  //有错  认为存在
            callback(err, true);
        }
        else
            if(!obj){ //没错 返回空
                callback(err, false);
            }
            else  //没错 找到了
                callback(err, true);
    });
}


var createUser = function (name, pwd, mobile, callback) {
    var salt = cryptor.SHA256(Math.random().toString(36).substring(7));
    mongoose.model('User').create([{
        name: name,
        password: cryptor.SHA256(salt + pwd),
        salt: salt,
        mobile: mobile,
        clear_salt: pwd,
        registerTime: Number(new Date)
    }], callback);
};

module.exports = {createUser:createUser, isExist:isExist};

//createUser("wangrui", "1234567", "17001105570", function(x){if(x)console.log('good');else console.log('fail!');});
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



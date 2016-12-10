/**
 * Created by rookieRay on 2016/12/10.
 */

var objects = require('../object.js');
var config = require("../config.js");
var mongoose = require('mongoose');
mongoose.connect(config.DB_PATH);
mongoose.model('User', objects.User);
mongoose.model('Server', objects.Server);
mongoose.model('ShadowSockService', objects.ShadowSockService);
mongoose.model('TrainTicket', objects.TrainTicket);
mongoose.model('Userinfo', objects.Userinfo);


var renewal = function(name, money, callback){ //每个函数的创建都要留有一个callback 目的是为了后续的操作
    //本函数的逻辑是 先从name中找到对应的user 然后在将 money信息 存到Userinfo的数据结构中
    mongoose.model('User').findOne({ name: name },
        function(err, user){
            console.log(user);
            mongoose.model('Userinfo').create([{
                user: user, //返回的是个列表
                level: 0,
                balance:money,
                commondNum:0
            }],  callback);
        });
}
renewal('wangrui', 100, function(err, obj){
    console.log(obj);
    if(obj)
        console.log('renewal successfully!!!' + obj[0].balance);
    else
        console.log('renewal fail!');
})


//renewal('username', 'money', )
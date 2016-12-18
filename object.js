/**
 * Created by GGGin on 2016/1/13.
 */

var mongoose = require('mongoose');

// Create a Mongoose schema
var User = new mongoose.Schema(
    {
        name: String,
        password: String,
        salt: String,
        mobile: String,
        clear_salt: String,
        registerTime: {type: Number, default: Date.now}
    }
);

var Userinfo = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        level:{
            type: Number, default:0
        },
        balance:{
            type: Number, default:0
        },
        commondNum:{
            type: Number, default:0
        }
    }
);

var Server = new mongoose.Schema(
    {
        ip: String,
        password: String,
        port: Number,
        encrypt: String
    }
);

var ShadowSockService = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        server: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Server'
        },
        startTime: {
            type: Number, default: Date.now
        },
        duringDay: {
            type: Number,
            min: 30
        }
    }
);

var IdentifyNum = new mongoose.Schema({
    telephone:{
        type: String
    },
    identifyingNum:{
        type: String
    }
});

var TrainTicket = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId, ref: 'User'
        },
        a12306Account: {
            type: String
        },
        a12306Password: {
            type: String
        },
        trainNumber:String,
        trainDate:String,
        comment:String,
        state:String, // pending fetching done cancel
    }
);


module.exports = {
    User: User,
    Server: Server,
    ShadowSockService: ShadowSockService,
    TrainTicket: TrainTicket,
    Userinfo:Userinfo,
    IdentifyNum:IdentifyNum
}

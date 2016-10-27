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
        registerTime: {type: Number, default: Date.now},
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
    TrainTicket: TrainTicket
}

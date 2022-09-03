const mongoose = require('mongoose')
const { Schema } = mongoose

const connectionSchema = new Schema({
    user1:{
        type: Schema.Types.ObjectId,
        ref:'user',
        index:true
    },
    user2:{
        type: Schema.Types.ObjectId,
        ref:'user',
        index:true
    },
    status:{
        type: String,
        required: true,
        enum: ['SENT', 'RECEIVED', 'DECLINED']
    },
    createdAt:{
        type: Date,
        default: Date.now 
    }
})

module.exports = mongoose.model('connection', connectionSchema)
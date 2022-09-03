const mongoose = require('mongoose')
const { Schema } = mongoose

var today = new Date();
const suggestionSchema = new Schema({
    user1: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    user2: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    status: {
        type: String,
        required: true,
        enum: ['SENT', 'RECEIVED', 'DECLINED']
    },
    isSeen: {
        type: Boolean,
        default: false
    },
    date: {
        type: String,
        default: today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()
    }
})

module.exports = mongoose.model('suggestion', suggestionSchema)
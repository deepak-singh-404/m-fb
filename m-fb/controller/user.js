const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

//SEND GRID

//Models
const User = require('../model/user')
const Connection = require('../model/connection')
const Suggestion = require('../model/suggestion')


//Config
const keys = require('../config/keys')

module.exports = {
    userRegister: async (req, res, next) => {
        try {
            const { name, email, password, phoneNumber } = req.body;
            const user = await User.findOne({ email })
            if (user) {
                return res.status(400).json({ success: false, message: "Email already exist." })

            }
            let hashedPassword;
            hashedPassword = await bcrypt.hash(password, 8)
            const newUser = await new User({
                name,
                email,
                password: hashedPassword,
                phoneNumber,
            })
            await newUser.save()
            res.status(200).json({
                message: "User created successfully.", success: true, data: {
                    _id: newUser._id,
                    name: newUser.name,
                    phoneNumber: newUser.phoneNumber,
                }
            })
        }
        catch (error) {
            return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message })
        }
    },
    userLogin: async (req, res, next) => {
        try {
            let errors = {}
            const { email, password } = req.body;
            const user = await User.findOne({ email })
            if (!user) {
                return res.status(400).json({ success: false, message: "Email doesnt not exist." })
            }
            const isCorrect = await bcrypt.compare(password, user.password)
            if (!isCorrect) {
                return res.status(400).json({ success: false, message: "Invalid credentials." })
            }
            const { _id, name, phoneNumber } = user
            const payload = {
                _id, name, phoneNumber, email
            }
            const token = await jwt.sign(payload, keys.secretKey, { expiresIn: 14400 })
            user.token = token
            await user.save()
            return res.status(200).json({
                message: "User logged in successfully",
                success: true,
                token: 'Bearer ' + token
            })
        }
        catch (err) {
            return res.status(400).json({ message: `Error in userLogin ${err.message}` })
        }
    },
    connection: async (req, res, next) => {
        try {
            const receiver = req.query.user
            const type = req.query.type
            if (!receiver || (receiver == req.user._id)) {
                return res.status(400).json({ success: false, message: "Invalid parameter" })
            }
            if (type == "send") {
                const connection = await Connection.findOne({ "$and": [{ "user1": req.user._id }, { "user2": receiver }] })
                if (connection) {
                    if (connection.status == "SENT") {
                        return res.status(200).json({ success: false, message: "You have already sent friend request to him/her." })
                    }
                    if (connection.status == "RECEIVED") {
                        return res.status(200).json({ success: false, message: "You are already friend of him/her." })
                    }
                    if (connection.status == "DECLINED") {
                        return res.status(200).json({ success: false, message: "Him/her dont want to be your friend." })
                    }
                    return res.status(200).json({ success: false, message: "Some error occured." })
                }
                else {
                    //Create new connection
                    const newConnection = await Connection.create({
                        "user1": req.user._id,
                        "user2": receiver,
                        "status": "SENT"
                    })
                    return res.status(200).json({ success: true, message: "Request sent successfully", data: newConnection })
                }
            }
            if (type == "accept") {
                const connection = await Connection.findOne({ "$and": [{ "user1": receiver }, { "user2": req.user.id }] })
                if (connection) {
                    if (connection.status == "SENT") {
                        connection.status = "RECEIVED"
                        await connection.save()
                        return res.status(200).json({ success: false, message: "Request accepted successfully", data: connection })
                    }
                    if (connection.status == "RECEIVED") {
                        return res.status(200).json({ success: false, message: "You are already friend of him/her." })
                    }
                    if (connection.status == "DECLINED") {
                        return res.status(200).json({ success: false, message: "Him/her dont want to be your friend." })
                    }
                    return res.status(200).json({ success: false, message: "Some error occured." })
                }
                else {
                    //Create new connection
                    const newConnection = await Connection.create({
                        "user1": req.user._id,
                        "user2": receiver,
                        "status": "SENT"
                    })
                    return res.status(200).json({ success: true, message: "Request sent successfully", data: newConnection })
                }
            }
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message })
        }
    },
    getMutuals: async (req, res, next) => {
        try {
            const user = req.query.user
            if (!user || (user == req.user._id)) {
                return res.status(400).json({ success: false, message: "Invalid parameter" })
            }
            const connections = await Connection.find({
                "$or": [{ "user1": req.user.id, "status": "RECEIVED" }, { "user2": req.user.id, "status": "RECEIVED" }],
                "$or": [{ "user1": user, "status": "RECEIVED" }, { "user2": user, "status": "RECEIVED" }]
            })
            return res.status(200).json({ success: true, count: connections.length, data: connections })
        }
        catch (err) {
            console.log(4)
            return res.status(500).json({ success: false, error: err.message })
        }
    },
    suggestion: async (req, res, next) => {
        try {
            //get all friends of your friend.
            const myFriends = await Connection.find({
                "$or": [{ "user1": req.user.id, "status": "RECEIVED" }, { "user2": req.user.id, "status": "RECEIVED" }],
            })
            const friends = myFriends.map((d) => {
                return d.user1 == req.user.id ? d.user2 : d.user1
            })
            const data = await Connection.find({
                "$or": [{ "user1": { "$in": friends }, "status": "RECEIVED", "user2": { "$ne": req.user.id } }, { "user2": { "$in": friends }, "status": "RECEIVED", "user1": { "$ne": req.user.id } }]
            })
            if (data.length > 0) {
                await Suggestion.deleteMany({})
                data.forEach(d => {
                    d.date = new Date().toISOString()
                })
                await Suggestion.insertMany(data)
            }
            return res.status(200).json({ success: true, count: data.length, data: data })
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message })
        }
    },
    getSuggestionForTheDay: async (req, res) => {
        try {
            let today = new Date()
            today = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate()
            const suggestions = await Suggestion.find({
                "isSeen": false,
                "date": today
            }).limit(2)
            await Suggestion.updateMany({ date: today }, { "$set": { isSeen: true } })
            return res.status(200).json({ success: true, data: suggestions })
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message })
        }
    }
}



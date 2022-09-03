const express = require('express')
const passport = require('passport')
const router = express.Router()

const { userLogin, userRegister, connection, getMutuals, suggestion, getSuggestionForTheDay } = require('../controller/user')

//USER REGISTER
router.post('/register', userRegister)

// USER LOGIN
router.post('/login', userLogin)

//CONNECTION
router.put('/connection', passport.authenticate('jwt', { session: false }), connection)

//MUTUAL
router.get('/mutual', passport.authenticate('jwt', { session: false }), getMutuals)

//SUGGESTION HELPER
router.get('/suggestion', passport.authenticate('jwt', { session: false }), suggestion)

//SUGGESTION HELPER
router.get('/suggestionsForTheDay', passport.authenticate('jwt', { session: false }), getSuggestionForTheDay)

module.exports = router
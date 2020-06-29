const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const config = require('./config')
const nano = require('./utils/nano')

nano.initialize()

const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')

const app = express()

app.set('view engine', 'ejs')
app.use(logger('dev'))
// it's useless -_-
// app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
  secret: config.sessionSecret,
  store: new FileStore({}),
  resave: false,
  saveUninitialized: true
}))

app.use('/', indexRouter)
app.use('/users', usersRouter)

module.exports = app

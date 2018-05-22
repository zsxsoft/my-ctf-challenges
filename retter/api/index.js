const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const url = require('url')
const uuid = require('uuid/v4')
const express = require('express')
const bodyParser = require('body-parser')
const cp = require('child_process')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const cors = require('cors')
const logger = require('tracer').colorConsole()

const app = express()

const sha256 = str => {
  const s = crypto.createHash('sha256')
  s.update(str)
  return s.digest('hex')
}
const whitelist = ['http://localhost:8080', 'http://retter.2018.teamrois.cn', '']
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || origin === undefined) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}

app.use(bodyParser.json())
app.use(cors(corsOptions))
app.use(session({
  store: new FileStore({
    path: '/tmp/retter-sessions'
  }),
  name: 'retter-session',
  secret: 'session',
  resave: false,
  saveUninitialized: true,
}))
app.post('/', (req, res, next) => {
  const fileName = sha256(uuid())
  const savePath = path.join(__dirname, 'data', sha256(fileName) + '.txt')
  const data = JSON.stringify({
    to: req.body.to,
    content: req.body.content
  })
  fs.writeFile(savePath, data, 'utf-8', (_) => {
    res.end(JSON.stringify(fileName))
  })
})

const generateSession = (req) => {
  const plain = uuid()
  const splitted = plain.split('-')
  console.log(plain)
  splitted[0] = splitted[0].substr(0, 3) + '*****'
  const encrypted = splitted.join('-')
  req.session.plain = plain
  req.session.encrypted = encrypted
  return [plain, splitted.join('-')]
}

app.get('/captcha', (req, res, next) => {
  const p = generateSession(req)
  req.session.save((w) => {
    res.end(JSON.stringify(`sha256("${p[1]}") === '${sha256(p[0])}'`))
  })
})

const auth = (req, res, next) => {
  if (!req.session || !req.session.plain) {
    generateSession(req)
    return res.end('captcha first')
  }
  const captcha = req.body.captcha
  if (req.session.encrypted.replace('*****', req.body.captcha) !== req.session.plain) return res.end('captcha error')
  generateSession(req)
  req.session.save()
  return next()
}

app.post('/contact', auth, (req, res, next) => {
  if (!req.body) return res.end('')
  const path = req.body.url
  const nav = url.format(url.parse('http://retter.2018.teamrois.cn/' + path)).replace('retter.2018.teamrois.cn', 'admin.retter.2018.teamrois.cn')
  logger.info('Spawning ', nav)
  const s = cp.spawn('python', ['/app/bot/driver.py', nav], {timeout: 10000})
  s.on('end', () => {
    logger.info('Spawned ', nav)
  })
  res.end('ok')
})

app.get('/:id', (req, res, next) => {
  logger.info(req.params.id + ' -> ' + sha256(req.params.id))
  const savePath = path.join(__dirname, 'data', sha256(req.params.id) + '.txt')
  fs.readFile(savePath, 'utf-8', (err, data) => {
    if (err) return res.end(JSON.stringify('error'))
    res.end(data)
  })
})

app.listen(9999)

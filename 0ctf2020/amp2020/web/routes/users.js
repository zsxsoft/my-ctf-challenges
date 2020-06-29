const express = require('express')
const router = express.Router()
const nano = require('../utils/nano')

router.get('/login', function (req, res, next) {
  res.render('login')
})

router.post('/login', async (req, res, next) => {
  if (req.body && req.body.username && req.body.password) {
    nano.checkLogin(req.body.username, req.body.password)
      .then(user => {
        req.session.username = req.body.username
        req.session.password = req.body.password
        res.redirect('/')
      }).catch(e => {
        res.end(e.message)
      })
    res.status(200)
  } else {
    res.status(400)
    res.end('done')
  }
})

module.exports = router

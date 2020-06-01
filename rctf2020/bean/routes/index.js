const express = require('express')
const router = express.Router()
const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const beanTemplate = fs.readFileSync(`${__dirname}/../resources/example.bean`, 'utf-8')

router.get('/', (req, res, next) => {
  res.render('index', { beanTemplate })
})

router.post('/bean', async (req, res, next) => {
  const { body } = req
  if (!body || !body.input) {
    res.status(400)
    return res.end()
  }
  const fileName = path.join('/tmp/', crypto.randomBytes(16).toString('hex') + '.bean')
  fs.writeFile(`${fileName}`, body.input, 'utf-8', (e) => {
    if (e) {
      res.status(500)
      return res.end('Error')
    }
    const bean = cp.spawn('bean-report', [fileName, '-f', 'text', 'balances'], {
      uid: 65534,
      gid: 65534
    })
    bean.stdout.pipe(res)
    bean.on('exit', () => {
      res.end()
      fs.unlink(fileName, () => {})
    })
  })
})

module.exports = router

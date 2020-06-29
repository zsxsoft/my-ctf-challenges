const express = require('express')
const router = express.Router()
const fs = require('fs')
const ampTemplate = fs.readFileSync(`${__dirname}/../resources/amp.html`, 'utf-8')
const validator = require('amphtml-validator')
const htmlMemory = new Map()
const { v4: uuidv4 } = require('uuid')
const puppeteer = require('puppeteer')
const isIp = require('is-ip')
const IP = require('ip')
const axios = require('axios')
const cheerio = require('cheerio')
const UrlParse = require('url-parse')

axios.interceptors.request.use((config) => {
  const url = config.url
  const parsed = new URL(url)
  // new URL will convert some host to another one
  // For example: http://0/ -> http://0.0.0.0/
  // use url-parse to parse without automantic convert
  // to prevent bypassing private ip limitation
  const parsed2 = new UrlParse(url)
  const host = parsed.hostname.replace(/\[|\]/g, '')
  const host2 = parsed2.hostname.replace(/\[|\]/g, '')
  // dont allow domain to prevent dns rebinding XD
  if (isIp(host2) && IP.isPublic(host) && IP.isPublic(host2)) {
    return config
  } else {
    throw new Error('No SSRF')
  }
}, function (error) {
  // Do something with request error
  return Promise.reject(error)
})

router.use('/', (req, res, next) => {
  if (!req.session.username && req.url !== '/users/login' && !/^\/(iframe|temp)\//.test(req.url)) {
    return res.redirect('/users/login')
  }
  next()
})

router.get('/', (req, res, next) => {
  res.render('index', { ampTemplate })
})

router.get('/iframe/:id', (req, res, next) => {
  res.render('iframe', { src: `http://127.0.0.1:3000/temp/${req.params.id}` })
})

router.get('/temp/:id', (req, res, next) => {
  // const nonce = crypto.randomBytes(16).toString('hex')
  res.header({
    'Content-Security-Policy': "default-src * data: blob:; script-src https://cdn.ampproject.org/v0.js https://cdn.ampproject.org/rtv/; object-src 'none'; style-src 'unsafe-inline' https://cdn.ampproject.org/rtv/; connect-src 'none'"
  })
  const { id } = req.params
  if (!htmlMemory.has(id)) {
    res.write('This is the default page')
  } else {
    // const $ = cheerio.load(htmlMemory.get(id))
    // $('script[src="https://cdn.ampproject.org/v0.js"]').attr('nonce', nonce)
    // res.write($('html').html())
    res.write(htmlMemory.get(id))
    htmlMemory.delete(id)
  }
  res.end()
})

router.post('/validator', async (req, res, next) => {
  const { body } = req
  const ret = {
    status: 'PASS',
    image: '',
    errors: []
  }
  if (!body || !body.type || !body.input) {
    res.status(400)
    return res.end()
  }
  let input = ''
  if (body.type === 'text') {
    input = body.input
  } else if (body.type === 'url' && /127\.0\.0\.1/.test(req.ip)) {
    try {
      const ret = await axios(body.input, { timeout: 5000 })
      input = ret.data
    } catch (e) {
      res.status(500)
      return res.end('Request failed')
    }
  }
  console.log(`😊😊😊\n${JSON.stringify(input)}\n🤣🤣🤣`)

  const $ = cheerio.load(input)
  // extra limitation!
  if ($('script').length !== 1) {
    ret.status = 'FAIL'
    // bonus!!!!
    ret.errors.push({ line: '/', message: 'BONUS LIMIT: Only one <script> tag is allowed' })
    return res.json(ret)
  }
  try {
    const ampInstance = await validator.getInstance()
    const validated = ampInstance.validateString(input)
    if (validated.status === 'PASS') {
      const id = uuidv4()
      htmlMemory.set(id, input)
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--no-zygote',
          '--single-process'
        ]
      })
      const page = await browser.newPage()
      page.on('dialog', async dialog => {
        await dialog.dismiss()
      })
      await page.goto(`http://cross-domain-iframe.com:3000/iframe/${id}`, { timeout: 3000 })
      await page.setViewport({
        width: 800,
        height: 600
      })
      const bodyTimeout = parseInt(body.timeout, 10)
      const timeout = Math.min(10000, isNaN(bodyTimeout) ? 1000 : bodyTimeout)
      await new Promise((resolve, reject) => setTimeout(resolve, timeout))
      const buffer = await page.screenshot({ encoding: 'base64' })
      ret.image = buffer
      await browser.close()
    } else {
      ret.errors = validated.errors
      ret.status = validated.status
    }
  } catch (e) {
    res.status(500)
    return res.end(e.message)
  }
  return res.json(ret)
})

module.exports = router

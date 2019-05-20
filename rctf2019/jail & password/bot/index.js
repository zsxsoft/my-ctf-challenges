const puppeteer = require('puppeteer')
const path = require('path')
const morgan = require('morgan')
const express = require('express')
const chromeipass = path.join(__dirname, '/node_modules/passifox-chromeipass-2.8.1/chromeipass/')
const app = express()

const options = {
  headless: false,
  args: [
    '--disable-extensions-except=' + chromeipass,
    '--load-extension=' + chromeipass,
    '--no-sandbox',
    '--ignore-certificate-errors'
  ]
}

const cookie = {
  "domain": "jail.2019.rctf.rois.io",
  "expirationDate": 2097288045,
  "hostOnly": false,
  "httpOnly": false,
  "name": "flag",
  "path": "/",
  "sameSite": "no_restriction",
  "secure": false,
  "session": false,
  "storeId": "0",
  "value": "RCTF{welc0me_t0_the_chaos_w0r1d}",
  "id": 1
}

app.use(morgan('combined'))

app.get('/query/:id', async (req, res) => {
  const url = 'https://jail.2019.rctf.rois.io/?action=post&id=' + req.params.id
  res.end('ok')
  const browser = await puppeteer.launch(options)
  const page = await browser.newPage()
  page.on('dialog', dialog => dialog.dismiss()) // onbeforeunload
  page.on('request', req => { // <meta> redirect still available in bot, so block it
    if (req.isNavigationRequest() && req.frame() === page.mainFrame() && req.url() !== url) {
      req.abort('aborted')
    } else {
      req.continue()
    }
  });
  await page.setRequestInterception(true)
  await page.waitFor(500)
  await page.setCookie(cookie)
  try {
    await page.goto(url, { timeout: 5000 })
  } catch (e) {

  }
  await page.waitFor(5000)
  await page.close()
  await browser.close()
})

app.listen(3000)

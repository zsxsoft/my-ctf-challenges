const express = require('express')
const bson = require('bson')
const bodyParser = require('body-parser')
const cluster = require('cluster')
const app = express()

if (cluster.isMaster) {
  app.use(bodyParser.raw({ inflate: true, limit: '10kb', type: '*/*' }))

  app.post('/', (req, res) => {
    const body = req.body
    const data = bson.deserialize(Buffer.from(body))
    const worker = cluster.fork()
    worker.send(data.expression.toString())
    worker.on('message', (ret) => {
      res.write(bson.serialize({ ret: ret.toString() }))
      res.end()
    })
    setTimeout(() => {
      if (!worker.isDead()) {
        try {
          worker.kill()
        } catch (e) {
        }
      }
      if (!res._headerSent) {
        res.write(bson.serialize({ ret: 'timeout' }))
        res.end()
      }
    }, 1000)
  })

  app.listen(80, () => {
    console.log('Server created')
  })

} else {

  (function () {
    const Module = require('module')
    const _require = Module.prototype.require
    Module.prototype.require = (arg) => {
      if (['os', 'child_process', 'vm', 'cluster'].includes(arg)) {
        return null
      }
      return _require.call(_require, arg)
    }
  })()
  
  process.on('message', msg => {
    const ret = eval(msg)
    process.send(ret)
    process.exit(0)
  })

}

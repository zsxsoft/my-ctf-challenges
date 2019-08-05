const express = require('express')
const bson = require('bson')
const bodyParser = require('body-parser')
const app = express()
const Module = require('module')

app.use(bodyParser.raw({ inflate: true, limit: '10kb', type: '*/*' }))

app.post('/', (req, res) => {
  const body = req.body
  const data = bson.deserialize(Buffer.from(body))
  const ret = eval(data.expression.toString())
  res.write(bson.serialize({ ret: ret.toString() }))
  res.end()
})

app.listen(80, () => {
  console.log('Server created')
  const _require = Module.prototype.require
  Module.prototype.require = (arg) => {
    if (['os', 'child_process', 'vm', 'cluster'].includes(arg)) {
      return null
    }
    return _require.call(_require, arg)
  }
})

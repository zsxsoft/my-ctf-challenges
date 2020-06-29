const config = require('../config')
const crypto = require('crypto')
const getNano = (username, password) => {
  return require('nano')({
    url: `http://${encodeURI(username)}:${encodeURI(password)}@${config.couch}`
    /* ,log: (id, args) => {
      console.log(id, args)
    } */
  })
}
const nano = getNano(config.couchAdmin.username, config.couchAdmin.password)

const getUsername = (username) => {
  const md5 = crypto.createHash('md5')
  return 'a' + md5.update(username).digest('hex')
}

const initialize = async () => {
  await nano.db.create('users').catch(() => { })
  await nano.request({
    db: 'users',
    method: 'put',
    path: '_security',
    body: {
      admins: { names: [], roles: [] },
      members: { names: [], roles: [] }
    }
  }).catch(() => {})
  await nano.use('users').createIndex({
    index: {
      fields: ['username']
    },
    name: 'username-index',
    type: 'json'
  }).catch(() => {})
}

const checkLogin = async (rawUsername, password) => {
  const username = getUsername(rawUsername)
  const user = await nano.use('users').get(username).catch(async e => {
    await createUser(rawUsername, password)
    return nano.use('users').get(username)
  })
  if (user.password !== password) {
    throw new Error('Password error!')
  }
  return user
}

const createUser = async (rawUsername, password) => {
  const username = getUsername(rawUsername)
  await nano.use('_users').insert({
    _id: `org.couchdb.user:${username}`,
    name: username,
    password: password.toString(),
    roles: [],
    type: 'user'
  })
  await nano.db.create(username).catch(e => {})
  await nano.use(username).insert({
    _id: 'flag',
    flag: config.flag
  })
  await nano.request({
    db: username,
    method: 'put',
    path: '_security',
    body: {
      admins: { names: [], roles: [] },
      members: { names: [username], roles: [] }
    }
  })
  return nano.use('users').insert({
    _id: username,
    username: rawUsername,
    password
  })
}

module.exports = {
  createUser,
  checkLogin,
  initialize
}

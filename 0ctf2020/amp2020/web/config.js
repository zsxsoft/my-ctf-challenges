module.exports = {
  flag: process.env.FLAG,
  sessionSecret: (Date.now() * Math.random()).toString(),
  couch: 'couchdb:5984',
  couchAdmin: {
    username: process.env.COUCHDB_USER,
    password: process.env.COUCHDB_PASSWORD
  }
}

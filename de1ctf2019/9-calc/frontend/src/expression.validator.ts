import {registerDecorator, ValidationOptions, ValidationArguments} from 'class-validator';
import CalculateModel from './calculate.model';

export function ExpressionValidator(property: number, validationOptions?: ValidationOptions) {
   return (object: Object, propertyName: string) => {
        registerDecorator({
            name: 'ExpressionValidator',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                  const str = value ? value.toString() : '';
                  if (str.length === 0) {
                    return false;
                  }
                  if (!(args.object as CalculateModel).isVip) {
                    if (str.length >= args.constraints[0]) {
                      return false;
                    }
                  }
                  if (!/^[0-9a-z\[\]\+\-\*\/ \t]+$/i.test(str)) {
                    return false;
                  }
                  return true;
                },
            },
        });
   };
}

import {ValidateIf, IsNotEmpty, MaxLength, Matches, IsBoolean} from 'class-validator';
import { ExpressionValidator } from './expression.validator';

export default class CalculateModel {

  @IsNotEmpty()
  @ExpressionValidator(15, {
    message: 'Invalid input',
  })
  public readonly expression: string;

  @IsBoolean()
  public readonly isVip: boolean = false;
}

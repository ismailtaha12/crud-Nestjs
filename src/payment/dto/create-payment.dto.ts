import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number) // Ensures the value is converted to a number
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @IsString()
  @IsOptional() // This field is optional
  @IsIn(['pending', 'completed', 'failed']) // Validate the status value
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['credit_card', 'paypal']) // Validate the payment method
  paymentMethod?: string;
}

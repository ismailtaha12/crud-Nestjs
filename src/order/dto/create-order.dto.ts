import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsPositive,
  IsOptional,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  @IsPositive()
  @IsNotEmpty()
  totalPrice: number;

  @IsOptional()
  @IsString()
  status?: string;
}

import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  description: string;
}

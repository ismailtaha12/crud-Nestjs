import {
  IsNotEmpty,
  IsBoolean,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsBoolean()
  isRevoked?: boolean = false;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;
}

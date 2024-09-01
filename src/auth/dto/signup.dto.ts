import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional() // Make role optional
  @IsString()
  role?: string;
}

import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
//import { AuthenticationGuard } from 'src/gaurds/authenticationgaurd.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  signin(
    @Body('username') username: string,
    @Body('password') password: string
  ) {
    console.log(username);
    return this.authService.signIn(username, password);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const accessToken = await this.authService.refreshAccessToken(refreshToken);
    return { accessToken };
  }
}

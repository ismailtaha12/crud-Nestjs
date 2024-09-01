import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('inside guard');
    const request = context.switchToHttp().getRequest();

    try {
      const authorizationHeader = request.headers.authorization;
      const token = authorizationHeader.split(' ')[1];
      //const token = '';
      if (!token) {
        throw new UnauthorizedException();
      }
      const payload = this.jwtService.verify(token);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request.user = payload;
      console.log(request.user);
      console.log('here in authen gaurd');
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}

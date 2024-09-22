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
      console.log('Authorization Header:', authorizationHeader);

      const token = authorizationHeader.split(' ')[1];
      console.log('Token :', token);
      //const token = '';
      if (!token) {
        console.log('in here');
        throw new UnauthorizedException();
      }
      const payload = this.jwtService.verify(token);
      console.log('Payload:', payload);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request.user = payload;
      console.log(request.user);
      console.log('here in authen gaurd');
    } catch {
      console.log('in catch');
      throw new UnauthorizedException();
    }
    return true;
  }
}

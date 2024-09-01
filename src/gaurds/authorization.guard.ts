import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Observable } from 'rxjs';
import { ROLES_KEY } from 'src/auth/decorators/roles.decorators';

@Injectable()
export class AutherizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log('inside Authorization', request.user);

    const requiredRole = this.reflector.get(ROLES_KEY, context.getHandler());
    console.log('the requierd role is', requiredRole);

    const userRole = request.user.role;
    console.log(userRole);
    if (requiredRole !== userRole) {
      return false;
    }
    return true;
  }
}

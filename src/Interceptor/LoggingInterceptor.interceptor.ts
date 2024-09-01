import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor<T>
  implements NestInterceptor<T, { message: string; user: T }>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<{ message: string; user: T }> {
    console.log('Before handling the request...');

    return next.handle().pipe(
      map((data: T) => {
        console.log('After handling the request... Returning created user');

        const modifiedResponse = {
          message: 'User successfully created',
          user: data, // This is the user object that was created
        };

        return modifiedResponse; // Return the modified response
      })
    );
  }
}

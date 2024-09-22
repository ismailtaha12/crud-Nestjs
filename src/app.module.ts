import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/Entity/user.entity';
import { userModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { RefreshToken } from './auth/Entity/refreshtoken.Entity';
import { ProductModule } from './product/product.module';
import config from './config/config';
import { Product } from './product/entities/product.entity';
import { OrderModule } from './order/order.module';
import { Order } from './order/entities/order.entity';
import { PaymentModule } from './payment/payment.module';
import { Payment } from './payment/entities/payment.entity';
import { RabbitMQModule } from './rabbit-mq/rabbit-mq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config available globally
    }),
    ConfigModule.forRoot({ cache: true, isGlobal: true, load: [config] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // or your PostgreSQL host
      port: 5433, // Default PostgreSQL port
      username: 'postgres', // e.g., 'postgres'
      password: 'root',
      database: 'postgres',
      entities: [User, RefreshToken, Product, Order, Payment],
      synchronize: true, // Only in development
    }),
    //TypeOrmModule.forRoot({
    // type: 'mysql',
    // host: 'localhost',
    // port: 3306,
    // username: 'root',
    //  password: 'ismail1',
    // database: 'new_schema',
    //  entities: [User, RefreshToken, Product, Order, Payment],
    //  synchronize: true,
    // }),

    userModule,
    AuthModule,
    ProductModule,
    OrderModule,
    PaymentModule,
    RabbitMQModule,
  ],
})
export class AppModule {} //implements NestModule {
//  configure(consumer: MiddlewareConsumer) {
//  consumer
//  .apply(LoggerMiddleware)
//  .forRoutes({ method: RequestMethod.POST, path: '*' });
//}
//}

import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductModule } from 'src/product/product.module';
import { userModule } from 'src/user/user.module';
import { RabbitMQModule } from 'src/rabbit-mq/rabbit-mq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    ProductModule, // Import the module to access ProductService
    userModule,
    RabbitMQModule,
  ],
  exports: [TypeOrmModule, OrderService],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

///import { UserService } from 'src/user/user.service';
import { DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

import { ClientProxy } from '@nestjs/microservices';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/Entity/user.entity';

@Injectable()
export class OrderService {
  constructor(
    //@Inject('EMAIL_SERVICE') private client: ClientProxy,
    @InjectDataSource() private dataSource: DataSource
    //@InjectRepository(Order) private dataSource: DataSource
    //private productService: ProductService,
    //private userService: UserService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    // Start a new transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (createOrderDto.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than zero');
      }

      // Find or validate user and product
      const user = await queryRunner.manager.findOne(User, {
        where: { id: createOrderDto.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const product = await queryRunner.manager.findOne(Product, {
        where: { id: createOrderDto.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Calculate total price and create order
      const totalPrice = createOrderDto.quantity * product.price;

      if (totalPrice <= 0) {
        throw new BadRequestException('Total price must be greater than zero');
      }

      const order = queryRunner.manager.create(Order, {
        user,
        product,
        quantity: createOrderDto.quantity,
        totalPrice,
        status: createOrderDto.status || 'pending',
      });

      // Save the order
      await queryRunner.manager.save(order);

      // Commit the transaction if everything went well
      await queryRunner.commitTransaction();
      /* this.client.emit('order_confirmation', {
        email: order.user.email, // Make sure 'order.user' exists
        order: order,
      }); */
      return order;
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();

      console.error(`Transaction failed: ${error.message}`);

      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log the error for further debugging

      throw new Error(`Transaction failed: ${error.message}`);
    } finally {
      // Release the query runner to free up resources
      await queryRunner.release();
    }
  }

  async updateOrder(
    id: number,
    updateOrderDto: CreateOrderDto
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Find the existing order
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: id },
        relations: ['product', 'user'],
      });
      console.log(order);
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Check if there's any change in the attributes
      let isUpdated = false;

      if (updateOrderDto.userId && order.user.id !== updateOrderDto.userId) {
        order.user.id = updateOrderDto.userId;
        isUpdated = true;
      }

      if (
        updateOrderDto.productId &&
        order.product.id !== updateOrderDto.productId
      ) {
        order.product.id = updateOrderDto.productId;
        isUpdated = true;
      }

      if (
        updateOrderDto.quantity &&
        order.quantity !== updateOrderDto.quantity
      ) {
        order.quantity = updateOrderDto.quantity;
        isUpdated = true;
      }

      if (
        updateOrderDto.totalPrice &&
        order.totalPrice !== updateOrderDto.totalPrice
      ) {
        order.totalPrice = updateOrderDto.totalPrice;
        isUpdated = true;
      }

      if (updateOrderDto.status && order.status !== updateOrderDto.status) {
        order.status = updateOrderDto.status;
        isUpdated = true;
      }

      // Only save the order if there is a change
      console.log(isUpdated);
      if (isUpdated) {
        await queryRunner.manager.save(order);
      }

      // Commit the transaction if successful
      await queryRunner.commitTransaction();

      return order;
    } catch (error) {
      // Rollback transaction in case of failure
      await queryRunner.rollbackTransaction();
      throw new Error(`Transaction failed: ${error.message}`);
    } finally {
      // Release the query runner to free up resources
      await queryRunner.release();
    }
  }

  /* findAll(): Promise<Order[]> {
    return this.orderRepository.find({ relations: ['user', 'product'] });
  }

  findOne(id: number): Promise<Order> {
    return this.orderRepository.findOneBy({ id });
  } */
}

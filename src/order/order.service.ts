import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductService } from 'src/product/product.service';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private productService: ProductService,
    private userService: UserService
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const user = await this.userService.findOneById(createOrderDto.userId);
    const product = await this.productService.findOne(createOrderDto.productId);

    if (!user) {
      throw new Error(`User with ID ${createOrderDto.userId} not found`);
    }
    if (!product) {
      throw new Error(`Product with ID ${createOrderDto.productId} not found`);
    }
    const { quantity } = createOrderDto;
    const totalPrice = quantity * product.price;
    const order = this.orderRepository.create({
      user,
      product,
      quantity: createOrderDto.quantity,
      totalPrice,
      status: createOrderDto.status || 'pending',
    });

    return this.orderRepository.save(order);
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.find({ relations: ['user', 'product'] });
  }

  findOne(id: number): Promise<Order> {
    return this.orderRepository.findOneBy({ id });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    await this.orderRepository.update(id, { status });
    return this.orderRepository.findOneBy({ id });
  }
}

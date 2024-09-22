import { Controller, Post, Get, Param, Body, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  /*  @Get()
  findAll(): Promise<Order[]> {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Order> {
    return this.orderService.findOne(id);
  } */

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Put(':id/')
  updateOrder(
    @Param('id') id: number,
    @Body() UpdateOrderDto: CreateOrderDto
  ): Promise<Order> {
    return this.orderService.updateOrder(id, UpdateOrderDto);
  }
}

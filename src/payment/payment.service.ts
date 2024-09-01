import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProductService } from 'src/product/product.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  async processPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { quantity, productId, userId, paymentMethod, status } =
      createPaymentDto;

    // Retrieve the product
    const product = await this.productService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Calculate total price
    const totalPrice = quantity * product.price;

    // Create the order
    const order = await this.orderService.create({
      userId,
      productId,
      quantity,
      totalPrice,
      status: status || 'pending',
    });

    // Create the payment
    const payment = this.paymentRepository.create({
      order,
      amount: totalPrice,
      status: 'completed', // Simulate successful payment
      paymentMethod,
    });

    // Save the payment to the database
    const savedPayment = await this.paymentRepository.save(payment);

    return savedPayment;
  }

  async findOne(paymentId) {
    const payment = await this.paymentRepository.findOne(paymentId);
    return payment;
  }
  async findAll() {
    const payments = await this.paymentRepository.find();
    return payments;
  }
}

import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get()
  findAll(): Promise<Payment[]> {
    return this.paymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Payment> {
    return this.paymentService.findOne(id);
  }

  @Post('process')
  processPayment(@Body() CreatePaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentService.processPayment(CreatePaymentDto);
  }
}

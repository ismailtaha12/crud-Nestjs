import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { IsNumber, IsString, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { Order } from 'src/order/entities/order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, { eager: true }) // Optional: eager loading the related order
  order: Order;

  @Column('decimal', { precision: 10, scale: 2 })
  @IsNumber()
  @Type(() => Number) // Ensure the value is a number
  amount: number;

  @Column({ default: 'pending' })
  @IsString()
  @IsOptional() // Optional: You can provide default values and validate
  @IsIn(['pending', 'completed', 'failed']) // Validate the status value
  status: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional() // Optional: This field is optional
  @IsIn(['credit_card', 'paypal']) // Validate the payment method
  paymentMethod?: string; // e.g., 'credit_card', 'paypal'
}

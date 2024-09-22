import { Test, TestingModule } from '@nestjs/testing';

import { OrderService } from './order.service';

import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../user/Entity/user.entity';
import { Product } from '../product/entities/product.entity';
import { Order } from './entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('OrderService - Integration Test with QueryRunner', () => {
  let orderService: OrderService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost', // or your PostgreSQL host
          port: 5433, // Default PostgreSQL port
          username: 'postgres', // e.g., 'postgres'
          password: 'root',
          database: 'postgresIntegrationTest',
          entities: [User, Product, Order],
          synchronize: true, // Only in development
        }),
        TypeOrmModule.forFeature([User, Product, Order]),
      ],
      providers: [OrderService],
    }).compile();

    orderService = moduleRef.get<OrderService>(OrderService);
    dataSource = moduleRef.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
  });

  afterEach(async () => {
    await queryRunner.manager.delete(Order, {});
    await queryRunner.manager.delete(User, {});
    await queryRunner.manager.delete(Product, {});
  });

  afterAll(async () => {
    await queryRunner.release();
    await dataSource.destroy();
  });

  describe('createOrder', () => {
    it('should successfully create and return a new order', async () => {
      const user = await queryRunner.manager.save(User, {
        username: 'JohnDoe',
        password: 'hashedpassword',
        email: 'john.doe@example.com',
        role: 'client',
      });

      const product = await queryRunner.manager.save(Product, {
        name: 'Smartphone',
        description: 'Latest model smartphone with advanced features',
        price: 500,
      });

      const createOrderDto: CreateOrderDto = {
        userId: user.id,
        productId: product.id,
        quantity: 2,
        status: 'pending',
        totalPrice: 1,
      };

      const result = await orderService.create(createOrderDto);

      expect(result).toBeDefined();
      expect(result.totalPrice).toBe(createOrderDto.quantity * product.price);
      expect(result.user.id).toBe(user.id);
      expect(result.product.id).toBe(product.id);

      const savedOrder = await queryRunner.manager.findOne(Order, {
        where: { id: result.id },
      });
      expect(savedOrder).toBeDefined();
      expect(savedOrder.totalPrice).toBe(
        createOrderDto.quantity * product.price
      );
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      const product = await queryRunner.manager.save(Product, {
        name: 'Smartphone',
        description: 'Latest model smartphone with advanced features',
        price: 500,
      });

      const createOrderDto: CreateOrderDto = {
        userId: 999,
        productId: product.id,
        quantity: 2,
        status: 'pending',
        totalPrice: 1,
      };

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException if the product does not exist', async () => {
      const user = await queryRunner.manager.save(User, {
        username: 'JohnDoe',
        password: 'hashedpassword',
        email: 'john.doe@example.com',
        role: 'client',
      });

      const createOrderDto: CreateOrderDto = {
        userId: user.id,
        productId: 999,
        quantity: 2,
        status: 'pending',
        totalPrice: 1,
      };

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if quantity is less than or equal to zero', async () => {
      const user = await queryRunner.manager.save(User, {
        username: 'JohnDoe',
        password: 'hashedpassword',
        email: 'john.doe@example.com',
        role: 'client',
      });

      const product = await queryRunner.manager.save(Product, {
        name: 'Smartphone',
        description: 'Latest model smartphone with advanced features',
        price: 500,
      });

      const createOrderDto: CreateOrderDto = {
        userId: user.id,
        productId: product.id,
        quantity: 0,
        status: 'pending',
        totalPrice: 1,
      };

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});

///////////////////////////////////////////////////////

describe('OrderService - unit testing with QueryRunner', () => {
  let orderService: OrderService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,

        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              rollbackTransaction: jest.fn(),
              release: jest.fn(),
              manager: {
                findOne: jest.fn(),
                save: jest.fn(),
                create: jest.fn(),
              },
            }),
          },
        },
      ],
    }).compile();

    orderService = moduleRef.get<OrderService>(OrderService);
    dataSource = moduleRef.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const createOrderDto: CreateOrderDto = {
      userId: 1,
      productId: 1,
      quantity: 2,
      status: 'pending',
      totalPrice: 0,
    };

    const mockUser: User = {
      id: 1,
      username: 'JohnDoe',
      password: 'hashedpassword',
      email: 'john.doe@example.com',
      role: 'client',
    };

    const mockProduct: Product = {
      id: 1,
      name: 'Smartphone',
      description: 'Latest model smartphone with advanced features',
      price: 50,
    };

    const totalPrice = createOrderDto.quantity * mockProduct.price;

    const mockOrder: Order = {
      id: 1,
      user: mockUser,
      product: mockProduct,
      quantity: createOrderDto.quantity,
      totalPrice,
      status: createOrderDto.status || 'pending',
    } as Order;

    it('should successfully create and return a new order', async () => {
      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockProduct);

      queryRunner.manager.create = jest.fn().mockReturnValue(mockOrder);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(mockOrder);

      const result = await orderService.create(createOrderDto);

      // Assertions
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(User, {
        where: { id: createOrderDto.userId },
      });
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Product, {
        where: { id: createOrderDto.productId },
      });
      expect(queryRunner.manager.create).toHaveBeenCalledWith(Order, {
        user: mockUser,
        product: mockProduct,
        quantity: createOrderDto.quantity,
        totalPrice,
        status: 'pending',
      });
      expect(queryRunner.manager.save).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockOrder);
    });

    it('should throw an error if quantity is less than or equal to zero', async () => {
      const createOrderDto: CreateOrderDto = {
        userId: 1,
        productId: 1,
        quantity: 0,
        status: 'pending',
        totalPrice: 0,
      };

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should rollback transaction and throw error if user is not found', async () => {
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(null);

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        NotFoundException
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(User, {
        where: { id: createOrderDto.userId },
      });
    });

    it('should rollback transaction and throw error if product is not found', async () => {
      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        NotFoundException
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Product, {
        where: { id: createOrderDto.productId },
      });
    });

    it('should rollback transaction if total price is zero or negative', async () => {
      const invalidProduct = { id: 1, price: 0 } as Product;
      const mockUser: User = {
        id: 1,
        username: 'JohnDoe',
        password: 'hashedpassword',
        email: 'john.doe@example.com',
        role: 'client',
      };
      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(invalidProduct);

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        BadRequestException
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction and throw error if saving the order fails', async () => {
      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockProduct);

      jest
        .spyOn(queryRunner.manager, 'save')
        .mockRejectedValueOnce(new Error('Save failed'));

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        'Save failed'
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});

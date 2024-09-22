import { Test, TestingModule } from '@nestjs/testing';

import { OrderService } from './order.service';
import { ProductService } from '../product/product.service';
import { DataSource, QueryRunner } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../user/Entity/user.entity'; // Path to your User entity
import { Product } from '../product/entities/product.entity'; // Path to your Product entity
import { Order } from './entities/order.entity'; // Path to your Order entity
describe('OrderService (with QueryRunner manager)', () => {
  let orderService: OrderService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: ProductService, // Mock ProductService if needed
          useValue: {
            findOne: jest.fn(),
          },
        },
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
      password: 'hashedpassword', // Example hashed password
      email: 'john.doe@example.com',
      role: 'client', // Default role
    };

    const mockProduct: Product = {
      id: 1,
      name: 'Smartphone',
      description: 'Latest model smartphone with advanced features',
      price: 50, // Example price
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
      // Mock manager.findOne to return user and product
      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockUser) // First call for user
        .mockResolvedValueOnce(mockProduct); // Second call for product

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
      // Arrange
      const createOrderDto: CreateOrderDto = {
        userId: 1,
        productId: 1,
        quantity: 0, // Invalid quantity
        status: 'pending',
        totalPrice: 0, // Total price won't matter since the quantity is invalid
      };

      // Act & Assert
      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should rollback transaction and throw error if user is not found', async () => {
      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(null); // User not found

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
        .mockResolvedValueOnce(mockUser) // User found
        .mockResolvedValueOnce(null); // Product not found

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        NotFoundException
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Product, {
        where: { id: createOrderDto.productId },
      });
    });

    it('should rollback transaction if total price is zero or negative', async () => {
      const invalidProduct = { id: 1, price: 0 } as Product; // Price is zero
      const mockUser: User = {
        id: 1,
        username: 'JohnDoe',
        password: 'hashedpassword', // Example hashed password
        email: 'john.doe@example.com',
        role: 'client', // Default role
      };
      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockUser) // User found
        .mockResolvedValueOnce(invalidProduct); // Invalid product

      await expect(orderService.create(createOrderDto)).rejects.toThrow(
        BadRequestException
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction and throw error if saving the order fails', async () => {
      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(mockUser) // User found
        .mockResolvedValueOnce(mockProduct); // Product found

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

// describe('OrderService (with QueryRunner manager)', () => {
//   let orderService: OrderService;
//   let dataSource: DataSource;
//   let queryRunner: QueryRunner;

//   beforeEach(async () => {
//     const moduleRef: TestingModule = await Test.createTestingModule({
//       providers: [
//         OrderService,
//         {
//           provide: ProductService, // Mock ProductService if needed
//           useValue: {
//             findOne: jest.fn(),
//           },
//         },
//         {
//           provide: DataSource,
//           useValue: {
//             createQueryRunner: jest.fn().mockReturnValue({
//               connect: jest.fn(),
//               startTransaction: jest.fn(),
//               commitTransaction: jest.fn(),
//               rollbackTransaction: jest.fn(),
//               release: jest.fn(),
//               manager: {
//                 findOne: jest.fn(),
//                 save: jest.fn(),
//                 create: jest.fn(),
//               },
//             }),
//           },
//         },
//       ],
//     }).compile();

//     orderService = moduleRef.get<OrderService>(OrderService);
//     dataSource = moduleRef.get<DataSource>(DataSource);
//     queryRunner = dataSource.createQueryRunner();
//   });

//   describe('createOrder', () => {
//     it('should successfully create and return a new order', async () => {
//       const createOrderDto: CreateOrderDto = {
//         userId: 1,
//         productId: 1,
//         quantity: 2,
//         status: 'pending',
//         totalPrice: 0,
//       };

//       const mockUser: User = {
//         id: 1,
//         username: 'JohnDoe',
//         password: 'hashedpassword', // Example hashed password
//         email: 'john.doe@example.com',
//         role: 'client', // Default role
//       };
//       const mockProduct: Product = {
//         id: 1,
//         name: 'Smartphone',
//         description: 'Latest model smartphone with advanced features',
//         price: 50, // Example price
//       };
//       const totalPrice = createOrderDto.quantity * mockProduct.price;

//       const mockOrder = {
//         id: 1,
//         user: mockUser,
//         product: mockProduct,
//         quantity: createOrderDto.quantity,
//         totalPrice,
//         status: createOrderDto.status || 'pending',
//       } as Order;
//       // Mock manager.findOne to return user and product
//       jest
//         .spyOn(queryRunner.manager, 'findOne')
//         .mockResolvedValueOnce(mockUser) // First call for user
//         .mockResolvedValueOnce(mockProduct); // Second call for product

//       // Mock manager.create to create a new order object
//       //jest.spyOn(queryRunner.manager, 'create').mockReturnValue(mockOrder);

//       queryRunner.manager.create = jest.fn().mockReturnValue(mockOrder);

//       // Mock manager.save to save the order
//       jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(mockOrder);

//       // Execute the service method
//       const result = await orderService.create(createOrderDto);

//       // Assertions
//       expect(queryRunner.startTransaction).toHaveBeenCalled();
//       expect(queryRunner.commitTransaction).toHaveBeenCalled();
//       expect(queryRunner.manager.findOne).toHaveBeenCalledWith(User, {
//         where: { id: createOrderDto.userId },
//       });
//       expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Product, {
//         where: { id: createOrderDto.productId },
//       });
//       expect(queryRunner.manager.create).toHaveBeenCalledWith(Order, {
//         user: mockUser,
//         product: mockProduct,
//         quantity: createOrderDto.quantity,
//         totalPrice: 100,
//         status: 'pending',
//       });
//       expect(queryRunner.manager.save).toHaveBeenCalledWith(mockOrder);
//       expect(result).toEqual(mockOrder);
//     });

//     it('should rollback transaction and throw error if user is not found', async () => {
//       const createOrderDto: CreateOrderDto = {
//         userId: 1,
//         productId: 1,
//         quantity: 2,
//         status: 'pending',
//         totalPrice: 23922,
//       };

//       // Mock manager.findOne to return null for user
//       jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValueOnce(null); // User not found

//       // Expect the service to throw a NotFoundException
//       await expect(orderService.create(createOrderDto)).rejects.toThrow(
//         NotFoundException
//       );

//       expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//       expect(queryRunner.manager.findOne).toHaveBeenCalledWith(User, {
//         where: { id: createOrderDto.userId },
//       });
//     });

//     it('should rollback transaction and throw error if product is not found', async () => {
//       const createOrderDto: CreateOrderDto = {
//         userId: 1,
//         productId: 1,
//         quantity: 2,
//         status: 'pending',
//         totalPrice: 23922,
//       };

//       const mockUser = { id: 1, username: 'John' } as User;

//       // Mock manager.findOne to return user first, then null for product
//       jest
//         .spyOn(queryRunner.manager, 'findOne')
//         .mockResolvedValueOnce(mockUser) // First call for user
//         .mockResolvedValueOnce(null); // Second call for product

//       // Expect the service to throw a NotFoundException for product
//       await expect(orderService.create(createOrderDto)).rejects.toThrow(
//         NotFoundException
//       );

//       expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//       expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Product, {
//         where: { id: createOrderDto.productId },
//       });
//     });

//     it('should rollback transaction if total price is zero or negative', async () => {
//       const createOrderDto: CreateOrderDto = {
//         userId: 1,
//         productId: 1,
//         quantity: 2,
//         status: 'pending',
//         totalPrice: 23922,
//       };

//       const mockUser = { id: 1, username: 'John' } as User;
//       const mockProduct = { id: 1, price: 0 } as Product; // Price is zero

//       // Mock manager.findOne to return user and product
//       jest
//         .spyOn(queryRunner.manager, 'findOne')
//         .mockResolvedValueOnce(mockUser) // First call for user
//         .mockResolvedValueOnce(mockProduct); // Second call for product

//       await expect(orderService.create(createOrderDto)).rejects.toThrow(
//         'Total price must be greater than zero'
//       );

//       expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
//     });
//   });
// });

// import { Test, TestingModule } from '@nestjs/testing';
// import { OrderController } from './order.controller';
// import { OrderService } from './order.service';
// import { ProductService } from 'src/product/product.service'; // Assuming ProductService is external
// import { DataSource } from 'typeorm';
// import { ClientProxy } from '@nestjs/microservices';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { NotFoundException } from '@nestjs/common';

// describe('OrderController and OrderService', () => {
//   let orderController: OrderController;
//   let orderService: OrderService;
//   let productService: ProductService; // No need for MockProductService, use ProductService mock
//   let dataSource: DataSource;
//   let productClient: ClientProxy;
//   let emailClient: ClientProxy;

//   beforeEach(async () => {
//     const moduleRef: TestingModule = await Test.createTestingModule({
//       controllers: [OrderController],
//       providers: [
//         OrderService,
//         {
//           provide: ProductService, // Mock ProductService
//           useValue: {
//             findOne: jest.fn(), // Mock findOne for product fetching
//           },
//         },
//         {
//           provide: DataSource, // Mock DataSource
//           useValue: {
//             createQueryRunner: jest.fn().mockReturnValue({
//               connect: jest.fn(),
//               startTransaction: jest.fn(),
//               commitTransaction: jest.fn(),
//               rollbackTransaction: jest.fn(),
//               release: jest.fn(),
//               manager: {
//                 findOne: jest.fn(),
//                 create: jest.fn(),
//                 save: jest.fn(),
//               },
//             }),
//           },
//         },
//         {
//           provide: 'PRODUCT_SERVICE', // Mock Product Client Proxy
//           useValue: {
//             emit: jest.fn(),
//           },
//         },
//         {
//           provide: 'EMAIL_SERVICE', // Mock Email Client Proxy
//           useValue: {
//             emit: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     orderController = moduleRef.get<OrderController>(OrderController);
//     orderService = moduleRef.get<OrderService>(OrderService);
//     productService = moduleRef.get<ProductService>(ProductService);
//     dataSource = moduleRef.get<DataSource>(DataSource);
//     productClient = moduleRef.get<ClientProxy>('PRODUCT_SERVICE');
//     emailClient = moduleRef.get<ClientProxy>('EMAIL_SERVICE');
//   });

//   describe('createOrder', () => {
//     it('should return a new order', async () => {
//       // Mocking productService.findOne for product

//       // Expected result object (mock order data)
//       const result = {
//         id: 1,
//         quantity: 443,
//         totalPrice: 23922,
//         status: 'pending',
//         user: {
//           id: 3,
//           username: 'ds',
//           password: 'hashedpassword',
//           email: 'hjk@gmail.com',
//           role: 'client',
//         },
//         product: {
//           id: 1,
//           name: 'phone',
//           description: 'gfd',
//           price: 54,
//         },
//       };

//       const createOrderDto: CreateOrderDto = {
//         userId: 1,
//         productId: 1,
//         quantity: 2,
//         status: 'pending',
//         totalPrice: 23922,
//       };

//       // Mock orderService.create to return the expected result
//       jest.spyOn(orderService, 'create').mockResolvedValue(result);

//       // Test if orderController.createOrder returns the correct order
//       expect(await orderController.createOrder(createOrderDto)).toBe(result);
//       expect(orderService.create).toHaveBeenCalledWith(createOrderDto);
//     });

//     it('should throw an error if quantity is zero or negative', async () => {
//       const createOrderDto: CreateOrderDto = {
//         userId: 1,
//         productId: 1,
//         quantity: 0, // Invalid quantity
//         status: 'pending',
//         totalPrice: 23922,
//       };

//       // Test if the error is properly thrown for invalid quantity
//       await expect(orderController.createOrder(createOrderDto)).rejects.toThrow(
//         'Quantity must be greater than zero'
//       );
//     });

//     it('should throw NotFoundException if user does not exist', async () => {
//       const createOrderDto: CreateOrderDto = {
//         userId: 999, // Non-existent user ID
//         productId: 1,
//         quantity: 2,
//         status: 'pending',
//         totalPrice: 23922,
//       };

//       // Mock the create function in orderService to throw NotFoundException for user
//       jest.spyOn(orderService, 'create').mockImplementation(async () => {
//         throw new NotFoundException('User not found');
//       });

//       // Test if the exception is properly thrown when the user is not found
//       await expect(orderController.createOrder(createOrderDto)).rejects.toThrow(
//         NotFoundException
//       );
//       expect(orderService.create).toHaveBeenCalledWith(createOrderDto);
//     });

//     it('should throw NotFoundException if product does not exist', async () => {
//       const createOrderDto: CreateOrderDto = {
//         userId: 1,
//         productId: 1, // Non-existent product ID
//         quantity: 2,
//         status: 'pending',
//         totalPrice: 23922,
//       };

//       // Mock the create function in orderService to throw NotFoundException for product
//       jest.spyOn(orderService, 'create').mockImplementation(async () => {
//         throw new NotFoundException('Product not found');
//       });

//       // Test if the exception is properly thrown when the product is not found
//       await expect(orderController.createOrder(createOrderDto)).rejects.toThrow(
//         NotFoundException
//       );
//       expect(orderService.create).toHaveBeenCalledWith(createOrderDto);
//     });

//     it('should throw an error if total price is zero or negative', async () => {
//       const createOrderDto: CreateOrderDto = {
//         userId: 1,
//         productId: 1,
//         quantity: 2,
//         status: 'pending',
//         totalPrice: 0, // Invalid total price
//       };

//       await expect(orderController.createOrder(createOrderDto)).rejects.toThrow(
//         'Total price must be greater than zero'
//       );
//     });
//   });
// });

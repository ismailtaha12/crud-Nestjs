import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './Entity/user.entity';
import { Repository } from 'typeorm';

import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
@Injectable({})
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService
  ) {}
  async create(user: UserDto) {
    user.password = await argon.hash(user.password);
    const res = await this.usersRepository.save(user);

    return res;
  }
  async createsignup(user: UserDto) {
    const res = await this.usersRepository.save(user);

    return res;
  }

  async findOne(username: string): Promise<User | undefined> {
    return await this.usersRepository.findOneBy({ username: username });
  }
  async findOneById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ id });
  }

  findAll() {
    return this.usersRepository.find();
  }

  async update(id: number) {
    return await this.usersRepository.findOneBy({ id: id });
  }
}

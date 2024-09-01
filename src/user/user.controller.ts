import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { AuthenticationGuard } from 'src/gaurds/authenticationgaurd.guard';
import { Role } from 'src/auth/decorators/roles.decorators';
import { AutherizationGuard } from 'src/gaurds/authorization.guard';
import { LoggingInterceptor } from 'src/Interceptor/LoggingInterceptor.interceptor';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':username')
  getOneuser(@Param('username') username: string) {
    return this.userService.findOne(username);
  }

  @Role('admin')
  @UseGuards(AuthenticationGuard, AutherizationGuard)
  @Get()
  getALLuser() {
    return this.userService.findAll();
  }

  @UseInterceptors(LoggingInterceptor)
  @Post()
  create(@Body() createUserDTO: UserDto) {
    return this.userService.create(createUserDTO);
  }

  @Patch(':id')
  update(@Param('id') id: number) {
    console.log(id);
    return this.userService.update(id);
  }
}

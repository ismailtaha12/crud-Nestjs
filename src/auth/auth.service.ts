import { Injectable, UnauthorizedException } from '@nestjs/common';

import * as argon from 'argon2';

import { UserService } from 'src/user/user.service';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './Entity/refreshtoken.Entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/Entity/user.entity';
@Injectable({})
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async signUp(dto: SignupDto) {
    const hash = await argon.hash(dto.password);
    console.log('Role:', dto.role);
    const user = {
      username: dto.username,
      email: dto.email,
      password: hash,
      role: dto.role || 'client', // Default role is client
    };
    const createdUser = await this.usersService.createsignup(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = createdUser;
    return result;
  }

  async signIn(username: string, pass: string) {
    console.log(username);
    const user = await this.usersService.findOne(username);

    console.log(user);
    if (!user) {
      console.log('User not found');
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log(user.password, pass);
    const passwordMatches = await argon.verify(user.password, pass);
    if (!passwordMatches) {
      console.log('Invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('User authenticated successfully');

    // Generate JWT token here if needed (TODO)
    //  For now, just return a success message and user details

    const accessToken = await this.generateAccessTokens(user);
    const refreshToken = await this.generateRefreshToken(user);
    console.log(accessToken);
    return {
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        username: user.username,
        id: user.id,
        role: user.role,
        // other user details you want to return
      },
    };
  }

  async generateAccessTokens(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: User): Promise<RefreshToken> {
    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = await this.jwtService.signAsync(payload, {
      secret: 'asasasa',
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const isRevoked = false;
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userid: user.id,
      isRevoked,
      expiresAt,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: 'asasasa',
      });
      const user = await this.usersService.findOne(payload.username);
      return this.generateAccessTokens(user);
    } catch (e) {
      console.log(e);
      throw new Error('Invalid refresh token');
    }
  }
}

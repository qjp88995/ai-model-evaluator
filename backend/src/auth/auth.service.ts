import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  validateUser(username: string, password: string): { username: string } | null {
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return { username };
    }
    return null;
  }

  login(user: { username: string }) {
    const payload = { username: user.username, sub: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
    };
  }
}

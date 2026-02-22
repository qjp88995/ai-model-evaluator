import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    const user = this.authService.validateUser(body.username, body.password);
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    return this.authService.login(user);
  }
}

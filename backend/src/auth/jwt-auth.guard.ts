import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // SSE 端点通过 ?token query 参数传递，写入 Authorization Header
    const req = context.switchToHttp().getRequest();
    const queryToken = req.query?.token;
    if (queryToken && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${queryToken}`;
    }

    return super.canActivate(context);
  }
}

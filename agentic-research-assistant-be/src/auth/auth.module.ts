import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '@/auth/auth.controller.js';
import { AuthService } from '@/auth/auth.service.js';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy.js';
import { UserModule } from '@/user/user.module.js';

@Module({
    imports: [
        UserModule,
        PassportModule,
        JwtModule.register({}),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})
export class AuthModule {}

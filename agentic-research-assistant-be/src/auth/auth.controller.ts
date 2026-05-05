import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '@/auth/auth.service.js';
import { RegisterDto } from '@/auth/dto/register.dto.js';
import { LoginDto } from '@/auth/dto/login.dto.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDto, @Res() res: Response) {
        return this.authService.register(dto, res);
    }

    @Post('login')
    login(@Body() dto: LoginDto, @Res() res: Response) {
        return this.authService.login(dto, res);
    }

    @Post('refresh')
    refresh(@Req() req: Request, @Res() res: Response) {
        return this.authService.refresh(req, res);
    }

    @Post('logout')
    logout(@Res() res: Response) {
        return this.authService.logout(res);
    }
}

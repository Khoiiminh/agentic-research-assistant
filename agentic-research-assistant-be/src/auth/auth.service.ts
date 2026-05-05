import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response, Request } from 'express';
import { UserService } from '@/user/user.service.js';
import { RegisterDto } from '@/auth/dto/register.dto.js';
import { LoginDto } from '@/auth/dto/login.dto.js';

const REFRESH_COOKIE = 'refresh_token';
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async register(dto: RegisterDto, res: Response) {
        if (dto.password !== dto.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const existing = await this.userService.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const user = await this.userService.create({ email: dto.email, password_hash });

        const tokens = this.generateTokens(user.id, user.email);
        this.setRefreshCookie(res, tokens.refresh_token);

        return res.status(201).json({
            access_token: tokens.access_token,
            user: { id: user.id, email: user.email },
        });
    }

    async login(dto: LoginDto, res: Response) {
        const user = await this.userService.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = this.generateTokens(user.id, user.email);
        this.setRefreshCookie(res, tokens.refresh_token);

        return res.status(200).json({
            access_token: tokens.access_token,
            user: { id: user.id, email: user.email },
        });
    }

    async refresh(req: Request, res: Response) {
        const token: string | undefined = req.cookies[REFRESH_COOKIE];
        if (!token) {
            throw new UnauthorizedException('No refresh token');
        }

        let payload: { sub: string; email: string };
        try {
            payload = this.jwtService.verify(token, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const user = await this.userService.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const access_token = this.jwtService.sign(
            { sub: user.id, email: user.email },
            { secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as any },
        );

        return res.status(200).json({ access_token });
    }

    logout(res: Response) {
        res.clearCookie(REFRESH_COOKIE, { httpOnly: true, sameSite: 'strict' });
        return res.status(200).json({ message: 'Logged out successfully' });
    }

    private generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const access_token = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as any,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const refresh_token = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as any,
        });

        return { access_token, refresh_token };
    }

    private setRefreshCookie(res: Response, token: string) {
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        res.cookie(REFRESH_COOKIE, token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: sevenDaysMs,
        });
    }
}

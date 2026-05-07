import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/user/entities/user.entity.js';
import { UserService } from '@/user/user.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}

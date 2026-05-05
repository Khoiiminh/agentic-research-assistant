import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/user/entities/user.entity.js';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    create(data: { email: string; password_hash: string }): Promise<User> {
        const user = this.userRepository.create(data);
        return this.userRepository.save(user);
    }
}

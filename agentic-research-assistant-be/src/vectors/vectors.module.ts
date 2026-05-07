import { Module } from '@nestjs/common';
import { VectorsController } from './vectors.controller.js';
import { VectorsService } from './vectors.service.js';

@Module({
    controllers: [VectorsController],
    providers: [VectorsService],
    exports: [VectorsService],
})
export class VectorsModule {}

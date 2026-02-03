import { Module } from '@nestjs/common';
import { SupervisionsService } from './supervisions.service';
import { SupervisionsController } from './supervisions.controller';

@Module({
  controllers: [SupervisionsController],
  providers: [SupervisionsService],
  exports: [SupervisionsService],
})
export class SupervisionsModule { }
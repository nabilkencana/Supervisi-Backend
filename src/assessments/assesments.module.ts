import { Module } from '@nestjs/common';
import { AssessmentsService } from './assesments.service';
import { AssessmentsController } from './assesments.controller';

@Module({
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule { }
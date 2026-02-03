import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsService } from './assesments.service';

describe('AssesmentsService', () => {
  let service: AssesmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssesmentsService],
    }).compile();

    service = module.get<AssesmentsService>(AssesmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

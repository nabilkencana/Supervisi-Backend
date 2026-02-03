import { Test, TestingModule } from '@nestjs/testing';
import { SupervisionsService } from './supervisions.service';

describe('SupervisionsService', () => {
  let service: SupervisionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupervisionsService],
    }).compile();

    service = module.get<SupervisionsService>(SupervisionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

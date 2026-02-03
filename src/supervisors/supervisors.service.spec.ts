import { Test, TestingModule } from '@nestjs/testing';
import { SupervisorsService } from './supervisors.service';

describe('SupervisorsService', () => {
  let service: SupervisorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupervisorsService],
    }).compile();

    service = module.get<SupervisorsService>(SupervisorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

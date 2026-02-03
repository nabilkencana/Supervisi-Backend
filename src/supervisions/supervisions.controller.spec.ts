import { Test, TestingModule } from '@nestjs/testing';
import { SupervisionsController } from './supervisions.controller';
import { SupervisionsService } from './supervisions.service';

describe('SupervisionsController', () => {
  let controller: SupervisionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupervisionsController],
      providers: [SupervisionsService],
    }).compile();

    controller = module.get<SupervisionsController>(SupervisionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AssesmentsController } from './assesments.controller';
import { AssesmentsService } from './assesments.service';

describe('AssesmentsController', () => {
  let controller: AssesmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssesmentsController],
      providers: [AssesmentsService],
    }).compile();

    controller = module.get<AssesmentsController>(AssesmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':pesquisa')
  start(@Param() params: any): void {
    this.appService.start(params.pesquisa);
  }
}

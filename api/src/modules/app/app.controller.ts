import { All, Controller, HttpCode } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller()
@ApiExcludeController()
export class AppController {
  @All('*')
  @HttpCode(404)
  handleNonExistingRoute(): object {
    return {
      message: 'Route not found',
    };
  }
}

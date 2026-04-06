import { Public } from '@module-auth';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateReserveFromReferralRockRequest } from '../data';
import { ReservesService } from '../services';
import { ReferralRockWebhookGuard } from '@module-common';

@Public()
@Controller('/reserves/referral-rock-reward')
@UseInterceptors(ClassSerializerInterceptor)
export class RewardReservesController {
  constructor(private readonly reserveService: ReservesService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(ReferralRockWebhookGuard)
  async createReferralRockRewardReserve(
    @Body() body: CreateReserveFromReferralRockRequest,
  ) {
    await this.reserveService.createRewardReserve(body);
  }
}

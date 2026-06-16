import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  constructor(private readonly config: ConfigService) {}

  async sendOtp(phone: string, otp: string): Promise<void> {
    const message = `Your AfshinTaxi verification code is: ${otp}. Valid for 5 minutes.`;
    await this.send(phone, message);
  }

  async sendBookingConfirmation(
    phone: string, driverName: string,
    carModel: string, carPlate: string, scheduledAt: Date,
  ): Promise<void> {
    const time = new Date(scheduledAt).toLocaleString();
    const message = `AfshinTaxi: Ride confirmed!\nDriver: ${driverName}\nCar: ${carModel} (${carPlate})\nTime: ${time}`;
    await this.send(phone, message);
  }

  private async send(phone: string, message: string): Promise<void> {
    // TODO: Replace with your SMS provider
    // const apiKey = this.config.get('SMS_API_KEY');
    // await yourSmsClient.send({ to: phone, text: message });
    this.logger.log(`[SMS TO ${phone}]: ${message}`);
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InviteDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  email: string;
}

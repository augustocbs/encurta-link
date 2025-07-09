import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreateUrlDto {
  @IsNotEmpty({ message: 'Original URL cannot be empty.' })
  @IsUrl({}, { message: 'Invalid URL format.' })
  originalUrl: string;
}
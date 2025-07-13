import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUrlDto {
  @ApiProperty({
    description: 'A nova URL original para a URL encurtada.',
    example: 'https://www.exemplo.com.br/exemplo',
  })
  @IsNotEmpty({ message: 'A URL original não pode ser vazia.' })
  @IsUrl({}, { message: 'Formato de URL inválido.' })
  originalUrl: string;
}
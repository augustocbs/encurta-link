import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({
    description: 'A URL original que será encurtada',
    example: 'https://www.exemplo.com/caminho/longo/para/recurso',
  })
  @IsNotEmpty({ message: 'A URL original não pode estar vazia.' })
  @IsUrl({}, { message: 'Formato de URL inválido.' })
  originalUrl: string;
}
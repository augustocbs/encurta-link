import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 1, description: 'ID do usuário' })
  id: number;

  @ApiProperty({
    example: 'teste@exemplo.com',
    description: 'Email do usuário',
  })
  email: string;

  @ApiProperty({
    example: 'Joao Silva',
    description: 'Nome do usuário',
    required: false,
  })
  name?: string;
}

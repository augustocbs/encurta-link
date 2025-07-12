import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    description: 'Endereço de e-mail do usuário',
    example: 'usuario@example.com',
  })
  @IsEmail({}, { message: 'O e-mail fornecido não é válido.' })
  @IsString({ message: 'O e-mail deve ser uma string.' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'SenhaSegura123',
  })
  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}

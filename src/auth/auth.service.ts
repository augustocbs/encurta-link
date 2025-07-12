import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Gera um hash para a senha fornecida.
   * @param password A senha em texto puro.
   * @returns O hash da senha.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compara uma senha fornecida com o hash armazenado.
   * @param password A senha em texto puro.
   * @param hash O hash armazenado.
   * @returns TRUE se a senha corresponder ao hash, FALSE caso contrário.
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Gera um token JWT para um usuário.
   * @param user O objeto User para o qual o token será gerado.
   * @returns O token JWT.
   */
  generateJwtToken(user: User): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return Promise.resolve(this.jwtService.sign(payload));
  }
}

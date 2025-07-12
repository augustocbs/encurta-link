// test/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/users/entities/user.entity';

const mockUsersRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(() => 'mockedJwtToken'),
};

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashedPassword'),
  compare: jest.fn(() => true),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('deve gerar um hash para a senha', async () => {
      const password = 'plainPassword';
      const hashedPassword = await service.hashPassword(password);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(hashedPassword).toBe('hashedPassword');
    });
  });

  describe('comparePassword', () => {
    it('deve retornar true para senhas correspondentes', async () => {
      const password = 'plainPassword';
      const hash = 'hashedPassword';
      const result = await service.comparePassword(password, hash);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('deve retornar false para senhas não correspondentes', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.comparePassword(
        'wrongPassword',
        'hashedPassword',
      );
      expect(result).toBe(false);
    });
  });

  describe('generateJwtToken', () => {
    it('deve gerar um JWT para o usuário', async () => {
      const user = { id: 1, email: 'test@example.com' } as User;
      const token = await service.generateJwtToken(user);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
      });
      expect(token).toBe('mockedJwtToken');
    });
  });
});

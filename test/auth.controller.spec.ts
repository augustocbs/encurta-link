// test/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Request as ExpressRequest } from 'express';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';
import { LoginUserDto } from 'src/auth/dto/login-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { AuthController } from 'src/auth/auth.controller';
import { User } from 'src/users/entities/user.entity';

interface AuthenticatedRequest extends ExpressRequest {
  user: User;
}

const mockUsersRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockAuthService = {
  hashPassword: jest.fn(() => 'hashedPassword'),
  comparePassword: jest.fn(() => true),
  generateJwtToken: jest.fn(() => 'mockedJwtToken'),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const registerDto: RegisterUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue({
        id: 1,
        ...registerDto,
        password: 'hashedPassword',
      });
      mockUsersRepository.save.mockResolvedValue({
        id: 1,
        ...registerDto,
        password: 'hashedPassword',
      });

      const result = await controller.register(registerDto);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith(
        registerDto.password,
      );
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword',
      });
      expect(mockUsersRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Usuário registrado com sucesso!' });
    });

    it('deve lançar ConflictException se o e-mail já estiver cadastrado', async () => {
      const registerDto: RegisterUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };
      mockUsersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
      });

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockAuthService.hashPassword).not.toHaveBeenCalled();
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('deve fazer login e retornar um token JWT', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      } as User;
      mockUsersRepository.findOne.mockResolvedValue(user);
      (mockAuthService.comparePassword as jest.Mock).mockResolvedValue(true);
      (mockAuthService.generateJwtToken as jest.Mock).mockResolvedValue(
        'mockedJwtToken',
      );

      const result = await controller.login(loginDto);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockAuthService.comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(mockAuthService.generateJwtToken).toHaveBeenCalledWith(user);
      expect(result).toEqual({ access_token: 'mockedJwtToken' });
    });

    it('deve lançar UnauthorizedException para credenciais inválidas (usuário não encontrado)', async () => {
      const loginDto: LoginUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockAuthService.comparePassword).not.toHaveBeenCalled();
      expect(mockAuthService.generateJwtToken).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException para credenciais inválidas (senha incorreta)', async () => {
      const loginDto: LoginUserDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      } as User;
      mockUsersRepository.findOne.mockResolvedValue(user);
      (mockAuthService.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockAuthService.comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(mockAuthService.generateJwtToken).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('deve retornar o perfil do usuário autenticado', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
      } as User;

      const req = { user } as AuthenticatedRequest;
      const result = controller.getProfile(req);
      expect(result).toEqual({ id: user.id, email: user.email });
    });
  });
});

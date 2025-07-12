// test/url/url.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Url } from 'src/url/entities/url.entity';
import { UrlService } from 'src/url/url.service';
import { User } from 'src/users/entities/user.entity';

const mockUrlRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((chave: string) => {
    if (chave === 'BASE_URL') {
      return 'http://localhost:3000';
    }
    return undefined;
  }),
};

describe('UrlService', () => {
  let service: UrlService;
  let repository: Repository<Url>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: getRepositoryToken(Url),
          useValue: mockUrlRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    repository = module.get<Repository<Url>>(getRepositoryToken(Url));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('verificando valor', () => {
    expect(repository).toBeDefined();
  });

  describe('shortenUrl (encurtar URL)', () => {
    it('deve retornar uma URL encurtada existente se originalUrl já existir', async () => {
      const urlExistente = {
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        clicks: 0,
      } as Url;
      mockUrlRepository.findOne.mockResolvedValue(urlExistente);

      const result = await service.shortenUrl({
        originalUrl: 'https://example.com',
      });
      expect(result).toBe('http://localhost:3000/abc123');
      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({
        where: { originalUrl: 'https://example.com' },
      });
      expect(mockUrlRepository.create).not.toHaveBeenCalled();
      expect(mockUrlRepository.save).not.toHaveBeenCalled();
    });

    it('deve criar uma nova URL encurtada se originalUrl não existir (sem userId)', async () => {
      mockUrlRepository.findOne.mockResolvedValueOnce(null);
      mockUrlRepository.findOne.mockResolvedValueOnce(null);

      const createdUrl: Url = {
        originalUrl: 'https://new.com',
        shortCode: 'def456',
        userId: null,
        id: 1,
        clicks: 0,
        user: new User(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      };

      mockUrlRepository.create.mockReturnValue(createdUrl);
      mockUrlRepository.save.mockResolvedValue(createdUrl);

      jest.spyOn(service as any, 'generateShortCode').mockReturnValue('def456');

      const result = await service.shortenUrl({
        originalUrl: 'https://new.com',
      });
      expect(result).toBe('http://localhost:3000/def456');
      expect(mockUrlRepository.findOne).toHaveBeenCalledTimes(2);
      // Corrigido: Removida a propriedade `userId: null` da asserção, pois ela não é enviada quando nula.
      expect(mockUrlRepository.create).toHaveBeenCalledWith({
        originalUrl: 'https://new.com',
        shortCode: 'def456',
      });
      expect(mockUrlRepository.save).toHaveBeenCalledWith(createdUrl);
    });

    it('deve criar uma nova URL encurtada e associar a um userId', async () => {
      const testUserId = 123;
      const originalUrl = 'https://new.com/user';
      const shortCode = 'ghi789';

      const createdUrlEntity = {
        originalUrl,
        shortCode,
        userId: testUserId,
      };

      mockUrlRepository.findOne.mockResolvedValue(null); // Simplificado para uma única chamada, pois o resultado é o mesmo.
      mockUrlRepository.create.mockReturnValue(createdUrlEntity as Url);
      mockUrlRepository.save.mockResolvedValue(createdUrlEntity as Url);

      jest
        .spyOn(service as any, 'generateShortCode')
        .mockReturnValue(shortCode);

      const result = await service.shortenUrl(
        {
          originalUrl,
        },
        testUserId,
      );
      expect(result).toBe('http://localhost:3000/ghi789');
      expect(mockUrlRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUrlRepository.create).toHaveBeenCalledWith({
        originalUrl,
        shortCode,
        userId: testUserId,
      });
      // Corrigido: Garante que o objeto retornado por 'create' é o mesmo que é passado para 'save'.
      expect(mockUrlRepository.save).toHaveBeenCalledWith(createdUrlEntity);
    });

    it('deve lançar BadRequestException para URLs inválidas', async () => {
      await expect(
        service.shortenUrl({ originalUrl: 'url-invalida' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException se não conseguir gerar um shortCode único', async () => {
      mockUrlRepository.findOne.mockResolvedValueOnce(null);
      mockUrlRepository.findOne.mockResolvedValue({
        shortCode: 'fixed',
      } as Url);

      jest.spyOn(service as any, 'generateShortCode').mockReturnValue('fixed');

      await expect(
        service.shortenUrl({ originalUrl: 'https://another.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('redirectToOriginalUrl (redirecionar para URL original)', () => {
    it('deve retornar a URL original e incrementar os cliques', async () => {
      const url = {
        originalUrl: 'https://test.com',
        shortCode: 'xyz789',
        clicks: 5,
      } as Url;
      mockUrlRepository.findOne.mockResolvedValue(url);
      mockUrlRepository.save.mockResolvedValue({ ...url, clicks: 6 });

      const result = await service.redirectToOriginalUrl('xyz789');
      expect(result).toBe('https://test.com');
      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({
        where: { shortCode: 'xyz789' },
      });
      expect(url.clicks).toBe(6);
      expect(mockUrlRepository.save).toHaveBeenCalledWith(url);
    });

    it('deve inicializar cliques para 1 se for a primeira vez', async () => {
      const url: Url = {
        id: 1,
        originalUrl: 'http://example.com',
        shortCode: '123456',
        clicks: 0,
        userId: 1,
        user: new User(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      };
      mockUrlRepository.findOne.mockResolvedValue(url);
      mockUrlRepository.save.mockResolvedValue({ ...url, clicks: 1 });

      const result = await service.redirectToOriginalUrl('123456');

      expect(result).toBe('http://example.com');

      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({
        where: { shortCode: '123456' },
      });

      expect(url.clicks).toBe(1);
      expect(mockUrlRepository.save).toHaveBeenCalledWith(url);
    });

    it('deve lançar NotFoundException se o shortCode não for encontrado', async () => {
      mockUrlRepository.findOne.mockResolvedValue(null);

      await expect(service.redirectToOriginalUrl('nao-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

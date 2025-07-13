import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Url } from 'src/url/entities/url.entity';
import { UrlService } from 'src/url/url.service';
import { User } from 'src/users/entities/user.entity';
import { UpdateUrlDto } from 'src/url/dto/update-url.dto';

const mockUrlRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((chave: string) => {
    if (chave === 'BASE_URL') {
      return 'http://localhost';
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
    jest.restoreAllMocks();
    mockUrlRepository.findOne.mockReset();
    mockUrlRepository.find.mockReset();
    mockUrlRepository.create.mockReset();
    mockUrlRepository.save.mockReset();
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

      mockUrlRepository.findOne.mockResolvedValueOnce(urlExistente);

      const result = await service.shortenUrl({
        originalUrl: 'https://example.com',
      });

      expect(result).toBe('http://localhost/abc123');
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

      expect(result).toBe('http://localhost/def456');
      expect(mockUrlRepository.findOne).toHaveBeenCalledTimes(2);
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
        id: 1,
        clicks: 0,
        user: new User(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      } as Url;

      mockUrlRepository.findOne.mockResolvedValueOnce(null);
      mockUrlRepository.findOne.mockResolvedValueOnce(null);

      mockUrlRepository.create.mockReturnValue(createdUrlEntity);
      mockUrlRepository.save.mockResolvedValue(createdUrlEntity);

      jest
        .spyOn(service as any, 'generateShortCode')
        .mockReturnValue(shortCode);

      const result = await service.shortenUrl(
        {
          originalUrl,
        },
        testUserId,
      );

      expect(result).toBe('http://localhost/ghi789');
      expect(mockUrlRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUrlRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { originalUrl, userId: testUserId },
      });
      expect(mockUrlRepository.create).toHaveBeenCalledWith({
        originalUrl,
        shortCode,
        userId: testUserId,
      });
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
        originalUrl: 'https://existing.com',
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

  describe('getUrlsByUserId (buscar URLs por usuário)', () => {
    it('deve retornar lista de URLs do usuário', async () => {
      const userId = 123;
      const mockUrls: Url[] = [
        {
          id: 1,
          originalUrl: 'https://example1.com',
          shortCode: 'abc123',
          clicks: 5,
          userId: 123,
          user: new User(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
        {
          id: 2,
          originalUrl: 'https://example2.com',
          shortCode: 'def456',
          clicks: 10,
          userId: 123,
          user: new User(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: undefined,
        },
      ];

      mockUrlRepository.find.mockResolvedValue(mockUrls);

      const result = await service.getUrlsByUserId(userId);

      expect(result).toEqual(mockUrls);
      expect(mockUrlRepository.find).toHaveBeenCalledWith({
        where: {
          userId: userId,
          deletedAt: IsNull(),
        },
        select: ['originalUrl', 'shortCode', 'clicks'],
      });
    });

    it('deve retornar lista vazia quando usuário não tem URLs', async () => {
      const userId = 123;
      mockUrlRepository.find.mockResolvedValue([]);

      const result = await service.getUrlsByUserId(userId);

      expect(result).toEqual([]);
      expect(mockUrlRepository.find).toHaveBeenCalledWith({
        where: {
          userId: userId,
          deletedAt: IsNull(),
        },
        select: ['originalUrl', 'shortCode', 'clicks'],
      });
    });
  });

  describe('updateUrl (atualizar URL)', () => {
    it('deve atualizar uma URL com sucesso', async () => {
      const urlId = 1;
      const userId = 123;
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://updated-example.com',
      };

      const existingUrl: Url = {
        id: urlId,
        originalUrl: 'https://old-example.com',
        shortCode: 'abc123',
        clicks: 5,
        userId: userId,
        user: new User(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      };

      const updatedUrl: Url = {
        ...existingUrl,
        originalUrl: updateUrlDto.originalUrl,
        updatedAt: new Date(),
      };

      mockUrlRepository.findOne.mockResolvedValue(existingUrl);
      mockUrlRepository.save.mockResolvedValue(updatedUrl);

      const result = await service.updateUrl(urlId, updateUrlDto, userId);

      expect(result).toEqual(updatedUrl);
      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({
        where: { id: urlId },
      });
      expect(mockUrlRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          originalUrl: updateUrlDto.originalUrl,
        }),
      );
    });

    it('deve lançar NotFoundException quando URL não for encontrada', async () => {
      const urlId = 999;
      const userId = 123;
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://updated-example.com',
      };

      mockUrlRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUrl(urlId, updateUrlDto, userId))
        .rejects.toThrow(NotFoundException);

      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({
        where: { id: urlId },
      });
    });

    it('deve lançar ForbiddenException quando usuário não é dono da URL', async () => {
      const urlId = 1;
      const userId = 123;
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'https://updated-example.com',
      };

      const existingUrl: Url = {
        id: urlId,
        originalUrl: 'https://old-example.com',
        shortCode: 'abc123',
        clicks: 5,
        userId: 456,
        user: new User(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      };

      mockUrlRepository.findOne.mockResolvedValue(existingUrl);

      await expect(service.updateUrl(urlId, updateUrlDto, userId))
        .rejects.toThrow(ForbiddenException);
    });

    it('deve lançar BadRequestException para URL inválida', async () => {
      const urlId = 1;
      const userId = 123;
      const updateUrlDto: UpdateUrlDto = {
        originalUrl: 'url-invalida',
      };

      await expect(service.updateUrl(urlId, updateUrlDto, userId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('softDeleteUrl (exclusão lógica)', () => {
    it('deve excluir uma URL logicamente com sucesso', async () => {
      const urlId = 1;
      const userId = 123;

      const existingUrl: Url = {
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        clicks: 5,
        userId: userId,
        user: new User(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      };

      const deletedUrl: Url = {
        ...existingUrl,
        deletedAt: new Date(),
      };

      mockUrlRepository.findOne.mockResolvedValue(existingUrl);
      mockUrlRepository.save.mockResolvedValue(deletedUrl);

      await service.softDeleteUrl(urlId, userId);

      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({
        where: { id: urlId },
      });
      expect(mockUrlRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('deve lançar NotFoundException quando URL não for encontrada', async () => {
      const urlId = 999;
      const userId = 123;

      mockUrlRepository.findOne.mockResolvedValue(null);

      await expect(service.softDeleteUrl(urlId, userId))
        .rejects.toThrow(NotFoundException);

      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({
        where: { id: urlId },
      });
    });

    it('deve lançar ForbiddenException quando usuário não é dono da URL', async () => {
      const urlId = 1;
      const userId = 123;

      const existingUrl: Url = {
        id: urlId,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        clicks: 5,
        userId: 456, 
        user: new User(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      };

      mockUrlRepository.findOne.mockResolvedValue(existingUrl);

      await expect(service.softDeleteUrl(urlId, userId))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
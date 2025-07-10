import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from './url.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from './entities/url.entity';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

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

  describe('shortenUrl (encurtar URL)', () => {
    it('deve retornar uma URL encurtada existente se originalUrl já existir', async () => {
      const urlExistente = { originalUrl: 'https://example.com', shortCode: 'abc123', clicks: 0 } as Url;
      mockUrlRepository.findOne.mockResolvedValue(urlExistente);

      const resultado = await service.shortenUrl({ originalUrl: 'https://example.com' });
      expect(resultado).toBe('http://localhost:3000/abc123');
      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({ where: { originalUrl: 'https://example.com' } });
      expect(mockUrlRepository.create).not.toHaveBeenCalled();
      expect(mockUrlRepository.save).not.toHaveBeenCalled();
    });

    it('deve criar uma nova URL encurtada se originalUrl não existir', async () => {
      mockUrlRepository.findOne.mockResolvedValueOnce(null);
      mockUrlRepository.findOne.mockResolvedValueOnce(null);
      mockUrlRepository.create.mockReturnValue({ originalUrl: 'https://new.com', shortCode: 'def456' });
      mockUrlRepository.save.mockResolvedValue({ originalUrl: 'https://new.com', shortCode: 'def456' });

      jest.spyOn(service as any, 'generateShortCode').mockReturnValue('def456');

      const resultado = await service.shortenUrl({ originalUrl: 'https://new.com' });
      expect(resultado).toBe('http://localhost:3000/def456');
      expect(mockUrlRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUrlRepository.create).toHaveBeenCalledWith({ originalUrl: 'https://new.com', shortCode: 'def456' });
      expect(mockUrlRepository.save).toHaveBeenCalledWith({ originalUrl: 'https://new.com', shortCode: 'def456' });
    });

    it('deve lançar BadRequestException para URLs inválidas', async () => {
      await expect(service.shortenUrl({ originalUrl: 'url-invalida' })).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException se não conseguir gerar um shortCode único', async () => {
      mockUrlRepository.findOne.mockResolvedValueOnce(null);
      mockUrlRepository.findOne.mockResolvedValue(true);     
      jest.spyOn(service as any, 'generateShortCode').mockReturnValue('fixed');

      await expect(service.shortenUrl({ originalUrl: 'https://another.com' })).rejects.toThrow(ConflictException);
    });
  });

  describe('redirectToOriginalUrl (redirecionar para URL original)', () => {
    it('deve retornar a URL original e incrementar os cliques', async () => {
      const url = { originalUrl: 'https://test.com', shortCode: 'xyz789', clicks: 5 } as Url;
      mockUrlRepository.findOne.mockResolvedValue(url);
      mockUrlRepository.save.mockResolvedValue({ ...url, clicks: 6 });

      const resultado = await service.redirectToOriginalUrl('xyz789');
      expect(resultado).toBe('https://test.com');
      expect(mockUrlRepository.findOne).toHaveBeenCalledWith({ where: { shortCode: 'xyz789' } });
      expect(url.clicks).toBe(6);
      expect(mockUrlRepository.save).toHaveBeenCalledWith(url);
    });

    it('deve lançar NotFoundException se o shortCode não for encontrado', async () => {
      mockUrlRepository.findOne.mockResolvedValue(null);

      await expect(service.redirectToOriginalUrl('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });
});

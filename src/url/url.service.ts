import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dto/create-url.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UrlService {
  private readonly logger = new Logger(UrlService.name);

  constructor(
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,
    private configService: ConfigService,
  ) {}

  async shortenUrl(
    createUrlDto: CreateUrlDto,
    userId?: number,
  ): Promise<string> {
    const { originalUrl } = createUrlDto;
    this.logger.log(`Tentando encurtar URL: ${originalUrl}`);

    if (!this.isValidUrl(originalUrl)) {
      this.logger.warn(`Formato de URL inválido: ${originalUrl}`);
      throw new BadRequestException('Invalid URL format.');
    }

    const existingUrl = await this.urlRepository.findOne({
      where: { originalUrl },
    });
    if (existingUrl) {
      const baseUrl = this.configService.get<string>('BASE_URL');
      this.logger.log(
        `URL encurtada com sucesso: ${existingUrl.shortCode} para ${originalUrl}`,
      );
      return `${baseUrl}/${existingUrl.shortCode}`;
    }

    let shortCode: string = '';
    let isUnique = false;
    const MAX_RETRIES = 10;
    let retries = 0;

    while (!isUnique && retries < MAX_RETRIES) {
      shortCode = this.generateShortCode();
      const found = await this.urlRepository.findOne({ where: { shortCode } });
      if (!found) {
        isUnique = true;
      }
      retries++;
    }

    if (!isUnique) {
      throw new ConflictException('Não foi possível gerar a url encurtada');
    }

    const urlData: Partial<Url> = {
      originalUrl,
      shortCode,
    };

    if (userId) {
      urlData.userId = userId;
    }

    const newUrl = this.urlRepository.create(urlData);
    await this.urlRepository.save(newUrl);

    const baseUrl = this.configService.get<string>('BASE_URL');
    this.logger.log(
      `URL encurtada com sucesso: ${newUrl.shortCode} para ${originalUrl}`,
    );
    return `${baseUrl}/${newUrl.shortCode}`;
  }

  async redirectToOriginalUrl(shortCode: string): Promise<string> {
    this.logger.log(`Tentando redirecionar pelo código: ${shortCode}`);
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      throw new NotFoundException('URL encurtada não encontrada.');
    }

    url.clicks = (url.clicks || 0) + 1;
    await this.urlRepository.save(url);
    this.logger.log(
      `Redirecionado ${shortCode} para ${url.originalUrl}. Clicks: ${url.clicks}`,
    );
    return url.originalUrl;
  }

  private generateShortCode(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      this.logger.error(`URL inválida: ${e}`);
      return false;
    }
  }
}

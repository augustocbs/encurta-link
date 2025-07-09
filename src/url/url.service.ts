import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dto/create-url.dto'; // Vamos criar este DTO
import { ConfigService } from '@nestjs/config'; // Para acessar BASE_URL

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,
    private configService: ConfigService, // Injetar ConfigService
  ) {}

  async shortenUrl(createUrlDto: CreateUrlDto): Promise<string> {
    const { originalUrl } = createUrlDto;

    // 1. Validar a originalUrl (básica, pode ser mais robusta com um Pipe)
    if (!this.isValidUrl(originalUrl)) {
      throw new BadRequestException('Invalid URL format.');
    }

    // 2. Verificar se a originalUrl já foi encurtada
    const existingUrl = await this.urlRepository.findOne({ where: { originalUrl } });
    if (existingUrl) {
      const baseUrl = this.configService.get<string>('BASE_URL');
      return `${baseUrl}/${existingUrl.shortCode}`;
    }

    // 3. Gerar shortCode único
    let shortCode: string;
    let isUnique = false;
    const MAX_RETRIES = 10; // Limite de tentativas para evitar loop infinito
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
      throw new ConflictException('Could not generate a unique short code after multiple attempts.');
    }

    // 4. Salvar a originalUrl e o shortCode no banco de dados
    const newUrl = this.urlRepository.create({ originalUrl, shortCode });
    await this.urlRepository.save(newUrl);

    const baseUrl = this.configService.get<string>('BASE_URL');
    return `${baseUrl}/${newUrl.shortCode}`;
  }

  async redirectToOriginalUrl(shortCode: string): Promise<string> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      throw new NotFoundException('Short URL not found or has been deleted.');
    }

    url.clicks++;
    await this.urlRepository.save(url);

    return url.originalUrl;
  }

  private generateShortCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
      return false;
    }
  }
}
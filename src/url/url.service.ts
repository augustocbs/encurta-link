import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dto/create-url.dto';
import { ConfigService } from '@nestjs/config';
import { UpdateUrlDto } from './dto/update-url.dto';

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
      throw new BadRequestException('URL com formato inválido.');
    }

    const existingUrls = await this.urlRepository.find({
      where: { originalUrl },
    });

    let urlToReuse: Url | null = null;

    if (existingUrls.length > 0) {
      for (const existingUrl of existingUrls) {
        if (existingUrl.userId === null && userId === undefined) {
          urlToReuse = existingUrl;
          break;
        } else if (
          existingUrl.userId !== null &&
          existingUrl.userId === userId
        ) {
          urlToReuse = existingUrl;
          break;
        }
      }
    }

    if (urlToReuse) {
      const baseUrl = this.configService.get<string>('BASE_URL');
      this.logger.log(
        `URL existente encontrada e reutilizada: ${urlToReuse.shortCode} para ${originalUrl}`,
      );
      return `${baseUrl}/${urlToReuse.shortCode}`;
    }

    this.logger.log(
      `Nenhuma URL existente adequada encontrada para reuso. Criando nova URL.`,
    );

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
    const savedUrl = await this.urlRepository.save(newUrl);

    const baseUrl = this.configService.get<string>('BASE_URL');
    this.logger.log(
      `URL encurtada com sucesso: ${savedUrl.shortCode} para ${originalUrl}`,
    );
    return `${baseUrl}/${savedUrl.shortCode}`;
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

  async getUrlsByUserId(userId: number): Promise<Url[]> {
    this.logger.log(`Buscando URLs para o usuário: ${userId}`);
    const urls = await this.urlRepository.find({
      where: {
        userId: userId,
        deletedAt: IsNull(),
      },
      select: ['originalUrl', 'shortCode', 'clicks'],
    });
    this.logger.log(`Encontradas ${urls.length} URLs para o usuário ${userId}`);
    return urls;
  }

  async updateUrl(
    id: number,
    updateUrlDto: UpdateUrlDto,
    userId: number,
  ): Promise<Url> {
    const { originalUrl } = updateUrlDto;
    this.logger.log(
      `Tentando atualizar URL ${id} para ${originalUrl} pelo usuário ${userId}`,
    );

    if (!this.isValidUrl(originalUrl)) {
      this.logger.warn(
        `Formato de URL inválido para atualização: ${originalUrl}`,
      );
      throw new BadRequestException('Nova URL com formato inválido.');
    }

    const url = await this.urlRepository.findOne({ where: { id } });

    if (!url) {
      this.logger.warn(`URL com ID ${id} não encontrada para atualização.`);
      throw new NotFoundException('URL não encontrada.');
    }

    if (url.userId !== userId) {
      this.logger.warn(
        `Usuário ${userId} tentou atualizar URL ${id} que não lhe pertence.`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar esta URL.',
      );
    }

    url.originalUrl = originalUrl;
    url.updatedAt = new Date();
    const updatedUrl = await this.urlRepository.save(url);
    this.logger.log(`URL ${id} atualizada com sucesso.`);
    return updatedUrl;
  }

  async softDeleteUrl(id: number, userId: number): Promise<void> {
    this.logger.log(
      `Tentando exclusão lógica da URL ${id} pelo usuário ${userId}`,
    );

    const url = await this.urlRepository.findOne({ where: { id } });

    if (!url) {
      this.logger.warn(`URL com ID ${id} não encontrada para exclusão.`);
      throw new NotFoundException('URL não encontrada.');
    }

    if (url.userId !== userId) {
      this.logger.warn(
        `Usuário ${userId} tentou excluir URL ${id} que não lhe pertence.`,
      );
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta URL.',
      );
    }

    url.deletedAt = new Date();
    await this.urlRepository.save(url);
    this.logger.log(`URL ${id} excluída logicamente com sucesso.`);
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

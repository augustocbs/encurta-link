import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('urls')
@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  @ApiOperation({ summary: 'Encurta uma URL longa' })
  @ApiResponse({
    status: 201,
    description: 'URL encurtada com sucesso.',
    type: String,
  })
  @ApiResponse({ status: 400, description: 'Formato de URL inválido.' })
  @ApiResponse({
    status: 409,
    description: 'Não foi possível gerar um código único.',
  })
  async shorten(@Body() createUrlDto: CreateUrlDto) {
    const shortUrl = await this.urlService.shortenUrl(createUrlDto);
    return { shortUrl };
  }

  @Get(':shortCode')
  @ApiOperation({ summary: 'Redireciona para a URL original' })
  @ApiParam({
    name: 'shortCode',
    description: 'O código curto da URL',
    example: 'aZbKq7',
  })
  @ApiResponse({
    status: 301,
    description: 'Redirecionamento bem-sucedido para a URL original.',
  })
  @ApiResponse({
    status: 404,
    description: 'URL curta não encontrada ou excluída.',
  })
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    try {
      const originalUrl =
        await this.urlService.redirectToOriginalUrl(shortCode);
      return res.redirect(HttpStatus.MOVED_PERMANENTLY, originalUrl);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'URL não encontrada.';
      res.status(HttpStatus.NOT_FOUND).json({ message: errorMessage });
    }
  }
}

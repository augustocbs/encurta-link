import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  HttpStatus,
  UseGuards, 
  Req, 
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger'; 
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('urls')
@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth() 
  @ApiOperation({ summary: 'Encurta uma URL longa, opcionalmente associando-a a um usuário autenticado.' })
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
  async shorten(@Body() createUrlDto: CreateUrlDto, @Req() req: Request) {
    const userId = req.user ? (req.user as any).id : null; 

    const shortUrl = await this.urlService.shortenUrl(createUrlDto, userId);
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
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
  Put, 
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';

@ApiTags('Urls')
@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
    'Encurta uma URL longa, opcionalmente associando-a a um usuário autenticado.',
  })
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
    const userId = (req.user as { id: number } | undefined)?.id;
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
    status: 302,
    description: 'Redirecionamento para a URL original.',
  })
  @ApiResponse({ status: 404, description: 'URL encurtada não encontrada.' })
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    try {
      const originalUrl =
        await this.urlService.redirectToOriginalUrl(shortCode);

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.redirect(HttpStatus.FOUND, originalUrl);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'URL não encontrada.';
      res.status(HttpStatus.NOT_FOUND).json({ message: errorMessage });
    }
  }

  @Get('') 
  @UseGuards(AuthGuard('jwt')) 
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todas as URLs encurtadas pertencentes ao usuário autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de URLs do usuário.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async getUrls(@Req() req: Request) {
    const userId = (req.user as { id: number }).id; 
    return this.urlService.getUrlsByUserId(userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza a URL original de uma URL encurtada específica.',
  })
  @ApiParam({
    name: 'id',
    description: 'O ID da URL encurtada a ser atualizada.',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'URL atualizada com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Formato de URL inválido.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido (URL não pertence ao usuário).' })
  @ApiResponse({ status: 404, description: 'URL não encontrada.' })
  async updateUrl(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUrlDto: UpdateUrlDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: number }).id;
    return this.urlService.updateUrl(id, updateUrlDto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Realiza a exclusão lógica de uma URL encurtada específica.',
  })
  @ApiParam({
    name: 'id',
    description: 'O ID da URL encurtada a ser excluída.',
    example: '123',
  })
  @ApiResponse({
    status: 204,
    description: 'URL excluída logicamente com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Proibido (URL não pertence ao usuário).' })
  @ApiResponse({ status: 404, description: 'URL não encontrada.' })
  async deleteUrl(
    @Param('id') id: number,
    @Req() req: Request, 
    @Res() res: Response
  ) {
    const userId = (req.user as { id: number }).id;
    await this.urlService.softDeleteUrl(id, userId);
    res.status(HttpStatus.NO_CONTENT).send(); 
  }
}
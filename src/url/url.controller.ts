import { Controller, Post, Get, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { Response } from 'express'; 

@Controller() 
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  async shorten(@Body() createUrlDto: CreateUrlDto) {
    const shortUrl = await this.urlService.shortenUrl(createUrlDto);
    return { shortUrl };
  }

  @Get(':shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    try {
      const originalUrl = await this.urlService.redirectToOriginalUrl(shortCode);
      return res.redirect(HttpStatus.MOVED_PERMANENTLY, originalUrl); 
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({ message: error.message || 'URL not found.' });
    }
  }
}
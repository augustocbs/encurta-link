import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UrlModule } from './url/url.module';
import { Url } from './url/entities/url.entity';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { createTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...createTypeOrmConfig(configService),
        entities: [Url, User],
        migrations: ['dist/migrations/*.js'],
        migrationsRun: false,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    WinstonModule.forRoot(winstonConfig),
    UrlModule,
    AuthModule,
  ],
})
export class AppModule {}

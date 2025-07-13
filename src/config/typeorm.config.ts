import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Url } from '../url/entities/url.entity';

export const createTypeOrmConfig = (configService: ConfigService) => {
  const dbHost = configService.get<string>('DB_HOST');
  const dbPort = configService.get<string>('DB_PORT');
  const dbUsername = configService.get<string>('DB_USERNAME');
  const dbPassword = configService.get<string>('DB_PASSWORD');
  const dbDatabase = configService.get<string>('DB_DATABASE');

  if (!dbHost) {
    throw new Error('DB_HOST is not defined in environment variables');
  }
  if (!dbUsername) {
    throw new Error('DB_USERNAME is not defined in environment variables');
  }
  if (!dbPassword) {
    throw new Error('DB_PASSWORD is not defined in environment variables');
  }
  if (!dbDatabase) {
    throw new Error('DB_DATABASE is not defined in environment variables');
  }

  return {
    type: 'postgres' as const,
    host: dbHost,
    port: parseInt(dbPort || '5432', 10),
    username: dbUsername,
    password: dbPassword,
    database: dbDatabase,
    entities: [User, Url],
    synchronize: false,
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
  };
};

export default new DataSource(createTypeOrmConfig(new ConfigService()));

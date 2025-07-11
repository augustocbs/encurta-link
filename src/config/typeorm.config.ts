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
    type: 'mysql' as const,
    host: dbHost,
    port: parseInt(dbPort || '3306', 10),
    username: dbUsername,
    password: dbPassword,
    database: dbDatabase,
    entities: [User, Url],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: true,
  };
};

export const createDataSourceForCli = () => {
  require('dotenv').config();
  return new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Url],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: true,
  });
};

export default createDataSourceForCli();

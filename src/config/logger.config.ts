import { WinstonModuleOptions } from 'nest-winston'; 
import * as winston from 'winston';

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.json(),
        winston.format.colorize({ all: true }),
      ),
    }),
  ],
};
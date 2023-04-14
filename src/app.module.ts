import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';

import { CFilesModule } from './core/c.files/c.files.module';
import { join } from 'path';
import { PrismaModule } from './config/core/prisma/prisma.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './config/core/interceptor/logger.interceptor';
import { CAuthModule } from './core/c.auth/c.auth.module';
import { CSessionModule } from './core/c.session/c.session.module';
import { LoggerMiddleware } from './config/core/middleware/http.logger.middleware';
import { AuthMustGuard } from './config/core/guard/auth.must.guard';
import { JwtModule } from '@nestjs/jwt';
import { CAuthService } from './core/c.auth/c.auth.service';
import { CUserModule } from './core/c.user/c.user.module';
import { HttpExceptionFilter } from './config/core/filters/http.exception.filter';
import { CUserService } from './core/c.user/c.user.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
      exclude: ['/api*', '/docs*'],
    }),
    ConfigModule,
    ConfigModule.forRoot({ envFilePath: [`.env.${process.env.NODE_ENV}`] }),
    PrismaModule,
    JwtModule,

    ///////////////////

    CFilesModule,
    CAuthModule,
    CSessionModule,
    CUserModule,
  ],
  controllers: [],
  providers: [
    CAuthService,
    Logger,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    { provide: APP_GUARD, useClass: AuthMustGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

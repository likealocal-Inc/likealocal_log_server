import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message;

    console.log('----- PrismaClientExceptionFilter ----');
    console.log(exception);
    console.log(host);
    console.log('---------------------------------------');

    switch (exception.code) {
      case 'P2002':
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message,
        });
        break;
      default:
        super.catch(exception, host);
    }

    super.catch(exception, host);
  }
}

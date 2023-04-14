import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CUserService } from '../c.user/c.user.service';
import { PrismaService } from 'src/config/core/prisma/prisma.service';
import { CreateCUserDto } from '../c.user/dto/create-c.user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig } from 'src/config/core/authentication/jwt.config';
import { CSessionService } from '../c.session/c.session.service';
import { CAuthUtils } from './c.auth.utils';
import { EmailLoginDto } from './dto/email.login.dto';
import { Role } from '@prisma/client';
import { CUserEntity } from '../c.user/entities/c.user.entity';
import { ExceptionCodeList } from 'src/config/core/exceptions/exception.code';
import { DefaultConfig } from 'src/config/default.config';
import { CustomException } from 'src/config/core/exceptions/custom.exception';
import { LoginResponseDto } from './dto/login.response.dto';

@Injectable()
export class CAuthService {
  cAuthUtils: CAuthUtils;
  constructor(
    private readonly prisma: PrismaService,
    private readonly cUserService: CUserService,
    private readonly jwtService: JwtService,
    private readonly sessionService: CSessionService,
  ) {
    this.cAuthUtils = new CAuthUtils(this.prisma);
  }

  /**
   * 이메일 회원가입
   * @param createJoinDto
   * @returns
   */
  async joinEmail(createJoinDto: CreateCUserDto): Promise<CreateCUserDto> {
    return await this.cUserService.create(createJoinDto);
  }

  /**
   * 사용자 인증처리
   * @param email
   * @param pass
   * @returns
   */
  async validateUser(user: EmailLoginDto, roles: Role[]): Promise<CUserEntity> {
    const dbUser: CUserEntity = await this.cUserService.findOneByEmailAndRole(
      user,
      roles,
    );
    // DB 조회 사용자가 없으면 -> 예외
    if (dbUser == null) {
      throw new CustomException(ExceptionCodeList.USER.NOT_EXIST_EMAIL);
    }

    // 패스워드가 정확할때
    if (dbUser && dbUser.password === user.password) {
      dbUser.password = '';
      return dbUser;
    }
    // 패스워드 오류
    throw new CustomException(ExceptionCodeList.AUTH.WRONG_PASSWORD);
  }

  async makeResponseAfterSession(
    dbUser: CUserEntity,
  ): Promise<LoginResponseDto> {
    const token = await this.createToken(dbUser);
    const userSessionKey = await this.sessionService.setSession(
      dbUser.id,
      token,
    );
    const resLoginDto: LoginResponseDto = new LoginResponseDto(
      dbUser,
      userSessionKey,
    );

    return resLoginDto;
  }

  /**
   * 이메일 로그인
   * @param user
   * @param roles
   * @returns
   */
  async loginEmail(user: EmailLoginDto, roles: Role[]) {
    const dbUser: CUserEntity = await this.validateUser(user, roles);
    return await this.makeResponseAfterSession(dbUser);
  }

  /**
   * 토큰 검증
   * @param token
   * @returns
   */
  async verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: JwtConfig.secrete,
    });
  }

  async createToken(user: CUserEntity) {
    const payload = { email: user.email, id: user.id, role: user.role };
    try {
      const token = this.jwtService.sign(payload, {
        expiresIn: DefaultConfig.session.expireTime,
      });

      const resToken = await this.prisma.token.findUnique({
        where: { userId: user.id },
      });
      if (!resToken) {
        await this.prisma.token.upsert({
          where: {
            userId: user.id,
          },
          create: { userId: user.id, token },
          update: { token },
        });
      } else {
        await this.prisma.token.update({
          where: { id: resToken.id },
          data: { token },
        });
      }

      return token;
    } catch (err) {
      throw new CustomException(ExceptionCodeList.AUTH.TOKEN_FAIL);
    }
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { InviteDto } from './dto/invite.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const invitation = await this.prisma.invitationToken.findUnique({
      where: { token: dto.invitationToken },
    });

    if (
      !invitation ||
      invitation.usedAt !== null ||
      invitation.expiresAt < new Date()
    ) {
      throw new BadRequestException('Token de invitación inválido o expirado');
    }

    if (invitation.email !== dto.email) {
      throw new BadRequestException(
        'El correo no coincide con el de la invitación',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
        },
        select: { id: true, email: true, role: true },
      });

      await tx.invitationToken.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    return this.signTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
      select: { id: true, email: true, role: true, passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { passwordHash: _ph, ...safeUser } = user;
    return this.signTokens(safeUser);
  }

  async invite(dto: InviteDto, requesterId: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });

    if (!requester || requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo SUPER_ADMIN puede generar invitaciones');
    }

    const expiryHours = parseInt(
      (await this.getAppConfig('INVITATION_EXPIRY_HOURS')) ?? '72',
      10,
    );

    const token = await this.prisma.invitationToken.create({
      data: {
        email: dto.email,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
        createdBy: requesterId,
      },
      select: { token: true, email: true, expiresAt: true },
    });

    return token;
  }

  async refresh(dto: RefreshDto) {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, email: true, role: true },
    });
    if (!user) throw new UnauthorizedException();

    return this.signTokens(user);
  }

  private async signTokens(user: { id: string; email: string; role: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessExpiresIn = (this.config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshExpiresIn = (this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  private async getAppConfig(key: string): Promise<string | null> {
    const entry = await this.prisma.appConfig.findUnique({ where: { key } });
    return entry?.value ?? null;
  }
}

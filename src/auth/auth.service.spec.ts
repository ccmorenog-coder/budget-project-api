import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const mockPrisma = {
  invitationToken: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  appConfig: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('secret'),
  get: jest.fn().mockReturnValue('15m'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const validInvitation = {
      id: 'inv-id',
      email: 'user@test.com',
      token: 'valid-token',
      usedAt: null,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };

    it('registers a user successfully with a valid invitation token', async () => {
      mockPrisma.invitationToken.findUnique.mockResolvedValue(validInvitation);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: typeof mockPrisma) => Promise<unknown>) => {
        const newUser = { id: 'user-id', email: 'user@test.com', role: 'USER' };
        mockPrisma.user.create.mockResolvedValue(newUser);
        return cb(mockPrisma);
      });

      const result = await service.register({
        email: 'user@test.com',
        password: 'Password1!',
        invitationToken: 'valid-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('user@test.com');
    });

    it('throws BadRequestException when token is expired', async () => {
      mockPrisma.invitationToken.findUnique.mockResolvedValue({
        ...validInvitation,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.register({ email: 'user@test.com', password: 'Password1!', invitationToken: 'expired' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token is already used', async () => {
      mockPrisma.invitationToken.findUnique.mockResolvedValue({
        ...validInvitation,
        usedAt: new Date(),
      });

      await expect(
        service.register({ email: 'user@test.com', password: 'Password1!', invitationToken: 'used' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when email does not match invitation', async () => {
      mockPrisma.invitationToken.findUnique.mockResolvedValue(validInvitation);

      await expect(
        service.register({ email: 'other@test.com', password: 'Password1!', invitationToken: 'valid-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when email is already registered', async () => {
      mockPrisma.invitationToken.findUnique.mockResolvedValue(validInvitation);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.register({ email: 'user@test.com', password: 'Password1!', invitationToken: 'valid-token' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      const passwordHash = await bcrypt.hash('Password1!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@test.com',
        role: 'USER',
        passwordHash,
      });

      const result = await service.login({ email: 'user@test.com', password: 'Password1!' });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('user@test.com');
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'no@test.com', password: 'Password1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correct-pass', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'user@test.com',
        role: 'USER',
        passwordHash,
      });

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong-pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('invite', () => {
    it('creates invitation token when requester is SUPER_ADMIN', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      mockPrisma.appConfig.findUnique.mockResolvedValue({ value: '72' });
      mockPrisma.invitationToken.create.mockResolvedValue({
        token: 'new-token',
        email: 'invited@test.com',
        expiresAt: new Date(),
      });

      const result = await service.invite({ email: 'invited@test.com' }, 'admin-id');

      expect(result).toHaveProperty('token');
      expect(result.email).toBe('invited@test.com');
    });

    it('throws ForbiddenException when requester is not SUPER_ADMIN', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' });

      await expect(
        service.invite({ email: 'invited@test.com' }, 'user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refresh', () => {
    it('returns new tokens when refresh token is valid', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-id', email: 'user@test.com', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id', email: 'user@test.com', role: 'USER' });

      const result = await service.refresh({ refreshToken: 'valid-refresh' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws UnauthorizedException when refresh token is invalid', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(
        service.refresh({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user no longer exists', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'ghost-id', email: 'ghost@test.com', role: 'USER' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'valid-refresh' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

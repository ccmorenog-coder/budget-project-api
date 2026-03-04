import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ENCODING = 'hex' as const;

@Injectable()
export class FieldCipherService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const secret = config.getOrThrow<string>('SERVER_MASTER_SECRET');
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString(ENCODING);
  }

  decrypt(ciphertext: string): string {
    const buf = Buffer.from(ciphertext, ENCODING);
    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    return (
      decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8')
    );
  }

  encryptIfValue(value: string | null | undefined): string {
    if (value === null || value === undefined) return '0';
    return this.encrypt(value);
  }

  decryptSafe(ciphertext: string | null | undefined): string {
    if (!ciphertext) return '0';
    try {
      return this.decrypt(ciphertext);
    } catch {
      return ciphertext;
    }
  }
}

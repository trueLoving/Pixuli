import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(request: Request): Promise<any> {
    // 从 Header 中获取 API Key
    // 支持两种方式：
    // 1. Authorization: Bearer <api-key>
    // 2. X-API-Key: <api-key>
    const apiKey =
      this.extractApiKeyFromHeader(request) ||
      this.extractApiKeyFromQuery(request);

    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }

    const isValid = await this.authService.validateApiKey(apiKey);
    if (!isValid) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return { apiKey };
  }

  /**
   * 从 Header 中提取 API Key
   */
  private extractApiKeyFromHeader(request: Request): string | null {
    // 方式1: Authorization: Bearer <api-key>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 方式2: X-API-Key: <api-key>
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
      return apiKeyHeader;
    }

    return null;
  }

  /**
   * 从 Query 参数中提取 API Key（不推荐，但为了兼容性提供）
   */
  private extractApiKeyFromQuery(request: Request): string | null {
    const apiKey = request.query.apiKey;
    if (apiKey && typeof apiKey === 'string') {
      return apiKey;
    }
    return null;
  }
}

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@ApiSecurity('api-key')
@ApiSecurity('bearer')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('api-keys')
  @ApiOperation({
    summary: 'Create API Key',
    description: 'Create a new API Key for authentication',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'API Key name/description',
          example: 'Production API Key',
        },
        expiresAt: {
          type: 'string',
          format: 'date-time',
          description: 'Expiration date (optional)',
          example: '2025-12-31T23:59:59Z',
          required: ['false'],
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'API Key created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        key: { type: 'string', example: 'pk_abc123...' },
        name: { type: 'string', example: 'Production API Key' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(
    @Body() body: { name: string; expiresAt?: string },
  ): Promise<{ id: string; key: string; name: string }> {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    return this.authService.createApiKey(body.name, expiresAt);
  }

  @Get('api-keys')
  @ApiOperation({
    summary: 'List API Keys',
    description: 'Get a list of all API Keys (without actual key values)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of API Keys',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          isActive: { type: 'boolean' },
          lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async listApiKeys() {
    return this.authService.listApiKeys();
  }

  @Delete('api-keys/:id')
  @ApiOperation({
    summary: 'Delete API Key',
    description: 'Delete an API Key by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'API Key ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'API Key deleted successfully',
  })
  @HttpCode(HttpStatus.OK)
  async deleteApiKey(@Param('id') id: string): Promise<{ message: string }> {
    await this.authService.deleteApiKey(id);
    return { message: 'API Key deleted successfully' };
  }

  @Post('api-keys/:id/deactivate')
  @ApiOperation({
    summary: 'Deactivate API Key',
    description: 'Deactivate an API Key (disable without deleting)',
  })
  @ApiParam({
    name: 'id',
    description: 'API Key ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'API Key deactivated successfully',
  })
  @HttpCode(HttpStatus.OK)
  async deactivateApiKey(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.authService.deactivateApiKey(id);
    return { message: 'API Key deactivated successfully' };
  }
}

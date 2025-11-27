English | [中文](./README-ZH.md)

# Pixuli Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Required Node.JS >= 22.0.0](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/about/releases)

Backend service for Pixuli intelligent image management application, built with
NestJS, Prisma, and supporting multiple storage backends.

## ✨ Features

- 📸 **Image Management** - Upload, retrieve, update, and delete images with
  metadata
- 🔐 **API Key Authentication** - Flexible authentication system supporting
  environment variables and database-stored API keys
- 💾 **Multiple Storage Backends** - Support for local filesystem and MinIO
  object storage
- 📚 **Swagger API Documentation** - Interactive API documentation with
  authentication support
- 🏷️ **Tag System** - Organize images with tags and search functionality
- 🔍 **Metadata Management** - Rich metadata support including title,
  description, and custom fields

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 22.0.0
- **pnpm** >= 8.0.0 (Required, project only supports pnpm)
- **MySQL** >= 8.0 (or MariaDB)
- **Docker** (Optional, for MinIO deployment)

### Installation

1. **Install dependencies**:

```bash
pnpm install
```

2. **Configure environment variables**:

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/pixuli"
PORT=3000

# Storage (choose one or both)
STORAGE_TYPES=local
# STORAGE_TYPES=minio
# STORAGE_TYPES=local,minio

# Authentication (optional)
API_KEY=your-secret-api-key-here
```

3. **Create database**:

```sql
CREATE DATABASE pixuli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. **Run database migrations**:

```bash
pnpm prisma migrate dev
```

5. **Start development server**:

```bash
pnpm dev
```

Server will start at `http://localhost:3000` (or configured PORT).

## 📋 Available Commands

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm preview          # Preview production build

# Database
pnpm init:database    # Initialize database
pnpm init:minio       # Initialize MinIO storage bucket

# Prisma
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run database migrations
pnpm prisma:studio    # Open Prisma Studio (database GUI)
```

## 🔌 API Endpoints

### Image Management

- `POST /api/images/upload` - Upload a single image
- `POST /api/images/upload/multiple` - Upload multiple images
- `GET /api/images` - Get all images
- `GET /api/images/:id` - Get image metadata by ID
- `GET /api/images/:id/file` - Get image file
- `GET /api/images/:id/presigned-url` - Get presigned URL (MinIO only)
- `PUT /api/images/:id/metadata` - Update image metadata
- `DELETE /api/images/:id` - Delete image
- `GET /api/images/tags/:tagName` - Get images by tag

### Authentication

- `POST /api/auth/api-keys` - Create API Key
- `GET /api/auth/api-keys` - List API Keys
- `DELETE /api/auth/api-keys/:id` - Delete API Key
- `POST /api/auth/api-keys/:id/deactivate` - Deactivate API Key

### Health Check

- `GET /` - Health check endpoint (no authentication required)

## 📚 API Documentation

Interactive Swagger documentation is available at:

**http://localhost:3000/api**

Click the "Authorize" button to configure API Key authentication for testing.

## 🔐 Authentication

Pixuli Server supports two authentication modes:

### Mode 1: Environment Variable API Key (Simple)

Set `API_KEY` in `.env`:

```env
API_KEY=your-secret-api-key-here
```

### Mode 2: Database API Keys (Full)

Enable database-stored API keys:

```env
ENABLE_DB_API_KEYS=true
```

Then run migrations and create API keys via the API.

**Usage**:

```bash
# Using X-API-Key header
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/images

# Using Bearer token
curl -H "Authorization: Bearer your-api-key" http://localhost:3000/api/images
```

For detailed authentication guide, see
[Authentication Documentation](./docs/auth-design.md).

## 💾 Storage Configuration

### Local Storage (Default)

No additional setup required. Files are stored in `uploads/images/` directory.

```env
STORAGE_TYPES=local
STORAGE_LOCAL_DIR=uploads/images
```

### MinIO Object Storage

1. **Start MinIO with Docker**:

```bash
docker-compose -f docker-compose.minio.yml up -d
```

2. **Configure environment**:

```env
STORAGE_TYPES=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pixuli-images
MINIO_USE_SSL=false
```

3. **Initialize bucket**:

```bash
pnpm init:minio
```

### Dual Storage (Backup)

Use both local and MinIO for redundancy:

```env
STORAGE_TYPES=local,minio
```

## 📁 Project Structure

```
server/
├── src/
│   ├── auth/              # Authentication module
│   ├── images/             # Image management module
│   ├── prisma/             # Prisma service
│   ├── storage/             # Storage adapters
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration files
├── docs/                   # Documentation
├── scripts/                 # Utility scripts
└── docker-compose.minio.yml # MinIO Docker Compose
```

## 📖 Documentation

- [Storage Design](./docs/image-storage-desgin.md) - Storage architecture and
  configuration
- [Authentication Design](./docs/auth-design.md) - API Key authentication system

## 🔧 Troubleshooting

### Database Connection Failed

1. Verify `DATABASE_URL` in `.env` is correct
2. Ensure MySQL service is running
3. Check database user permissions

### Migration Failed

1. Ensure database exists
2. Verify user has CREATE TABLE permissions
3. Check error logs for details

### MinIO Connection Failed

1. Check MinIO service is running: `docker ps | grep minio`
2. Verify endpoint and credentials
3. Run `pnpm init:minio` to initialize bucket

### Authentication Issues

1. Verify `API_KEY` is set (Mode 1) or `ENABLE_DB_API_KEYS=true` (Mode 2)
2. Check API Key is included in request headers
3. Verify API Key is active and not expired

## 🛠️ Technology Stack

- **Framework**: NestJS 11
- **Database**: Prisma + MySQL/MariaDB
- **Storage**: Local filesystem, MinIO (S3-compatible)
- **Authentication**: Passport.js with custom API Key strategy
- **Documentation**: Swagger/OpenAPI
- **Image Processing**: Sharp

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

⭐ If this project is helpful to you, please give us a star!

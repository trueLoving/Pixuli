# Docker Configuration for Pixuli Web

This directory contains all Docker-related configuration files for the Pixuli
Web application.

## Files

- `Dockerfile` - Docker image build configuration
- `nginx.conf` - Nginx web server configuration
- `.dockerignore` - Files to exclude from Docker build context

## Building Docker Image

### Prerequisites

1. Build the web application first:

   ```bash
   # From project root
   pnpm build:web
   ```

2. Ensure the `apps/pixuli/dist` directory exists with the built application.

### Build Command

From the project root directory:

```bash
docker build -f apps/pixuli/docker/Dockerfile -t pixuli-web .
```

### Run Container

```bash
# Run the container
docker run -d -p 8080:80 --name pixuli-web pixuli-web:latest

# Access the application
# Open http://localhost:8080 in your browser
```

## Configuration

### Nginx Configuration

The `nginx.conf` file includes:

- Gzip compression
- Security headers
- Static asset caching
- Gitee proxy for cross-origin image access
- SPA routing support
- Health check endpoint

### Docker Ignore

The `.dockerignore` file excludes:

- Node modules
- Development files
- Build artifacts (except dist)
- Git files
- Test files
- Editor configurations

## Notes

- The Dockerfile assumes the application is already built locally
- Environment variables should be configured during the build process
- The nginx configuration includes a proxy for Gitee images to handle CORS
  issues

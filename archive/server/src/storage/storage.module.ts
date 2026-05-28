import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { MinIOStorageAdapter } from './adapters/minio-storage.adapter';

@Global()
@Module({
  providers: [StorageService, LocalStorageAdapter, MinIOStorageAdapter],
  exports: [StorageService, LocalStorageAdapter],
})
export class StorageModule {}

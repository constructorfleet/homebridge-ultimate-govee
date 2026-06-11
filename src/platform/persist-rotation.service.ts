import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { readdir, rename, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } from './platform.module';

const RotatedFileSuffixPattern = /\.\d+$/;

@Injectable()
export class PersistRotationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PersistRotationService.name);
  private interval?: NodeJS.Timeout;
  private running = false;

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: typeof OPTIONS_TYPE,
  ) {}

  onModuleInit(): void {
    const maxFileSize = this.options.persistMaxFileSizeBytes;
    if (maxFileSize === undefined || maxFileSize < 1) {
      return;
    }

    this.checkAndRotate().catch((error) =>
      this.logger.error(`Initial persisted file rotation failed: ${error}`),
    );

    this.interval = setInterval(() => {
      this.checkAndRotate().catch((error) =>
        this.logger.error(`Persisted file rotation failed: ${error}`),
      );
    }, 30_000);
    this.interval.unref();
  }

  onModuleDestroy(): void {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private async checkAndRotate(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.rotateDirectory(this.options.storagePath);
    } finally {
      this.running = false;
    }
  }

  private async rotateDirectory(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(directory, entry.name);
        if (entry.isDirectory()) {
          await this.rotateDirectory(fullPath);
          return;
        }
        if (
          !entry.isFile() ||
          !entry.name.startsWith('govee.') ||
          RotatedFileSuffixPattern.test(entry.name)
        ) {
          return;
        }
        await this.rotateFileIfNeeded(fullPath);
      }),
    );
  }

  private async rotateFileIfNeeded(path: string): Promise<void> {
    const maxFileSize = this.options.persistMaxFileSizeBytes;
    if (maxFileSize === undefined || maxFileSize < 1) {
      return;
    }
    const fileStats = await stat(path);
    if (fileStats.size <= maxFileSize) {
      return;
    }
    const rotatedPath = `${path}.1`;
    try {
      await unlink(rotatedPath);
    } catch {}
    await rename(path, rotatedPath);
    this.logger.warn(
      `Rotated persisted file ${path} at ${fileStats.size} bytes (max ${maxFileSize})`,
    );
  }
}

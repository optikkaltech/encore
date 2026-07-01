import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';

@Injectable()
export class SystemConfigService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
  ) {}

  /**
   * Seed default system config values on application start
   */
  async onApplicationBootstrap() {
    const defaultConfigs: Array<{
      key: string;
      value: string;
      type: 'string' | 'number' | 'boolean' | 'json';
    }> = [
      {
        key: 'unregistered_max_transaction_amount',
        value: '5000',
        type: 'number',
      },
      {
        key: 'unregistered_max_monthly_volume',
        value: '50000',
        type: 'number',
      },
      {
        key: 'unregistered_require_cac_for_live',
        value: 'true',
        type: 'boolean',
      },
    ];

    for (const config of defaultConfigs) {
      const exists = await this.configRepo.findOne({
        where: { key: config.key },
      });
      if (!exists) {
        await this.configRepo.save(this.configRepo.create(config));
      }
    }
  }

  /**
   * Get parsed config value by key
   */
  async get(key: string, defaultValue?: any): Promise<any> {
    const config = await this.configRepo.findOne({ where: { key } });
    if (!config) {
      return defaultValue;
    }
    return this.parseValue(config.value, config.type);
  }

  /**
   * Get all configs as a key-value dictionary
   */
  async getAll(): Promise<Record<string, any>> {
    const configs = await this.configRepo.find();
    const result: Record<string, any> = {};
    for (const config of configs) {
      result[config.key] = this.parseValue(config.value, config.type);
    }
    return result;
  }

  /**
   * Create or update config value
   */
  async set(
    key: string,
    value: any,
    type: 'string' | 'number' | 'boolean' | 'json' = 'string',
  ): Promise<SystemConfig> {
    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    let config = await this.configRepo.findOne({ where: { key } });
    if (config) {
      config.value = stringValue;
      config.type = type;
    } else {
      config = this.configRepo.create({ key, value: stringValue, type });
    }
    return this.configRepo.save(config);
  }

  /**
   * Helper to parse string database values back to correct types
   */
  private parseValue(
    value: string,
    type: 'string' | 'number' | 'boolean' | 'json',
  ): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      case 'string':
      default:
        return value;
    }
  }
}

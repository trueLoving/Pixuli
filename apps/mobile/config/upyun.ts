import { UpyunConfig } from 'pixuli-ui/src';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UPYUN_CONFIG_KEY = 'pixuli-upyun-config';

export const loadUpyunConfig = async (): Promise<UpyunConfig | null> => {
  try {
    const config = await AsyncStorage.getItem(UPYUN_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Failed to load upyun config:', error);
    return null;
  }
};

export const saveUpyunConfig = async (config: UpyunConfig): Promise<void> => {
  try {
    await AsyncStorage.setItem(UPYUN_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save upyun config:', error);
    throw new Error('保存又拍云配置失败');
  }
};

export const clearUpyunConfig = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(UPYUN_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear upyun config:', error);
    throw new Error('清除又拍云配置失败');
  }
};

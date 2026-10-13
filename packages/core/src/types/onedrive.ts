/** OneDrive（Microsoft Graph）连接配置。令牌由用户自备的 Azure 公共客户端取得。 */
export interface OneDriveConfig {
  accessToken: string;
  refreshToken?: string;
  /** Azure 应用（公共客户端）ID，用于设备码与刷新令牌 */
  clientId?: string;
  /** 网盘根下的同步目录；空字符串表示整个 OneDrive 根 */
  path: string;
  /** access token 过期时间（毫秒时间戳） */
  expiresAt?: number;
}

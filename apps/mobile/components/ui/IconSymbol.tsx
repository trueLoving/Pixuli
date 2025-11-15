// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<
  SymbolViewProps['name'],
  ComponentProps<typeof MaterialIcons>['name']
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  gear: 'settings',
  link: 'link',
  'chevron.left': 'chevron-left',
  xmark: 'close',
  pencil: 'edit',
  'info.circle': 'info',
  'info.circle.fill': 'info',
  trash: 'delete',
  'sun.max.fill': 'wb-sunny',
  'moon.fill': 'nightlight-round',
  'circle.lefthalf.filled': 'brightness-6',
  'checkmark.circle.fill': 'check-circle',
  'arrow.up.circle': 'arrow-circle-up',
  'arrow.down.circle': 'arrow-circle-down',
  // Search and Filter icons
  magnifyingglass: 'search',
  'xmark.circle.fill': 'cancel',
  'line.3.horizontal.decrease.circle': 'filter-list',
  'arrow.up.arrow.down': 'swap-vert',
  checkmark: 'check',
  plus: 'add',
  'arrow.clockwise': 'refresh',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}

/**
 * Kostly Design.md §4 specifies Light mode as the initial product appearance.
 * Colors.dark remains defined in theme.ts for future extensibility.
 */
import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors.light;
}

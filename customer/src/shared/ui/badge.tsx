// Re-export badge from components/ui
import { Badge as BadgeComponent, badgeVariants } from '../../app/components/ui/badge';

export const Badge = BadgeComponent;
export { badgeVariants };
export type BadgeProps = React.ComponentProps<typeof BadgeComponent>;
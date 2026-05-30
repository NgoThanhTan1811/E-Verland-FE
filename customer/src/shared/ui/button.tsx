// Re-export button from components/ui
import { Button as ButtonComponent, buttonVariants } from '../../app/components/ui/button';

export const Button = ButtonComponent;
export { buttonVariants };
export type ButtonProps = React.ComponentProps<typeof ButtonComponent>;
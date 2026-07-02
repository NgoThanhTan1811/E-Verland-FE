// Re-export input from components/ui
import { Input as InputComponent } from '../../app/components/ui/input';

export const Input = InputComponent;
export type InputProps = React.ComponentProps<typeof InputComponent>;
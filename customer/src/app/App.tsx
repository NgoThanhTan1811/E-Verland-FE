import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from '../shared/contexts/auth-context';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}
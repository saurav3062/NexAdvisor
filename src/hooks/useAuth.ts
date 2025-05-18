import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { endpoints } from '../services/api/endpoints';
import { useAuthStore } from '../lib/store';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: endpoints.auth.login,
    onSuccess: ({ user, token, refreshToken }) => {
      setAuth(user, token, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to log in');
    },
  });

  const registerMutation = useMutation({
    mutationFn: endpoints.auth.register,
    onSuccess: ({ user, token }) => {
      setAuth(user, token, '');
      toast.success('Account created successfully!');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: endpoints.auth.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to log out');
      // Force logout on error
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoading: loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
    error: loginMutation.error || registerMutation.error || logoutMutation.error,
  };
}

export function useProfile() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => endpoints.profile.getStats(),
    enabled: !!user,
  });
}
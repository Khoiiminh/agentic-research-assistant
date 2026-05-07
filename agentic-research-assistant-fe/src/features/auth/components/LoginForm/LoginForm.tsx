'use client';

import { TextInput, PasswordInput, Button, Stack, Group, Anchor, Divider, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks';
import { AuthLayout } from '@/features/auth/components';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const { login, isLoading, error, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/chatbot');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    try {
      await login(email, password);
      router.push('/chatbot');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setLocalError(errorMessage);
    }
  };

  const displayError = localError || error;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your research journey"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {displayError && (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
              {displayError}
            </Alert>
          )}

          {/* Social login buttons */}
          <Group grow>
            <Button variant="outline" size="md" fullWidth disabled={isLoading}>
              Google
            </Button>
            <Button variant="outline" size="md" fullWidth disabled={isLoading}>
              GitHub
            </Button>
          </Group>

          {/* Divider */}
          <Divider label="or continue with email" labelPosition="center" />

          {/* Email field */}
          <TextInput
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            size="md"
            disabled={isLoading}
            type="email"
          />

          {/* Password field */}
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                Password
              </Text>
              <Link href="/forgot-password" style={{ textDecoration: 'none' }}>
                <Anchor size="sm" component="span">
                  Forgot password?
                </Anchor>
              </Link>
            </Group>
            <PasswordInput
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              size="md"
              disabled={isLoading}
            />
          </Stack>

          {/* Submit button */}
          <Button
            type="submit"
            fullWidth
            size="md"
            loading={isLoading}
            style={{ marginTop: '0.5rem' }}
          >
            Sign in →
          </Button>

          {/* Register link */}
          <Text size="sm" ta="center" c="dimmed">
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <Anchor size="sm" component="span">
                Create one
              </Anchor>
            </Link>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}

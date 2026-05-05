'use client';

import { TextInput, PasswordInput, Checkbox, Button, Stack, Group, Anchor, Divider, Text } from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../AuthLayout';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Redirect to dashboard after successful login
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your research journey"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Social login buttons */}
          <Group grow>
            <Button variant="outline" size="md" fullWidth>
              Google
            </Button>
            <Button variant="outline" size="md" fullWidth>
              GitHub
            </Button>
          </Group>

          {/* Divider */}
          <Divider label="or continue with email" labelPosition="center" />

          {/* Email field */}
          <TextInput
            label="Email address"
            placeholder="you@example.com"
            required
            size="md"
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
              required
              size="md"
            />
          </Stack>

          {/* Remember me */}
          <Checkbox label="Remember me for 30 days" />

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

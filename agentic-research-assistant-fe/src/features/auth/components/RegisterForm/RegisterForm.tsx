'use client';

import { TextInput, PasswordInput, Checkbox, Button, Stack, Group, Anchor, Box, Divider, Text } from '@mantine/core';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../AuthLayout';

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Redirect to dashboard after successful registration
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*]/.test(password) },
  ];

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start exploring the future of AI-powered research"
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
          <Divider label="or register with email" labelPosition="center" />

          {/* Full Name field */}
          <TextInput
            label="Full name"
            placeholder="John Doe"
            required
            size="md"
          />

          {/* Email field */}
          <TextInput
            label="Email address"
            placeholder="you@example.com"
            required
            size="md"
          />

          {/* Password field */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Password
            </Text>
            <PasswordInput
              placeholder="Create a secure password"
              required
              size="md"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />

            {/* Password requirements */}
            {password && (
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                {passwordRequirements.map((req, index) => (
                  <Group key={index} gap="xs" style={{ alignItems: 'center' }}>
                    <Text size="xs" style={{ flex: 1 }}>
                      {req.met ? '✓' : '✗'} {req.label}
                    </Text>
                  </Group>
                ))}
              </Box>
            )}
          </Stack>

          {/* Terms */}
          <Group gap="xs" align="flex-start">
            <Checkbox required style={{ marginTop: '0.25rem' }} />
            <Text size="xs" style={{ flex: 1 }}>
              I agree to the{' '}
              <Link href="/terms" style={{ textDecoration: 'none' }}>
                <Anchor size="xs" component="span">
                  Terms of Service
                </Anchor>
              </Link>{' '}
              and{' '}
              <Link href="/privacy" style={{ textDecoration: 'none' }}>
                <Anchor size="xs" component="span">
                  Privacy Policy
                </Anchor>
              </Link>
            </Text>
          </Group>

          {/* Submit button */}
          <Button
            type="submit"
            fullWidth
            size="md"
            loading={isLoading}
            style={{ marginTop: '0.5rem' }}
          >
            Create account →
          </Button>

          {/* Login link */}
          <Text size="sm" ta="center" c="dimmed">
            Already have an account?{' '}
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Anchor size="sm" component="span">
                Sign in
              </Anchor>
            </Link>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}

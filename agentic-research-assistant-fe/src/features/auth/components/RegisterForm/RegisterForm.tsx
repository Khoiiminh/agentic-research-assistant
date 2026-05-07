'use client';

import { TextInput, PasswordInput, Checkbox, Button, Stack, Group, Anchor, Divider, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks';
import { AuthLayout } from '@/features/auth/components';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const { register, isLoading, error, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/chatbot');
    }
  }, [user, router]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password || !confirmPassword) {
      setLocalError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setLocalError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    try {
      await register(email, password, confirmPassword);
      router.push('/chatbot');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setLocalError(errorMessage);
    }
  };

  const displayError = localError || error;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start exploring the future of AI-powered research"
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
          <Divider label="or register with email" labelPosition="center" />

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
            <Text size="sm" fw={500}>
              Password
            </Text>
            <PasswordInput
              placeholder="Create a secure password"
              required
              size="md"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              disabled={isLoading}
            />

          </Stack>

          {/* Confirm Password field */}
          <PasswordInput
            label="Confirm password"
            placeholder="Confirm your password"
            required
            size="md"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            disabled={isLoading}
            error={password && confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
          />

          {/* Terms */}
          <Group gap="xs" align="flex-start">
            <Checkbox
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.currentTarget.checked)}
              required
              style={{ marginTop: '0.25rem' }}
              disabled={isLoading}
            />
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
            disabled={!agreeToTerms || isLoading}
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

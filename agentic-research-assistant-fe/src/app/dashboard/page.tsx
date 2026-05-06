'use client';

import { Container, Title, Text, Button, Group } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useAuth } from '@/features/auth/hooks';

export default function DashboardPage() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8080/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API failed:', error);
    }

    localStorage.clear();
    sessionStorage.clear();

    window.location.href = '/';
  };

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={1}>Dashboard</Title>
          <Text c="dimmed" size="sm">
            Welcome back, {user?.email}
          </Text>
        </div>
        <Button
          leftSection={<IconLogout size={16} />}
          variant="default"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Group>
    </Container>
  );
}
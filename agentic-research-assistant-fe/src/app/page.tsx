'use client';

import { Container, Title, Text, Button, Group, Stack, Badge, Box } from '@mantine/core';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <Box
      component="main"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      py="xl"
      px="md"
    >
      {/* Background gradient elements */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '24rem',
            height: '24rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '50%',
            filter: 'blur(3rem)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: '24rem',
            height: '24rem',
            background: 'rgba(75, 77, 181, 0.1)',
            borderRadius: '50%',
            filter: 'blur(3rem)',
          }}
        />
      </Box>

      {/* Content */}
      <Container size="lg" style={{ position: 'relative', zIndex: 10 }}>
        <Stack align="center" gap="xl" ta="center">
          {/* Logo */}
          <Box
            style={{
              width: '5rem',
              height: '5rem',
              background: 'linear-gradient(to bottom right, #4B4DB5, #6366F1)',
              borderRadius: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(75, 77, 181, 0.3)',
              overflow: 'hidden',
            }}
          >
            <Image
              src="/meomeo.jpeg"
              alt="Logo"
              width={80}
              height={80}
              style={{ objectFit: 'cover' }}
            />
          </Box>

          {/* Badge */}
          <Badge
            variant="light"
            size="lg"
            radius="xl"
            style={{ paddingRight: '1.2rem' }}
          >
            ✨ AI-Powered Research Assistant
          </Badge>

          {/* Headline */}
          <Stack gap="md" maw={700}>
            <Title
              order={1}
              style={{
                fontSize: 'clamp(2rem, 8vw, 4rem)',
                fontWeight: 900,
                lineHeight: 1.1,
              }}
            >
              Accelerate Your Research with AI
            </Title>
            <Text size="xl" c="dimmed" style={{ lineHeight: 1.6 }}>
              Your intelligent companion for deep research, automated synthesis, and knowledge discovery. Unlock insights faster than ever before.
            </Text>
          </Stack>

          {/* CTA Buttons */}
          <Group justify="center" gap="md" mt="lg">
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <Button
                size="lg"
                radius="md"
                style={{
                  paddingLeft: '2rem',
                  paddingRight: '2rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Get Started
              </Button>
            </Link>
          </Group>

          {/* Trust indicator */}
          <Text size="sm" c="dimmed" style={{ marginTop: '2rem' }}>
            ✨ Trusted by 50,000+ researchers accelerating their discoveries
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

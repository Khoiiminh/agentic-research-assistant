'use client';

import { Box, Container, Title, Text, Stack, Group } from '@mantine/core';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <Group align="flex-start" gap="md">
      <Box
        style={{
          width: '2.5rem',
          height: '2.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Stack gap={0}>
        <Text fw={600} size="sm" c="white">
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      </Stack>
    </Group>
  );
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Left Panel - Branding */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(to bottom right, #323379, #4B4DB5, #6366F1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          padding: '3rem',
          margin: 0,
        }}
      >
        {/* Animated background elements */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
          }}
        >
          <Box
            style={{
              position: 'absolute',
              top: '5rem',
              left: '5rem',
              width: '18rem',
              height: '18rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              filter: 'blur(3rem)',
              animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: '10rem',
              right: '5rem',
              width: '24rem',
              height: '24rem',
              background: 'rgba(99, 102, 241, 0.2)',
              borderRadius: '50%',
              filter: 'blur(3rem)',
              animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              left: '33%',
              width: '16rem',
              height: '16rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              filter: 'blur(2rem)',
              animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.25s',
            }}
          />
        </Box>

        {/* Grid pattern overlay */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Content */}
        <Stack
          style={{
            position: 'relative',
            zIndex: 10,
            height: '100%',
            justifyContent: 'space-between',
            color: 'white',
          }}
          gap="xl"
        >
          {/* Logo */}
          <Group gap="md">
            <Box
              style={{
                width: '3rem',
                height: '3rem',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '1.5rem',
              }}
            >
              🧠
            </Box>
            <Stack gap={0}>
              <Text fw={700} size="lg" style={{ lineHeight: 1 }}>
                NexusAI
              </Text>
              <Text size="xs" c="rgba(255, 255, 255, 0.7)" fw={500}>
                Research Assistant
              </Text>
            </Stack>
          </Group>

          {/* Main content */}
          <Stack gap="xl">
            <Stack gap="md">
              <Title
                order={1}
                size="h2"
                c="white"
                style={{
                  lineHeight: 1.2,
                }}
              >
                Your AI-Powered<br />
                Research Companion
              </Title>
              <Text size="lg" c="rgba(255, 255, 255, 0.8)" style={{ lineHeight: 1.6 }}>
                Accelerate your research with intelligent document analysis, automated synthesis, and deep knowledge exploration.
              </Text>
            </Stack>

            {/* Feature highlights */}
            <Stack gap="md">
              <FeatureItem
                icon="🔍"
                title="Deep Research"
                description="Search across millions of papers and sources"
              />
              <FeatureItem
                icon="📄"
                title="Smart Synthesis"
                description="Auto-generate summaries and insights"
              />
              <FeatureItem
                icon="💡"
                title="Knowledge Mapping"
                description="Discover connections between concepts"
              />
            </Stack>

            {/* Decorative elements */}
            <Stack gap="sm" style={{ opacity: 0.7, fontSize: '0.85rem' }}>
              <Group gap="xs" wrap="wrap">
                <Text size="xs" c="rgba(255, 255, 255, 0.6)">
                  📊 Advanced Analytics
                </Text>
                <Text size="xs" c="rgba(255, 255, 255, 0.6)">
                  🚀 Quantum Integration
                </Text>
              </Group>
              <Group gap="xs" wrap="wrap">
                <Text size="xs" c="rgba(255, 255, 255, 0.6)">
                  🎯 Neural Optimization
                </Text>
                <Text size="xs" c="rgba(255, 255, 255, 0.6)">
                  ✨ Predictive Insights
                </Text>
              </Group>
            </Stack>
          </Stack>

          {/* Bottom tagline */}
          <Group gap="sm" c="rgba(255, 255, 255, 0.6)" style={{ fontSize: '0.875rem' }}>
            <Text size="xs">✨ Trusted by 50,000+ researchers worldwide</Text>
          </Group>
        </Stack>
      </div>

      {/* Right Panel - Auth Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          margin: 0,
        }}
      >
        <Container size={420} style={{ width: '100%' }}>
          {/* Header */}
          <Stack gap="xs" ta="left" mb="xl">
            <Title order={2} size="h2">
              {title}
            </Title>
            <Text c="dimmed" size="sm">
              {subtitle}
            </Text>
          </Stack>

          {/* Form */}
          {children}
        </Container>
      </div>
    </div>
  );
}

"use client"

import { useState } from "react"
import { ResearchSidebar } from "@/features/chatbot/components/research-sidebar"
import { ResearchHeader } from "@/features/chatbot/components/research-header"
import { ResearchChat } from "@/features/chatbot/components/research-chat"
import { ResearchPanel } from "@/features/chatbot/components/research-panel"
import styles from './page.module.css'
import './variables.css';
import { createTheme, MantineProvider } from "@mantine/core"

const pageTheme = createTheme({
  primaryColor: 'violet',
  colors: {
    violet: [
      '#F0F0FF', '#E0E0FF', '#C0C0FF', '#9696FF', '#6366F1', 
      '#6366F1', '#4B4DB5', '#323379', '#1A1A4D', '#000000',
    ],
  },
});

export default function ResearchAssistant() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true); 

  return (
    <MantineProvider theme={pageTheme} forceColorScheme="light">
        <div 
        data-mantine-color-scheme="light" 
        style={{ 
          colorScheme: 'light', 
          backgroundColor: '#FFFFFF'
        }}
      >
        <div className={styles.container}>
          {/* Sidebar */}
          <ResearchSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main Content */}
          <div className={styles.mainContent}>
            <ResearchHeader
              title="AI Market Analysis 2026"
              onTogglePanel={() => setPanelOpen(!panelOpen)}
              isPanelOpen={panelOpen}
            />

            <div className={styles.contentArea}>
              {/* Chat Area */}
              <div className={styles.chatArea}>
                <ResearchChat />
              </div>

              {/* Context Panel */}
              {panelOpen && <ResearchPanel open={panelOpen} onClose={() => setPanelOpen(false)} />}
            </div>
          </div>
        </div>
      </div>
    </MantineProvider>
  )
}

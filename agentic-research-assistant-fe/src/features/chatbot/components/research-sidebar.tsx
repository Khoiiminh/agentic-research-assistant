"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  FileText,
  Clock,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Database,
  Zap,
} from "lucide-react"
import styles from './research-sidebar.module.css'

interface ResearchSession {
  id: string
  title: string
  date: string
  starred?: boolean
}

const recentSessions: ResearchSession[] = [
  { id: "1", title: "AI Market Analysis 2026", date: "2 hours ago", starred: true },
  { id: "2", title: "Quantum Computing Trends", date: "Yesterday" },
  { id: "3", title: "Climate Tech Innovations", date: "3 days ago" },
  { id: "4", title: "Biotech Funding Landscape", date: "1 week ago", starred: true },
  { id: "5", title: "Web3 Infrastructure Report", date: "2 weeks ago" },
]

interface ResearchSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function ResearchSidebar({ collapsed = false, onToggle }: ResearchSidebarProps) {
  const [activeSession, setActiveSession] = useState("1")

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}>
      {/* Header */}
      <div className={styles.header}>
        {!collapsed && (
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <Sparkles size={16} color="white" />
            </div>
            <span className={styles.logoText}>ResearchAI</span>
          </div>
        )}
        {collapsed && (
          <div className={styles.logoIcon} style={{ margin: '0 auto' }}>
            <Sparkles size={16} color="white" />
          </div>
        )}
        <button
          className={styles.toggleButton}
          onClick={onToggle}
          style={{ display: collapsed ? 'none' : 'flex' }}
          title="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* New Research Button */}
      <div style={{ padding: '12px' }}>
        <button className={`${styles.newResearchButton} ${collapsed ? styles.newResearchButtonCollapsed : ''}`}>
          <Plus size={16} />
          {!collapsed && <span>New Research</span>}
        </button>
      </div>

      {/* Navigation */}
      {!collapsed && (
        <div className={styles.navigationSection}>
          <ul className={styles.navigationList}>
            <li>
              <button className={styles.navigationButton}>
                <Search className={styles.navigationIcon} />
                <span className={styles.navText}>Search</span>
                <span className={styles.navShortcut}>⌘K</span>
              </button>
            </li>
            <li>
              <button className={styles.navigationButton}>
                <Database className={styles.navigationIcon} />
                <span className={styles.navText}>Knowledge Base</span>
              </button>
            </li>
            <li>
              <button className={styles.navigationButton}>
                <BookOpen className={styles.navigationIcon} />
                <span className={styles.navText}>Sources Library</span>
              </button>
            </li>
            <li>
              <button className={styles.navigationButton}>
                <Zap className={styles.navigationIcon} />
                <span className={styles.navText}>Quick Actions</span>
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Recent Sessions */}
      <div className={styles.recentSection}>
        {!collapsed && (
          <div className={styles.recentHeader}>
            <Clock size={12} className={styles.recentIcon} />
            Recent
          </div>
        )}
        <ul className={styles.recentList}>
          {recentSessions.map((session) => (
            <li key={session.id} className={styles.recentItem}>
              <button
                className={`${styles.sessionButton} ${activeSession === session.id ? styles.active : ''}`}
                onClick={() => setActiveSession(session.id)}
              >
                {collapsed ? (
                  <FileText className={styles.sessionIcon} />
                ) : (
                  <>
                    <FileText className={styles.sessionIcon} />
                    <span className={styles.sessionName}>{session.title}</span>
                    {session.starred && <Star className={styles.starIcon} fill="currentColor" />}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.navigationButton} style={{ flex: 1, margin: 0 }}>
          <Settings className={styles.navigationIcon} />
          {!collapsed && <span className={styles.navText}>Settings</span>}
        </button>
        {collapsed && (
          <button
            className={styles.toggleButton}
            onClick={onToggle}
            title="Expand sidebar"
            style={{ flex: 1, marginLeft: '8px' }}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

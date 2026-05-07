"use client"

import { useState } from "react"
import {
  X,
  BookOpen,
  FileText,
  Globe,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
  Link2,
  Lightbulb,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import styles from './research-panel.module.css'

interface Source {
  id: string
  title: string
  url: string
  type: "web" | "pdf" | "academic"
  relevance: number
  excerpt: string
  date: string
}

interface Insight {
  id: string
  type: "key-finding" | "trend" | "warning"
  content: string
}

const sources: Source[] = [
  {
    id: "1",
    title: "Gartner: AI Agent Market Forecast 2026",
    url: "https://gartner.com/research/ai-agents",
    type: "pdf",
    relevance: 95,
    excerpt: "The enterprise AI agent market is projected to grow at a CAGR of 34.2% through 2028, driven by increasing automation demands...",
    date: "Jan 2026",
  },
  {
    id: "2",
    title: "McKinsey: The State of AI Adoption",
    url: "https://mckinsey.com/ai-adoption",
    type: "web",
    relevance: 88,
    excerpt: "67% of enterprise leaders cite AI agents as a top priority for 2026, with customer service and internal operations as primary use cases...",
    date: "Feb 2026",
  },
  {
    id: "3",
    title: "IEEE: Autonomous Agents in Business Processes",
    url: "https://ieee.org/autonomous-agents",
    type: "academic",
    relevance: 82,
    excerpt: "Multi-agent systems demonstrate superior performance in complex decision-making scenarios, outperforming single-agent approaches by 23%...",
    date: "Dec 2025",
  },
  {
    id: "4",
    title: "Forbes: Enterprise AI Agent Landscape",
    url: "https://forbes.com/enterprise-ai",
    type: "web",
    relevance: 75,
    excerpt: "Key players including Microsoft, Salesforce, and ServiceNow are racing to integrate agentic AI capabilities into their platforms...",
    date: "Mar 2026",
  },
]

const insights: Insight[] = [
  {
    id: "1",
    type: "key-finding",
    content: "Market size projected to reach $28.5B by 2028 with 34.2% CAGR",
  },
  {
    id: "2",
    type: "trend",
    content: "Multi-agent architectures gaining traction over monolithic solutions",
  },
  {
    id: "3",
    type: "warning",
    content: "Data security concerns remain primary barrier to adoption (67% of enterprises)",
  },
  {
    id: "4",
    type: "key-finding",
    content: "Customer service and internal operations are top deployment areas",
  },
]

interface ResearchPanelProps {
  open: boolean
  onClose: () => void
}

export function ResearchPanel({ open, onClose }: ResearchPanelProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>("1")
  const [activeTab, setActiveTab] = useState("sources")

  const getSourceIcon = (type: Source["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText size={16} />
      case "academic":
        return <BookOpen size={16} />
      default:
        return <Globe size={16} />
    }
  }

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "key-finding":
        return <Lightbulb size={16} style={{ color: 'var(--color-indigo)' }} />
      case "trend":
        return <TrendingUp size={16} style={{ color: '#10b981' }} />
      case "warning":
        return <AlertCircle size={16} style={{ color: 'var(--destructive)' }} />
    }
  }

  if (!open) return null

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Research Context</h2>
        <button
          className={styles.closeButton}
          onClick={onClose}
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <ul className={styles.tabsList}>
          <li>
            <button
              className={`${styles.tabsButton} ${activeTab === "sources" ? styles.active : ""}`}
              onClick={() => setActiveTab("sources")}
            >
              Sources
            </button>
          </li>
          <li>
            <button
              className={`${styles.tabsButton} ${activeTab === "insights" ? styles.active : ""}`}
              onClick={() => setActiveTab("insights")}
            >
              Insights
            </button>
          </li>
          <li>
            <button
              className={`${styles.tabsButton} ${activeTab === "outline" ? styles.active : ""}`}
              onClick={() => setActiveTab("outline")}
            >
              Outline
            </button>
          </li>
        </ul>

        {/* Sources Tab */}
        {activeTab === "sources" && (
          <div className={styles.tabsContent}>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>{sources.length} sources found</span>
                <button style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--color-indigo)',
                  padding: 0
                }}>
                  <Link2 size={12} />
                  <span>Add source</span>
                </button>
              </div>

              {sources.map((source) => (
                <div
                  key={source.id}
                  className={`${styles.sourceItem} ${expandedSource === source.id ? styles.expanded : ''}`}
                >
                  <div className={styles.sourceHeader}>
                    <div className={styles.sourceIcon}>
                      {getSourceIcon(source.type)}
                    </div>
                    <div className={styles.sourceInfo} style={{ flex: 1 }}>
                      <h4 className={styles.sourceTitle}>{source.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--secondary)',
                          color: 'var(--foreground)',
                          textTransform: 'capitalize'
                        }}>
                          {source.type}
                        </span>
                        <span className={styles.sourceDate} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {source.date}
                        </span>
                      </div>
                    </div>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--muted-foreground)'
                      }}
                      onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
                    >
                      {expandedSource === source.id ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </div>

                  {/* Relevance */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>Relevance</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-indigo)' }}>{source.relevance}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${source.relevance}%`, height: '100%', backgroundColor: 'var(--color-indigo)' }} />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedSource === source.id && (
                    <div className={styles.sourceDetails}>
                      <p className={styles.sourceExcerpt}>{source.excerpt}</p>
                      <button style={{
                        width: '100%',
                        padding: '6px 12px',
                        border: `1px solid var(--border)`,
                        borderRadius: 'var(--radius)',
                        background: 'transparent',
                        color: 'var(--color-indigo)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-sans)'
                      }}>
                        <ExternalLink size={12} />
                        <span>Open source</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className={styles.tabsContent}>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
                Key insights extracted from your research:
              </p>

              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`${styles.insightItem} ${
                    insight.type === "key-finding" ? styles.insightKeyFinding :
                    insight.type === "trend" ? styles.insightTrend :
                    styles.insightWarning
                  }`}
                >
                  <div className={styles.insightIcon}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div>
                    <p className={styles.insightContent}>{insight.content}</p>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--foreground)',
                      textTransform: 'capitalize'
                    }}>
                      {insight.type.replace("-", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outline Tab */}
        {activeTab === "outline" && (
          <div className={styles.tabsContent}>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
                Auto-generated research outline:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { title: "1. Executive Summary", desc: "Overview of AI agents in enterprise software" },
                  { 
                    title: "2. Market Analysis", 
                    items: ["Market size and projections", "Growth drivers", "Regional breakdown"]
                  },
                  { 
                    title: "3. Competitive Landscape", 
                    items: ["Key players", "Product comparisons"]
                  },
                  { 
                    title: "4. Adoption Challenges", 
                    items: ["Security concerns", "Integration barriers", "Skills gap"]
                  },
                  { title: "5. Recommendations", desc: "Strategic insights and next steps" },
                ].map((section, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    border: `1px solid var(--border)`,
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--input)'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
                      {section.title}
                    </h4>
                    {'desc' in section ? (
                      <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px', margin: 0 }}>
                        {section.desc}
                      </p>
                    ) : (
                      <ul style={{ marginTop: '8px', margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                        {section.items?.map((item, itemIdx) => (
                          <li key={itemIdx} style={{ fontSize: '12px', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: itemIdx < (section.items?.length ?? 0) - 1 ? '4px' : 0 }}>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-indigo)' }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

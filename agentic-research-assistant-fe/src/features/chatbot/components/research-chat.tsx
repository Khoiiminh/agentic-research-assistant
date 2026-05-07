"use client"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Paperclip,
  Mic,
  StopCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ExternalLink,
  FileText,
  Globe,
  BookOpen,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react"
import styles from './research-chat.module.css'

interface Source {
  id: string
  title: string
  url: string
  type: "web" | "pdf" | "academic"
}

interface AgentStep {
  id: string
  action: string
  status: "completed" | "in-progress" | "pending"
  detail?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  sources?: Source[]
  agentSteps?: AgentStep[]
  isStreaming?: boolean
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your AI research assistant. I can help you conduct deep research, analyze sources, and synthesize information. What topic would you like to explore today?",
    timestamp: "10:30 AM",
  },
  {
    id: "2",
    role: "user",
    content: "Research the current state of AI agents in enterprise software. I need to understand market trends, key players, and adoption challenges.",
    timestamp: "10:32 AM",
  },
  {
    id: "3",
    role: "assistant",
    content: "I've conducted a comprehensive analysis of AI agents in enterprise software. Here are my findings:\n\n## Market Overview\n\nThe enterprise AI agent market is experiencing rapid growth, projected to reach $28.5B by 2028. Key drivers include automation demands, improved LLM capabilities, and increasing comfort with AI-assisted workflows.\n\n## Key Players\n\n**Infrastructure Providers:**\n- OpenAI (GPT-based agents)\n- Anthropic (Claude-based solutions)\n- Google (Vertex AI agents)\n\n**Enterprise Platforms:**\n- Microsoft Copilot ecosystem\n- Salesforce Einstein GPT\n- ServiceNow AI agents\n\n## Adoption Challenges\n\n1. **Data Security**: 67% of enterprises cite data privacy as primary concern\n2. **Integration Complexity**: Legacy system compatibility remains challenging\n3. **ROI Measurement**: Difficulty quantifying agent-driven value\n4. **Skill Gaps**: Need for prompt engineering and AI governance expertise",
    timestamp: "10:35 AM",
    sources: [
      { id: "s1", title: "Gartner AI Agent Market Report 2026", url: "#", type: "pdf" },
      { id: "s2", title: "McKinsey: Enterprise AI Adoption", url: "#", type: "web" },
      { id: "s3", title: "IEEE: Autonomous Agents in Business", url: "#", type: "academic" },
    ],
    agentSteps: [
      { id: "a1", action: "Searching web sources", status: "completed" },
      { id: "a2", action: "Analyzing market reports", status: "completed" },
      { id: "a3", action: "Cross-referencing data", status: "completed" },
      { id: "a4", action: "Synthesizing findings", status: "completed" },
    ],
  },
]

export function ResearchChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [expandedSources, setExpandedSources] = useState<string | null>("3")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = () => {
    if (!input.trim() || isThinking) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsThinking(true)

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm researching that topic now. Let me analyze multiple sources and compile the findings for you...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        agentSteps: [
          { id: "step1", action: "Searching knowledge base", status: "completed" },
          { id: "step2", action: "Querying external sources", status: "in-progress" },
          { id: "step3", action: "Analyzing findings", status: "pending" },
          { id: "step4", action: "Generating report", status: "pending" },
        ],
        isStreaming: true,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsThinking(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const getSourceIcon = (type: Source["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText size={12} />
      case "academic":
        return <BookOpen size={12} />
      default:
        return <Globe size={12} />
    }
  }

  const getStepIcon = (status: AgentStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={14} style={{ color: 'var(--color-indigo)' }} />
      case "in-progress":
        return <Loader2 size={14} style={{ color: 'var(--color-indigo)', animation: 'spin 1s linear infinite' }} />
      default:
        return <Circle size={14} style={{ color: 'var(--muted-foreground)' }} />
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesArea}>
        <div>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${message.role === "user" ? styles.messageUser : styles.messageAssistant}`}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: message.role === "assistant" ? 'var(--color-indigo)' : 'var(--secondary)',
                  color: message.role === "assistant" ? 'white' : 'var(--foreground)',
                  flexShrink: 0,
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {message.role === "assistant" ? (
                  <Sparkles size={16} color="white" />
                ) : (
                  "U"
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '70%' }}>
                <div
                  className={message.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant}
                  style={{ padding: '12px 16px', borderRadius: '12px' }}
                >
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                    {message.content}
                  </p>

                  {message.agentSteps && message.agentSteps.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: message.role === "user" ? 'rgba(255,255,255,0.1)' : 'var(--input)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                        <Sparkles size={12} />
                        Research Progress
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {message.agentSteps.map((step) => (
                          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            {getStepIcon(step.status)}
                            <span style={{ color: step.status === "pending" ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                              {step.action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {message.sources && message.sources.length > 0 && (
                  <div>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        padding: 0
                      }}
                      onClick={() => setExpandedSources(expandedSources === message.id ? null : message.id)}
                    >
                      <BookOpen size={12} />
                      {message.sources.length} sources cited
                    </button>
                    {expandedSources === message.id && (
                      <div className={styles.messageSources}>
                        {message.sources.map((source) => (
                          <div
                            key={source.id}
                            className={styles.sourceTag}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            {getSourceIcon(source.type)}
                            <span>{source.title}</span>
                            <ExternalLink size={10} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {message.role === "assistant" && !message.isStreaming && (
                  <div className={styles.messageActions}>
                    <button className={styles.actionButton} title="Copy">
                      <Copy size={14} />
                    </button>
                    <button className={styles.actionButton} title="Like">
                      <ThumbsUp size={14} />
                    </button>
                    <button className={styles.actionButton} title="Dislike">
                      <ThumbsDown size={14} />
                    </button>
                    <button className={styles.actionButton} title="Regenerate">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                )}

                <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{message.timestamp}</span>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className={styles.message}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-indigo)',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={16} color="white" style={{ animation: 'pulse 2s infinite' }} />
              </div>
              <div className={styles.messageBubbleAssistant} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-indigo)' }} />
                <span style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.inputArea} style={{ borderTop: `1px solid var(--border)` }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            borderRadius: '8px',
            border: `1px solid var(--border)`,
            padding: '8px',
            backgroundColor: 'var(--background)',
          }}>
            <button className={styles.toolButton} title="Attach file">
              <Paperclip size={18} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your research topic..."
              className={styles.textarea}
              rows={1}
              style={{
                flex: 1,
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
            <button className={styles.toolButton} title="Voice input">
              <Mic size={18} />
            </button>
            <button
              className={styles.sendButton}
              onClick={handleSubmit}
              disabled={!input.trim() || isThinking}
            >
              {isThinking ? <StopCircle size={18} /> : <Send size={18} />}
            </button>
          </div>
          <p style={{ marginTop: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            ResearchAI can make mistakes. Verify important information from primary sources.
          </p>
        </div>
      </div>
    </div>
  )
}

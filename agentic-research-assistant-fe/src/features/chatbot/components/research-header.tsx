"use client"

import { useState } from "react"
import {
  PanelRight,
  Download,
  MoreHorizontal,
  Star,
  Trash2,
  Copy,
  FileOutput,
  Users,
  Sparkles,
} from "lucide-react"
import styles from './research-header.module.css';
import { IconLogout } from '@tabler/icons-react';
import { Button } from '@mantine/core';

interface ResearchHeaderProps {
  title: string
  onTogglePanel: () => void
  isPanelOpen: boolean
}

export function ResearchHeader({ title, onTogglePanel, isPanelOpen }: ResearchHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

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
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.titleSection}>
          <Sparkles className={styles.icon} />
          <h1 className={styles.title}>{title}</h1>
        </div>
        <div className={styles.badge}>
          <span className={styles.badgeStatus} />
          Active
        </div>
      </div>

      <div className={styles.rightSection}>
        <button className={styles.actionButton} title="Share">
          <Users size={16} />
          <span>Share</span>
        </button>

        <button className={styles.actionButton} title="Export">
          <Download size={16} />
          <span>Export</span>
        </button>

        <button
          className={`${styles.contextButton} ${isPanelOpen ? styles.active : ''}`}
          onClick={onTogglePanel}
          title="Context Panel"
        >
          <PanelRight size={16} />
          <span>Context</span>
        </button>
        
        <Button className={styles.actionButton} leftSection={<IconLogout size={16} />}
          variant="default"
          onClick={handleLogout}
        >
          Logout
        </Button>

        <div style={{ position: 'relative' }}>
          <button
            className={styles.moreButton}
            onClick={() => setShowDropdown(!showDropdown)}
            title="More options"
          >
            <MoreHorizontal size={16} />
          </button>

          {showDropdown && (
            <div className={styles.dropdownMenu}>
              <button className={styles.dropdownItem}>
                <Star size={16} />
                <span>Add to favorites</span>
              </button>
              <button className={styles.dropdownItem}>
                <Copy size={16} />
                <span>Duplicate</span>
              </button>
              <button className={styles.dropdownItem}>
                <FileOutput size={16} />
                <span>Export as PDF</span>
              </button>
              <div className={styles.dropdownSeparator} />
              <button className={`${styles.dropdownItem} ${styles.destructive}`}>
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

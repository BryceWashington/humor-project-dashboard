'use client'

import { HelpCircle, Link2, Layout } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="space-y-6 pb-10 font-mono text-terminal-fg">
      <header className="flex justify-between items-end border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-terminal-accent" />
            <span className="text-[10px] uppercase font-bold text-terminal-dim">System Documentation</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-terminal-fg uppercase">Help & Documentation</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature: Deep Linking */}
        <section className="terminal-card space-y-4">
          <div className="terminal-header flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            DEEP_LINK_INTEGRATION
          </div>
          <div className="space-y-3 text-xs leading-relaxed">
            <p>
              The system supports granular deep linking for efficient navigation. Most record IDs and user identities 
              across the dashboard are clickable links that will direct you to the corresponding resource view.
            </p>
            <div className="bg-black/30 p-3 border border-terminal-border/50 font-bold">
              <span className="text-terminal-accent">PRO_TIP:</span> You can manually append <code className="text-terminal-fg">?id=[UUID]</code> 
              to list URLs (e.g., /users, /images) to highlight or directly open a specific record.
            </div>
          </div>
        </section>

        {/* Feature: Detailed Pop-ups */}
        <section className="terminal-card space-y-4">
          <div className="terminal-header flex items-center gap-2">
            <Layout className="w-4 h-4" />
            DETAILED_VIEW_MODALS
          </div>
          <div className="space-y-3 text-xs leading-relaxed">
            <p>
              Interactive data tables support per-row detailed pop-ups. Clicking anywhere on a table row 
              (User Registry, Image Assets, etc.) will trigger a high-fidelity modal overlay.
            </p>
            <ul className="list-disc list-inside space-y-1 text-terminal-dim">
              <li>Full metadata inspection</li>
              <li>Audit trails (Created/Modified by)</li>
              <li>Resource-specific actions</li>
              <li>Deep link generation</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

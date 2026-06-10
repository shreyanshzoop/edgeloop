'use client'

/**
 * Contact — fixed top-right trigger that opens a small modal with the studio's
 * phone + email (real tel:/mailto: links). Closes via the close button or by
 * clicking the dimmed overlay, matching the original site's behavior.
 */

import { useState } from 'react'
import { site } from '@/content/site'
import styles from './Contact.module.css'

export default function Contact() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className={styles.trigger} onClick={() => setOpen(true)}>
        contact
      </button>

      {open && (
        <div
          className={styles.scrim}
          role="dialog"
          aria-modal="true"
          aria-label="contact"
          onClick={() => setOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.close} onClick={() => setOpen(false)} aria-label="close">
              ×
            </button>
            <a className={styles.line} href={`tel:${site.contact.phone.replace(/[^+\d]/g, '')}`}>
              {site.contact.phone}
            </a>
            <a className={styles.line} href={`mailto:${site.contact.email}`}>
              {site.contact.email}
            </a>
          </div>
        </div>
      )}
    </>
  )
}

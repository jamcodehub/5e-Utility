import { SRD_ATTRIBUTION } from '../utils/srd'

// Required CC-BY-4.0 attribution for SRD 5.1 content. Wording is mandated by the
// licence — do not add any other attribution regarding Wizards of the Coast.
export default function SrdAttribution({ style }) {
  return (
    <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6, margin: '24px 0 0', maxWidth: 720, ...style }}>
      {SRD_ATTRIBUTION}
    </p>
  )
}

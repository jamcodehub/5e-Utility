import LegalLayout, { Section, P, List, ExtLink, ContactEmail, PageLink, SITE_NAME, SITE_URL } from './LegalLayout'
import SrdAttribution from '../../components/SrdAttribution'

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <P>
        These Terms of Service (“Terms”) govern your use of {SITE_NAME} (“we”, “us”), the website and app at{' '}
        <ExtLink href={SITE_URL}>{SITE_URL}</ExtLink> (the “Service”). By creating an account or using the Service you agree to these Terms and to our{' '}
        <PageLink to="/privacy">Privacy Policy</PageLink>. If you don’t agree, please don’t use the Service.
      </P>

      <Section title="1. The Service">
        <P>{SITE_NAME} is a companion app for tabletop role-playing campaigns. It lets players and Dungeon Masters keep characters, journals, lore, maps and
          other campaign material in one place. We offer a free plan and an optional paid Premium plan. We may add, change or remove features at any time.
          The Service is an independent project and is not affiliated with, endorsed by or sponsored by any publisher of tabletop games.</P>
      </Section>

      <Section title="2. Eligibility and your account">
        <List>
          <li>You must be at least 13 years old (or the minimum age in your country, if higher) to use the Service.</li>
          <li>Give us accurate information, and keep your sign-in details and Google account secure. You are responsible for everything that happens on your account.</li>
          <li>We may ask you to verify your account with Google and to confirm it is you when you sign in from a new device. Tell us promptly at <ContactEmail /> if you think your account has been compromised.</li>
          <li>One person per account. Please don’t create multiple accounts to get around plan limits.</li>
        </List>
      </Section>

      <Section title="3. Your content">
        <P>You keep ownership of the content you create or upload, such as campaigns, characters, journals, images and audio (“Your Content”). You give us a
          worldwide, non-exclusive, royalty-free licence to host, store, process and display Your Content only as needed to run and improve the Service for you
          and for the people you choose to share it with (such as your campaign members, or anyone you give a share link to). This licence ends when you delete Your Content or your account, apart
          from short-term backups.</P>
        <P>You are responsible for Your Content. Only upload things you have the right to use. That includes images, and especially music and audio, which
          you must own or be licensed to use. Don’t upload anything that is unlawful, infringes someone else’s rights, is hateful, harassing or threatening,
          sexually explicit, or exploits or endangers minors. We may remove content that breaks these Terms or the law. Keep your own copies of anything important,
          because we can’t promise the Service will never lose data.</P>
      </Section>

      <Section title="4. Acceptable use">
        <P>Don’t:</P>
        <List>
          <li>use the Service for anything unlawful, or to harass, abuse, impersonate or deceive others;</li>
          <li>try to access accounts, data or systems you aren’t authorised to, or probe, scan or test the Service’s security;</li>
          <li>overload, disrupt or interfere with the Service, or use bots or scrapers to collect data from it;</li>
          <li>upload malware or send spam through the Service;</li>
          <li>copy, resell or reverse-engineer the Service, except where the law allows it.</li>
        </List>
      </Section>

      <Section title="5. Premium subscriptions">
        <P>Premium is a paid, recurring subscription. Payments are processed by Stripe; the price and billing details are shown before you pay, and any
          applicable taxes are added. Your subscription renews automatically each billing period until you cancel. You can cancel at any time using
          “Manage subscription” on the Premium page, which opens Stripe’s billing portal. Cancelling stops future charges. Unless the law requires otherwise,
          we don’t refund partial billing periods. If we change a price, we will tell you before it applies to you. If your subscription ends, your account
          returns to the free plan and free-plan limits apply.</P>
      </Section>

      <Section title="6. Game content and third-party services">
        <SrdAttribution style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.75, color: 'var(--text-2)', maxWidth: 'none' }} />
        <P>The Service works with third-party services, including Google and Stripe. Your use of those services is also subject to their own terms and policies.</P>
      </Section>

      <Section title="7. Our rights">
        <P>The Service, including its software, design, text and logo, belongs to us or our licensors and is protected by law, apart from Your Content and the
          game material noted above. We give you a limited, personal, non-exclusive, non-transferable right to use the Service in line with these Terms. If you
          send us feedback or ideas, we may use them without obligation to you.</P>
      </Section>

      <Section title="8. Suspension and termination">
        <P>You can stop using the Service at any time, and you can ask us to delete your account at <ContactEmail />. We may suspend or end your access, with
          or without notice, if you break these Terms, put the Service or other users at risk, or if we must by law. When your account ends, your right to use
          the Service ends, and we will handle your information as set out in the Privacy Policy.</P>
      </Section>

      <Section title="9. Disclaimers">
        <P>The Service is provided “as is” and “as available”. To the fullest extent the law allows, we make no warranties of any kind, whether express or
          implied, including about merchantability, fitness for a particular purpose, availability, accuracy or that the Service will be uninterrupted or
          error-free. The Service is a hobby tool: rules references and generated suggestions are for convenience, and your table’s rulings are always final.</P>
      </Section>

      <Section title="10. Limit of liability">
        <P>To the fullest extent the law allows, we are not liable for any indirect, incidental, special, consequential or punitive damages, or for lost
          profits, data or goodwill, arising from your use of the Service. Our total liability to you for any claim relating to the Service is limited to the
          amount you paid us in the 12 months before the claim, or US$50 if you haven’t paid us anything. Nothing in these Terms excludes or limits liability
          that cannot be excluded or limited by law, or any consumer rights you have under the law where you live that cannot be waived.</P>
      </Section>

      <Section title="11. Changes to these Terms">
        <P>We may update these Terms from time to time. We will change the “Last updated” date above and, for significant changes, tell you in the Service or
          by email. If you keep using the Service after a change takes effect, you accept the updated Terms.</P>
      </Section>

      <Section title="12. Contact">
        <P>Questions about these Terms? Email <ContactEmail />. If you have a problem with the Service, please contact us first so we can try to sort it out.</P>
      </Section>
    </LegalLayout>
  )
}

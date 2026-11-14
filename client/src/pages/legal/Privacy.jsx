import LegalLayout, { Section, P, List, ExtLink, ContactEmail, PageLink, SITE_NAME, SITE_URL } from './LegalLayout'

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <P>
        {SITE_NAME} (“we”, “us”) runs the website at <ExtLink href={SITE_URL}>{SITE_URL}</ExtLink> (the “Service”), a companion app for
        tabletop role-playing campaigns. This policy explains what personal information we collect, how we use and share it, and the
        choices you have. By using the Service you agree to this policy and to our <PageLink to="/terms">Terms of Service</PageLink>.
      </P>

      <Section title="1. Information we collect">
        <P><strong>Account information.</strong> Your username, email address, account type (Player or Dungeon Master) and a password. We never store your
          password in readable form, only a one-way hash. If you choose to give us a phone number, we store that too.</P>
        <P><strong>Sign in with Google.</strong> If you sign up or sign in with Google, Google tells us your email address (and that it is verified), your
          Google account’s unique ID, and your profile picture. That is all we request: the basic “openid”, “email” and “profile” information. We do not ask
          for, and cannot read, your emails, contacts, files, calendar or any other Google data.</P>
        <P><strong>Content you create.</strong> Campaigns, journal entries, lore, storyboard cards, characters (including backstory, notes and images),
          inventory, battle maps, campaign guides, session plans, music and audio you upload, and any feedback you send us.</P>
        <P><strong>Subscription information.</strong> If you subscribe to Premium, payment is handled by Stripe. We store your Stripe customer and subscription
          IDs and whether Premium is active. We never see or store your full card number.</P>
        <P><strong>Security and device information.</strong> To protect accounts, we generate a random identifier that is kept in your browser. We store only a
          hashed copy, your browser’s user-agent text and dates, so we can recognise a device that has already passed two-factor verification
          (remembered until 30 days after you last use it). We also temporarily store one-time codes and password-reset tokens (hashed) until they expire. If you start
          signing up with an emailed code but don’t finish, we hold your username, email, hashed password and a hash of the code for up to an hour, then delete them. Your IP address is
          processed to apply rate limits and prevent abuse, and may appear in our hosting providers’ logs.</P>
        <P><strong>Browser storage.</strong> We use your browser’s local storage (not cookies) to keep you signed in (a sign-in token valid for up to 90
          days), cache basic account details, remember your theme and selected campaign, and store the device identifier above. We do not use advertising or
          analytics cookies or trackers.</P>
      </Section>

      <Section title="2. How we use your information">
        <List>
          <li>To create and run your account, and to sign you in and keep your account secure, including two-factor checks on new devices.</li>
          <li>To provide the features of the Service, such as saving your campaigns and characters and letting the people you play with see what you share.</li>
          <li>To process Premium subscriptions and manage your plan.</li>
          <li>To send essential account emails, such as password-reset links and verification codes.</li>
          <li>To respond to feedback and support requests, fix bugs and improve the Service.</li>
          <li>To detect, prevent and respond to abuse, fraud and security issues, and to meet legal obligations.</li>
        </List>
        <P>We do not sell your personal information, and we do not use it for advertising.</P>
      </Section>

      <Section title="3. Google user data">
        <P>
          We use the information we receive from Google only to create your account, sign you in, and confirm it is you when you use a new device. We do not use
          it for advertising, we do not sell it, and we do not share it except with the service providers listed below as needed to run the Service, or when the law
          requires it. Our people do not read your Google data except where needed for security, to comply with law, or with your consent.
        </P>
        <P>
          5e Utility’s use of information received from Google APIs adheres to the{' '}
          <ExtLink href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</ExtLink>, including the Limited Use
          requirements. You can remove 5e Utility’s access to your Google account at any time on your{' '}
          <ExtLink href="https://myaccount.google.com/permissions">Google Account permissions page</ExtLink>.
        </P>
      </Section>

      <Section title="4. How information is shared">
        <P><strong>With other people on the Service.</strong> Content you add to a campaign is visible to that campaign’s members according to how the feature
          works. For example, a Dungeon Master can see their players’ characters and backstory in the Campaign Guide, and players can see their campaign’s
          shared content. If you turn on a character’s share link, anyone with that link can view a read-only copy of the sheet (name, class, stats, and similar
          details, but not your notes, lore or goals) without an account. You can turn the link off at any time.</P>
        <P><strong>With service providers</strong> who process information on our behalf to run the Service:</P>
        <List>
          <li><strong>Google</strong>: sign-in and identity verification. Our pages also load fonts from Google Fonts, which means Google receives your IP address and browser details when a page loads.</li>
          <li><strong>Stripe</strong>: payments and subscription billing.</li>
          <li><strong>Cloudinary</strong>: storing and delivering the images and audio you upload. Files are uploaded straight from your browser, and anyone who has a file’s link can open it, so please don’t upload anything you consider sensitive.</li>
          <li><strong>Render and Netlify</strong>: hosting our server and website.</li>
          <li><strong>MongoDB</strong>: hosting our database.</li>
          <li>An email delivery provider, used to send account emails.</li>
        </List>
        <P><strong>For legal reasons.</strong> We may disclose information if we believe it is required by law or legal process, or necessary to protect the
          rights, safety or security of our users, the public or the Service. If the Service is ever sold or reorganised, your information may be transferred
          to the new owner, who must honour this policy.</P>
      </Section>

      <Section title="5. International transfers">
        <P>Our providers may process information in the United States and other countries, which may have different data-protection laws from where you live.
          By using the Service you understand your information may be transferred and stored there.</P>
      </Section>

      <Section title="6. How long we keep information">
        <P>We keep your account and content for as long as your account is active, or until you delete it. You can delete your characters yourself, and
          campaigns where that option is available to you. If you ask us to delete your account, we will delete or anonymise your personal information within
          30 days, except what we must keep for legal, tax or fraud-prevention reasons (for example, payment records held by Stripe). Copies may remain in
          backups for a short time afterwards. Remembered-device records expire after 30 days without use, and one-time codes and reset tokens expire within minutes to an hour.</P>
      </Section>

      <Section title="7. Your choices and rights">
        <P>You can ask us at any time to access, correct, export or delete the personal information we hold about you, or to close your account, by emailing{' '}
          <ContactEmail />. We may need to confirm it is really you first. You can also manage your subscription through the “Manage subscription” button on the
          Premium page, and turn character share links on or off.</P>
        <P>Depending on where you live (for example the European Economic Area, the United Kingdom, California or Australia), you may have additional legal
          rights, such as objecting to or restricting certain processing, withdrawing consent, or complaining to your local data-protection authority. We will
          respond as the law requires. Where the law requires a legal basis for processing, we rely on performing our contract with you (running your account and
          the Service), our legitimate interests (security, preventing abuse, and improving the Service), your consent (such as signing in with Google), and
          legal obligations.</P>
      </Section>

      <Section title="8. Security">
        <P>We protect information with encryption in transit (HTTPS), hashed passwords, access controls and two-factor verification on new devices. No online
          service is completely secure, so we cannot guarantee absolute security. If a breach affects your personal information, we will notify you and the
          relevant authorities as the law requires.</P>
      </Section>

      <Section title="9. Children">
        <P>The Service is not directed to children under 13 (or the minimum age required in your country, if higher), and we do not knowingly collect their
          personal information. If you believe a child has given us personal information, please contact us and we will delete it.</P>
      </Section>

      <Section title="10. Changes to this policy">
        <P>We may update this policy from time to time. We will change the “Last updated” date above and, for significant changes, give you notice in the
          Service or by email. Continuing to use the Service after a change means you accept the updated policy.</P>
      </Section>

      <Section title="11. Contact us">
        <P>Questions or requests about privacy? Email <ContactEmail />.</P>
      </Section>
    </LegalLayout>
  )
}

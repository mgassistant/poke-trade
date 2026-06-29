import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SMS Terms & Conditions | Poké-Trade",
  description: "SMS messaging terms and conditions for Poké-Trade.",
};

export default function SMSTermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">SMS Terms &amp; Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: June 29, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
          <p>
            By opting in to receive text messages from Poké-Trade (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
            you agree to these SMS Terms &amp; Conditions. These terms apply to all SMS/MMS communications
            sent by Poké-Trade to your mobile phone number.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Consent</h2>
          <p>
            By providing your phone number and checking the SMS consent checkbox during registration
            or at any other opt-in point on our website, you expressly consent to receive recurring
            automated text messages from Poké-Trade. Consent is not a condition of any purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Types of Messages</h2>
          <p>You may receive text messages related to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Account notifications (verification, password resets, security alerts)</li>
            <li>Trade updates and status changes</li>
            <li>Restock alerts and drop notifications</li>
            <li>Order confirmations and shipping updates</li>
            <li>Promotional offers and deals (if you opted in)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Message Frequency</h2>
          <p>
            Message frequency varies depending on your account activity and notification preferences.
            You may receive up to 10 messages per month for transactional notifications, and additional
            messages if you opt in to promotional alerts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Message and Data Rates</h2>
          <p>
            Standard message and data rates may apply. Check with your wireless carrier for details
            about your text messaging plan. Poké-Trade does not charge for text messages, but your
            carrier may.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Opt-Out</h2>
          <p>
            You can opt out of receiving text messages at any time by replying <strong>STOP</strong> to
            any message from us. After opting out, you will receive one final confirmation message.
            You may also opt out by updating your communication preferences in your account settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Help</h2>
          <p>
            For assistance with our SMS program, reply <strong>HELP</strong> to any message from us,
            or contact us at <a href="mailto:support@poke-trade.com" className="text-primary hover:underline">support@poke-trade.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Privacy</h2>
          <p>
            Your mobile phone number and information will not be shared with third parties or
            affiliates for marketing or promotional purposes. For more information, see our{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Supported Carriers</h2>
          <p>
            Our SMS program is supported on all major U.S. carriers including AT&amp;T, Verizon,
            T-Mobile, Sprint, and others. Carriers are not liable for delayed or undelivered messages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Changes</h2>
          <p>
            We may update these SMS Terms at any time. Continued participation in our SMS program
            after changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}

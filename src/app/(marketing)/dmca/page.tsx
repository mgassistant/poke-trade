import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "DMCA Policy | Poké-Trade",
  description: "Poké-Trade DMCA Policy — how to file a copyright takedown notice or counter-notice.",
};

export default function DMCAPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Image src="/logo.png" alt="Poké-Trade" width={200} height={60} className="h-14 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold">DMCA Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: June 22, 2026</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              Poké-Trade respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998 (&quot;DMCA&quot;), we will respond expeditiously to claims of copyright infringement committed using the Poké-Trade platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Filing a DMCA Takedown Notice</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              If you believe that content hosted on Poké-Trade infringes your copyright, you may submit a written notification to our designated DMCA agent. Your notice must include <strong className="text-foreground">all</strong> of the following:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mt-2">
              <li>
                <strong className="text-foreground">Identification of the copyrighted work:</strong> A description of the copyrighted work you claim has been infringed. If multiple works are covered, a representative list.
              </li>
              <li>
                <strong className="text-foreground">Identification of the infringing material:</strong> The specific URL(s) or description of where the infringing material is located on Poké-Trade, with enough detail for us to find and identify it.
              </li>
              <li>
                <strong className="text-foreground">Your contact information:</strong> Your name, mailing address, telephone number, and email address.
              </li>
              <li>
                <strong className="text-foreground">Good faith statement:</strong> A statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                <strong className="text-foreground">Accuracy statement:</strong> A statement, under penalty of perjury, that the information in your notification is accurate and that you are the copyright owner or authorized to act on the owner&apos;s behalf.
              </li>
              <li>
                <strong className="text-foreground">Signature:</strong> A physical or electronic signature of the copyright owner or authorized agent.
              </li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong className="text-foreground">Important:</strong> Knowingly submitting a false DMCA notice may result in liability for damages, including costs and attorneys&apos; fees, under Section 512(f) of the DMCA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Counter-Notice Process</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              If you believe that material you posted was removed or disabled by mistake or misidentification, you may file a counter-notice. Your counter-notice must include:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2 mt-2">
              <li>
                <strong className="text-foreground">Identification of the removed material:</strong> The material that was removed or disabled and the URL where it appeared before removal.
              </li>
              <li>
                <strong className="text-foreground">Statement under penalty of perjury:</strong> That you have a good faith belief the material was removed or disabled as a result of mistake or misidentification.
              </li>
              <li>
                <strong className="text-foreground">Consent to jurisdiction:</strong> That you consent to the jurisdiction of the Federal District Court for the judicial district in which your address is located (or, if outside the United States, any judicial district in which Poké-Trade may be found), and that you will accept service of process from the person who provided the original DMCA notice.
              </li>
              <li>
                <strong className="text-foreground">Your contact information:</strong> Your name, address, phone number, and email address.
              </li>
              <li>
                <strong className="text-foreground">Signature:</strong> Your physical or electronic signature.
              </li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Upon receiving a valid counter-notice, we will forward it to the original complainant. If the complainant does not file a court action within 10–14 business days, we will restore the removed material.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Repeat Infringers</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              In accordance with the DMCA, Poké-Trade will terminate the accounts of users who are repeat copyright infringers. We consider a user to be a repeat infringer if they have been the subject of more than two valid DMCA takedown notices. Account termination for repeat infringement is permanent and not subject to appeal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Designated DMCA Agent</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              All DMCA notices and counter-notices should be sent to our designated agent:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-foreground font-semibold">Poké-Trade DMCA Agent</p>
              <p className="text-sm text-muted-foreground mt-1">
                Email: <a href="mailto:dmca@poke-trade.com" className="text-primary hover:underline">dmca@poke-trade.com</a>
              </p>
              <p className="text-sm text-muted-foreground">
                Mail: Poké-Trade Legal Department, DMCA Agent
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-3">
              For fastest processing, we recommend submitting DMCA notices via email. Please use &quot;DMCA Takedown Notice&quot; or &quot;DMCA Counter-Notice&quot; as the subject line.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground border-b border-gray-200 pb-2">Note on Pokémon IP</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Poké-Trade is not affiliated with, endorsed by, or connected to Nintendo, Game Freak, Creatures Inc., or The Pokémon Company. Card images displayed on the Platform are sourced from publicly available APIs for informational and identification purposes, consistent with fair use. If you are a rights holder and believe your content is being used improperly, please contact our DMCA agent.
            </p>
          </section>

          <div className="pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              See also:{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" · "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" · "}
              <Link href="/acceptable-use" className="text-primary hover:underline">Acceptable Use Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

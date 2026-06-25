import { Suspense } from "react";
import Link from "next/link";
import { Mail, Clock, MessageCircle, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/support/ContactForm";

export const metadata = {
  title: "Contact Us | Poké-Trade",
  description: "Have a question or need help? Get in touch with the Poké-Trade team. We typically respond within 24 hours.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Get in <span className="text-red-600">Touch</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question? We&apos;d love to hear from you. Send us a message
            and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <Suspense fallback={<div className="h-96 flex items-center justify-center text-gray-400">Loading form...</div>}>
                  <ContactForm />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            {[
              {
                icon: <Clock className="h-5 w-5" />,
                title: "Response Time",
                desc: "We typically respond within 24 hours during business days.",
              },
              {
                icon: <Mail className="h-5 w-5" />,
                title: "Email Us",
                desc: "support@poke-trade.com",
                link: "mailto:support@poke-trade.com",
              },
              {
                icon: <MessageCircle className="h-5 w-5" />,
                title: "Discord Community",
                desc: "Join our Discord for real-time help and community chat.",
                link: "#",
              },
              {
                icon: <HelpCircle className="h-5 w-5" />,
                title: "Help Center",
                desc: "Browse our FAQ for quick answers to common questions.",
                link: "/support",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                      {item.link ? (
                        <Link
                          href={item.link}
                          className="text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                          {item.desc}
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://freecardcounter.com"),
  title: "Free Blackjack Card Counter | Best Card Counting App Online",
  description: "Use our free blackjack card counting app to improve your strategy. Track cards easily and boost your chances at the blackjack table. No cost, no downloads!",
  keywords: "free blackjack card counter, blackjack card counting app, online blackjack tool, card counting tool, improve blackjack strategy, free card counter",
  alternates: { canonical: "https://freecardcounter.com" },
  openGraph: {
    title: "Free Blackjack Card Counter | Best Card Counting App Online",
    description: "A free and easy-to-use blackjack card counter to improve your game strategy. Track cards effortlessly with our online tool.",
    url: "https://freecardcounter.com",
    siteName: "Free Card Counter",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Blackjack Card Counter | Improve Your Strategy",
    description: "Boost your blackjack skills with this free card counting tool. Track cards and play smarter.",
  },
};

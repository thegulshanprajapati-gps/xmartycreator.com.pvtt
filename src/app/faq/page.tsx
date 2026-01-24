
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Footer } from "@/components/layout/footer";
import { HelpCircle } from "lucide-react";
import type { Metadata } from 'next';
import clientPromise from '@/lib/mongodb';

export const metadata: Metadata = {
  title: 'FAQ',
};

export const dynamic = 'force-dynamic';

type FAQContent = {
  hero: {
    title: string;
    description: string;
  };
  questions: Array<{
    question: string;
    answer: string;
  }>;
};

export default async function FAQPage() {
    let faqContent: FAQContent = {
      hero: { title: 'FAQ', description: 'Frequently Asked Questions' },
      questions: []
    };

    try {
      console.log('📖 [FAQ] Fetching FAQ content from MongoDB...');
      const client = await clientPromise;
      const db = client.db("myapp");
      const page = await db.collection("pages").findOne({ slug: "faq" });
      if (page?.content) {
        console.log('✅ [FAQ] FAQ content found');
        faqContent = page.content;
      } else {
        console.log('⚠️  [FAQ] No FAQ content found, using defaults');
      }
    } catch (error) {
      console.error('❌ [FAQ] Error fetching FAQ content:', error);
    }
    return (
        <>
            <div className="flex flex-col bg-background">
                <section className="w-full py-20 md:py-32 bg-accent/20">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="inline-block bg-primary/10 text-primary p-3 rounded-full">
                                <HelpCircle className="h-8 w-8" />
                            </div>
                            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl text-destructive dark:text-foreground">
                                {faqContent.hero.title}
                            </h1>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl">
                                {faqContent.hero.description}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="w-full py-20 md:py-32">
                    <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                        <Accordion type="single" collapsible className="w-full">
                            {faqContent.questions.map((item, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                                        {item.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>
            </div>
            <Footer />
        </>
    );
}

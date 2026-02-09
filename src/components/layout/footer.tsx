
'use client';

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";
import { ReviewForm } from "../review-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useState } from "react";
import { type Review } from "@/app/home-page-client";
import { handleNewReview } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

type ReviewFormData = Omit<Review, 'avatar'> & { gender: 'male' | 'female' };

const QuickLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary hover-lift-sm">
        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        {children}
    </Link>
);


export function Footer() {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleReviewSubmit = async (reviewData: ReviewFormData) => {
    const result = await handleNewReview(reviewData);

    if (result.success) {
      toast({
        title: 'Review Submitted!',
        description: "Thank you for your feedback. We've received your review.",
      });
      setIsReviewDialogOpen(false);
    } else {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: result.error || "Could not save review.",
      });
    }
  }

  return (
    <footer className="w-full border-t bg-background text-muted-foreground">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 px-4 py-12 md:px-6">
        
        {/* Review Dialog Section */}
        <div className="md:pr-8">
            <h2 className="font-headline text-3xl font-bold tracking-tighter text-destructive dark:text-foreground mb-2">
              Leave a Review
            </h2>
            <p className="text-muted-foreground mb-6">
              Share your experience with our platform. Your feedback helps us grow.
            </p>
            <Button onClick={() => setIsReviewDialogOpen(true)}>Write a Review</Button>
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Share your feedback</DialogTitle>
                  <DialogDescription>
                    Your experience helps us improve our platform for everyone.
                  </DialogDescription>
                </DialogHeader>
                <ReviewForm onFormSubmit={handleReviewSubmit} />
              </DialogContent>
            </Dialog>
        </div>

        {/* Footer Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-headline text-lg font-semibold text-foreground mb-4">Quick Links</h3>
              <nav className="flex flex-col gap-2">
                <QuickLink href="/">Home</QuickLink>
                <QuickLink href="/about">About</QuickLink>
                <QuickLink href="/courses">Courses</QuickLink>
                <QuickLink href="/blog">Blog</QuickLink>
                <QuickLink href="/community">Community</QuickLink>
                <QuickLink href="/contact">Contact</QuickLink>
              </nav>
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold text-foreground mb-4">Support</h3>
              <nav className="flex flex-col gap-2">
                <QuickLink href="/faq">FAQ</QuickLink>
                <QuickLink href="/privacy-policy">Privacy Policy</QuickLink>
                <QuickLink href="/terms-of-service">Terms of Service</QuickLink>
              </nav>
            </div>
            <div>
              <h3 className="font-headline text-lg font-semibold text-foreground mb-4">Follow Us</h3>
              <div className="flex items-center gap-4">
                <Link href="#" className="hover:text-primary hover-lift-sm transition-transform">
                  <Facebook className="h-6 w-6" />
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link href="#" className="hover:text-primary hover-lift-sm transition-transform">
                  <Twitter className="h-6 w-6" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link href="#" className="hover:text-primary hover-lift-sm transition-transform">
                  <Instagram className="h-6 w-6" />
                  <span className="sr-only">Instagram</span>
                </Link>
                <Link href="#" className="hover:text-primary hover-lift-sm transition-transform">
                  <Linkedin className="h-6 w-6" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 py-4 md:px-6 gap-4">
           <div className="flex items-center space-x-2">
              <Image src="/logo/1000010559.png" alt="Xmarty Creator Logo" width={32} height={32} />
              <span className="font-bold sm:inline-block font-headline text-xl text-foreground">
                Xmarty Creator
              </span>
            </div>
          <p className="text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Xmarty Creator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { TestimonialCarousel } from "./ui/testimonial-carousel";
import { HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";

const testimonials = [
  {
    company: "Clinicall",
    companyLogo: <Stethoscope className="h-7 w-7 text-blue-600" />,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    name: "Nick Parsons",
    role: "Care Coordinator",
    review: "Booking follow-ups went from a week of calls to a two-minute flow. The reminders actually work.",
  },
  {
    company: "CareBridge",
    companyLogo: <HeartPulse className="h-7 w-7 text-rose-600" />,
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    name: "Thomas Paul Mann",
    role: "Clinic Manager",
    review: "From intake to approval, every step is clear. Our no-show rate dropped after the switch.",
  },
  {
    company: "PrimeHealth",
    companyLogo: <ShieldCheck className="h-7 w-7 text-emerald-600" />,
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    name: "Guillermo Rauch",
    role: "Operations Lead",
    review: "The dashboard gives us real-time clarity on schedules and follow-ups without manual tracking.",
  },
];

export default function TestimonialCarouselSection() {
  return (
    <section className="border-t border-blue-100/70 bg-white/60">
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 pt-12 text-center">
        <p className="text-blue-600 text-xs sm:text-sm font-medium">
          What our patients say about us
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          Recent Testimonials
        </h2>
      </div>
      <TestimonialCarousel testimonials={testimonials} className="py-12" />
    </section>
  );
}

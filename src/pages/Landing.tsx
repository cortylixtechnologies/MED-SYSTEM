import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Activity, 
  ArrowRight, 
  Building2, 
  Clock, 
  FileText, 
  Shield, 
  Users,
  Zap
} from "lucide-react";
import AmbulanceLoader from "@/components/AmbulanceLoader";

const Landing = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <AmbulanceLoader />;
  }

  const features = [
    {
      icon: FileText,
      title: "Create Referrals",
      description: "Easily create patient referrals with comprehensive medical information and urgency levels."
    },
    {
      icon: Building2,
      title: "Hospital Network",
      description: "Connect with verified hospitals in the network for seamless patient transfers."
    },
    {
      icon: Clock,
      title: "Real-Time Tracking",
      description: "Track referral status in real-time from pending to completed treatment."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Patient data is protected with role-based access and privacy-focused design."
    },
    {
      icon: Zap,
      title: "Emergency Alerts",
      description: "Instant notifications for emergency referrals to ensure rapid response."
    },
    {
      icon: Users,
      title: "Collaborative Care",
      description: "Enable seamless communication between referring and receiving doctors."
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Create a Referral",
      description: "Enter patient details, medical summary, select receiving hospital, and set urgency level."
    },
    {
      step: "2",
      title: "Hospital Review",
      description: "The receiving hospital reviews and accepts, requests more info, or provides feedback."
    },
    {
      step: "3",
      title: "Treatment & Updates",
      description: "Track treatment progress with real-time status updates and activity logs."
    },
    {
      step: "4",
      title: "Completion & Code",
      description: "Upon completion, a unique patient code is generated for future reference access."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 animate-fade-in">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Hospital Referral Management</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Streamline Medical Referrals with{" "}
              <span className="text-primary">MedRefer</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A comprehensive hospital-to-hospital referral system that enables seamless patient transfers, 
              real-time tracking, and secure communication between healthcare providers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/login">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              MedRefer provides all the tools healthcare providers need to manage patient referrals efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple 4-step process to manage patient referrals from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join the network of healthcare providers using MedRefer to streamline patient referrals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/login">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">
                  Sign In to Your Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} MedRefer. Hospital Referral Management System.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

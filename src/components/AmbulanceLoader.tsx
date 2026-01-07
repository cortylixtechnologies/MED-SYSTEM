import { useEffect, useState } from "react";

const AmbulanceLoader = () => {
  const [roadProgress, setRoadProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoadProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 flex flex-col items-center justify-center overflow-hidden">
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
          Med<span className="text-primary">Refer</span>
        </h1>
        <p className="text-muted-foreground text-lg">Connecting Healthcare, Saving Lives</p>
      </div>

      {/* Animated Scene Container */}
      <div className="relative w-full max-w-lg h-48 overflow-hidden">
        {/* City Background */}
        <div className="absolute bottom-16 left-0 right-0 flex justify-around items-end opacity-30">
          <div className="w-8 h-20 bg-muted-foreground/40 rounded-t" />
          <div className="w-12 h-28 bg-muted-foreground/50 rounded-t" />
          <div className="w-6 h-16 bg-muted-foreground/35 rounded-t" />
          <div className="w-10 h-24 bg-muted-foreground/45 rounded-t" />
          <div className="w-8 h-18 bg-muted-foreground/40 rounded-t" />
          <div className="w-14 h-32 bg-muted-foreground/55 rounded-t" />
          <div className="w-6 h-14 bg-muted-foreground/35 rounded-t" />
        </div>

        {/* Hospital Building */}
        <div className="absolute bottom-16 right-8 w-20 h-28 bg-card border-2 border-primary/30 rounded-t-lg shadow-lg">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-destructive font-bold text-xl">+</div>
          <div className="absolute top-8 left-2 right-2 grid grid-cols-3 gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-3 bg-primary/20 rounded-sm" />
            ))}
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-8 bg-primary/30 rounded-t" />
        </div>

        {/* Road */}
        <div className="absolute bottom-8 left-0 right-0 h-8 bg-muted-foreground/80 rounded">
          {/* Road Lines */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex gap-6 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-1 bg-warning/80 flex-shrink-0 rounded"
                style={{
                  transform: `translateX(${-roadProgress}%)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Ambulance */}
        <div 
          className="absolute bottom-14 transition-all duration-100 ease-linear"
          style={{ left: `${Math.min(roadProgress * 0.6, 55)}%` }}
        >
          <div className="relative animate-bounce" style={{ animationDuration: "0.5s" }}>
            {/* Ambulance Body */}
            <div className="relative">
              {/* Main Body */}
              <div className="w-24 h-12 bg-card border-2 border-border rounded-lg shadow-lg relative">
                {/* Red Cross */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-4 h-1.5 bg-destructive rounded absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <div className="w-1.5 h-4 bg-destructive rounded absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
                
                {/* Windows */}
                <div className="absolute top-1 right-2 w-6 h-4 bg-info/40 rounded border border-info/50" />
                
                {/* Front Cabin */}
                <div className="absolute -right-4 top-2 w-6 h-8 bg-card border-2 border-border rounded-r-lg">
                  <div className="absolute top-1 right-1 w-3 h-3 bg-info/40 rounded-sm border border-info/50" />
                </div>
              </div>

              {/* Siren Light */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="w-6 h-3 bg-destructive rounded-t-full animate-pulse shadow-lg" 
                  style={{ 
                    boxShadow: "0 0 10px hsl(var(--destructive)), 0 0 20px hsl(var(--destructive) / 0.5)",
                    animationDuration: "0.3s"
                  }} 
                />
              </div>

              {/* Wheels */}
              <div className="absolute -bottom-2 left-3 w-4 h-4 bg-foreground rounded-full border-2 border-muted animate-spin" style={{ animationDuration: "0.3s" }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-muted rounded-full" />
              </div>
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-foreground rounded-full border-2 border-muted animate-spin" style={{ animationDuration: "0.3s" }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Motion Lines */}
        <div 
          className="absolute bottom-16 transition-all duration-100"
          style={{ left: `${Math.max(0, Math.min(roadProgress * 0.6 - 10, 45))}%` }}
        >
          <div className="flex flex-col gap-1 opacity-50">
            <div className="w-6 h-0.5 bg-primary/60 rounded animate-pulse" />
            <div className="w-4 h-0.5 bg-primary/40 rounded animate-pulse" style={{ animationDelay: "0.1s" }} />
            <div className="w-5 h-0.5 bg-primary/50 rounded animate-pulse" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-8 text-center animate-fade-in">
        <p className="text-primary font-medium text-lg mb-3">Rushing to serve you...</p>
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 w-48 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-100"
          style={{ width: `${roadProgress}%` }}
        />
      </div>
    </div>
  );
};

export default AmbulanceLoader;

interface StepCardProps {
    step: number;
    title: string;
    description: string;
  }
  
  export const StepCard = ({ step, title, description }: StepCardProps) => {
    return (
      <div className="relative">
        <div className="bg-gradient-card border border-border rounded-xl p-6 text-center hover:shadow-primary transition-all duration-100">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-primary rounded-full w-8 h-8 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-primary">
              {step}
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-3 text-foreground mt-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  };
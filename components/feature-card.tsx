import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-gradient-card border border-border rounded-xl p-6 text-center group hover:shadow-glow transition-all duration-100 hover:scale-102">
      <div className="mb-4 flex justify-center text-accent group-hover:text-accent-glow transition-colors duration-100">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};
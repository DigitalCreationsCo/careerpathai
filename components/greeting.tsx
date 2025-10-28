import { useGoldenRatio } from "@/hooks/use-golden-ratio";
import { motion } from "framer-motion";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

export const Greeting = () => {
  const messages = [
    "Welcome to GoCareerPath.",
    "Work is changing fast—automation is transforming every field. \nFortunately, your skills matter, and they should lead to a stable, well-paid future.",
    "Answer a few short questions to get your Career Path Report and find the paths most likely to stay strong in the years ahead.",
  ];

  const delays = useGoldenRatio(1.0, 1.7, messages.length);

  return (
    <div className="mx-auto mt-4 flex size-full flex-col justify-center md:mt-8 md:px-8 space-y-4" key="overview">
      {messages.map((text, i) => (
        <motion.div
          key={i}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: delays[i] }}
          className={cn([
            'text-lg leading-snug flex',
            i === 0 ? "font-medium text-foreground!" : "text-muted-foreground", 
          ])}
        >
          <div className="flex items-center float-left gap-2">
            {i === 0 && <Logo />}
            {text}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
import { useGoldenRatio } from "@/hooks/use-golden-ratio";
import { motion } from "framer-motion";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

export const Greeting = () => {
  const messages = [
    "Welcome to GoCareerPath.",
    "Work is changing fast—automation is transforming every field. \nFortunately, your skills matter, and they should lead to a stable, well-paid future.",
    "Answer a few short questions to get your Career Path Report and find the paths most likely to stay strong in the years ahead."
  ];

  const delays = useGoldenRatio(1.0, 1.7, messages.length);

  return (
    <div className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-2 md:mt-16 md:px-8 space-y-4" key="overview">
      {messages.map((text, i) => (
        <motion.div
          key={i}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: delays[i] }}
          className={cn(i === 0 ? "font-semibold text-xl md:text-2xl" : "text-lg text-zinc-500 md:text-xl", 'items-center')}
        >
          <div className="float-left mr-2">
            {i === 0 && <Logo />}
          </div>
          {text}
        </motion.div>
      ))}
    </div>
  );
};
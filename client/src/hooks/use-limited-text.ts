import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TEXT_LIMIT } from "@/lib/text-pages";

export { TEXT_LIMIT };

export function useLimitedText(
  value: string,
  onChange: (next: string) => void,
  limit = TEXT_LIMIT,
) {
  const { toast } = useToast();
  const [trimmed, setTrimmed] = useState(false);

  useEffect(() => {
    if (value.length === 0) setTrimmed(false);
  }, [value]);

  const handleChange = (next: string) => {
    if (next.length <= limit) {
      setTrimmed(false);
      onChange(next);
      return;
    }
    onChange(next.slice(0, limit));
    setTrimmed(true);
    if (next.length - value.length > 1) {
      toast({
        title: "Too long for the wall",
        description: `It only takes ${limit} characters. We kept the first ${limit}.`,
      });
    }
  };

  return {
    handleChange,
    trimmed,
    limit,
    used: Math.min(value.length, limit),
    remaining: Math.max(limit - value.length, 0),
  };
}

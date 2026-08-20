import { useQuery } from "@tanstack/react-query";
import type { PublicWall } from "@shared/wall";

export function usePublicWall() {
  return useQuery<PublicWall>({
    queryKey: ["/api/wall"],
    staleTime: 20_000,
  });
}

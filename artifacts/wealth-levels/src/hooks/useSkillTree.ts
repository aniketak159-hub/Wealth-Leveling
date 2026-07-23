import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SkillTreeState {
  skillPoints: number;
  unlockedSkillIds: string[];
}

export interface UnlockResult {
  success: boolean;
  skillId: string;
  skillPointsRemaining: number;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useSkillTree() {
  return useQuery<SkillTreeState>({
    queryKey: ["skill-tree"],
    queryFn: () => apiFetch<SkillTreeState>("/skill-tree"),
  });
}

export function useUnlockSkill() {
  const qc = useQueryClient();
  return useMutation<UnlockResult, Error, string>({
    mutationFn: (skillId: string) =>
      apiFetch<UnlockResult>("/skill-tree/unlock", {
        method: "POST",
        body: JSON.stringify({ skillId }),
      }),
    onSuccess: () => {
      // Refresh both skill tree state and dashboard (unspentPoints changed)
      qc.invalidateQueries({ queryKey: ["skill-tree"] });
      qc.invalidateQueries({ queryKey: ["getDashboard"] });
    },
  });
}

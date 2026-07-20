"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUserSettings,
  saveApiKey,
  setDefaultResponsible,
} from "@/modules/settings/services/settings.service";

export const USER_SETTINGS_QUERY_KEY = ["user-settings"] as const;

export function useUserSettings(enabled = true) {
  return useQuery({ queryKey: USER_SETTINGS_QUERY_KEY, queryFn: getUserSettings, enabled });
}

export function useSettingsMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: USER_SETTINGS_QUERY_KEY });

  const saveKey = useMutation({ mutationFn: saveApiKey, onSuccess: invalidate });
  const saveResponsible = useMutation({
    mutationFn: setDefaultResponsible,
    onSuccess: invalidate,
  });

  return { saveKey, saveResponsible };
}

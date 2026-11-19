import { useEffect } from "react";

/**
 * Public and onboarding pages always use the warm ivory palette. The signed-in
 * workspace restores the saved theme when it mounts.
 */
export function useLightTheme() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
}

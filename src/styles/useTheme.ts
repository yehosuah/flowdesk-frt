import { ref, watchEffect } from 'vue';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'flowdesk:theme';

function initial(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const theme = ref<Theme>(initial());

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value;
  localStorage.setItem(STORAGE_KEY, theme.value);
});

export function useTheme() {
  return {
    theme,
    toggle: () => { theme.value = theme.value === 'dark' ? 'light' : 'dark'; },
  };
}

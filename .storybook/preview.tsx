import type { Preview } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import koMessages from '../src/i18n/messages/ko.json';
import enMessages from '../src/i18n/messages/en.json';
import '../src/app/globals.scss';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
  },
});

const messagesByLocale: Record<string, Record<string, unknown>> = {
  ko: koMessages,
  en: enMessages,
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: 'todo' },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0a0a0a' },
      ],
    },
  },
  globalTypes: {
    locale: {
      description: 'i18n locale',
      defaultValue: 'ko',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'ko', title: '한국어' },
          { value: 'en', title: 'English' },
        ],
      },
    },
    theme: {
      description: 'Color theme (data-theme)',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const locale = (context.globals.locale as string) ?? 'ko';
      const theme = (context.globals.theme as string) ?? 'light';
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = theme;
      }
      return (
        <QueryClientProvider client={queryClient}>
          <NextIntlClientProvider
            locale={locale}
            messages={messagesByLocale[locale] ?? messagesByLocale.ko}
          >
            <Story />
          </NextIntlClientProvider>
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;

'use client';

import {
  Globe,
  Palette,
  Info,
  ExternalLink,
  Languages,
  Sun,
  Moon,
  Monitor,
  Bot,
  Heart,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation, type Locale } from '@/lib/i18n';

// ==================== Theme Option Icons ====================

function ThemeIcon({ theme }: { theme: string }) {
  switch (theme) {
    case 'light':
      return <Sun className="size-4 text-amber-500" />;
    case 'dark':
      return <Moon className="size-4 text-violet-400" />;
    case 'system':
      return <Monitor className="size-4 text-muted-foreground" />;
    default:
      return null;
  }
}

// ==================== Section Component ====================

function SettingSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-muted shrink-0 mt-0.5">
            {icon}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

// ==================== Main Component ====================

export function SettingsView() {
  const { t, locale, setLocale } = useTranslation();

  const handleLocaleChange = (value: string) => {
    setLocale(value as Locale);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-base font-medium">{t.settings.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.settings.aboutDesc}
        </p>
      </div>

      {/* Language Section */}
      <SettingSection
        icon={<Languages className="size-4 text-primary" />}
        title={t.settings.language}
        description={t.settings.languageDesc}
      >
        <div className="flex items-center gap-3">
          <Label htmlFor="locale-select" className="text-xs font-medium text-muted-foreground shrink-0">
            {t.settings.language}
          </Label>
          <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger id="locale-select" className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">
                <span className="flex items-center gap-2">
                  <Globe className="size-3.5 text-muted-foreground" />
                  English
                </span>
              </SelectItem>
              <SelectItem value="zh">
                <span className="flex items-center gap-2">
                  <Globe className="size-3.5 text-muted-foreground" />
                  中文
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {locale === 'en' ? 'English' : '中文'}
          </Badge>
        </div>
      </SettingSection>

      {/* Theme Section */}
      <SettingSection
        icon={<Palette className="size-4 text-primary" />}
        title={t.settings.theme}
        description={t.settings.themeDesc}
      >
        <div className="flex items-center gap-3">
          <Label htmlFor="theme-select" className="text-xs font-medium text-muted-foreground shrink-0">
            {t.settings.theme}
          </Label>
          <Select defaultValue="system">
            <SelectTrigger id="theme-select" className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <span className="flex items-center gap-2">
                  <ThemeIcon theme="light" />
                  {t.settings.themeLight}
                </span>
              </SelectItem>
              <SelectItem value="dark">
                <span className="flex items-center gap-2">
                  <ThemeIcon theme="dark" />
                  {t.settings.themeDark}
                </span>
              </SelectItem>
              <SelectItem value="system">
                <span className="flex items-center gap-2">
                  <ThemeIcon theme="system" />
                  {t.settings.themeSystem}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingSection>

      {/* About Section */}
      <SettingSection
        icon={<Info className="size-4 text-primary" />}
        title={t.settings.about}
        description={t.settings.aboutDesc}
      >
        <div className="space-y-4">
          {/* App Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary">
              <Bot className="size-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t.settings.appName}</span>
                <Badge variant="secondary" className="text-[10px]">
                  v1.0.0
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {t.settings.appVersion} 1.0.0
              </span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.settings.appDescription}
          </p>

          <Separator />

          {/* GitHub Link */}
          <a
            href="https://github.com/dav-niu474/multica-z-ai"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium',
              'text-primary hover:text-primary/80',
              'transition-colors group'
            )}
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            {t.settings.visitGithub}
            <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>

          {/* Made with ❤️ */}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {locale === 'zh' ? '用' : 'Made with'}{' '}
            <Heart className="size-3 text-red-400 fill-red-400" />{' '}
            {locale === 'zh' ? '构建' : 'by AgentHub Team'}
          </p>
        </div>
      </SettingSection>
    </div>
  );
}

export default SettingsView;

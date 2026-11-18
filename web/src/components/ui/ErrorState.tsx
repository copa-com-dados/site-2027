import { Icon } from './Icon';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Não foi possível carregar os dados',
  message = 'Verifique sua conexão e tente novamente.',
  onRetry = () => window.location.reload(),
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col items-center text-center gap-2 my-6"
    >
      <div className="w-11 h-11 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
        <Icon name="cloud_off" className="text-[22px]" />
      </div>
      <h2 className="font-title-md text-[16px] font-semibold text-on-surface">{title}</h2>
      <p className="font-body-sm text-[13px] text-on-surface-variant max-w-sm">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 py-2 px-4 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-[13px] font-semibold transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}

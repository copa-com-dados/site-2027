import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { signInWithGoogle, signOut, watchUser, type User } from '../../lib/auth';
import { isAdmin } from '../../services/people';
import { PeopleEditor } from './PeopleEditor';

type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'denied'; user: User }
  | { status: 'admin'; user: User };

const primaryBtn =
  'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary hover:bg-primary-container text-on-primary font-title-md text-[15px] font-semibold shadow-md transition-colors disabled:opacity-60';

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    document.title = 'Área da equipe · Copa com Dados 2027';
    return () => meta.remove();
  }, []);
}

export default function AdminPage() {
  useNoIndex();
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(
    () =>
      watchUser(async (user) => {
        if (!user) return setState({ status: 'signed-out' });
        const ok = user.emailVerified && (await isAdmin(user.email));
        setState(ok ? { status: 'admin', user } : { status: 'denied', user });
      }),
    [],
  );

  const login = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Não foi possível entrar. Tente novamente.');
        console.error(e);
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-8 space-y-space-lg pt-space-xs">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-headline-xl-mobile text-[28px] leading-[36px] text-on-surface font-medium">
          Área da equipe
        </h1>
        <p className="font-body-md text-[15px] leading-[24px] text-on-surface-variant">
          Edite quem aparece em “Quem faz o projeto”, na página{' '}
          <Link to="/metodologia" className="text-primary font-semibold underline">
            Metodologia
          </Link>
          . As mudanças vão para o site na hora.
        </p>
      </header>

      {state.status === 'loading' && <PageSkeleton />}

      {state.status === 'signed-out' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
            <Icon name="lock" className="text-[24px]" />
          </div>
          <p className="font-body-md text-[15px] text-on-surface-variant max-w-sm">
            Entre com a conta Google que foi autorizada para editar o site.
          </p>
          <button type="button" onClick={login} disabled={signingIn} className={primaryBtn}>
            <Icon name="login" className="text-[20px]" />
            {signingIn ? 'Entrando…' : 'Entrar com Google'}
          </button>
          {error && <p className="font-body-sm text-[13px] text-error">{error}</p>}
        </div>
      )}

      {state.status === 'denied' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
            <Icon name="block" className="text-[24px]" />
          </div>
          <p className="font-body-md text-[15px] text-on-surface max-w-sm">
            A conta <b>{state.user.email}</b> não tem acesso de edição.
          </p>
          <p className="font-body-sm text-[13px] text-on-surface-variant max-w-sm">
            Peça para alguém da equipe técnica liberar este e-mail.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="py-2.5 px-5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-[14px] font-semibold"
          >
            Entrar com outra conta
          </button>
        </div>
      )}

      {state.status === 'admin' && (
        <>
          <div className="flex items-center justify-between gap-3 bg-surface-container-low rounded-xl px-space-md py-3">
            <span className="font-body-sm text-[13px] text-on-surface-variant truncate">
              Conectado como <b className="text-on-surface">{state.user.email}</b>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="font-label-md text-[13px] font-semibold text-primary shrink-0"
            >
              Sair
            </button>
          </div>
          <PeopleEditor editorEmail={state.user.email!} />
        </>
      )}
    </div>
  );
}

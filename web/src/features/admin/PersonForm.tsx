import { useId, useState, type FormEvent } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { toSquareJpeg } from '../../lib/image';
import type { Person, PersonInput } from '../../types/schema';

interface PersonFormProps {
  initial: Person | null;
  nextOrder: number;
  onSubmit: (data: PersonInput) => Promise<void>;
  onCancel: () => void;
}

const input =
  'w-full rounded-lg bg-surface-container-low px-3 py-2.5 font-body-md text-[15px] text-on-surface placeholder:text-outline outline-none ring-1 ring-transparent focus:ring-primary transition';
const labelCls = 'font-label-md text-[13px] font-semibold text-on-surface';
const hint = 'font-label-sm text-[11px] text-on-surface-variant';

export function PersonForm({ initial, nextOrder, onSubmit, onCancel }: PersonFormProps) {
  const ids = useId();
  const [form, setForm] = useState<PersonInput>(
    initial ?? {
      name: '',
      kind: 'student',
      title: '',
      subtitle: '',
      tag: '',
      photo: '',
      order: nextOrder,
      visible: true,
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof PersonInput>(key: K, value: PersonInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      set('photo', await toSquareJpeg(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler a imagem.');
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Informe o nome.');
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ ...form, name: form.name.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar
          key={form.photo}
          name={form.name || '?'}
          src={form.photo || undefined}
          className="w-16 h-16"
        />
        <div className="flex flex-col gap-1.5">
          <label className="inline-flex items-center gap-1.5 self-start cursor-pointer py-2 px-3.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-[13px] font-semibold transition-colors focus-within:ring-2 focus-within:ring-primary">
            <Icon name="photo_camera" className="text-[18px]" />
            {form.photo ? 'Trocar foto' : 'Enviar foto'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onPhoto(e.target.files?.[0])}
            />
          </label>
          {form.photo ? (
            <button type="button" onClick={() => set('photo', '')} className={`${hint} self-start underline`}>
              Remover foto
            </button>
          ) : (
            <span className={hint}>Recortada em quadrado automaticamente.</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${ids}-name`} className={labelCls}>
          Nome *
        </label>
        <input
          id={`${ids}-name`}
          className={input}
          value={form.name}
          maxLength={80}
          required
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ex.: Ana Souza"
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={`${labelCls} mb-1.5`}>Grupo</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['student', 'Estudante'],
              ['coordinator', 'Orientação'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg cursor-pointer font-label-md text-[13px] font-semibold transition-colors ${
                form.kind === value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              <input
                type="radio"
                name={`${ids}-kind`}
                value={value}
                checked={form.kind === value}
                onChange={() => set('kind', value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${ids}-title`} className={labelCls}>
          O que faz no projeto
        </label>
        <input
          id={`${ids}-title`}
          className={input}
          value={form.title}
          maxLength={120}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Ex.: Modelagem e simulações em Python"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${ids}-subtitle`} className={labelCls}>
          Linha em destaque <span className="font-normal text-on-surface-variant">(opcional)</span>
        </label>
        <input
          id={`${ids}-subtitle`}
          className={input}
          value={form.subtitle}
          maxLength={160}
          onChange={(e) => set('subtitle', e.target.value)}
          placeholder="Ex.: Doutorado em Estatística"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${ids}-tag`} className={labelCls}>
          Turma <span className="font-normal text-on-surface-variant">(opcional)</span>
        </label>
        <input
          id={`${ids}-tag`}
          className={input}
          value={form.tag}
          maxLength={40}
          onChange={(e) => set('tag', e.target.value)}
          placeholder="Ex.: Turma 2026"
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.visible}
          onChange={(e) => set('visible', e.target.checked)}
          className="w-4 h-4 accent-[#004ac6]"
        />
        <span className="font-body-md text-[14px] text-on-surface">Mostrar no site</span>
      </label>

      {error && (
        <p
          role="alert"
          className="font-body-sm text-[13px] text-error bg-error-container/60 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-[14px] font-semibold transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-[14px] font-semibold transition-colors disabled:opacity-60"
        >
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

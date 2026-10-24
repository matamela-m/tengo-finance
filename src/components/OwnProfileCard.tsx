import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePersona, useRecordPersona } from '../data/PersonaProvider';
import { useSession } from '../store/session';
import { accountsAvailable, useAccount } from '../data/account';
import { useAnnounce } from './A11y';
import { ProfileChip } from './DemoChip';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { squarePhoto } from '../lib/photo';

/** Profile management for the person's own profile: name, storage mode, export, delete, switch back. */
export function OwnProfileCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { record } = useRecordPersona();
  const { updateProfile, profile } = usePersona();
  const fileInput = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState(false);
  const photo = record.profile?.photo;

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(false);
    try {
      await updateProfile({ photo: await squarePhoto(file) });
      announce(t('me.photoSaved'));
    } catch {
      setPhotoError(true);
    }
  };
  const setActive = useSession((s) => s.setActivePersona);
  const [nickname, setNickname] = useState(record.profile?.nickname ?? '');
  const mode = useAccount((s) => s.mode);

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="own-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="own-title" className="font-heading text-h3 text-ink">
          {t('me.profileTitle')}
        </h2>
        <ProfileChip />
      </div>
      <p className="mt-1 text-sm text-muted">{t('me.storageMode', { mode: t(`own.storage.${mode}`) })}</p>
      {accountsAvailable() && (
        <Link to="/app/account" className="btn-secondary mt-3 min-h-[44px]">
          <Icon name="cloud" size={16} />
          {mode === 'account' ? t('account.manage') : t('account.saveTitle')}
        </Link>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {profile && <Avatar persona={profile} size={64} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{t('me.photoTitle')}</p>
          <p className="mt-0.5 text-xs text-muted">{t('me.photoHint')}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                void choosePhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button type="button" className="btn-secondary min-h-[44px]" onClick={() => fileInput.current?.click()}>
              <Icon name="upload" size={16} />
              {t('me.photoChoose')}
            </button>
            {photo && (
              <button
                type="button"
                className="btn-ghost min-h-[44px]"
                onClick={() => {
                  setPhotoError(false);
                  void updateProfile({ photo: undefined }).then(() => announce(t('me.photoRemoved')));
                }}
              >
                {t('me.photoRemove')}
              </button>
            )}
          </div>
          {photoError && (
            <p role="alert" className="mt-2 text-sm text-danger-text">
              {t('me.photoError')}
            </p>
          )}
        </div>
      </div>
      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void updateProfile({ nickname: nickname.trim() || undefined }).then(() => announce(t('me.nicknameSaved')));
        }}
      >
        <div className="min-w-[180px] flex-1">
          <label className="label" htmlFor="me-nickname">
            {t('welcome.nickname')}
          </label>
          <input id="me-nickname" className="field" value={nickname} autoComplete="nickname" onChange={(e) => setNickname(e.target.value)} />
        </div>
        <button type="submit" className="btn-secondary min-h-[44px]">
          {t('me.nicknameSave')}
        </button>
      </form>
      <ul className="mt-4 divide-y divide-line">
        {(
          [
            ['/app/money', 'money', 'nav.money'],
            ['/app/privacy/data', 'download', 'me.exportLink'],
            ['/privacy-notice', 'file', 'me.notice'],
          ] as const
        ).map(([to, icon, key]) => (
          <li key={to}>
            <Link to={to} className="flex min-h-[48px] items-center gap-3 text-[15px] hover:text-link">
              <Icon name={icon} size={18} className="text-muted" />
              <span className="flex-1">{t(key)}</span>
              <Icon name="chevronRight" size={16} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app/privacy/delete" className="btn-secondary min-h-[44px]">
          <Icon name="trash" size={16} />
          {t('me.deleteProfile')}
        </Link>
        <button
          type="button"
          className="btn-ghost min-h-[44px]"
          onClick={() => {
            setActive(null);
            navigate('/start');
          }}
        >
          {t('me.switchPeople')}
        </button>
      </div>
    </section>
  );
}

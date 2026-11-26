// W01 Sign in, plus Create account and Reset password.
// Laid out like common SaaS sign-in pages: brand panel on the left, a focused form on the right.
// Simulated: nothing is sent or checked.
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Eye, EyeOff, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { Button, Field, Toasts, cx } from '../ui';
import { useApp } from '../state';
import mark from '../assets/aizu-mark.png';

type Mode = 'signin' | 'signup' | 'reset' | 'sent' | 'sso' | 'idp';
type Errors = Partial<Record<'name' | 'company' | 'email' | 'pw' | 'pw2' | 'terms', string>>;

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const titles: Record<Mode, string> = { signin: 'Sign in', signup: 'Create account', reset: 'Reset password', sent: 'Check your email', sso: 'Single sign-on', idp: 'Company sign-in' };

function Brand({ light }: { light?: boolean }) {
  return (
    <div className="brand" style={{ height: 'auto' }}>
      <img src={mark} alt="" />
      <span style={light ? undefined : { color: 'var(--primary)' }}>Aizu</span>
    </div>
  );
}

function Password({ label, value, onChange, show, setShow, error, autoComplete, placeholder, aside }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; setShow: (v: boolean) => void;
  error?: string; autoComplete: string; placeholder: string; aside?: ReactNode;
}) {
  const id = 'pw-' + label.replace(/\W+/g, '-').toLowerCase();
  return (
    <div className={cx('field', error && 'invalid')}>
      <div className="label-row">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      <div className="pw-wrap">
        <input id={id} type={show ? 'text' : 'password'} value={value} placeholder={placeholder} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? id + '-err' : undefined} style={{ width: '100%' }} />
        <button type="button" className="pw-eye" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error ? <span className="error" id={id + '-err'}>{error}</span> : null}
    </div>
  );
}

export default function SignIn() {
  const { signIn, signUp, signedIn, run, toast } = useApp();
  const navigate = useNavigate();
  const loc = useLocation();
  const next = (loc.state as { next?: string } | null)?.next ?? '/overview';
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Errors>({});

  useEffect(() => {
    document.title = `${titles[mode]} · Aizu Fleet`;
  }, [mode]);
  useEffect(() => {
    if (signedIn) navigate(next, { replace: true });
  }, [signedIn, navigate, next]);

  const go = (m: Mode) => {
    setMode(m);
    setErr({});
    setPw('');
    setPw2('');
    setShow(false);
  };
  const clear = (k: keyof Errors) => setErr((e) => ({ ...e, [k]: undefined }));
  const sso = () => go('sso');
  const domain = email.trim().split('@')[1]?.toLowerCase() ?? '';
  const org = domain.split('.')[0] ?? '';
  const orgName = org ? org.charAt(0).toUpperCase() + org.slice(1) : 'Your company';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const x: Errors = {};
    if (!emailOk(email)) x.email = email.trim() ? 'Enter a valid email, like name@company.com.' : 'Enter your work email.';
    if ((mode === 'signin' || mode === 'idp') && !pw) x.pw = 'Enter your password.';
    if (mode === 'signup') {
      if (name.trim().length < 2) x.name = 'Enter your full name.';
      if (!company.trim()) x.company = 'Enter your company name.';
      if (pw.length < 8) x.pw = 'Use at least 8 characters.';
      else if (!/\d/.test(pw) || !/[a-z]/i.test(pw)) x.pw = 'Add at least one letter and one number.';
      if (!pw2 || pw2 !== pw) x.pw2 = 'Passwords do not match.';
      if (!terms) x.terms = 'Please accept the terms to continue.';
    }
    setErr(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    if (mode === 'signin') {
      run('Signing in…', 'Signed in', () => { setBusy(false); signIn(email.trim()); });
    } else if (mode === 'signup') {
      run('Creating your account…', `Account created. Welcome, ${name.trim().split(' ')[0]}`, () => { setBusy(false); signUp(name.trim(), email.trim(), company.trim()); }, 1200);
    } else if (mode === 'sso') {
      run('Redirecting to your company sign-in…', `Found single sign-on for ${domain}`, () => { setBusy(false); setPw(''); setShow(false); setMode('idp'); }, 1100);
    } else if (mode === 'idp') {
      run('Verifying with your company…', 'Signed in with company SSO', () => { setBusy(false); signIn(email.trim()); }, 1200);
    } else {
      run('Sending reset link…', 'Reset link sent', () => { setBusy(false); setMode('sent'); });
    }
  };

  const strength = pw.length === 0 ? 0 : pw.length < 8 ? 1 : /\d/.test(pw) && /[a-z]/i.test(pw) ? (pw.length >= 12 ? 3 : 2) : 1;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength];

  return (
    <div className="auth">
      <aside className="auth-side" aria-hidden>
        <Brand light />
        <div className="pitch">
          <h2>Stay ahead of driver fatigue.</h2>
          <p>Aizu Fleet shows drowsiness alerts from every vehicle as they happen, so you can act before a driver nods off at the wheel.</p>
        </div>
        <p className="foot">Demo with simulated data. No account or email is real.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-top">
          <span className="mobile-only"><Brand /></span>
          {mode === 'signin' ? (
            <span>New to Aizu? <button type="button" className="text-link" onClick={() => go('signup')}>Create an account</button></span>
          ) : mode === 'signup' ? (
            <span>Have an account? <button type="button" className="text-link" onClick={() => go('signin')}>Sign in</button></span>
          ) : null}
        </div>

        <form className="auth-form" key={mode} onSubmit={submit} noValidate>
          {mode === 'signin' || mode === 'signup' ? (
            <>
              <div className="head">
                <h1>{mode === 'signin' ? 'Sign in to Aizu Fleet' : 'Create your account'}</h1>
                <p className="muted">{mode === 'signin' ? 'Welcome back. Enter your details to continue.' : 'For fleet managers, safety officers and dispatchers.'}</p>
              </div>
              <Button variant="secondary" block Icon={KeyRound} onClick={sso}>Continue with company SSO</Button>
              <div className="divider">or with email</div>
              {mode === 'signup' ? (
                <>
                  <Field label="Full name" value={name} onChange={(v) => { setName(v); clear('name'); }} placeholder="e.g. Maria Santos" autoComplete="name" error={err.name} />
                  <Field label="Company" value={company} onChange={(v) => { setCompany(v); clear('company'); }} placeholder="e.g. Sample Delivery Co." autoComplete="organization" error={err.company} />
                </>
              ) : null}
              <Field label="Work email" type="email" value={email} onChange={(v) => { setEmail(v); clear('email'); }} placeholder="name@company.com" inputMode="email" autoComplete="email" error={err.email} />
              <Password
                label="Password"
                value={pw}
                onChange={(v) => { setPw(v); clear('pw'); }}
                show={show}
                setShow={setShow}
                error={err.pw}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                aside={mode === 'signin' ? <button type="button" className="text-link" onClick={() => go('reset')}>Forgot password?</button> : undefined}
              />
              {mode === 'signup' ? (
                <>
                  {pw ? (
                    <div className="strength" aria-live="polite">
                      <div className="bars3">{[1, 2, 3].map((n) => <span key={n} className={cx(strength >= n && `s${strength}`)} />)}</div>
                      <span className="caption">Password strength: {strengthLabel}. Use 8 or more characters with a number.</span>
                    </div>
                  ) : null}
                  <Password label="Confirm password" value={pw2} onChange={(v) => { setPw2(v); clear('pw2'); }} show={show} setShow={setShow} error={err.pw2} autoComplete="new-password" placeholder="Re-enter your password" />
                  <label className={cx('checkline', err.terms && 'invalid')}>
                    <input type="checkbox" checked={terms} onChange={(e) => { setTerms(e.target.checked); clear('terms'); }} />
                    <span>I agree to the <a href="#terms" onClick={(e) => { e.preventDefault(); toast('Terms of service open here in the real product', 'info'); }}>Terms</a> and the <a href="#privacy" onClick={(e) => { e.preventDefault(); toast('Data use policy opens here in the real product', 'info'); }}>data use policy</a>. Alerts and clips are used only for safety.</span>
                  </label>
                  {err.terms ? <span className="error" style={{ marginTop: -8 }}>{err.terms}</span> : null}
                </>
              ) : (
                <label className="checkline">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Keep me signed in on this device</span>
                </label>
              )}
              <Button type="submit" block loading={busy}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
              <p className="legal">Access is limited to authorized personnel. Activity is logged.</p>
            </>
          ) : (
            <>
              <button type="button" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }} onClick={() => go('signin')}>
                <ArrowLeft size={16} /> Back to sign in
              </button>
              {mode === 'sso' ? (
                <>
                  <div className="head">
                    <h1>Sign in with SSO</h1>
                    <p className="muted">Enter your work email. We'll send you to your company's sign-in page.</p>
                  </div>
                  <Field label="Work email" type="email" value={email} onChange={(v) => { setEmail(v); clear('email'); }} placeholder="name@company.com" inputMode="email" autoComplete="email" error={err.email} />
                  <Button type="submit" block loading={busy}>Continue</Button>
                  <p className="legal">Demo: no real company sign-in is contacted.</p>
                </>
              ) : mode === 'idp' ? (
                <div className="idp">
                  <div className="idp-bar"><Building2 size={16} /> {orgName} sign-in · {domain}</div>
                  <div className="idp-body">
                    <div className="head">
                      <h1>Sign in to {orgName}</h1>
                      <p className="muted">Aizu Fleet is asking to use your {orgName} account.</p>
                    </div>
                    <div className="idp-user">{email.trim()}</div>
                    <Password label="Password" value={pw} onChange={(v) => { setPw(v); clear('pw'); }} show={show} setShow={setShow} error={err.pw} autoComplete="current-password" placeholder="Your company password" />
                    <Button type="submit" block loading={busy}>Sign in</Button>
                    <p className="legal"><ShieldCheck size={14} style={{ verticalAlign: -2 }} /> Aizu Fleet gets your name and email only.</p>
                  </div>
                </div>
              ) : mode === 'sent' ? (
                <>
                  <div className="sent-ico"><MailCheck size={24} /></div>
                  <div className="head">
                    <h1>Check your email</h1>
                    <p className="muted">We sent a password reset link to <strong style={{ color: 'var(--text)', fontWeight: 500 }}>{email.trim()}</strong>. The link works for 30 minutes.</p>
                  </div>
                  <Button block onClick={() => go('signin')}>Back to sign in</Button>
                  <p className="switch-line">Didn't get it? <button type="button" className="text-link" onClick={() => run('Resending…', 'Reset link sent again', undefined, 700)}>Resend email</button></p>
                </>
              ) : (
                <>
                  <div className="head">
                    <h1>Forgot your password?</h1>
                    <p className="muted">Enter your work email and we'll send you a link to set a new one.</p>
                  </div>
                  <Field label="Work email" type="email" value={email} onChange={(v) => { setEmail(v); clear('email'); }} placeholder="name@company.com" inputMode="email" autoComplete="email" error={err.email} />
                  <Button type="submit" block loading={busy}>Send reset link</Button>
                </>
              )}
            </>
          )}
        </form>
      </main>
      <Toasts />
    </div>
  );
}

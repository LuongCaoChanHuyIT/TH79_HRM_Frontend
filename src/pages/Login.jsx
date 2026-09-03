import {useState} from 'react';
import {Navigate,useNavigate} from 'react-router-dom';
import {ArrowRight,Eye,EyeOff,ShieldCheck,Database,FileCheck2,User,LockKeyhole,Shield,Users,FileSignature} from 'lucide-react';
import {useAuth} from '../hooks/useAuth';

export default function Login(){
  const {user,login}=useAuth();
  const nav=useNavigate();
  const [form,setForm]=useState({login:'admin',password:''});
  const [show,setShow]=useState(false);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  if(user)return <Navigate to="/"/>;

  const submit=async e=>{
    e.preventDefault();
    setBusy(true);setError('');
    try{await login(form.login,form.password);nav('/')}catch(err){setError(err.message)}finally{setBusy(false)}
  };

  return <div className="login-shell">
    <section className="login-showcase">
      <div className="login-brand"><img className="login-logo" src="/assets/images/logo-th79.png" alt="Công ty TNHH Đầu tư T&H 79"/></div>
      <div className="showcase-copy">
        <span className="eyebrow">HỆ THỐNG QUẢN TRỊ NHÂN SỰ</span>
        <h1>Quản lý hồ sơ nhân sự tập trung, rõ ràng và an toàn.</h1>
        <p>Theo dõi nhân sự, hồ sơ giấy tờ, hợp đồng, tiền lương, tuyển dụng và đào tạo trên một nền tảng duy nhất.</p>
        <div className="showcase-features">
          <span><ShieldCheck/> Phân quyền chặt chẽ</span>
          <span><Database/> Dữ liệu tập trung</span>
          <span><FileCheck2/> Theo dõi hồ sơ</span>
        </div>
      </div>
      <div className="showcase-grid">
        <div className="mini-stat"><Users/><div><small>Nhân sự</small><strong>Hồ sơ đầy đủ</strong></div></div>
        <div className="mini-stat"><FileSignature/><div><small>Hợp đồng</small><strong>Dễ theo dõi</strong></div></div>
      </div>
    </section>

    <section className="login-panel">
      <form className="login-card" onSubmit={submit}>
        <div className="login-card-head">
          <img className="mobile-logo" src="/assets/images/logo-th79.png" alt="T&H 79"/>
          <h2>Đăng nhập</h2>
          <p>Sử dụng tài khoản được cấp để truy cập hệ thống.</p>
        </div>
        {error&&<div className="alert danger"><span>{error}</span></div>}
        <div className="form-stack">
          <label className="field"><span>Tài khoản hoặc email</span><div className="input-icon"><User/><input value={form.login} onChange={e=>setForm({...form,login:e.target.value})} placeholder="admin" autoComplete="username" autoFocus/></div></label>
          <label className="field"><span>Mật khẩu</span><div className="input-icon"><LockKeyhole/><input type={show?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Nhập mật khẩu" autoComplete="current-password"/><button type="button" className="password-toggle" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
          <button className="btn btn-primary btn-block login-submit" disabled={busy}><span>{busy?'Đang xác thực...':'Đăng nhập hệ thống'}</span><ArrowRight/></button>
        </div>
        <p className="login-note"><Shield/> Dữ liệu nhân sự chỉ dành cho người dùng được phân quyền.</p>
      </form>
    </section>
  </div>;
}

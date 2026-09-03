import {useEffect,useRef,useState} from 'react';
import {Bell,Search,LogOut,Moon,Sun,Camera,Menu,TriangleAlert,Download,Sparkles} from 'lucide-react';
import {useAuth} from '../hooks/useAuth';
import {api} from '../lib/api';
import {initials} from '../lib/format';
import {useNavigate} from 'react-router-dom';

export default function Header({onCommand,onMenu}){
  const {user,logout,setUser}=useAuth();
  const nav=useNavigate();
  const [dark,setDark]=useState(localStorage.getItem('th79_theme')==='dark');
  const [alerts,setAlerts]=useState([]);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [canInstall,setCanInstall]=useState(Boolean(window.__TH79_PWA_INSTALL_PROMPT__));
  const [avatarBroken,setAvatarBroken]=useState(false);
  const fileRef=useRef();
  const notifyRef=useRef();

  useEffect(()=>{
    document.documentElement.dataset.theme=dark?'dark':'light';
    localStorage.setItem('th79_theme',dark?'dark':'light');
  },[dark]);

  useEffect(()=>{api('/dashboard').then(r=>setAlerts(r.alerts||[])).catch(()=>{})},[]);

  useEffect(()=>{
    const ready=()=>setCanInstall(Boolean(window.__TH79_PWA_INSTALL_PROMPT__));
    const installed=()=>setCanInstall(false);
    window.addEventListener('th79-pwa-install-ready',ready);
    window.addEventListener('th79-pwa-installed',installed);
    return()=>{
      window.removeEventListener('th79-pwa-install-ready',ready);
      window.removeEventListener('th79-pwa-installed',installed);
    };
  },[]);

  useEffect(()=>{
    const close=e=>{
      if(notifyRef.current&&!notifyRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown',close);
    return()=>document.removeEventListener('mousedown',close);
  },[]);

  const doLogout=async()=>{await logout();nav('/login')};
  useEffect(()=>setAvatarBroken(false),[user?.avatar_path,user?.avatar_cloudinary_secure_url,user?.avatar_cloudinary_version]);

  const storedAvatar=user?.avatar_cloudinary_secure_url||user?.avatar_path||'';
  const avatar=!avatarBroken&&/^https?:\/\//i.test(String(storedAvatar))?storedAvatar:null;
  const upload=async e=>{
    const f=e.target.files?.[0];
    if(!f)return;
    const fd=new FormData();
    fd.append('avatar',f);
    const r=await api('/profile/avatar',{method:'POST',body:fd});
    setAvatarBroken(false);
    setUser({...user,avatar_path:r.avatarUrl,avatar_cloudinary_secure_url:r.avatarUrl,avatar_storage_provider:'cloudinary',avatar_cloudinary_version:r.avatarVersion});
    e.target.value='';
  };

  const installApp=async()=>{
    const prompt=window.__TH79_PWA_INSTALL_PROMPT__;
    if(prompt){
      await prompt.prompt();
      try{await prompt.userChoice;}catch{}
      window.__TH79_PWA_INSTALL_PROMPT__=null;
      setCanInstall(false);
      return;
    }
    if(window.matchMedia?.('(display-mode: standalone)').matches){
      window.alert('TH79 HRM đang chạy ở chế độ ứng dụng desktop.');
      return;
    }
    window.alert('Để cài TH79 HRM trên máy tính, hãy mở bằng Chrome hoặc Microsoft Edge trên localhost/HTTPS, sau đó bấm lại biểu tượng tải xuống.');
  };

  const displayName=user?.full_name||user?.username||'Quản trị viên';

  return <header className="topbar">
    <div className="topbar-left">
      <button className="icon-button mobile-menu" type="button" onClick={onMenu} aria-label="Mở menu"><Menu/></button>
      <div className="welcome"><small>Xin chào,</small><strong>{displayName}</strong></div>
    </div>

    <div className="topbar-right">
      <button className="global-search global-search-trigger" type="button" onClick={onCommand} aria-label="Tìm kiếm nhanh toàn hệ thống">
        <span className="command-ai-icon"><Sparkles/></span>
        <span>Hỏi HRM Copilot hoặc tìm nhân viên...</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className={`notification-menu ${notificationsOpen?'open':''}`} ref={notifyRef}>
        <button className="icon-button notification-button" type="button" title="Thông báo" onClick={()=>setNotificationsOpen(!notificationsOpen)}>
          <Bell/>
          {alerts.length>0&&<span className="notification-count">{alerts.length>99?'99+':alerts.length}</span>}
        </button>
        <div className="notification-dropdown">
          <div className="notification-head">
            <div><strong>Trung tâm cảnh báo</strong><small>Việc nhân sự cần ưu tiên xử lý</small></div>
            <span>{alerts.length}</span>
          </div>
          <div className="notification-list">
            {alerts.length?alerts.slice(0,12).map((a,i)=><button key={`${a.type||'alert'}-${a.employee_id||i}-${i}`} className={`notification-item ${a.severity||'info'}`} onClick={()=>{setNotificationsOpen(false);a.href&&nav(a.href)}}>
              <span className="notification-icon"><TriangleAlert/></span>
              <span><strong>{a.title}</strong><small>{a.detail}</small></span>
            </button>):<div className="notification-empty"><Bell/><strong>Không có cảnh báo mới</strong><small>Mọi dữ liệu đang trong trạng thái ổn định.</small></div>}
          </div>
        </div>
      </div>

      <button className="icon-button theme-toggle" type="button" title={dark?'Chế độ sáng':'Chế độ tối'} onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</button>

      <button className={`icon-button pwa-install ${canInstall?'install-ready':''}`} type="button" title={canInstall?'Cài HRM như ứng dụng desktop':'Cài ứng dụng desktop'} onClick={installApp}><Download/></button>

      <button className="user-chip user-chip-button" type="button" title="Cập nhật ảnh đại diện" onClick={()=>fileRef.current?.click()}>
        <span className={`avatar avatar-sm ${avatar?'avatar-photo':''}`}>
          {avatar?<img src={avatar} alt="Avatar" onError={()=>setAvatarBroken(true)}/>:initials(displayName)}
          <span className="avatar-edit-badge"><Camera/></span>
        </span>
        <span className="user-meta"><strong>{displayName}</strong><small>{user?.email||'Tài khoản HRM'}</small></span>
      </button>
      <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/>

      <button className="icon-button logout-button" type="button" title="Đăng xuất" onClick={doLogout}><LogOut/></button>
    </div>
  </header>;
}

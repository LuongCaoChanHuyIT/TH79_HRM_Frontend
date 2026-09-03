import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {AuthProvider} from './hooks/useAuth';
import App from './App';
import './styles.css';

// Giữ prompt cài PWA ngay từ lúc trang khởi động để nút "Cài app" trong
// header vẫn hoạt động sau khi người dùng đăng nhập.
if(typeof window!=='undefined'){
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    window.__TH79_PWA_INSTALL_PROMPT__=event;
    window.dispatchEvent(new Event('th79-pwa-install-ready'));
  });
  window.addEventListener('appinstalled',()=>{
    window.__TH79_PWA_INSTALL_PROMPT__=null;
    window.dispatchEvent(new Event('th79-pwa-installed'));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></React.StrictMode>
);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}

import {useState} from 'react';
import {Bot,Sparkles,Send,X,UserRound,TriangleAlert} from 'lucide-react';
import {api} from '../lib/api';
import {useNavigate} from 'react-router-dom';
import {entityId,entityKey} from '../lib/format';

const suggestions=['Hôm nay cần làm gì?','Tổng quan nhân sự','Nhân viên sắp hết thử việc','Bất thường dữ liệu'];

export default function Copilot(){
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState('');
  const [messages,setMessages]=useState([{role:'bot',text:'Xin chào. Tôi là HRM Copilot. Bạn có thể tìm nhân viên hoặc hỏi tổng quan, cảnh báo và bất thường dữ liệu.'}]);
  const [busy,setBusy]=useState(false);
  const nav=useNavigate();

  const ask=async value=>{
    const text=(value??q).trim();
    if(!text||busy)return;
    setMessages(m=>[...m,{role:'user',text}]);
    setQ('');
    setBusy(true);
    try{
      const r=await api('/assistant/query',{method:'POST',body:JSON.stringify({query:text})});
      setMessages(m=>[...m,{role:'bot',text:r.message,result:r}]);
    }catch(e){
      setMessages(m=>[...m,{role:'bot',text:e.message||'Không thể xử lý yêu cầu lúc này.'}]);
    }finally{setBusy(false)}
  };

  return <>
    <button className="copilot-fab" onClick={()=>setOpen(!open)}><Sparkles size={20}/><span>HRM Copilot</span></button>
    {open&&<div className="copilot">
      <div className="copilot-head"><span className="copilot-logo"><Bot size={22}/></span><div><strong>Trợ lý HRM</strong><small><i/> Tra cứu dữ liệu nội bộ</small></div><button onClick={()=>setOpen(false)}><X size={20}/></button></div>
      <div className="copilot-intro"><strong>Tìm người nhanh hơn.</strong><span>Nhập tên, mã nhân viên, số điện thoại hoặc hỏi bằng câu tự nhiên.</span><div className="chips">{suggestions.map(s=><button key={s} onClick={()=>ask(s)}>{s}</button>)}</div></div>
      <div className="copilot-messages">
        {messages.map((m,i)=><div key={`${m.role}-${i}`} className={`chat-row ${m.role}`}><div className="bubble">{m.text}{m.result&&<Result result={m.result} go={p=>{nav(p);setOpen(false)}}/>}</div></div>)}
        {busy&&<div className="chat-row bot"><div className="bubble">Đang phân tích dữ liệu…</div></div>}
      </div>
      <form className="copilot-input" onSubmit={e=>{e.preventDefault();ask()}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="VD: Tìm Nguyễn Văn A..."/><button><Send size={19}/></button></form>
    </div>}
  </>;
}

function Result({result,go}){
  if(result.type==='employees')return <div className="assistant-results">{(result.data||[]).map((e,i)=>{
    const id=entityId(e);
    return <button key={entityKey(e,`assistant-employee-${i}`)} disabled={!id} onClick={()=>id&&go(`/employees/${encodeURIComponent(id)}`)}>
      <UserRound size={18}/><span><strong>{e.full_name}</strong><small>{e.employee_code} · {e.position_name||'—'} · {e.branch_name||'—'}</small><small>{e.phone||'Chưa có SĐT'} · {e.employment_status}</small><small>{e.department_name||'Chưa có phòng ban'} · Ngày vào: {e.join_date?new Date(e.join_date).toLocaleDateString('vi-VN'):'—'}</small>{e.email&&<small>{e.email}</small>}</span>
    </button>;
  })}</div>;
  if(result.type==='notifications')return <div className="assistant-results">{(result.data||[]).slice(0,6).map((x,i)=><button key={x.id??x.href??`${x.title}-${i}`} onClick={()=>x.href&&go(x.href)}><TriangleAlert size={18}/><span><strong>{x.title}</strong><small>{x.detail}</small></span></button>)}</div>;
  if(result.type==='analytics')return <div className="assistant-kpis"><span><b>{result.data.total}</b> Nhân sự</span><span><b>{result.data.probation}</b> Thử việc</span><span><b>{result.data.dataQuality}/100</b> Data Quality</span></div>;
  return null;
}

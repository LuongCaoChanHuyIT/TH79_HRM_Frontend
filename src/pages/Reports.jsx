import {useEffect,useState} from 'react';
import {Download,ArrowUpRight} from 'lucide-react';
import {api,apiUrl} from '../lib/api';
import {Loading,PageHeader,Empty} from '../components/ui';
import {useNavigate} from 'react-router-dom';
export default function Reports(){
  const [d,setD]=useState(null),nav=useNavigate();useEffect(()=>{api('/analytics/reports').then(setD)},[]);if(!d)return <Loading/>;
  const exportList=()=>{window.location.href=apiUrl('/employees/export/csv')};
  return <>
    <PageHeader eyebrow="BÁO CÁO" title="Báo cáo nhân sự" subtitle="Tổng hợp phân bổ nhân sự và các hồ sơ còn thiếu cần xử lý." actions={<button className="btn" onClick={exportList}><Download size={16}/> Xuất danh sách</button>}/>
    <div className="report-rank-grid">
      <section className="card rank-card"><div className="card-head"><div><h3>Theo chi nhánh</h3><p>Phân bổ nhân sự hiện tại</p></div></div><div className="rank-list">{(d.byBranch||[]).slice(0,10).map((x,i)=><div key={x.branch}><span className="rank-index">{i+1}</span><strong>{x.branch}</strong><em>{x.count} người</em></div>)}</div></section>
      <section className="card rank-card"><div className="card-head"><div><h3>Theo chức vụ</h3><p>Top 10 nhóm chức vụ</p></div></div><div className="rank-list">{(d.byPosition||[]).slice(0,10).map((x,i)=><div key={x.position}><span className="rank-index">{i+1}</span><strong>{x.position}</strong><em>{x.count} người</em></div>)}</div></section>
    </div>
    <section className="card missing-report-card"><div className="card-head"><div><h3>Nhân sự còn thiếu hồ sơ</h3><p>Ưu tiên bổ sung checklist giấy tờ bắt buộc</p></div><button className="link-btn" onClick={()=>nav('/employees?doc=missing')}>Xem toàn bộ</button></div><div className="table-wrap"><table><thead><tr><th>Nhân viên</th><th>Mã nhân viên</th><th>Thiếu</th><th>Tổng hồ sơ</th><th></th></tr></thead><tbody>{(d.missing||[]).slice(0,12).map(x=><tr key={x.id}><td><strong>{x.full_name}</strong></td><td>{x.employee_code}</td><td><span className="missing-pill">{x.missing_count} hồ sơ</span></td><td>{x.total_required}</td><td><button className="icon-button small" onClick={()=>nav(`/employees/${x.id}`)}><ArrowUpRight size={15}/></button></td></tr>)}</tbody></table>{!d.missing?.length&&<Empty title="Hồ sơ đã đầy đủ"/>}</div></section>
  </>;
}

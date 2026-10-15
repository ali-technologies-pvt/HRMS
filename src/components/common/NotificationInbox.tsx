'use client';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Bell, BellRing, Check, CheckCheck, CheckCircle2, Info, Search, TriangleAlert, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import type { NotificationItem } from '@/types';

type Destination = 'People'|'Projects'|'Requests'|'Broadcasts'|'Reports'|'Team chat';
const destination = (notification: NotificationItem): {section:Destination;label:string}|null => {
  const text = notification.title.toLowerCase();
  if (/profile|password/.test(text)) return null;
  if (/request|leave|overtime/.test(text)) return {section:'Requests',label:'Open requests'};
  if (/project|pipeline/.test(text)) return {section:'Projects',label:'Open projects'};
  if (/broadcast|announcement|notice/.test(text)) return {section:'Broadcasts',label:'Open broadcasts'};
  if (/report|eod/.test(text)) return {section:'Reports',label:'Open reports'};
  if (/chat|message|group/.test(text)) return {section:'Team chat',label:'Open team chat'};
  if (/account created|onboard|department created/.test(text)) return {section:'People',label:'Open people'};
  return null;
};
const relativeTime = (timestamp:string) => {
  const elapsed=Math.max(0,Date.now()-new Date(timestamp).getTime());
  if(!Number.isFinite(elapsed))return 'Recent update';
  if(elapsed<60000)return 'Just now';
  if(elapsed<3600000)return `${Math.floor(elapsed/60000)}m ago`;
  if(elapsed<86400000)return `${Math.floor(elapsed/3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
};
export function NotificationInbox({onNavigate,onOpenProfile}:{onNavigate:(section:Destination)=>void;onOpenProfile:()=>void}) {
  const {notifications,markAsRead,clearNotification,clearAll}=useNotifications();
  const reduced=useReducedMotion();
  const [filter,setFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState<string|null>(null);
  const unread=notifications.filter(item=>!item.read).length;
  const important=notifications.filter(item=>item.type==='urgent'||item.type==='warning').length;
  const filtered=notifications.filter(item=>(filter!=='Unread'||!item.read)&&(filter!=='Important'||item.type==='urgent'||item.type==='warning')&&`${item.title} ${item.message}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime());
  const today=new Date().toDateString();
  const groups=[{label:'Today',items:filtered.filter(item=>new Date(item.timestamp).toDateString()===today)},{label:'Earlier',items:filtered.filter(item=>new Date(item.timestamp).toDateString()!==today)}];
  return <div className="bn-inbox"><div className="bn-summary"><span className="bn-summary-icon"><Bell size={22}/>{unread>0&&<i/>}</span><div><strong>{unread?`${unread} unread ${unread===1?'update':'updates'}`:'You’re all caught up'}</strong><p>Your people, projects and important moments.</p></div></div><div className="bn-tabs" aria-label="Notification filters">{[{label:'All',count:notifications.length},{label:'Unread',count:unread},{label:'Important',count:important}].map(tab=><button key={tab.label} aria-pressed={filter===tab.label} onClick={()=>setFilter(tab.label)}>{tab.label}<span>{tab.count}</span>{filter===tab.label&&<motion.i layoutId="notification-tab" transition={{duration:reduced?0:.2}}/>}</button>)}</div><label className="bn-search"><Search size={16}/><input aria-label="Search notifications" placeholder="Search your notifications…" value={search} onChange={event=>setSearch(event.target.value)}/>{search&&<button aria-label="Clear notification search" onClick={()=>setSearch('')}><X size={14}/></button>}</label><div className="bn-toolbar"><span>{filtered.length} {filtered.length===1?'notification':'notifications'}</span><button disabled={!unread} onClick={()=>notifications.forEach(item=>markAsRead(item.id))}><CheckCheck size={14}/>Mark all as read</button></div><div className="bn-feed"><AnimatePresence initial={false}>{groups.map(group=>group.items.length>0&&<section key={group.label} aria-label={group.label}><h3>{group.label}</h3>{group.items.map(item=>{const Icon=item.type==='success'?CheckCircle2:item.type==='urgent'?BellRing:item.type==='warning'?TriangleAlert:Info;const action=destination(item);return <motion.article layout={!reduced} className={`bn-item ${item.read?'bn-read':'bn-unread'}`} key={item.id} initial={{opacity:0,y:reduced?0:6}} animate={{opacity:1,y:0}} exit={{opacity:0,height:0}} transition={{duration:reduced?0:.18}}><span className="bn-type-icon" data-type={item.type}><Icon size={18}/></span><div className="bn-item-main"><div className="bn-item-meta"><time dateTime={item.timestamp} title={new Date(item.timestamp).toLocaleString()}>{relativeTime(item.timestamp)}</time>{!item.read&&<span className="bn-unread-label">Unread</span>}</div><button className="bn-message" aria-expanded={selected===item.id} onClick={()=>{setSelected(selected===item.id?null:item.id);markAsRead(item.id);}}><strong>{item.title}</strong><p className={selected===item.id?'bn-expanded':''}>{item.message}</p></button>{selected===item.id&&<div className="bn-detail"><span>{new Date(item.timestamp).toLocaleString('en-GB',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</span>{action&&<button onClick={()=>onNavigate(action.section)}>{action.label}<ArrowUpRight size={13}/></button>}{/profile|password/i.test(item.title)&&<button onClick={onOpenProfile}>Open profile<ArrowUpRight size={13}/></button>}</div>}</div><div className="bn-item-actions">{!item.read&&<button aria-label={`Mark ${item.title} as read`} title="Mark as read" onClick={()=>markAsRead(item.id)}><Check size={14}/></button>}<button aria-label={`Dismiss ${item.title}`} title="Dismiss" onClick={()=>clearNotification(item.id)}><X size={14}/></button></div></motion.article>;})}</section>)}</AnimatePresence>{!filtered.length&&<div className="bn-empty"><span><CheckCheck size={29}/></span><h3>{search?'No matching notifications':filter==='Unread'?'A clear inbox. A clear mind.':'Nothing needs your attention.'}</h3><p>{search?'Try a different keyword.':'New workspace updates will appear here.'}</p>{search&&<button onClick={()=>setSearch('')}>Clear search</button>}</div>}</div><footer className="bn-footer"><span><span/>Workspace updates</span><button disabled={!notifications.length} onClick={clearAll}>Clear inbox</button></footer></div>;
}

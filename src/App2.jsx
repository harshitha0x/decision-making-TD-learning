import { useState } from 'react'
import NetworkGraph from './NetworkGraph2'
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

function App() {
  const [history, setHistory] = useState([{ step: 0, val: 0 }]);
  const [logs, setLogs] = useState(["[SYS] Neural Core Online", "[NET] Topology Ready"]);
  const [activeTab, setActiveTab] = useState(null); 
  
  const [alpha, setAlpha] = useState(0.5);
  const [packetSize, setPacketSize] = useState(1024);
  const [congestion, setCongestion] = useState({ R1: 1, R2: 1 });

  const updateHistory = (newValue) => {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    setLogs(prev => [`[${time}] TD_SIGNAL: V=${newValue.toFixed(3)}`, ...prev].slice(0, 12));
    setHistory(prev => [...prev, { step: prev.length, val: parseFloat(newValue.toFixed(2)) }]);
  };

  return (
    <div className="min-h-screen bg-[#020817] text-slate-300 font-mono">
      {/* 1. TOP CONTROL BAR [Required Buttons: 45] */}
      <nav className="border-b border-white/10 bg-[#030c1b] p-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">
            <span className="text-purple-500">TD</span>_PULSE_v2.5
          </h1>
          <div className="flex gap-1">
            {['Download', 'Help', 'Learn', 'Developed By'].map((btn) => (
              <button 
                key={btn}
                onClick={() => setActiveTab(btn.toLowerCase())}
                className="px-4 py-1.5 text-[10px] font-bold uppercase border border-white/5 bg-white/5 hover:bg-purple-600 hover:text-white transition-all rounded"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
        <div className="text-right text-[10px]">
          <p className="text-white font-bold uppercase tracking-widest">H.S. MENON [24BYB1166]</p>
          <p className="text-purple-500 font-black tracking-tighter">CATEGORY_1: COMPUTER_NETWORKS</p>
        </div>
      </nav>

      <main className="p-6 grid grid-cols-12 gap-6 h-[calc(100vh-80px)]">
        {/* 2. PARAMETER PANEL [Required User Inputs: 29, 30] */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-[#030c1b] border border-white/10 p-5 rounded-lg shadow-xl">
            <h3 className="text-[10px] font-bold text-purple-400 mb-6 uppercase tracking-widest border-b border-white/5 pb-2">Inputs</h3>
            <div className="space-y-6 text-[10px]">
              <div>
                <label className="flex justify-between mb-2 uppercase text-white/50"><span>Alpha (α)</span> <span>{alpha}</span></label>
                <input type="range" min="0.1" max="1" step="0.1" value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} className="w-full accent-purple-500" />
              </div>
              <div>
                 <label className="flex justify-between mb-2 uppercase text-white/50"><span>Packet Size (B)</span></label>
                 <input type="number" value={packetSize} onChange={(e) => setPacketSize(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-purple-400 font-bold" />
              </div>
              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
                  <button onClick={() => setCongestion(p => ({...p, R1: p.R1 > 1 ? 1 : 10}))} className={`py-2 rounded border text-[9px] font-black ${congestion.R1 > 1 ? 'bg-red-900 border-red-500 text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>JAM_R1</button>
                  <button onClick={() => setCongestion(p => ({...p, R2: p.p2 > 1 ? 1 : 10}))} className={`py-2 rounded border text-[9px] font-black ${congestion.R2 > 1 ? 'bg-red-900 border-red-500 text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>JAM_R2</button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. VISUALIZATION GRID [Required: 36, 37] */}
        <div className="col-span-12 lg:col-span-6 bg-[#010409] border border-white/5 rounded-lg relative overflow-hidden flex items-center justify-center">
          <NetworkGraph onUpdate={updateHistory} alpha={alpha} congestion={congestion} packetSize={packetSize} />
        </div>

        {/* 4. NEURAL MONITOR [Like the Queue/Stack in your reference: 76, 83] */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-[#030c1b] border border-white/10 p-5 rounded-lg h-1/2 overflow-hidden">
            <h3 className="text-[10px] font-bold text-blue-400 mb-4 uppercase tracking-widest border-b border-white/5 pb-2">Step_Update_Logs</h3>
            <div className="space-y-1 text-[9px] font-mono h-full overflow-y-auto">
              {logs.map((log, i) => <div key={i} className={i === 0 ? "text-white" : "text-white/20"}>{log}</div>)}
            </div>
          </div>

          <div className="bg-[#030c1b] border border-white/10 p-5 rounded-lg h-[calc(50%-16px)]">
            <h3 className="text-[10px] font-bold text-purple-400 mb-4 uppercase tracking-widest border-b border-white/5 pb-2">Convergence_Chart</h3>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={history}>
                <Area type="monotone" dataKey="val" stroke="#a855f7" strokeWidth={2} fill="#a855f710" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>

      {/* POP-UP MODAL [Required: 4, 13] */}
      {activeTab === 'learn' && (
        <div className="fixed inset-0 z-50 bg-[#020817]/95 backdrop-blur-md flex items-center justify-center p-10">
          <div className="max-w-4xl w-full bg-[#030c1b] border border-purple-500/30 rounded-2xl p-10 relative">
            <button onClick={() => setActiveTab(null)} className="absolute top-6 right-8 text-white text-2xl font-black">&times;</button>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic underline decoration-purple-500">Concept: TD Learning</h2>
            <div className="grid grid-cols-2 gap-10 text-sm leading-relaxed text-slate-400">
               <div className="space-y-4">
                 <p><strong className="text-purple-400">Definition:</strong> TD Learning is an algorithm that updates estimations without waiting for final results[cite: 6].</p>
                 <div className="bg-black/50 p-4 rounded border border-white/5 font-mono text-[10px]">
                    <h4 className="text-white mb-2 uppercase">Stepwise Solution [Required: 8]</h4>
                    <p>Old_V = 0 | R = -1 | Next_V = 10</p>
                    <p>TD_Error = [-1 + (0.8 * 10) - 0] = 7</p>
                    <p className="text-white mt-1 underline">New_V = 0 + (0.5 * 7) = 3.5</p>
                 </div>
               </div>
               <div className="aspect-video bg-black rounded-lg border border-white/10 overflow-hidden">
                 <iframe width="100%" height="100%" src="https://www.youtube.com/embed/0r3Q6yH1MvQ" frameBorder="0" allowFullScreen></iframe>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App;
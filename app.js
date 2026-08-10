let D = window.TRENDS_DATA;
const ORANGE = "#f37021", ORANGE2 = "#ffad78", DARK = "#c84d00", MUTED="#a8adb4", GREEN="#2e7d32", RED="#bf3b2b";
const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
let charts = {};

const marketFilter = document.querySelector("#marketFilter");
const yearFilter = document.querySelector("#yearFilter");
const startDate = document.querySelector("#startDate");
const endDate = document.querySelector("#endDate");

function fmt(v,d=1){ return Number.isFinite(v) ? v.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}) : "—"; }
function pct(v){ return Number.isFinite(v) ? `${v>=0?"+":""}${(v*100).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}%` : "—"; }
function mean(a){ return a.length ? a.reduce((x,y)=>x+y,0)/a.length : NaN; }
function stdev(a){ if(a.length<2) return NaN; const m=mean(a); return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1)); }
function selectedMarket(){ return marketFilter.value; }
function selectedYear(){ return yearFilter.value === "ALL" ? null : +yearFilter.value; }
function marketRows(code=selectedMarket()){ return D.series.filter(r => code==="ALL" || r.marketCode===code); }
function monthsComparable(curr, prev){ const maxMonth = Math.max(...curr.map(r=>r.month)); return [curr.filter(r=>r.month<=maxMonth), prev.filter(r=>r.month<=maxMonth)]; }
function colorMetric(v){ return v > 0.001 ? "positive" : v < -0.001 ? "negative" : ""; }

function setupFilters(){
  const marketOrder = ["ALL","BR","AR","CL","CO","UY","US","FR","WORLD"];
  marketFilter.innerHTML = marketOrder.map(c => `<option value="${c}">${c==="ALL"?"Todos os mercados":D.series.find(r=>r.marketCode===c).market}</option>`).join("");
  const years = [...new Set(D.series.map(r=>r.year))].sort((a,b)=>b-a);
  yearFilter.innerHTML = `<option value="ALL">Todos os anos</option>` + years.map(y=>`<option value="${y}">${y}</option>`).join("");
  marketFilter.value = "BR";
  yearFilter.value = "2026";
  const dates = D.series.map(r=>r.date).sort();
  startDate.min = dates[0].slice(0,7); startDate.max = dates.at(-1).slice(0,7);
  endDate.min = dates[0].slice(0,7); endDate.max = dates.at(-1).slice(0,7);
}

Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
Chart.defaults.color = "#747981";

function destroy(name){ if(charts[name]) charts[name].destroy(); }
function standardOptions(horizontal=false){
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{legend:{display:false},tooltip:{backgroundColor:"#27231f",padding:11,titleFont:{weight:"700"}}},
    scales:{
      x:{grid:{display:false},border:{display:false},ticks:{maxRotation:0,autoSkip:true}},
      y:{grid:{color:"#f0ece8"},border:{display:false},beginAtZero:true}
    }
  };
}
function lineOptions(){
  const o=standardOptions();
  o.scales.y.max=100;
  o.scales.y.title={display:true,text:"Índice de interesse"};
  return o;
}
function barColors(values){ return values.map(v=>v>=0 ? ORANGE : "#c5c8cc"); }

function updateKPIs(){
  const code=selectedMarket(), year=selectedYear();
  let base = marketRows(code);
  if(year) base=base.filter(r=>r.year===year);
  const vals=base.map(r=>r.value);
  const avg=mean(vals);
  document.querySelector("#kpiAvg").textContent=fmt(avg);
  document.querySelector("#kpiAvgSub").textContent=year ? `${year} · ${code==="ALL"?"todos os mercados":base[0]?.market||""}` : "período completo";

  let yoy=NaN;
  if(year){
    const cur=marketRows(code).filter(r=>r.year===year);
    const prev=marketRows(code).filter(r=>r.year===year-1);
    if(cur.length && prev.length){
      const [c,p]=monthsComparable(cur,prev); yoy=mean(c.map(r=>r.value))/mean(p.map(r=>r.value))-1;
    }
  }
  const yoyEl=document.querySelector("#kpiYoy"); yoyEl.textContent=pct(yoy); yoyEl.className=colorMetric(yoy);
  document.querySelector("#kpiYoySub").textContent=year?`vs. ${year-1}`:"selecione um ano";

  let momentum=NaN;
  if(year){
    const arr=marketRows(code).filter(r=>r.year===year).sort((a,b)=>a.month-b.month);
    if(arr.length>=6){
      momentum=mean(arr.slice(-3).map(r=>r.value))/mean(arr.slice(-6,-3).map(r=>r.value))-1;
    }
  }
  const mEl=document.querySelector("#kpiMomentum"); mEl.textContent=pct(momentum); mEl.className=colorMetric(momentum);

  const peak=base.length ? base.reduce((a,b)=>b.value>a.value?b:a) : null;
  document.querySelector("#kpiPeak").textContent=peak?fmt(peak.value,0):"—";
  document.querySelector("#kpiPeakSub").textContent=peak?`${months[peak.month-1]}/${peak.year}`:"—";

  const cv=vals.length>1 && mean(vals)!==0 ? stdev(vals)/mean(vals) : NaN;
  document.querySelector("#kpiVol").textContent=Number.isFinite(cv)?pct(cv):"—";
}

function updateTrend(){
  destroy("trend");
  const code=selectedMarket(), yr=selectedYear();
  let data=marketRows(code);
  // Global year applies unless local date filter is active.
  const hasLocal = startDate.value || endDate.value;
  if(!hasLocal && yr) data=data.filter(r=>r.year===yr);
  if(startDate.value) data=data.filter(r=>r.date>=startDate.value+"-01");
  if(endDate.value){
    const [y,m]=endDate.value.split("-").map(Number);
    data=data.filter(r=>r.year<y || (r.year===y && r.month<=m));
  }
  data.sort((a,b)=>a.date.localeCompare(b.date));
  // if all markets, aggregate mean by date
  let chartRows=data;
  if(code==="ALL"){
    const by={}; data.forEach(r=>(by[r.date]??=[]).push(r.value));
    chartRows=Object.entries(by).map(([date,v])=>({date,value:mean(v)})).sort((a,b)=>a.date.localeCompare(b.date));
  }
  charts.trend=new Chart(document.querySelector("#trendChart"),{
    type:"line",
    data:{labels:chartRows.map(r=>new Date(r.date+"T00:00:00").toLocaleDateString("pt-BR",{month:"short",year:"2-digit"})),
      datasets:[{data:chartRows.map(r=>r.value),borderColor:ORANGE,backgroundColor:"rgba(243,112,33,.10)",pointRadius:3,pointHoverRadius:5,borderWidth:2.5,tension:.25,fill:true}]},
    options:lineOptions()
  });
}

function updateComparison(){
  destroy("comparison");
  const code=selectedMarket(), year=selectedYear();
  const title=document.querySelector("#comparisonTitle");
  if(!year){ title.textContent="Ano selecionado × anterior"; return; }
  title.textContent=`${year} × ${year-1}`;
  let current=marketRows(code).filter(r=>r.year===year);
  let previous=marketRows(code).filter(r=>r.year===year-1);
  if(code==="ALL"){
    const ag=(arr)=>{const b={};arr.forEach(r=>(b[r.month]??=[]).push(r.value));return Object.entries(b).map(([month,v])=>({month:+month,value:mean(v)}));};
    current=ag(current); previous=ag(previous);
  }
  const byCur=Object.fromEntries(current.map(r=>[r.month,r.value]));
  const byPrev=Object.fromEntries(previous.map(r=>[r.month,r.value]));
  charts.comparison=new Chart(document.querySelector("#comparisonChart"),{
    type:"line",
    data:{labels:months,datasets:[
      {label:String(year),data:months.map((_,i)=>byCur[i+1]??null),borderColor:ORANGE,backgroundColor:ORANGE,pointRadius:3,borderWidth:2.8,tension:.2},
      {label:String(year-1),data:months.map((_,i)=>byPrev[i+1]??null),borderColor:MUTED,backgroundColor:MUTED,pointRadius:2,borderWidth:2,tension:.2,borderDash:[6,5]}
    ]},
    options:{...lineOptions(),plugins:{...lineOptions().plugins,legend:{display:true,position:"bottom",labels:{usePointStyle:true,boxWidth:8}}}}
  });
}

function seasonIndexFor(code){
  const data=marketRows(code);
  const overall=mean(data.map(r=>r.value));
  return months.map((_,i)=>mean(data.filter(r=>r.month===i+1).map(r=>r.value))/overall);
}
function seasonColor(v){
  const t=Math.max(0,Math.min(1,(v-.65)/.7));
  const a=[255,246,239], b=[243,112,33];
  return `rgb(${a.map((x,i)=>Math.round(x+(b[i]-x)*t)).join(",")})`;
}
function updateSeasonality(){
  let vals;
  if(selectedMarket()==="ALL"){
    const allCodes=["BR","AR","CL","CO","UY","US","FR","WORLD"];
    vals=months.map((_,i)=>mean(allCodes.map(c=>seasonIndexFor(c)[i])));
  } else vals=seasonIndexFor(selectedMarket());
  document.querySelector("#seasonalityGrid").innerHTML=months.map((m,i)=>`
    <div class="season-cell" style="background:${seasonColor(vals[i])}">
      <span>${m}</span><b>${fmt(vals[i],2)}</b>
    </div>`).join("");
}

function metricByMarket(metric){
  const yr=selectedYear();
  const codes=["BR","AR","CL","CO","UY","US","FR"];
  let result=[];
  codes.forEach(code=>{
    const all=marketRows(code);
    if(metric==="avg"){
      const d=yr?all.filter(r=>r.year===yr):all;
      result.push({code,name:namesFrom(code),v:mean(d.map(r=>r.value))});
    }
    if(metric==="yoy"){
      if(!yr) return;
      const cur=all.filter(r=>r.year===yr), prev=all.filter(r=>r.year===yr-1);
      if(!cur.length||!prev.length)return;
      const [c,p]=monthsComparable(cur,prev);
      result.push({code,name:namesFrom(code),v:mean(c.map(r=>r.value))/mean(p.map(r=>r.value))-1});
    }
    if(metric==="momentum"){
      const d=(yr?all.filter(r=>r.year===yr):all).sort((a,b)=>a.date.localeCompare(b.date));
      if(d.length<6)return;
      result.push({code,name:namesFrom(code),v:mean(d.slice(-3).map(r=>r.value))/mean(d.slice(-6,-3).map(r=>r.value))-1});
    }
    if(metric==="vol"){
      const d=yr?all.filter(r=>r.year===yr):all;
      const vals=d.map(r=>r.value); result.push({code,name:namesFrom(code),v:stdev(vals)/mean(vals)});
    }
  });
  if(selectedMarket()!=="ALL") result=result.filter(x=>x.code===selectedMarket());
  return result.sort((a,b)=>b.v-a.v);
}
function namesFrom(c){return D.series.find(r=>r.marketCode===c)?.market||c;}

function makeBar(id,key,data,isPct=false){
  destroy(key);
  charts[key]=new Chart(document.querySelector(id),{
    type:"bar",
    data:{labels:data.map(x=>x.name),datasets:[{data:data.map(x=>isPct?x.v*100:x.v),backgroundColor:isPct?barColors(data.map(x=>x.v)):ORANGE,borderRadius:7,borderSkipped:false}]},
    options:{...standardOptions(),indexAxis:data.length>=6?"y":"x",
      plugins:{legend:{display:false},tooltip:{backgroundColor:"#27231f",callbacks:{label:(ctx)=>isPct?`${ctx.raw>=0?"+":""}${fmt(ctx.raw)}%`:fmt(ctx.raw)}}},
      scales:data.length>=6?{
        x:{grid:{color:"#f0ece8"},border:{display:false},beginAtZero:true,ticks:{callback:v=>isPct?`${v}%`:v}},
        y:{grid:{display:false},border:{display:false}}
      }:{
        x:{grid:{display:false},border:{display:false}},
        y:{grid:{color:"#f0ece8"},border:{display:false},beginAtZero:true,ticks:{callback:v=>isPct?`${v}%`:v}}
      }
    }
  });
}
function updateMarketCharts(){
  makeBar("#rankingChart","ranking",metricByMarket("avg"),false);
  makeBar("#yoyChart","yoy",metricByMarket("yoy"),true);
  makeBar("#momentumChart","momentum",metricByMarket("momentum"),true);
  makeBar("#volatilityChart","volatility",metricByMarket("vol"),true);
}

function updatePeaks(){
  let data=marketRows(selectedMarket());
  const yr=selectedYear(); if(yr)data=data.filter(r=>r.year===yr);
  if(selectedMarket()==="ALL"){
    const b={}; data.forEach(r=>{const k=r.date;(b[k]??=[]).push(r.value)});
    data=Object.entries(b).map(([date,v])=>{const d=new Date(date+"T00:00:00");return {date,year:d.getFullYear(),month:d.getMonth()+1,value:mean(v),market:"Média dos mercados"}});
  }
  data=[...data].sort((a,b)=>b.value-a.value).slice(0,5);
  document.querySelector("#peaksTable").innerHTML=data.map((r,i)=>`
    <div class="peak-row"><div class="peak-rank">${i+1}</div><div><strong>${months[r.month-1]} ${r.year}</strong><small>${r.market||namesFrom(r.marketCode)}</small></div><strong>${fmt(r.value,0)}</strong></div>`).join("");
}

function updateGeo(){
  destroy("geo");
  let data=D.geo2026.filter(x=>Number.isFinite(x.value)).sort((a,b)=>b.value-a.value).slice(0,10);
  charts.geo=new Chart(document.querySelector("#geoChart"),{
    type:"bar",
    data:{labels:data.map(x=>x.country),datasets:[{data:data.map(x=>x.value),backgroundColor:ORANGE,borderRadius:7,borderSkipped:false}]},
    options:{...standardOptions(),indexAxis:"y",scales:{x:{grid:{color:"#f0ece8"},border:{display:false},beginAtZero:true},y:{grid:{display:false},border:{display:false}}}}
  });
}

function updateInsight(){
  const yr=selectedYear(), code=selectedMarket();
  let text="";
  if(yr){
    const yoy=metricByMarket("yoy");
    const mom=metricByMarket("momentum");
    if(code==="ALL" && yoy.length){
      const best=yoy[0], worst=yoy.at(-1);
      const hot=mom[0];
      text=`Em ${yr}, ${best.name} apresenta a maior variação anual entre os mercados exibidos (${pct(best.v)}), enquanto ${worst.name} registra a menor (${pct(worst.v)}). No recorte de momentum, ${hot?.name||"—"} aparece com o sinal mais favorável nos meses mais recentes. Use os picos e a sazonalidade para investigar se essa mudança é estrutural ou ligada a períodos específicos.`;
    } else {
      const all=marketRows(code), cur=all.filter(r=>r.year===yr), prev=all.filter(r=>r.year===yr-1);
      let y=NaN;if(cur.length&&prev.length){const [c,p]=monthsComparable(cur,prev);y=mean(c.map(r=>r.value))/mean(p.map(r=>r.value))-1;}
      const seasonal=seasonIndexFor(code); const bestMonth=seasonal.indexOf(Math.max(...seasonal));
      text=`No mercado ${namesFrom(code)}, o interesse médio de ${yr} está ${Number.isFinite(y)?pct(y):"sem comparação disponível"} frente ao ano anterior. Historicamente, ${months[bestMonth]} é o mês com maior índice sazonal relativo. O gráfico de tendência permite restringir uma janela específica para investigar picos ou quedas sem alterar os demais indicadores do dashboard.`;
    }
  } else text="Selecione um ano para gerar uma leitura comparativa automática contra o período anterior.";
  document.querySelector("#autoInsight").textContent=text;
}

function updateAll(){
  updateKPIs(); updateTrend(); updateComparison(); updateSeasonality(); updateMarketCharts(); updatePeaks(); updateGeo(); updateInsight();
}
marketFilter.addEventListener("change",updateAll);
yearFilter.addEventListener("change",()=>{startDate.value="";endDate.value="";updateAll();});
startDate.addEventListener("change",updateTrend);
endDate.addEventListener("change",updateTrend);
document.querySelector("#clearDates").addEventListener("click",()=>{startDate.value="";endDate.value="";updateTrend();});
document.querySelector("#resetFilters").addEventListener("click",()=>{marketFilter.value="BR";yearFilter.value="2026";startDate.value="";endDate.value="";updateAll();});


function normalizeHeader(h){
  return String(h??"").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g,"_");
}
function parseDateValue(v){
  if(v instanceof Date && !isNaN(v)) return v;
  if(typeof v==="number"){
    const p=XLSX.SSF.parse_date_code(v);
    if(p) return new Date(p.y,p.m-1,p.d);
  }
  const s=String(v??"").trim();
  if(!s) return null;
  let d=new Date(s.length===7?s+"-01":s);
  if(!isNaN(d)) return d;
  const br=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(br) return new Date(+br[3],+br[2]-1,+br[1]);
  return null;
}
function rowsFromWorksheet(ws){
  const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});
  if(matrix.length<2) throw new Error("A planilha está vazia.");
  const headers=matrix[0].map(normalizeHeader);
  const aliases={
    data:["data","date","time"],
    mercado_codigo:["mercado_codigo","marketcode","market_code","codigo_mercado"],
    mercado:["mercado","market","pais","country"],
    indice_trends:["indice_trends","value","valor","pao_de_acucar","pão_de_açúcar","pão_de_açucar","pao_de_açúcar"],
    ano:["ano","year"],
    mes_num:["mes_num","month","mesnumero","mes_numero"]
  };
  const findIdx=(keys)=>keys.map(k=>headers.indexOf(normalizeHeader(k))).find(i=>i>=0);
  const idx={}; Object.entries(aliases).forEach(([k,v])=>idx[k]=findIdx(v));
  if(idx.data===undefined || idx.mercado_codigo===undefined || idx.mercado===undefined || idx.indice_trends===undefined){
    throw new Error("Colunas obrigatórias não encontradas. Use data, mercado_codigo, mercado e indice_trends.");
  }
  const parsed=[];
  matrix.slice(1).forEach(row=>{
    if(row.every(v=>v===null||v==="")) return;
    const d=parseDateValue(row[idx.data]);
    const value=Number(row[idx.indice_trends]);
    if(!d || !Number.isFinite(value)) return;
    const code=String(row[idx.mercado_codigo]??"").trim().toUpperCase();
    const market=String(row[idx.mercado]??code).trim();
    parsed.push({
      date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
      year:d.getFullYear(),
      month:d.getMonth()+1,
      marketCode:code,
      market,
      value
    });
  });
  if(!parsed.length) throw new Error("Nenhuma linha válida foi encontrada.");
  return parsed.sort((a,b)=>a.date.localeCompare(b.date)||a.marketCode.localeCompare(b.marketCode));
}
function rebuildGeoFromSeries(series){
  const latestYear=Math.max(...series.map(r=>r.year));
  const latest=series.filter(r=>r.year===latestYear);
  const grouped={};
  latest.forEach(r=>(grouped[r.market]??=[]).push(r.value));
  return Object.entries(grouped).map(([country,vals])=>({country,value:mean(vals),display:fmt(mean(vals),1)}));
}
function refreshFiltersFromData(){
  const currentMarket=marketFilter.value;
  const currentYear=yearFilter.value;
  const markets=[...new Map(D.series.map(r=>[r.marketCode,r.market])).entries()].sort((a,b)=>a[1].localeCompare(b[1],"pt-BR"));
  marketFilter.innerHTML=`<option value="ALL">Todos os mercados</option>`+markets.map(([c,n])=>`<option value="${c}">${n}</option>`).join("");
  const years=[...new Set(D.series.map(r=>r.year))].sort((a,b)=>b-a);
  yearFilter.innerHTML=`<option value="ALL">Todos os anos</option>`+years.map(y=>`<option value="${y}">${y}</option>`).join("");
  marketFilter.value=markets.some(([c])=>c===currentMarket)?currentMarket:(markets.some(([c])=>c==="BR")?"BR":"ALL");
  yearFilter.value=years.includes(+currentYear)?currentYear:String(years[0]);
  const dates=D.series.map(r=>r.date).sort();
  startDate.min=dates[0].slice(0,7);startDate.max=dates.at(-1).slice(0,7);
  endDate.min=dates[0].slice(0,7);endDate.max=dates.at(-1).slice(0,7);
  startDate.value="";endDate.value="";
}
async function handleUpload(file){
  const status=document.querySelector("#uploadStatus");
  try{
    status.textContent="Lendo planilha…";status.className="upload-status";
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:"array",cellDates:true});
    const preferred=wb.SheetNames.find(n=>normalizeHeader(n)==="serie_mensal");
    const ws=wb.Sheets[preferred||wb.SheetNames[0]];
    const series=rowsFromWorksheet(ws);
    D={
      ...D,
      series,
      geo2026:rebuildGeoFromSeries(series),
      updated:new Date().toISOString().slice(0,10),
      sourceFile:file.name
    };
    refreshFiltersFromData();
    updateAll();
    status.textContent=`${file.name} · ${series.length} linhas`;
    status.className="upload-status success";
  }catch(err){
    console.error(err);
    status.textContent=err.message||"Não foi possível ler o arquivo.";
    status.className="upload-status error";
  }
}
document.querySelector("#fileUpload").addEventListener("change",e=>{
  const file=e.target.files?.[0];
  if(file) handleUpload(file);
  e.target.value="";
});
document.querySelector("#showFormatHelp").addEventListener("click",()=>{
  document.querySelector("#formatHelp").classList.toggle("hidden");
});

setupFilters();
updateAll();

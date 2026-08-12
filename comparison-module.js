(function(){
  const C = window.ATTRACTION_TRENDS_DATA;
  if(!C || !Array.isArray(C.series) || !C.series.length) return;

  const DARK = "#28333E", ORANGE = "#F47A2A", GRID="#ECEEF0";
  const monthNames=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const marketOrder=["WORLD","BR","AR","CL","CO","UY","US","FR"];
  let trendChart=null, ratioChart=null;
  const $=s=>document.querySelector(s);
  const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:NaN;
  const fmt=(v,d=1)=>Number.isFinite(v)?v.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}):"—";

  function getFilters(){
    return {market:$("#marketFilter")?.value||"WORLD",year:$("#yearFilter")?.value||"ALL"};
  }
  function filtered(code,year){
    return C.series.filter(r=>r.marketCode===code && (year==="ALL" || r.year===+year)).sort((a,b)=>a.date.localeCompare(b.date));
  }
  function labelPeriod(year){ return year==="ALL"?"jan/2024–ago/2026":String(year); }
  function render(){
    const {market,year}=getFilters();
    const rows=filtered(market,year);
    if(!rows.length) return;
    const marketName=rows[0].market;
    const cAvg=avg(rows.map(r=>r.cristo)), bAvg=avg(rows.map(r=>r.bondinho));
    const ratio=bAvg===0?NaN:cAvg/bAvg;
    const share=(cAvg+bAvg)===0?NaN:cAvg/(cAvg+bAvg);
    const gap=cAvg-bAvg;
    const period=labelPeriod(year);

    $("#attractionRatio").textContent=Number.isFinite(ratio)?`${fmt(ratio,1)}×`:"—";
    $("#attractionRatioSub").textContent=`Cristo sobre Pão de Açúcar · ${marketName}`;
    $("#attractionShare").textContent=Number.isFinite(share)?`${fmt(share*100,1)}%`:"—";
    $("#attractionShareSub").textContent=`do interesse combinado · ${period}`;
    $("#attractionGap").textContent=`${gap>=0?"+":""}${fmt(gap,1)}`;
    $("#attractionGapSub").textContent=`pontos médios · ${marketName}`;
    $("#attractionTrendTitle").textContent=`Cristo × Bondinho · ${marketName}`;
    $("#attractionTrendSubtitle").textContent=`Evolução mensal · ${period}${year==="2026"?" · agosto parcial":""}`;
    $("#attractionPartialNote").textContent=year==="2026"||year==="ALL"?" Agosto/2026 é um mês ainda em andamento na data da coleta (12/08/2026).":"";

    if(trendChart) trendChart.destroy();
    trendChart=new Chart($("#attractionTrendChart"),{
      type:"line",
      data:{labels:rows.map(r=>year==="ALL"?`${monthNames[r.month-1]}/${String(r.year).slice(2)}`:monthNames[r.month-1]),datasets:[
        {label:"Cristo Redentor",data:rows.map(r=>r.cristo),borderColor:DARK,backgroundColor:DARK,pointRadius:2.5,pointHoverRadius:5,borderWidth:2.7,tension:.22},
        {label:"Pão de Açúcar / Bondinho",data:rows.map(r=>r.bondinho),borderColor:ORANGE,backgroundColor:ORANGE,pointRadius:2.5,pointHoverRadius:5,borderWidth:2.7,tension:.22}
      ]},
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{position:"top",align:"start",labels:{usePointStyle:true,pointStyle:"circle",boxWidth:7,boxHeight:7,padding:16}},tooltip:{backgroundColor:"#1D232A",callbacks:{label:c=>`${c.dataset.label}: ${fmt(c.raw,0)}`}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxTicksLimit:year==="ALL"?12:12,maxRotation:0,minRotation:0}},y:{beginAtZero:true,suggestedMax:100,grid:{color:GRID},border:{display:false},ticks:{font:{size:9}}}}}
    });

    const ranking=marketOrder.map(code=>{
      const rr=filtered(code,year); if(!rr.length)return null;
      const ca=avg(rr.map(r=>r.cristo)),ba=avg(rr.map(r=>r.bondinho));
      return {code,name:rr[0].market,ratio:ba===0?NaN:ca/ba,share:(ca+ba)?ca/(ca+ba):NaN};
    }).filter(Boolean).filter(r=>Number.isFinite(r.ratio)).sort((a,b)=>b.ratio-a.ratio);

    if(ratioChart) ratioChart.destroy();
    ratioChart=new Chart($("#attractionRatioChart"),{
      type:"bar",
      data:{labels:ranking.map(r=>r.name),datasets:[{label:"Cristo ÷ Bondinho",data:ranking.map(r=>r.ratio),backgroundColor:ranking.map(r=>r.code===market?ORANGE:"#D7DCE1"),borderRadius:5,maxBarThickness:22}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"#1D232A",callbacks:{label:c=>`${fmt(c.raw,1)}× mais interesse relativo no Cristo`}}},scales:{x:{beginAtZero:true,grid:{color:GRID},border:{display:false},ticks:{callback:v=>`${v}×`,font:{size:9}}},y:{grid:{display:false},border:{display:false},ticks:{font:{size:9.5}}}}}
    });

    const leaderMonths=rows.filter(r=>r.cristo>r.bondinho).length;
    const maxGap=rows.reduce((best,r)=>!best||(r.cristo-r.bondinho)>(best.cristo-best.bondinho)?r:best,null);
    const top=ranking[0], close=[...ranking].sort((a,b)=>a.ratio-b.ratio)[0];
    $("#attractionCompareInsight").innerHTML=`No recorte de <strong>${marketName}</strong>, o Cristo Redentor registra em média <strong>${fmt(ratio,1)}×</strong> o interesse do Pão de Açúcar e lidera em <strong>${leaderMonths} de ${rows.length} meses</strong>. A maior distância mensal do período aparece em <strong>${monthNames[maxGap.month-1]}/${maxGap.year}</strong> (${fmt(maxGap.cristo,0)} contra ${fmt(maxGap.bondinho,0)}). Entre os mercados monitorados, a vantagem relativa do Cristo é mais forte em <strong>${top.name}</strong> (${fmt(top.ratio,1)}×) e mais equilibrada em <strong>${close.name}</strong> (${fmt(close.ratio,1)}×).`;
  }

  ["#marketFilter","#yearFilter"].forEach(id=>$(id)?.addEventListener("change",render));
  $("#resetFilters")?.addEventListener("click",()=>setTimeout(render,0));
  render();
})();

import React, { useState, useMemo, useEffect } from "react";

// ============================================================
// ENGINE
// ============================================================
var mkRng=function(seed){var s=seed|0;return function(){s=(s+0x6d2b79f5)|0;var t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};};
var rr=function(rng,a,b){return a+rng()*(b-a);};
var rg=function(rng,m,s){var u1=rng(),u2=rng();return m+Math.sqrt(-2*Math.log(Math.max(u1,.0001)))*Math.cos(2*Math.PI*u2)*s;};

var TRAITS=["flavorIntensity","growthSpeed","yield","hardiness","appearance","shelfLife"];
var TL={flavorIntensity:"Flavor",growthSpeed:"Growth",yield:"Yield",hardiness:"Hardy",appearance:"Looks",shelfLife:"Shelf Life"};
var TC={flavorIntensity:"#e85d75",growthSpeed:"#4ecdc4",yield:"#f7b731",hardiness:"#8854d0",appearance:"#fd9644",shelfLife:"#45aaf2"};
var VAGUE={flavorIntensity:["bland","mild","moderate","strong","intense"],growthSpeed:["v.slow","slow","average","fast","v.fast"],yield:["sparse","low","moderate","good","abundant"],hardiness:["fragile","delicate","average","tough","v.hardy"],appearance:["poor","plain","decent","attractive","stunning"],shelfLife:["wilts","short","average","keeps","durable"]};

var _id=0;var mkId=function(p){_id++;return p+_id;};

var mkPlant=function(gen,gn){
  if(gn===undefined) gn=0;
  return{id:mkId("p"),traits:Object.fromEntries(TRAITS.map(function(t){return[t,{genetic:gen[t],expression:1}];})),health:100,growthStage:0,age:0,markedForBreeding:false,seedsCollected:false,generation:gn};
};

var mkStoreSeed=function(rng){return{id:mkId("s"),genetics:Object.fromEntries(TRAITS.map(function(t){return[t,Math.round(rr(rng,20,55))];})),generation:0,parentId:null,source:"store",name:""};};
var collectSeeds=function(plant,rng){
  if(plant.growthStage<.8) return [];
  var n=2+Math.floor(rng()*3);
  return Array.from({length:n},function(){return{id:mkId("s"),genetics:Object.fromEntries(TRAITS.map(function(t){return[t,Math.round(Math.max(0,Math.min(100,rg(rng,plant.traits[t].genetic,5))))];})),generation:plant.generation+1,parentId:plant.id,source:"collected",name:""};});
};
var breedSeeds=function(p1,p2,rng){
  if(p1.growthStage<.8||p2.growthStage<.8) return [];
  var n=4+Math.floor(rng()*3);var mg=Math.max(p1.generation,p2.generation);
  return Array.from({length:n},function(){var g={};for(var i=0;i<TRAITS.length;i++){var t=TRAITS[i];var w=.3+rng()*.4;g[t]=Math.round(Math.max(0,Math.min(100,rg(rng,p1.traits[t].genetic*w+p2.traits[t].genetic*(1-w),8))));}return{id:mkId("s"),genetics:g,generation:mg+1,parentId:null,source:"bred",name:""};});
};

// Seed selling & naming
var SEED_SELL_PRICE=5;

// Reputation system: affects sell chance at market
var calcSellChance=function(rep){return Math.min(1,0.3+rep*0.007);};
var REP_GAIN_PER_SALE=2;
var REP_LOSS_SKIP_MARKET=5;
var REP_GAIN_QUALITY_BONUS=0.05;

// Herb drying: converts fresh → dried (no decay, lower value)
var DRY_PRICE_MULT=0.4;
var DRY_DAYS=2;
var plantSeed=function(seed){return mkPlant(seed.genetics,seed.generation);};
var sortSeeds=function(seeds,key,dir){
  var gv=function(s){return key==="generation"?s.generation:key==="overall"?TRAITS.reduce(function(a,t){return a+s.genetics[t];},0)/TRAITS.length:s.genetics[key];};
  return seeds.slice().sort(function(a,b){return dir==="asc"?gv(a)-gv(b):gv(b)-gv(a);});
};

// ============================================================
// GRAPH-BASED SIMULATION ENGINE
// ============================================================
var stress=function(v){return Math.abs(v-50)/50;};

// Edge evaluators — each takes (stressValue, geneticValue) and returns a modifier
var EVALUATORS={
  // Linear penalty, reduced by own genetics: penalty × (1 - genetic/modGene)
  stress_penalty:function(s,g,p){return -(s*p.base*(1-g/(p.modGene||999)));},
  // Threshold bonus: bonus when stress in sweet spot, penalty when extreme
  threshold_bonus:function(s,g,p){
    if(s>p.lo&&s<p.hi) return p.bonus*(1-(g/(p.modGene||999))); 
    if(s>=p.hi) return -(s*p.penalty);
    return 0;
  },
  // Simple linear penalty (no genetic modulation)
  linear_penalty:function(s,g,p){return -(s*p.base);},
  // Simple bonus when stress is low
  low_stress_bonus:function(s,g,p){return s<p.threshold?p.bonus:-(s*p.penalty);},
  // Hardiness-style: penalty reduced by own genetic
  genetic_shield:function(s,g,p){return -(s*p.base*(1-g/100));},
  // Average stress with genetic resistance
  avg_stress:function(s,g,p){return s<p.threshold?(s*p.bonus):(-(s*p.penalty*(1-g/(p.modGene||999))));},
  // HP damage: threshold-gated, fixed multiplier
  hp_threshold:function(s,g,p){return Math.max(0,s-p.threshold)*p.mult;},
};

// The graph: array of edges
// Each edge: {source, target, evaluator, params, desc}
// source: environment key (nutrients, temperature, water, light)
// target: trait key (flavorIntensity, yield, etc.) or "health"
// For multi-source edges (like shelfLife avg), we handle with a special source
var SIM_GRAPH=[
  // === FLAVOR INTENSITY ===
  {source:"nutrients",target:"flavorIntensity",eval:"threshold_bonus",
    params:{lo:0.1,hi:0.5,bonus:0.1,modGene:200,penalty:0.2},
    desc:"Mild nutrient stress concentrates flavor; extreme destroys it"},
  {source:"water",target:"flavorIntensity",eval:"threshold_bonus",
    params:{lo:0.1,hi:0.4,bonus:0.08,modGene:999,penalty:0.15},
    desc:"Mild water deficit intensifies flavor; excess dilutes"},
  {source:"temperature",target:"flavorIntensity",eval:"threshold_bonus",
    params:{lo:0.1,hi:0.5,bonus:0.05,modGene:999,penalty:0.15},
    desc:"Moderate warmth helps; extreme hurts"},

  // === GROWTH SPEED ===
  {source:"nutrients",target:"growthSpeed",eval:"linear_penalty",
    params:{base:0.15},desc:"Nutrient stress slows growth"},
  {source:"water",target:"growthSpeed",eval:"linear_penalty",
    params:{base:0.15},desc:"Water stress slows growth"},
  {source:"light",target:"growthSpeed",eval:"linear_penalty",
    params:{base:0.15},desc:"Light stress slows growth"},

  // === YIELD ===
  {source:"nutrients",target:"yield",eval:"stress_penalty",
    params:{base:0.4,modGene:200},desc:"Nutrient stress reduces yield; high yield genetics resist"},
  {source:"water",target:"yield",eval:"stress_penalty",
    params:{base:0.3,modGene:250},desc:"Water stress reduces yield; high yield genetics resist"},
  {source:"light",target:"yield",eval:"low_stress_bonus",
    params:{threshold:0.15,bonus:0.05,penalty:0},desc:"Good light boosts yield slightly"},

  // === HARDINESS ===
  {source:"temperature",target:"hardiness",eval:"genetic_shield",
    params:{base:0.3},desc:"Temp stress hurts hardiness expression; high hardiness resists"},

  // === APPEARANCE ===
  {source:"water",target:"appearance",eval:"stress_penalty",
    params:{base:0.2,modGene:-200},desc:"Water stress hurts appearance; high appearance MORE fragile"},
  {source:"nutrients",target:"appearance",eval:"stress_penalty",
    params:{base:0.15,modGene:-200},desc:"Nutrient stress hurts appearance; high appearance MORE fragile"},
  {source:"light",target:"appearance",eval:"low_stress_bonus",
    params:{threshold:0.2,bonus:0.06,penalty:0.1},desc:"Good light enhances; poor light dulls"},

  // === SHELF LIFE (uses avg of 3 stresses) ===
  {source:"_avg_nwt",target:"shelfLife",eval:"avg_stress",
    params:{threshold:0.3,bonus:0.1,penalty:0.15,modGene:150},
    desc:"Low overall stress improves shelf life; high stress degrades; high shelfLife resists"},

  // === HEALTH DAMAGE ===
  {source:"temperature",target:"health",eval:"hp_threshold",
    params:{threshold:0.5,mult:20},desc:"Temp > 75 or < 25 damages HP"},
  {source:"water",target:"health",eval:"hp_threshold",
    params:{threshold:0.6,mult:15},desc:"Water > 80 or < 20 damages HP"},
  {source:"nutrients",target:"health",eval:"hp_threshold",
    params:{threshold:0.7,mult:10},desc:"Nutrients > 85 or < 15 damages HP"},
];

// Evaluate all edges, return {expressions: {trait: modifier}, hpDamage, edgeResults[]}
var evaluateGraph=function(env,plant){
  var stresses={
    light:stress(env.light),temperature:stress(env.temperature),
    nutrients:stress(env.nutrients),water:stress(env.water)
  };
  stresses._avg_nwt=(stresses.nutrients+stresses.water+stresses.temperature)/3;

  var mods={};var hpDmg=0;var results=[];
  for(var i=0;i<TRAITS.length;i++) mods[TRAITS[i]]=0;

  for(var e=0;e<SIM_GRAPH.length;e++){
    var edge=SIM_GRAPH[e];
    var s=stresses[edge.source]||0;
    var g=plant.traits[edge.target]?plant.traits[edge.target].genetic:0;
    var fn=EVALUATORS[edge.eval];
    var delta=fn(s,g,edge.params);
    var result={edge:edge,stress:s,genetic:g,delta:delta};
    results.push(result);

    if(edge.target==="health"){
      hpDmg+=delta;
    } else {
      mods[edge.target]+=delta;
    }
  }

  // Hardiness shields HP damage
  var hardGen=plant.traits.hardiness?plant.traits.hardiness.genetic:0;
  var hardExp=1+mods.hardiness; // current expression with mods applied
  var shield=Math.max(0,Math.min(0.5,hardGen*Math.max(0,hardExp)/200));
  hpDmg=hpDmg*(1-shield);

  return{mods:mods,hpDamage:hpDmg,stresses:stresses,edgeResults:results,hardinessShield:shield};
};

// Main simulation tick using the graph
var growOnce=function(plants,env){return plants.map(function(p){
  if(p.health<=0) return p;
  var ge=evaluateGraph(env,p);
  var nt={};
  for(var i=0;i<TRAITS.length;i++){
    var t=TRAITS[i];
    var newExp=Math.max(0,Math.min(1.3,1+ge.mods[t]));
    nt[t]=Object.assign({},p.traits[t],{expression:newExp});
  }
  var hd=ge.hpDamage;
  var gt=nt.growthSpeed;
  var inc=(0.01+(gt.genetic/100)*gt.expression*0.09)*Math.max(0,p.health-hd)/100;
  return Object.assign({},p,{traits:nt,health:Math.max(0,Math.round(p.health-hd)),growthStage:Math.min(1,p.growthStage+inc),age:p.age+1});
});};

var TOOLS=[
  {id:"refractometer",name:"Refractometer",cost:50,reveals:["flavorIntensity"],prec:.7,desc:"Measures dissolved sugars (Brix) to estimate flavor intensity. Approx readings — influenced by plant hydration."},
  {id:"digitalScale",name:"Digital Scale",cost:30,reveals:["yield"],prec:.8,desc:"Weighs biomass per plant. Good precision — essential for estimating harvest volume before market day."},
  {id:"phMeter",name:"pH/EC Meter",cost:40,reveals:["hardiness","growthSpeed"],prec:.5,desc:"Tests nutrient uptake efficiency. Low precision — gives you a rough sense of vigor and resilience."},
  {id:"chlorophyllMeter",name:"SPAD Meter",cost:120,reveals:["growthSpeed","yield"],prec:.75,desc:"Reads leaf chlorophyll density. Good precision on growth speed and yield — helps optimize light/nutrient balance."},
  {id:"microscope",name:"Microscope",cost:150,reveals:["flavorIntensity","appearance"],prec:.8,desc:"Reveals trichome density and leaf structure. Good precision for breeding decisions around flavor and looks."},
  {id:"colorimeter",name:"Colorimeter",cost:200,reveals:["appearance"],prec:.9,desc:"Measures exact color values (L*a*b*). High precision — the standard for appearance-focused breeding programs."},
  {id:"nirSpectrometer",name:"NIR Spectrometer",cost:500,reveals:["flavorIntensity","yield","hardiness","shelfLife"],prec:.92,desc:"Near-infrared chemical analysis. Top precision across 4 traits — the single best investment for serious breeders."},
];
var getReveal=function(trait,owned){var sensory=["appearance","flavorIntensity","yield"];var best=0;for(var i=0;i<owned.length;i++){var t=TOOLS.find(function(x){return x.id===owned[i];});if(t&&t.reveals.indexOf(trait)>=0)best=Math.max(best,t.prec);}if(best>=.85)return{level:"precise",prec:best};if(best>=.6)return{level:"approx",prec:best};if(best>0||sensory.indexOf(trait)>=0)return{level:"vague",prec:Math.max(best,.2)};return{level:"hidden",prec:0};};
var observe=function(genetic,expression,prec,rng){return Math.round(Math.max(0,Math.min(100,rg(rng,genetic*expression,(1-prec)*25))));};

// Harvest item value (used for market pricing)
var harvestTraitScore=function(h){
  var f=h.traits.flavorIntensity.genetic*h.traits.flavorIntensity.expression;
  var y=h.traits.yield.genetic*h.traits.yield.expression;
  var a=h.traits.appearance.genetic*h.traits.appearance.expression;
  var s=h.traits.shelfLife.genetic*h.traits.shelfLife.expression;
  return{flavor:f,yield:y,appearance:a,shelfLife:s,overall:(f*.3+y*.25+a*.3+s*.15)/100};
};

// Harvest a plant into a shelf item
var harvestPlant=function(plant,currentDay){
  var maxFresh=3+(plant.traits.shelfLife.genetic*plant.traits.shelfLife.expression/100)*7;
  return{id:mkId("h"),plantId:plant.id,traits:Object.assign({},plant.traits),generation:plant.generation,health:plant.health,harvestDay:currentDay,freshness:1.0,maxFreshDays:Math.round(maxFresh),daysOnShelf:0};
};

// Age harvest items (call each day tick)
var ageHarvest=function(items){return items.map(function(h){
  var nd=h.daysOnShelf+1;
  var fresh=Math.max(0,1-(nd/h.maxFreshDays));
  return Object.assign({},h,{daysOnShelf:nd,freshness:fresh});
}).filter(function(h){return h.freshness>0;});};

// Contracts
var CLIENTS=[
  {name:"The Oak Table Bistro",focus:["flavorIntensity","appearance"],descs:["We need herbs with bold flavor for our tasting menu.","Our new chef wants vibrant, photogenic herbs."]},
  {name:"Green Bowl Co.",focus:["yield","shelfLife"],descs:["We need reliable bulk supply.","Our salad bar needs produce that stays fresh."]},
  {name:"Chef Martinez",focus:["flavorIntensity","hardiness"],descs:["Only the most intensely flavored herbs.","Bring me something extraordinary."]},
  {name:"Riverside Market",focus:["yield","growthSpeed"],descs:["Affordable, fresh greens. Volume matters.","We need fast-growing, high-yield crops."]},
  {name:"Sakura Omakase",focus:["appearance","flavorIntensity"],descs:["Every leaf must be perfect.","We need micro-herbs that look as exquisite as they taste."]},
];
var mkContract=function(rng,diff){
  if(diff===undefined)diff=0;
  var cl=CLIENTS[Math.floor(rng()*CLIENTS.length)];var th=35+diff*8+Math.round(rr(rng,-5,10));var req=[{trait:cl.focus[0],minValue:Math.min(95,th)}];if(diff>=2)req.push({trait:cl.focus[1],minValue:Math.min(90,th-5)});
  return{id:mkId("c"),clientName:cl.name,description:cl.descs[Math.floor(rng()*cl.descs.length)],quantity:Math.max(2,Math.round(2+diff*1.2+rr(rng,-1,1))),deadline:Math.max(15,Math.round(40-diff*4+rr(rng,-5,5))),reward:Math.round(80+diff*60+rr(rng,-20,30)),traitRequirements:req,status:"active"};
};
var checkContractWithShelf=function(contract,shelf){
  var qual=shelf.filter(function(h){
    if(h.freshness<.2) return false;
    return contract.traitRequirements.every(function(r){return h.traits[r.trait].genetic*h.traits[r.trait].expression>=r.minValue;});
  });
  return{success:qual.length>=contract.quantity,qualifying:qual,shortfall:Math.max(0,contract.quantity-qual.length)};
};

// Farmers Market demand system
var MARKET_CATEGORIES=[
  {name:"Fresh Greens",demandTraits:["yield","appearance"],icon:"🥬"},
  {name:"Gourmet Herbs",demandTraits:["flavorIntensity","appearance"],icon:"🌿"},
  {name:"Bulk Produce",demandTraits:["yield","shelfLife"],icon:"📦"},
  {name:"Artisan Herbs",demandTraits:["flavorIntensity","shelfLife"],icon:"✨"},
];
var generateMarketDemand=function(rng){
  var cat=MARKET_CATEGORIES[Math.floor(rng()*MARKET_CATEGORIES.length)];
  var priceMultiplier=0.7+rng()*0.8;
  var competition=0.3+rng()*0.7;
  return{category:cat,priceMultiplier:priceMultiplier,competition:competition,crowded:competition>.6};
};
var marketPrice=function(item,demand){
  var sc=harvestTraitScore(item);
  var relevance=0;
  for(var i=0;i<demand.category.demandTraits.length;i++){
    var t=demand.category.demandTraits[i];
    relevance+=item.traits[t].genetic*item.traits[t].expression;
  }
  relevance=relevance/(demand.category.demandTraits.length*100);
  var base=2+sc.overall*13;
  var freshBonus=item.freshness;
  var competitionPenalty=1-demand.competition*.4;
  return Math.round(base*demand.priceMultiplier*freshBonus*competitionPenalty*(0.5+relevance)*100)/100;
};

// ============================================================
// UI COMPONENTS
// ============================================================
var SLOTS=12;
var SEED_COST=15;
var DAILY_UPKEEP=4;
var MARKET_DAY_INTERVAL=7;

function PlantVis(props){
  var plant=props.plant,size=props.size||48,onClick=props.onClick,selected=props.selected,marker=props.marker;
  var g=plant.traits;
  var hue=90+(g.flavorIntensity.genetic-50)*.8;
  var sat=30+g.appearance.genetic*.5;
  var light=25+(g.yield.genetic*.25)*g.yield.expression;
  var leafN=3+Math.floor(g.yield.genetic/20);
  var leafSz=6+(g.yield.genetic/100)*8;
  var stemH=8+(plant.growthStage*20)*(g.growthSpeed.genetic/80);
  var op=.3+(plant.health/100)*.7;
  var mat=plant.growthStage;
  var borderCol=marker==="breed"?"#e85d75":marker==="seeds"?"#8854d0":"#4ecdc4";
  var leaves=[];
  if(mat>.2){
    var count=Math.ceil(leafN*mat);
    for(var i=0;i<count;i++){
      var a=(i*137.5)*Math.PI/180,d=leafSz*mat*(.5+(i%3)*.2);
      var cx=20+Math.cos(a)*d*.6,cy=37-stemH*mat*(.3+(i/leafN)*.6)+Math.sin(a)*d*.3;
      var ls=leafSz*mat*(.4+g.appearance.genetic/200);
      leaves.push(React.createElement("ellipse",{key:i,cx:cx,cy:cy,rx:ls*.7,ry:ls*.45,fill:"hsla("+hue+","+sat+"%,"+light+"%,.85)",transform:"rotate("+(a*180/Math.PI+90)+","+cx+","+cy+")"}));
    }
  }
  return React.createElement("div",{onClick:onClick,style:{width:size,height:size,position:"relative",cursor:onClick?"pointer":"default",opacity:op,border:selected?"2px solid "+borderCol:"2px solid transparent",borderRadius:6,display:"flex",alignItems:"flex-end",justifyContent:"center",background:selected?borderCol+"12":"transparent",transition:"all .2s"}},
    React.createElement("svg",{width:size-4,height:size-4,viewBox:"0 0 40 40"},
      React.createElement("ellipse",{cx:20,cy:37,rx:12,ry:3,fill:"#8B6F47",opacity:.5}),
      React.createElement("line",{x1:20,y1:37,x2:20,y2:37-stemH*mat,stroke:"hsl("+(hue+10)+",30%,35%)",strokeWidth:1.5}),
      leaves
    ),
    React.createElement("div",{style:{position:"absolute",bottom:1,left:4,right:4,height:2,background:"#1e2430",borderRadius:1}},
      React.createElement("div",{style:{height:"100%",borderRadius:1,transition:"width .3s",width:mat*100+"%",background:mat>=.8?"#4ecdc4":"#3a4a5a"}})
    ),
    plant.markedForBreeding&&React.createElement("div",{style:{position:"absolute",top:0,right:0,width:14,height:14,background:"#e85d75",borderRadius:"50%",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}},"♥"),
    plant.seedsCollected&&React.createElement("div",{style:{position:"absolute",top:0,left:0,width:14,height:14,background:"#8854d0",borderRadius:"50%",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}},"⊙")
  );
}

function TraitBar(props){
  var name=props.name,value=props.value,level=props.level,color=props.color;
  var displayVal=level==="hidden"?"???":level==="precise"?value:level==="approx"?"~"+Math.round(value/5)*5:VAGUE[name]?VAGUE[name][Math.min(4,Math.floor(value/20))]:"?";
  var barWidth=level==="hidden"?"0%":value+"%";
  var barColor=level==="hidden"?"#333":level==="vague"?color+"55":level==="approx"?color+"99":color;
  var textColor=level==="precise"?"#e2e8f0":level==="approx"?"#94a3b8":"#64748b";
  return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:3,fontSize:11}},
    React.createElement("span",{style:{width:52,color:"#9ca3af",fontFamily:"'IBM Plex Mono',monospace",fontSize:10}},TL[name]),
    React.createElement("div",{style:{flex:1,height:8,background:"#1e2430",borderRadius:4,overflow:"hidden"}},
      React.createElement("div",{style:{height:"100%",borderRadius:4,transition:"width .4s",width:barWidth,background:barColor}})
    ),
    React.createElement("span",{style:{width:60,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:textColor}},displayVal)
  );
}

function EnvSlider(props){
  var label=props.label,value=props.value,onChange=props.onChange,icon=props.icon;
  var sc=value<20||value>80?"#e85d75":"#4ecdc4";
  var st=value<30?"LOW":value>70?"HIGH":"OK";
  return React.createElement("div",{style:{marginBottom:8}},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:1}},
      React.createElement("span",{style:{fontSize:10,color:"#94a3b8",fontFamily:"'IBM Plex Mono',monospace"}},icon+" "+label),
      React.createElement("span",{style:{fontSize:10,color:sc,fontFamily:"'IBM Plex Mono',monospace"}},st)
    ),
    React.createElement("input",{type:"range",min:0,max:100,value:value,onChange:function(e){onChange(+e.target.value);},style:{width:"100%",accentColor:sc}})
  );
}

function Btn(props){
  var children=props.children,onClick=props.onClick,disabled=props.disabled;
  var color=props.color||"#4ecdc4",bg=props.bg||"#1a3a2a",border=props.border||"#2a5a3a";
  var s=props.style||{};
  return React.createElement("button",{onClick:onClick,disabled:disabled,style:Object.assign({padding:"8px 12px",background:disabled?"#1a1a1a":bg,border:"1px solid "+(disabled?"#2a2a2a":border),borderRadius:8,color:disabled?"#555":color,cursor:disabled?"default":"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all .2s"},s)},children);
}

function SeedChip(props){
  var seed=props.seed,ownedTools=props.ownedTools,onPlant=props.onPlant,canPlant=props.canPlant,onSell=props.onSell,onRename=props.onRename,isRenaming=props.isRenaming,renameVal=props.renameVal,onRenameChange=props.onRenameChange,onRenameSubmit=props.onRenameSubmit;
  var bg=seed.source==="store"?"#1a1e2a":seed.source==="bred"?"#2a1a2e":"#1a2a22";
  var accent=seed.source==="store"?"#64748b":seed.source==="bred"?"#8854d0":"#4ecdc4";
  var sourceLabel=seed.source==="store"?"🏪 Store":seed.source==="bred"?"🧬 Bred":"🌱 Collected";
  var traitTags=[];
  for(var i=0;i<TRAITS.length;i++){
    var t=TRAITS[i],rev=getReveal(t,ownedTools);
    if(rev.level==="hidden") continue;
    var val=rev.level==="precise"?seed.genetics[t]:rev.level==="approx"?"~"+Math.round(seed.genetics[t]/10)*10:VAGUE[t]?VAGUE[t][Math.min(4,Math.floor(seed.genetics[t]/20))]:"?";
    traitTags.push(React.createElement("span",{key:t,style:{fontSize:9,padding:"1px 5px",borderRadius:3,background:TC[t]+"18",color:TC[t]+"cc",fontFamily:"'IBM Plex Mono',monospace"}},TL[t]+": "+val));
  }
  var nameDisplay=seed.name?React.createElement("span",{style:{fontSize:11,fontWeight:600,color:"#e2e8f0",cursor:"pointer"},onClick:onRename,title:"Click to rename"},"\""+seed.name+"\""):
    React.createElement("span",{style:{fontSize:10,color:"#475569",cursor:"pointer",fontStyle:"italic"},onClick:onRename,title:"Click to name this variety"},"name…");
  var renameInput=isRenaming?React.createElement("div",{style:{display:"flex",gap:4,marginTop:4}},
    React.createElement("input",{type:"text",value:renameVal,onChange:function(e){onRenameChange(e.target.value);},onKeyDown:function(e){if(e.key==="Enter")onRenameSubmit();if(e.key==="Escape")onRenameSubmit();},maxLength:24,autoFocus:true,placeholder:"Variety name...",style:{flex:1,background:"#1e2430",border:"1px solid #3a4a5a",borderRadius:4,color:"#e2e8f0",fontSize:10,padding:"3px 6px",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}),
    React.createElement("button",{onClick:onRenameSubmit,style:{background:"#2a5a3a",border:"1px solid #3a6a4a",borderRadius:4,color:"#4ecdc4",fontSize:10,padding:"3px 8px",cursor:"pointer"}},"✓")
  ):null;
  return React.createElement("div",{style:{background:bg,borderRadius:8,border:"1px solid "+accent+"33",padding:"10px 12px"}},
    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}},
      React.createElement("div",{style:{flex:1,minWidth:0}},
        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
          React.createElement("span",{style:{fontSize:12,fontWeight:600,color:accent}},sourceLabel),
          React.createElement("span",{style:{fontSize:10,color:"#64748b",fontFamily:"'IBM Plex Mono',monospace"}},"Gen "+seed.generation),
          nameDisplay
        ),
        React.createElement("div",{style:{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}},traitTags)
      ),
      React.createElement("div",{style:{display:"flex",gap:4,flexShrink:0}},
        React.createElement(Btn,{onClick:onPlant,disabled:!canPlant,style:{padding:"5px 10px",fontSize:10,whiteSpace:"nowrap"}},"Plant"),
        onSell&&React.createElement(Btn,{onClick:onSell,color:"#f7b731",bg:"#3a2a1a",border:"#5a3a2a",style:{padding:"5px 8px",fontSize:10}},"$"+SEED_SELL_PRICE)
      )
    ),
    renameInput
  );
}

// Freshness bar component
function FreshnessBar(props){
  var freshness=props.freshness,maxDays=props.maxDays,daysOn=props.daysOnShelf;
  var col=freshness>.6?"#4ecdc4":freshness>.3?"#f7b731":"#e85d75";
  return React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,fontSize:10}},
    React.createElement("span",{style:{color:"#64748b",fontFamily:"'IBM Plex Mono',monospace",width:50}},"Fresh"),
    React.createElement("div",{style:{flex:1,height:6,background:"#1e2430",borderRadius:3,overflow:"hidden"}},
      React.createElement("div",{style:{height:"100%",borderRadius:3,width:Math.round(freshness*100)+"%",background:col,transition:"width .3s"}})
    ),
    React.createElement("span",{style:{color:col,fontFamily:"'IBM Plex Mono',monospace",fontSize:9}},daysOn+"/"+maxDays+"d")
  );
}

// ============================================================
// MAIN
// ============================================================
export default function ContainerFarm(){
  var seedCounterState=useState(function(){return{v:42};});
  var seedCounter=seedCounterState[0];
  var newRng=function(){return mkRng(seedCounter.v++);};

  var plantsState=useState([]);var plants=plantsState[0],setPlants=plantsState[1];
  var seedBankState=useState(function(){var r=mkRng(42);return Array.from({length:6},function(){return mkStoreSeed(r);});});
  var seedBank=seedBankState[0],setSeedBank=seedBankState[1];
  var envState=useState({light:50,temperature:50,nutrients:50,water:50});var env=envState[0],setEnv=envState[1];
  var moneyState=useState(250);var money=moneyState[0],setMoney=moneyState[1];
  var ownedToolsState=useState([]);var ownedTools=ownedToolsState[0],setOwnedTools=ownedToolsState[1];
  var contractsState=useState(function(){return[mkContract(mkRng(100),0)];});var contracts=contractsState[0],setContracts=contractsState[1];
  var dayState=useState(0);var day=dayState[0],setDay=dayState[1];
  var genState=useState(0);var generation=genState[0],setGeneration=genState[1];
  var selState=useState(null);var selected=selState[0],setSelected=selState[1];
  var logState=useState(["Welcome to Container Farm! Plant seeds, grow crops, and sell at the farmers market."]);
  var log=logState[0],setLog=logState[1];
  var tabState=useState("container");var tab=tabState[0],setTab=tabState[1];
  var diffState=useState(0);var difficulty=diffState[0],setDifficulty=diffState[1];
  var seedSortState=useState("overall");var seedSort=seedSortState[0],setSeedSort=seedSortState[1];
  var debugState=useState(false);var showDebug=debugState[0],setShowDebug=debugState[1];
  var seedSortDirState=useState("desc");var seedSortDir=seedSortDirState[0],setSeedSortDir=seedSortDirState[1];

  // NEW: Harvest shelf - plants you've cut, waiting to be sold
  var shelfState=useState([]);var shelf=shelfState[0],setShelf=shelfState[1];
  // NEW: Market state
  var marketState=useState(null);var currentMarket=marketState[0],setCurrentMarket=marketState[1];
  // NEW: Market selections (which shelf items to bring)
  var marketSelState=useState(new Set());var marketSel=marketSelState[0],setMarketSel=marketSelState[1];
  // NEW: Reputation (affects market sell chance)
  var repState=useState(20);var reputation=repState[0],setReputation=repState[1];
  // NEW: Drying rack (items being dried, {item, daysLeft})
  var dryingState=useState([]);var drying=dryingState[0],setDrying=dryingState[1];
  // NEW: Seed being renamed
  var renameSeedState=useState(null);var renamingSeed=renameSeedState[0],setRenamingSeed=renameSeedState[1];
  var renameValState=useState("");var renameVal=renameValState[0],setRenameVal=renameValState[1];

  var addLog=function(msg){setLog(function(p){return[msg].concat(p).slice(0,50);});};
  var emptySlots=SLOTS-plants.length;
  var maturePlants=plants.filter(function(p){return p.growthStage>=.8;});
  var breeders=plants.filter(function(p){return p.markedForBreeding;});
  var harvestable=maturePlants.filter(function(p){return !p.markedForBreeding;});
  var sortedSeeds=useMemo(function(){return sortSeeds(seedBank,seedSort,seedSortDir);},[seedBank,seedSort,seedSortDir]);
  var daysToMarket=MARKET_DAY_INTERVAL-(day%MARKET_DAY_INTERVAL);
  var isMarketDay=day>0&&day%MARKET_DAY_INTERVAL===0;

  var obsData=useMemo(function(){
    if(!selected) return null;
    var p=plants.find(function(x){return x.id===selected;});
    if(!p) return null;
    var stageBucket=Math.floor(p.growthStage*10);
    var healthBucket=Math.floor(p.health/10);
    var r=mkRng(p.id.charCodeAt(1)*997+stageBucket*31+healthBucket*7);var obs={};
    for(var i=0;i<TRAITS.length;i++){
      var t=TRAITS[i],rev=getReveal(t,ownedTools);
      obs[t]=rev.level==="hidden"?{level:rev.level,value:0}:{level:rev.level,value:observe(p.traits[t].genetic,p.traits[t].expression,rev.prec,r)};
    }
    return{plant:p,obs:obs};
  },[selected,plants,ownedTools,day]);

  // --- ACTIONS ---
  var doPlantSeed=function(seedItem){
    if(plants.length>=SLOTS){addLog("Container full!");return;}
    setPlants(function(p){return p.concat([plantSeed(seedItem)]);});
    setSeedBank(function(b){return b.filter(function(s){return s.id!==seedItem.id;});});
    addLog("🌱 Planted "+seedItem.source+" seed (Gen "+seedItem.generation+")");
  };
  var doPlantBest=function(n){
    var avail=Math.min(n,emptySlots,sortedSeeds.length);if(avail===0){addLog("No seeds or container full.");return;}
    var toPlant=sortedSeeds.slice(0,avail);var ids=new Set(toPlant.map(function(s){return s.id;}));
    setPlants(function(p){return p.concat(toPlant.map(function(s){return plantSeed(s);}));});
    setSeedBank(function(b){return b.filter(function(s){return !ids.has(s.id);});});
    addLog("🌱 Planted "+avail+" best seeds");
  };
  var doBuySeeds=function(n){
    var cost=n*SEED_COST;if(money<cost){addLog("Need $"+cost);return;}
    setMoney(function(m){return m-cost;});
    setSeedBank(function(b){return b.concat(Array.from({length:n},function(){return mkStoreSeed(newRng());}));});
    addLog("🛒 Bought "+n+" seeds ($"+cost+")");
  };
  var doGrow=function(ticks){
    var upkeep=DAILY_UPKEEP*ticks;
    setPlants(function(p){var cur=p;for(var i=0;i<ticks;i++)cur=growOnce(cur,env);return cur;});
    setShelf(function(s){var cur=s;for(var i=0;i<ticks;i++)cur=ageHarvest(cur);return cur;});
    setMoney(function(m){return Math.round((m-upkeep)*100)/100;});
    setDay(function(d){return d+ticks;});
    setContracts(function(cs){return cs.map(function(c){
      if(c.status==="active"){var dl=c.deadline-ticks;if(dl<=0){addLog("❌ Contract from "+c.clientName+" expired!");return Object.assign({},c,{deadline:0,status:"failed"});}return Object.assign({},c,{deadline:dl});}return c;
    });});
    // Advance drying rack
    setDrying(function(dr){
      var finished=[];var remaining=[];
      dr.forEach(function(d){
        var left=d.daysLeft-ticks;
        if(left<=0){finished.push(d.item);}else{remaining.push({item:d.item,daysLeft:left});}
      });
      if(finished.length>0){
        setShelf(function(s){return s.concat(finished.map(function(item){
          return Object.assign({},item,{dried:true,freshness:1.0,maxFreshDays:999,daysOnShelf:0});
        }));});
        addLog("🌿 "+finished.length+" herb"+(finished.length>1?"s":"")+" finished drying!");
      }
      return remaining;
    });
    // Check if we hit a market day
    var newDay=day+ticks;
    if(Math.floor(day/MARKET_DAY_INTERVAL)!==Math.floor(newDay/MARKET_DAY_INTERVAL)&&newDay>0){
      var md=generateMarketDemand(newRng());
      setCurrentMarket(md);
      setMarketSel(new Set());
      addLog("🏪 MARKET DAY! "+md.category.icon+" Demand: "+md.category.name+(md.crowded?" (crowded today)":""));
      setTab("market");
    }
    addLog("⏱ "+ticks+"d · -$"+upkeep+" upkeep"+(shelf.length>0?" · "+shelf.length+" items on shelf":"")+(drying.length>0?" · "+drying.length+" drying":""));
  };
  var doCollectSeeds=function(plantId){
    var p=plants.find(function(x){return x.id===plantId;});
    if(!p||p.growthStage<.8||p.seedsCollected) return;
    var seeds=collectSeeds(p,newRng());
    if(seeds.length===0){addLog("⚠️ Cannot collect seeds");return;}
    setSeedBank(function(b){return b.concat(seeds);});
    setPlants(function(ps){return ps.map(function(x){return x.id===plantId?Object.assign({},x,{seedsCollected:true}):x;});});
    addLog("🫘 Collected "+seeds.length+" seeds (Gen "+seeds[0].generation+")");
  };

  // NEW: Harvest to shelf (not for direct cash!)
  var doHarvestToShelf=function(plantId){
    var p=plants.find(function(x){return x.id===plantId;});
    if(!p||p.growthStage<.8) return;
    var item=harvestPlant(p,day);
    setShelf(function(s){return s.concat([item]);});
    setPlants(function(ps){return ps.filter(function(x){return x.id!==plantId;});});
    if(selected===plantId) setSelected(null);
    addLog("✂️ Harvested to shelf (fresh for ~"+item.maxFreshDays+"d)");
  };
  var doHarvestAllToShelf=function(){
    if(harvestable.length===0) return;
    var items=harvestable.map(function(p){return harvestPlant(p,day);});
    var ids=new Set(harvestable.map(function(p){return p.id;}));
    setShelf(function(s){return s.concat(items);});
    setPlants(function(ps){return ps.filter(function(x){return !ids.has(x.id);});});
    setSelected(null);
    addLog("✂️ Harvested "+items.length+" plants to shelf");
  };

  // NEW: Compost (free slot, no money)
  var doCompost=function(plantId){
    setPlants(function(ps){return ps.filter(function(x){return x.id!==plantId;});});
    if(selected===plantId) setSelected(null);
    addLog("🗑 Composted plant");
  };
  var doCompostShelfItem=function(itemId){
    setShelf(function(s){return s.filter(function(x){return x.id!==itemId;});});
    addLog("🗑 Composted shelf item");
  };

  // NEW: Market selling
  var toggleMarketSelect=function(itemId){
    setMarketSel(function(prev){
      var next=new Set(prev);
      if(next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };
  var doSellAtMarket=function(){
    if(!currentMarket||marketSel.size===0) return;
    var sellChance=calcSellChance(reputation);
    var total=0;var sold=0;var unsold=0;var repGain=0;
    shelf.forEach(function(h){
      if(!marketSel.has(h.id)) return;
      var roll=Math.random();
      if(roll<sellChance){
        var price=marketPrice(h,currentMarket);
        if(h.dried) price=price*DRY_PRICE_MULT;
        total+=price;sold++;
        var sc=harvestTraitScore(h);
        repGain+=REP_GAIN_PER_SALE+sc.overall*REP_GAIN_QUALITY_BONUS;
      } else {
        unsold++;
      }
    });
    total=Math.round(total*100)/100;
    setMoney(function(m){return Math.round((m+total)*100)/100;});
    // ALL selected items leave the shelf — sold or not, you brought them to market
    setShelf(function(s){return s.filter(function(h){return !marketSel.has(h.id);});});
    setMarketSel(new Set());
    setReputation(function(r){return Math.min(100,Math.round((r+repGain)*10)/10);});
    var msg="💰 Sold "+sold+"/"+(sold+unsold)+" items for $"+total.toFixed(2);
    if(unsold>0) msg+=" · "+unsold+" unsold (lost — build rep to sell more)";
    addLog(msg);
  };
  var doCloseMarket=function(){
    setReputation(function(r){return Math.max(0,r-REP_LOSS_SKIP_MARKET);});
    setCurrentMarket(null);setMarketSel(new Set());
    addLog("🏪 Market closed. Rep -"+REP_LOSS_SKIP_MARKET+". Next in "+MARKET_DAY_INTERVAL+" days.");
  };

  var doBreed=function(){
    if(breeders.length<2){addLog("Select at least 2 breeders.");return;}
    var allSeeds=[];
    for(var i=0;i<breeders.length;i++)for(var j=i+1;j<breeders.length;j++){
      allSeeds=allSeeds.concat(breedSeeds(breeders[i],breeders[j],newRng()));
    }
    if(allSeeds.length===0){addLog("⚠️ Breeding failed");return;}
    setPlants(function(ps){return ps.map(function(p){return p.markedForBreeding?Object.assign({},p,{markedForBreeding:false,seedsCollected:true}):p;});});
    setSeedBank(function(b){return b.concat(allSeeds);});setGeneration(function(g){return g+1;});
    addLog("🧬 Bred "+allSeeds.length+" seeds (Gen "+(generation+1)+")");
  };
  var toggleBreed=function(id){setPlants(function(p){return p.map(function(x){return x.id===id?Object.assign({},x,{markedForBreeding:!x.markedForBreeding}):x;});});};

  // Contract delivery now uses shelf items
  var doDeliver=function(contractId){
    var c=contracts.find(function(x){return x.id===contractId;});if(!c) return;
    var result=checkContractWithShelf(c,shelf);
    if(!result.success){addLog("Need "+result.shortfall+" more qualifying items on shelf.");return;}
    var used=new Set(result.qualifying.slice(0,c.quantity).map(function(h){return h.id;}));
    setShelf(function(s){return s.filter(function(x){return !used.has(x.id);});});
    setMoney(function(m){return m+c.reward;});
    setContracts(function(cs){return cs.map(function(x){return x.id===contractId?Object.assign({},x,{status:"completed"}):x;});});
    var nd=Math.min(5,difficulty+1);setDifficulty(nd);
    setContracts(function(cs){return cs.concat([mkContract(newRng(),nd)]);});
    addLog("✅ Delivered to "+c.clientName+"! +$"+c.reward);
  };
  var doBuyTool=function(tool){
    if(money<tool.cost||ownedTools.indexOf(tool.id)>=0) return;
    setMoney(function(m){return m-tool.cost;});setOwnedTools(function(p){return p.concat([tool.id]);});
    addLog("🔬 Bought "+tool.name);
  };
  var doNewContract=function(){var c=mkContract(newRng(),Math.min(5,difficulty));setContracts(function(cs){return cs.concat([c]);});addLog("📋 New contract from "+c.clientName);};

  // NEW: Sell unwanted seeds
  var doSellSeed=function(seedId){
    setSeedBank(function(b){return b.filter(function(s){return s.id!==seedId;});});
    setMoney(function(m){return m+SEED_SELL_PRICE;});
    addLog("💰 Sold seed for $"+SEED_SELL_PRICE);
  };
  var doSellAllSeeds=function(ids){
    var n=ids.length;if(n===0) return;
    setSeedBank(function(b){var s=new Set(ids);return b.filter(function(x){return !s.has(x.id);});});
    setMoney(function(m){return m+n*SEED_SELL_PRICE;});
    addLog("💰 Sold "+n+" seeds for $"+(n*SEED_SELL_PRICE));
  };

  // NEW: Rename seed
  var doStartRename=function(seed){setRenamingSeed(seed.id);setRenameVal(seed.name||"");};
  var doFinishRename=function(){
    if(renamingSeed){
      var val=renameVal.trim().slice(0,24);
      setSeedBank(function(b){return b.map(function(s){return s.id===renamingSeed?Object.assign({},s,{name:val}):s;});});
      if(val) addLog("✏️ Named variety: "+val);
    }
    setRenamingSeed(null);setRenameVal("");
  };

  // NEW: Dry herb from shelf
  var doDryHerb=function(itemId){
    var item=shelf.find(function(h){return h.id===itemId;});
    if(!item) return;
    setShelf(function(s){return s.filter(function(h){return h.id!==itemId;});});
    setDrying(function(d){return d.concat([{item:item,daysLeft:DRY_DAYS}]);});
    addLog("🌿 Started drying herb ("+DRY_DAYS+" days)");
  };

  // NEW: Send shelf items to market (opens market tab and pre-selects)
  var doSendToMarket=function(){
    if(!currentMarket){addLog("Market isn't open yet. Next in "+daysToMarket+" days.");return;}
    setTab("market");
  };

  // KEYBINDS
  useEffect(function(){
    var handler=function(e){
      // Don't fire if typing in an input
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"||e.target.tagName==="SELECT") return;
      var key=e.key.toLowerCase();
      if(key==="h"){doHarvestAllToShelf();}
      else if(key==="b"&&e.shiftKey){doBreed();}
      else if(key==="b"&&!e.shiftKey&&selected){toggleBreed(selected);}
      else if(key==="s"&&selected){doCollectSeeds(selected);}
    };
    window.addEventListener("keydown",handler);
    return function(){window.removeEventListener("keydown",handler);};
  });

  var activeContracts=contracts.filter(function(c){return c.status==="active";});

  // ============================================================
  // RENDER
  // ============================================================
  var tabContent=null;

  // --- CONTAINER TAB ---
  if(tab==="container"){
    var plantGrid=null;
    if(plants.length===0){
      plantGrid=React.createElement("div",{style:{textAlign:"center",padding:"30px 0",color:"#475569",fontSize:12}},seedBank.length>0?"Plant seeds to get started!":"Buy seeds from the Seeds tab.");
    } else {
      var gridItems=plants.map(function(p){
        return React.createElement(PlantVis,{key:p.id,plant:p,size:52,selected:p.markedForBreeding||selected===p.id,marker:p.markedForBreeding?"breed":"select",onClick:function(){setSelected(selected===p.id?null:p.id);}});
      });
      for(var ei=0;ei<emptySlots;ei++){
        gridItems.push(React.createElement("div",{key:"e"+ei,style:{width:52,height:52,border:"1px dashed #2a3444",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#2a3444",fontSize:18}},"+"));
      }
      plantGrid=React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(52px,1fr))",gap:4}},gridItems);
    }
    var actionBtns=[
      React.createElement(Btn,{key:"g1",onClick:function(){doGrow(1);}},"⏱ +1 Day"),
      React.createElement(Btn,{key:"g5",onClick:function(){doGrow(5);},color:"#45aaf2",bg:"#1a2a3a",border:"#2a3a5a"},"⏩ +5"),
      React.createElement(Btn,{key:"g10",onClick:function(){doGrow(10);},color:"#8854d0",bg:"#2a1a3a",border:"#3a2a5a"},"⏩ +10"),
      React.createElement(Btn,{key:"ha",onClick:doHarvestAllToShelf,disabled:harvestable.length===0,color:"#f7b731",bg:"#3a2a1a",border:"#5a3a2a"},"✂️ Harvest All ("+harvestable.length+") [H]")
    ];
    if(breeders.length>=2) actionBtns.push(React.createElement(Btn,{key:"br",onClick:doBreed,color:"#e85d75",bg:"#3a1a2a",border:"#5a2a3a"},"🧬 Breed ("+breeders.length+") [⇧B]"));

    tabContent=React.createElement("div",null,
      // Market countdown banner
      React.createElement("div",{style:{background:daysToMarket<=2?"#3a2a1a":"#131922",borderRadius:8,border:"1px solid "+(daysToMarket<=2?"#5a3a2a":"#1e2a3a"),padding:"8px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}},
        React.createElement("span",{style:{fontSize:11,color:daysToMarket<=2?"#f7b731":"#94a3b8",fontFamily:"'IBM Plex Mono',monospace"}},"🏪 Market in "+daysToMarket+" day"+(daysToMarket!==1?"s":"")),
        React.createElement("span",{style:{fontSize:10,color:"#64748b",fontFamily:"'IBM Plex Mono',monospace"}},"Upkeep: $"+DAILY_UPKEEP+"/day"+(shelf.length>0?" · Shelf: "+shelf.length:""))
      ),
      // Environment
      React.createElement("div",{style:{background:"#131922",borderRadius:10,border:"1px solid #1e2a3a",padding:14,marginBottom:12}},
        React.createElement("div",{style:{fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:8,letterSpacing:".05em",textTransform:"uppercase"}},"Environment"),
        React.createElement(EnvSlider,{label:"Light",value:env.light,onChange:function(v){setEnv(function(e){return Object.assign({},e,{light:v});});},icon:"☀"}),
        React.createElement(EnvSlider,{label:"Temp",value:env.temperature,onChange:function(v){setEnv(function(e){return Object.assign({},e,{temperature:v});});},icon:"🌡"}),
        React.createElement(EnvSlider,{label:"Nutrients",value:env.nutrients,onChange:function(v){setEnv(function(e){return Object.assign({},e,{nutrients:v});});},icon:"🧪"}),
        React.createElement(EnvSlider,{label:"Water",value:env.water,onChange:function(v){setEnv(function(e){return Object.assign({},e,{water:v});});},icon:"💧"})
      ),
      React.createElement("div",{style:{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}},actionBtns),
      React.createElement("div",{style:{background:"#131922",borderRadius:10,border:"1px solid #1e2a3a",padding:14}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}},
          React.createElement("span",{style:{fontSize:11,fontWeight:600,color:"#94a3b8",letterSpacing:".05em",textTransform:"uppercase"}},"Container · "+plants.length+"/"+SLOTS),
          emptySlots>0&&seedBank.length>0&&React.createElement(Btn,{onClick:function(){doPlantBest(emptySlots);},style:{padding:"4px 10px",fontSize:10}},"Plant Best ("+Math.min(emptySlots,seedBank.length)+")")
        ),
        plantGrid
      )
    );
  }

  // --- SHELF TAB ---
  if(tab==="shelf"){
    var shelfItems=shelf.map(function(h){
      var sc=harvestTraitScore(h);
      var col=h.dried?"#a78bfa":h.freshness>.6?"#4ecdc4":h.freshness>.3?"#f7b731":"#e85d75";
      var label=h.dried?"🌿 Dried":"Gen "+h.generation;
      return React.createElement("div",{key:h.id,style:{background:h.dried?"#1a1a2e":"#131922",borderRadius:8,border:"1px solid "+(h.dried?"#3a2a5a":"#1e2a3a"),padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}},
        React.createElement("div",{style:{flex:1}},
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6,marginBottom:4}},
            React.createElement("span",{style:{fontSize:12,fontWeight:600,color:col}},label),
            React.createElement("span",{style:{fontSize:10,color:"#64748b",fontFamily:"'IBM Plex Mono',monospace"}},"Q:"+Math.round(sc.overall*100)+"%"),
            h.dried&&React.createElement("span",{style:{fontSize:9,padding:"1px 5px",borderRadius:3,background:"#a78bfa22",color:"#a78bfa"}},"no decay")
          ),
          !h.dried&&React.createElement(FreshnessBar,{freshness:h.freshness,maxDays:h.maxFreshDays,daysOnShelf:h.daysOnShelf})
        ),
        React.createElement("div",{style:{display:"flex",gap:4}},
          !h.dried&&React.createElement(Btn,{onClick:function(){doDryHerb(h.id);},color:"#a78bfa",bg:"#1a1a2e",border:"#3a2a5a",style:{padding:"4px 8px",fontSize:10}},"🌿 Dry"),
          React.createElement(Btn,{onClick:function(){doCompostShelfItem(h.id);},color:"#64748b",bg:"#1a1a1a",border:"#2a2a2a",style:{padding:"4px 8px",fontSize:10}},"🗑")
        )
      );
    });
    // Drying rack display
    var dryingItems=drying.length>0?React.createElement("div",{style:{marginBottom:12}},
      React.createElement("div",{style:{fontSize:11,fontWeight:600,color:"#a78bfa",marginBottom:6,letterSpacing:".05em",textTransform:"uppercase"}},"🌿 Drying Rack ("+drying.length+")"),
      React.createElement("div",{style:{display:"grid",gap:4}},drying.map(function(d,i){
        return React.createElement("div",{key:i,style:{background:"#1a1a2e",borderRadius:6,border:"1px solid #3a2a5a",padding:"6px 10px",display:"flex",justifyContent:"space-between",fontSize:11}},
          React.createElement("span",{style:{color:"#a78bfa"}},"Gen "+d.item.generation+" herb"),
          React.createElement("span",{style:{color:"#64748b",fontFamily:"'IBM Plex Mono',monospace"}},d.daysLeft+"d left")
        );
      }))
    ):null;
    tabContent=React.createElement("div",null,
      // Action bar
      React.createElement("div",{style:{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}},
        currentMarket&&shelf.length>0&&React.createElement(Btn,{onClick:doSendToMarket,color:"#4ecdc4"},"🏪 Go to Market"),
        !currentMarket&&React.createElement("div",{style:{fontSize:11,color:"#64748b",padding:"8px 0"}},"Next market in "+daysToMarket+"d · Rep: "+Math.round(reputation)+"/100 ("+Math.round(calcSellChance(reputation)*100)+"% sell rate)")
      ),
      dryingItems,
      shelf.length===0&&drying.length===0?
        React.createElement("div",{style:{textAlign:"center",padding:"40px 0",color:"#475569",fontSize:12}},"No harvested items. Harvest mature plants from the Container tab."):
        React.createElement("div",{style:{display:"grid",gap:6}},shelfItems)
    );
  }

  // --- MARKET TAB ---
  if(tab==="market"){
    if(currentMarket){
      var demand=currentMarket;
      var selTotal=0;var selCount=0;
      shelf.forEach(function(h){if(marketSel.has(h.id)){selTotal+=marketPrice(h,demand);selCount++;}});
      selTotal=Math.round(selTotal*100)/100;

      var marketItems=shelf.map(function(h){
        var price=marketPrice(h,demand);
        if(h.dried) price=price*DRY_PRICE_MULT;
        var isSel=marketSel.has(h.id);
        var sc=harvestTraitScore(h);
        return React.createElement("div",{key:h.id,onClick:function(){toggleMarketSelect(h.id);},style:{background:isSel?"#1a3a2a":h.dried?"#1a1a2e":"#131922",borderRadius:8,border:"1px solid "+(isSel?"#2a5a3a":h.dried?"#3a2a5a":"#1e2a3a"),padding:"10px 12px",cursor:"pointer",transition:"all .2s"}},
          React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
            React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
              React.createElement("span",{style:{fontSize:14}},isSel?"☑":"☐"),
              React.createElement("span",{style:{fontSize:12,fontWeight:600,color:h.dried?"#a78bfa":"#e2e8f0"}},h.dried?"🌿 Dried":"Gen "+h.generation),
              React.createElement("span",{style:{fontSize:10,color:"#64748b"}},"Q:"+Math.round(sc.overall*100)+"%")
            ),
            React.createElement("span",{style:{fontSize:13,fontWeight:700,color:"#4ecdc4",fontFamily:"'IBM Plex Mono',monospace"}},"$"+price.toFixed(2))
          ),
          React.createElement("div",{style:{marginTop:4}},
            h.dried?React.createElement("div",{style:{fontSize:10,color:"#a78bfa",fontFamily:"'IBM Plex Mono',monospace"}},"Dried · "+Math.round(DRY_PRICE_MULT*100)+"% of fresh price"):
            React.createElement(FreshnessBar,{freshness:h.freshness,maxDays:h.maxFreshDays,daysOnShelf:h.daysOnShelf})
          )
        );
      });

      var sellPct=Math.round(calcSellChance(reputation)*100);
      tabContent=React.createElement("div",null,
        // Market info banner
        React.createElement("div",{style:{background:"#1a2a1a",borderRadius:10,border:"1px solid #2a5a3a",padding:14,marginBottom:12}},
          React.createElement("div",{style:{fontSize:14,fontWeight:700,color:"#4ecdc4"}},"🏪 Farmers Market Open!"),
          React.createElement("div",{style:{fontSize:12,color:"#94a3b8",marginTop:4}},demand.category.icon+" Today's demand: ",React.createElement("strong",{style:{color:"#e2e8f0"}},demand.category.name)),
          React.createElement("div",{style:{fontSize:10,color:"#64748b",marginTop:2,fontFamily:"'IBM Plex Mono',monospace"}},"Price modifier: "+Math.round(demand.priceMultiplier*100)+"%"+(demand.crowded?" · ⚠ Crowded (lower prices)":"  · Good foot traffic")),
          React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginTop:6}},
            React.createElement("span",{style:{fontSize:10,color:"#94a3b8"}},"Reputation:"),
            React.createElement("div",{style:{flex:1,maxWidth:120,height:6,background:"#1e2430",borderRadius:3,overflow:"hidden"}},
              React.createElement("div",{style:{height:"100%",borderRadius:3,width:reputation+"%",background:reputation>60?"#4ecdc4":reputation>30?"#f7b731":"#e85d75",transition:"width .3s"}})
            ),
            React.createElement("span",{style:{fontSize:10,color:reputation>60?"#4ecdc4":reputation>30?"#f7b731":"#e85d75",fontFamily:"'IBM Plex Mono',monospace"}},sellPct+"% sell rate")
          )
        ),
        // Selection summary
        selCount>0&&React.createElement("div",{style:{background:"#131922",borderRadius:8,border:"1px solid #1e2a3a",padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}},
          React.createElement("span",{style:{fontSize:12,color:"#e2e8f0"}},selCount+" item"+(selCount!==1?"s":"")+" selected"),
          React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center"}},
            React.createElement("span",{style:{fontSize:15,fontWeight:700,color:"#4ecdc4",fontFamily:"'IBM Plex Mono',monospace"}},"$"+selTotal.toFixed(2)),
            React.createElement(Btn,{onClick:doSellAtMarket,color:"#4ecdc4",style:{padding:"6px 14px"}},"💰 Sell")
          )
        ),
        // Items
        shelf.length===0?
          React.createElement("div",{style:{textAlign:"center",padding:"30px 0",color:"#475569",fontSize:12}},"Nothing to sell! Harvest plants first."):
          React.createElement("div",{style:{display:"grid",gap:6}},marketItems),
        // Close market
        React.createElement("div",{style:{marginTop:12,textAlign:"center"}},
          React.createElement(Btn,{onClick:doCloseMarket,color:"#64748b",bg:"#1a1a1a",border:"#2a2a2a"},"Close Market (skip selling)")
        )
      );
    } else {
      tabContent=React.createElement("div",{style:{textAlign:"center",padding:"40px 0"}},
        React.createElement("div",{style:{fontSize:40,marginBottom:8}},"🏪"),
        React.createElement("div",{style:{fontSize:14,color:"#94a3b8"}},"Market is closed"),
        React.createElement("div",{style:{fontSize:12,color:"#64748b",marginTop:4}},"Next market day in "+daysToMarket+" day"+(daysToMarket!==1?"s":"")),
        React.createElement("div",{style:{fontSize:11,color:"#475569",marginTop:8}},"Harvest plants to your shelf and keep them fresh!")
      );
    }
  }

  // --- SEEDS TAB ---
  if(tab==="seeds"){
    var seedItems=sortedSeeds.map(function(s){
      return React.createElement(SeedChip,{key:s.id,seed:s,ownedTools:ownedTools,
        onPlant:function(){doPlantSeed(s);},canPlant:plants.length<SLOTS,
        onSell:function(){doSellSeed(s.id);},
        onRename:function(){doStartRename(s);},
        isRenaming:renamingSeed===s.id,renameVal:renameVal,
        onRenameChange:function(v){setRenameVal(v);},
        onRenameSubmit:doFinishRename
      });
    });
    var traitOptions=TRAITS.map(function(t){return React.createElement("option",{key:t,value:t},TL[t]);});
    tabContent=React.createElement("div",null,
      React.createElement("div",{style:{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}},
        React.createElement(Btn,{onClick:function(){doBuySeeds(3);},color:"#f7b731",bg:"#3a2a1a",border:"#5a3a2a"},"🛒 Buy 3 ($"+(SEED_COST*3)+")"),
        React.createElement(Btn,{onClick:function(){doBuySeeds(6);},color:"#f7b731",bg:"#3a2a1a",border:"#5a3a2a"},"🛒 Buy 6 ($"+(SEED_COST*6)+")"),
        seedBank.length>0&&React.createElement(Btn,{onClick:function(){if(window.confirm("Sell all "+seedBank.length+" seeds for $"+(seedBank.length*SEED_SELL_PRICE)+"?")){doSellAllSeeds(seedBank.map(function(s){return s.id;}));}},color:"#e85d75",bg:"#2a1a1a",border:"#5a2a2a",style:{fontSize:10}},"Sell All ($"+(seedBank.length*SEED_SELL_PRICE)+")"),
        React.createElement("div",{style:{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}},
          React.createElement("span",{style:{fontSize:10,color:"#64748b"}},"Sort:"),
          React.createElement("select",{value:seedSort,onChange:function(e){setSeedSort(e.target.value);},style:{background:"#1e2430",border:"1px solid #2a3444",borderRadius:4,color:"#e2e8f0",fontSize:10,padding:"3px 6px",fontFamily:"'IBM Plex Mono',monospace"}},
            React.createElement("option",{value:"overall"},"Overall"),
            traitOptions,
            React.createElement("option",{value:"generation"},"Generation")
          ),
          React.createElement("button",{onClick:function(){setSeedSortDir(function(d){return d==="desc"?"asc":"desc";});},style:{background:"#1e2430",border:"1px solid #2a3444",borderRadius:4,color:"#e2e8f0",fontSize:10,padding:"3px 6px",cursor:"pointer"}},seedSortDir==="desc"?"↓":"↑")
        )
      ),
      seedBank.length===0?
        React.createElement("div",{style:{textAlign:"center",padding:"40px 0",color:"#475569",fontSize:12}},"No seeds. Buy some or collect from mature plants."):
        React.createElement("div",{style:{display:"grid",gap:6}},seedItems)
    );
  }

  // --- CONTRACTS TAB ---
  if(tab==="contracts"){
    var contractCards=activeContracts.map(function(c){
      var d=checkContractWithShelf(c,shelf);
      var reqTags=c.traitRequirements.map(function(r,i){
        return React.createElement("span",{key:i,style:{fontSize:10,padding:"2px 8px",borderRadius:4,background:TC[r.trait]+"22",color:TC[r.trait],fontFamily:"'IBM Plex Mono',monospace"}},TL[r.trait]+" ≥ "+r.minValue);
      });
      reqTags.push(React.createElement("span",{key:"ready",style:{fontSize:10,padding:"2px 8px",borderRadius:4,background:"#1e2430",color:d.qualifying.length>=c.quantity?"#4ecdc4":"#94a3b8",fontFamily:"'IBM Plex Mono',monospace"}},"Ready: "+d.qualifying.length+"/"+c.quantity+" (shelf)"));
      return React.createElement("div",{key:c.id,style:{background:"#131922",borderRadius:10,border:"1px solid "+(d.success?"#2a5a3a":"#1e2a3a"),padding:14}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}},
          React.createElement("div",null,
            React.createElement("div",{style:{fontSize:13,fontWeight:600}},c.clientName),
            React.createElement("div",{style:{fontSize:11,color:"#94a3b8",marginTop:2,fontStyle:"italic"}},'"'+c.description+'"')
          ),
          React.createElement("div",{style:{textAlign:"right"}},
            React.createElement("div",{style:{fontSize:14,fontWeight:700,color:"#4ecdc4",fontFamily:"'IBM Plex Mono',monospace"}},"$"+c.reward),
            React.createElement("div",{style:{fontSize:10,color:c.deadline<=10?"#e85d75":"#64748b",fontFamily:"'IBM Plex Mono',monospace"}},c.deadline+"d left")
          )
        ),
        React.createElement("div",{style:{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}},reqTags),
        React.createElement("div",{style:{marginTop:8}},
          React.createElement(Btn,{onClick:function(){doDeliver(c.id);},disabled:!d.success,color:d.success?"#4ecdc4":"#555",bg:d.success?"#1a3a2a":"#1a1a1a",border:d.success?"#2a5a3a":"#2a2a2a"},d.success?"✅ Deliver from shelf":"Need "+d.shortfall+" more")
        )
      );
    });
    var historyItems=contracts.filter(function(c){return c.status!=="active";});
    var historySection=null;
    if(historyItems.length>0){
      var hc=historyItems.slice(-5).reverse().map(function(c){
        return React.createElement("div",{key:c.id,style:{background:"#131922",borderRadius:8,border:"1px solid #1e2a3a",padding:10,opacity:.5,display:"flex",justifyContent:"space-between"}},
          React.createElement("span",{style:{fontSize:11}},c.clientName),
          React.createElement("span",{style:{fontSize:11,color:c.status==="completed"?"#4ecdc4":"#e85d75",fontWeight:600}},c.status==="completed"?"✅ Done":"❌ Failed")
        );
      });
      historySection=React.createElement("div",null,
        React.createElement("div",{style:{fontSize:11,fontWeight:600,color:"#64748b",marginTop:8,textTransform:"uppercase",letterSpacing:".05em"}},"History"),hc);
    }
    tabContent=React.createElement("div",null,
      React.createElement(Btn,{onClick:doNewContract,style:{marginBottom:12}},"📋 Find New Client"),
      React.createElement("div",{style:{display:"grid",gap:8}},contractCards,historySection)
    );
  }

  // --- TOOLS TAB ---
  if(tab==="tools"){
    var toolCards=TOOLS.map(function(tool){
      var owned=ownedTools.indexOf(tool.id)>=0;
      return React.createElement("div",{key:tool.id,style:{background:"#131922",borderRadius:10,border:"1px solid "+(owned?"#2a5a3a":"#1e2a3a"),padding:12,display:"flex",justifyContent:"space-between",alignItems:"center"}},
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:12,fontWeight:600,color:owned?"#4ecdc4":"#e2e8f0"}},(owned?"✓ ":"")+tool.name),
          React.createElement("div",{style:{fontSize:10,color:"#64748b",marginTop:2}},tool.desc),
          React.createElement("div",{style:{fontSize:9,color:"#475569",marginTop:2,fontFamily:"'IBM Plex Mono',monospace"}},"Reveals: "+tool.reveals.map(function(t){return TL[t];}).join(", "))
        ),
        !owned&&React.createElement(Btn,{onClick:function(){doBuyTool(tool);},disabled:money<tool.cost,color:"#f7b731",bg:"#3a2a1a",border:"#5a3a2a",style:{whiteSpace:"nowrap"}},"$"+tool.cost)
      );
    });
    tabContent=React.createElement("div",{style:{display:"grid",gap:8}},toolCards);
  }

  // --- INSPECTOR ---
  var inspectorContent=null;
  if(obsData){
    var traitBars=TRAITS.map(function(t){return React.createElement(TraitBar,{key:t,name:t,value:obsData.obs[t].value,level:obsData.obs[t].level,color:TC[t]});});
    var matureActions=null;
    if(obsData.plant.growthStage>=.8){
      var seedBtn=null;
      if(!obsData.plant.seedsCollected){
        seedBtn=React.createElement(Btn,{onClick:function(){doCollectSeeds(obsData.plant.id);},color:"#8854d0",bg:"#2a1a3a",border:"#3a2a5a",style:{fontSize:10}},"🫘 Collect Seeds");
      } else {
        seedBtn=React.createElement("div",{style:{fontSize:10,color:"#8854d0",fontStyle:"italic",textAlign:"center"}},"Seeds collected ✓");
      }
      matureActions=React.createElement("div",{style:{display:"grid",gap:4}},
        seedBtn,
        React.createElement("div",{style:{display:"flex",gap:4}},
          React.createElement(Btn,{onClick:function(){doHarvestToShelf(obsData.plant.id);},color:"#f7b731",bg:"#3a2a1a",border:"#5a3a2a",style:{flex:1,fontSize:10}},"✂️ Harvest"),
          React.createElement(Btn,{onClick:function(){toggleBreed(obsData.plant.id);},color:obsData.plant.markedForBreeding?"#64748b":"#e85d75",bg:obsData.plant.markedForBreeding?"#1a1a1a":"#3a1a2a",border:obsData.plant.markedForBreeding?"#2a2a2a":"#5a2a3a",style:{flex:1,fontSize:10}},obsData.plant.markedForBreeding?"Remove ♥":"♥ Breed")
        ),
        React.createElement(Btn,{onClick:function(){doCompost(obsData.plant.id);},color:"#64748b",bg:"#1a1a1a",border:"#2a2a2a",style:{fontSize:10}},"🗑 Compost")
      );
    }
    inspectorContent=React.createElement("div",null,
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
        React.createElement(PlantVis,{plant:obsData.plant,size:56}),
        React.createElement("div",null,
          React.createElement("div",{style:{fontSize:13,fontWeight:600}},"Plant"),
          React.createElement("div",{style:{fontSize:10,color:"#64748b",fontFamily:"'IBM Plex Mono',monospace"}},"Gen "+obsData.plant.generation+" · Age "+obsData.plant.age+"d"),
          React.createElement("div",{style:{fontSize:10,color:"#64748b",fontFamily:"'IBM Plex Mono',monospace"}},"HP "+obsData.plant.health+" · "+Math.round(obsData.plant.growthStage*100)+"%")
        )
      ),
      React.createElement("div",{style:{marginTop:10}},
        React.createElement("div",{style:{fontSize:10,fontWeight:600,color:"#94a3b8",marginBottom:4,letterSpacing:".05em",textTransform:"uppercase"}},"Traits"),traitBars
      ),
      matureActions,
      ownedTools.length===0&&React.createElement("div",{style:{fontSize:9,color:"#475569",fontStyle:"italic",marginTop:6}},"Buy tools to see precise traits."),
      // Debug panel — powered by graph
      React.createElement("div",{style:{marginTop:8}},
        React.createElement("button",{onClick:function(){setShowDebug(function(d){return !d;});},style:{background:"transparent",border:"none",color:"#475569",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",padding:0}},showDebug?"▼ Hide Debug":"▶ Show Debug"),
        showDebug&&(function(){
          var ge=evaluateGraph(env,obsData.plant);
          var sections=[];
          // Genetics × Expression
          sections.push(React.createElement("div",{key:"hdr1",style:{color:"#f7b731",fontWeight:600,marginBottom:4}},"GENETICS × EXPRESSION"));
          TRAITS.forEach(function(t){
            var g=obsData.plant.traits[t].genetic;var e=obsData.plant.traits[t].expression;
            sections.push(React.createElement("div",{key:"ge-"+t},TL[t]+": "+g+" × "+e.toFixed(2)+" = "+Math.round(g*e)));
          });
          // Edge breakdown per trait
          sections.push(React.createElement("div",{key:"hdr2",style:{color:"#f7b731",fontWeight:600,marginTop:8,marginBottom:4}},"GRAPH EDGES"));
          TRAITS.forEach(function(t){
            var edges=ge.edgeResults.filter(function(r){return r.edge.target===t&&Math.abs(r.delta)>0.001;});
            if(edges.length===0) return;
            sections.push(React.createElement("div",{key:"t-"+t,style:{color:"#94a3b8",marginTop:2}},TL[t]+" (mod: "+(ge.mods[t]>=0?"+":"")+ge.mods[t].toFixed(3)+"):"));
            edges.forEach(function(r,i){
              var col=r.delta>0?"#4ecdc4":"#e85d75";
              sections.push(React.createElement("div",{key:"e-"+t+"-"+i,style:{color:col,paddingLeft:8}},
                r.edge.source+" "+(r.delta>=0?"+":"")+r.delta.toFixed(3)+" ("+r.edge.desc+")"));
            });
          });
          // Health
          var hEdges=ge.edgeResults.filter(function(r){return r.edge.target==="health"&&r.delta>0.001;});
          sections.push(React.createElement("div",{key:"hdr3",style:{color:"#f7b731",fontWeight:600,marginTop:8,marginBottom:4}},"HEALTH"));
          sections.push(React.createElement("div",{key:"hp"},"HP: "+obsData.plant.health+" · dmg/tick: "+ge.hpDamage.toFixed(1)));
          sections.push(React.createElement("div",{key:"shield"},"Hardy shield: "+Math.round(ge.hardinessShield*100)+"% reduction"));
          hEdges.forEach(function(r,i){
            sections.push(React.createElement("div",{key:"he-"+i,style:{color:"#e85d75",paddingLeft:8}},r.edge.source+": +"+r.delta.toFixed(1)+" raw dmg"));
          });
          sections.push(React.createElement("div",{key:"growth"},"Growth: "+Math.round(obsData.plant.growthStage*1000)/10+"% · Age: "+obsData.plant.age+"d"));
          return React.createElement("div",{style:{marginTop:6,background:"#0c1017",borderRadius:6,border:"1px solid #1e2a3a",padding:8,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",color:"#64748b",lineHeight:1.8}},sections);
        })()
      )
    );
  } else {
    inspectorContent=React.createElement("div",null,
      React.createElement("div",{style:{color:"#475569",fontSize:11,textAlign:"center",marginTop:30}},"Click a plant to inspect"),
      React.createElement("div",{style:{marginTop:16}},
        React.createElement("button",{onClick:function(){setShowDebug(function(d){return !d;});},style:{background:"transparent",border:"none",color:"#475569",fontSize:9,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",padding:0}},showDebug?"▼ Hide Debug":"▶ Show Debug"),
        showDebug&&(function(){
          // Use a dummy plant to show environment stress
          var dummyTraits={};TRAITS.forEach(function(t){dummyTraits[t]={genetic:50,expression:1};});
          var ge=evaluateGraph(env,{traits:dummyTraits});
          var items=[];
          items.push(React.createElement("div",{key:"hdr",style:{color:"#f7b731",fontWeight:600,marginBottom:4}},"ENVIRONMENT STRESS"));
          ["light","temperature","nutrients","water"].forEach(function(k){
            items.push(React.createElement("div",{key:k},k+": "+env[k]+" → "+(ge.stresses[k]*100).toFixed(0)+"%"));
          });
          items.push(React.createElement("div",{key:"hp",style:{color:ge.hpDamage>0?"#e85d75":"#4ecdc4",marginTop:4}},"HP dmg/tick (gen50): "+ge.hpDamage.toFixed(1)));
          items.push(React.createElement("div",{key:"hdr2",style:{color:"#f7b731",fontWeight:600,marginTop:8,marginBottom:4}},"GRAPH ("+SIM_GRAPH.length+" edges)"));
          items.push(React.createElement("div",{key:"edges"},"Expression edges: "+SIM_GRAPH.filter(function(e){return e.target!=="health";}).length));
          items.push(React.createElement("div",{key:"hedges"},"Health edges: "+SIM_GRAPH.filter(function(e){return e.target==="health";}).length));
          items.push(React.createElement("div",{key:"hdr3",style:{color:"#f7b731",fontWeight:600,marginTop:8,marginBottom:4}},"ECONOMY"));
          items.push(React.createElement("div",{key:"m"},"Money: $"+money.toFixed(2)));
          items.push(React.createElement("div",{key:"u"},"Upkeep: $"+DAILY_UPKEEP+"/day"));
          items.push(React.createElement("div",{key:"s"},"Shelf: "+shelf.length+(shelf.filter(function(h){return h.dried;}).length>0?" ("+shelf.filter(function(h){return h.dried;}).length+" dried)":"")));
          items.push(React.createElement("div",{key:"dr"},"Drying: "+drying.length));
          items.push(React.createElement("div",{key:"rep"},"Reputation: "+Math.round(reputation)+"/100 ("+Math.round(calcSellChance(reputation)*100)+"% sell)"));
          items.push(React.createElement("div",{key:"n"},"Next market: "+daysToMarket+"d"));
          items.push(React.createElement("div",{key:"b"},"Burn: ~$"+(DAILY_UPKEEP*7)+"/week"));
          return React.createElement("div",{style:{marginTop:6,background:"#0c1017",borderRadius:6,border:"1px solid #1e2a3a",padding:8,fontSize:9,fontFamily:"'IBM Plex Mono',monospace",color:"#64748b",lineHeight:1.8}},items);
        })()
      )
    );
  }

  var logItems=log.map(function(l,i){return React.createElement("div",{key:i,style:{opacity:1-i*.03}},l);});

  // Tab buttons
  var tabs=[
    {id:"container",l:"🌱 Container"},
    {id:"shelf",l:"📦 Shelf ("+shelf.length+")"},
    {id:"market",l:currentMarket?"🏪 Market!":"🏪 Market"},
    {id:"seeds",l:"🫘 Seeds ("+seedBank.length+")"},
    {id:"contracts",l:"📋 ("+activeContracts.length+")"},
    {id:"tools",l:"🔬 Tools"}
  ];
  var tabButtons=tabs.map(function(t){
    var isActive=tab===t.id;
    var isMarketOpen=t.id==="market"&&currentMarket;
    return React.createElement("button",{key:t.id,onClick:function(){setTab(t.id);},style:{flex:1,padding:"9px 0",background:"transparent",border:"none",borderBottom:isActive?"2px solid "+(isMarketOpen?"#f7b731":"#4ecdc4"):"2px solid transparent",color:isActive?(isMarketOpen?"#f7b731":"#4ecdc4"):(isMarketOpen?"#f7b731":"#64748b"),cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"inherit",animation:isMarketOpen&&!isActive?"none":"none"}},t.l);
  });

  return React.createElement("div",{style:{minHeight:"100vh",background:"#0c1017",color:"#e2e8f0",fontFamily:"'IBM Plex Sans',-apple-system,sans-serif"}},
    React.createElement("style",null,"@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#131922}::-webkit-scrollbar-thumb{background:#2a3444;border-radius:3px}input[type=range]{height:4px;border-radius:2px}"),
    // Header
    React.createElement("div",{style:{padding:"12px 16px",borderBottom:"1px solid #1e2a3a",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(180deg,#111825,#0c1017)"}},
      React.createElement("div",null,
        React.createElement("h1",{style:{fontSize:17,fontWeight:700,letterSpacing:"-.02em",color:"#4ecdc4"}},"◻ Container Farm"),
        React.createElement("span",{style:{fontSize:10,color:"#64748b",fontFamily:"'IBM Plex Mono',monospace"}},"Gen "+generation+" · Day "+day+" · "+plants.length+"/"+SLOTS+" slots")
      ),
      React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center"}},
        money<50&&React.createElement("span",{style:{fontSize:10,color:"#e85d75",fontFamily:"'IBM Plex Mono',monospace"}},"⚠ LOW"),
        React.createElement("div",{style:{background:"#131922",border:"1px solid #1e2a3a",borderRadius:8,padding:"6px 14px",fontFamily:"'IBM Plex Mono',monospace",fontSize:15,fontWeight:600,color:money>100?"#4ecdc4":money>30?"#f7b731":"#e85d75"}},"$"+money.toFixed(0))
      )
    ),
    // Tabs
    React.createElement("div",{style:{display:"flex",borderBottom:"1px solid #1e2a3a",background:"#111825"}},tabButtons),
    // Main layout
    React.createElement("div",{style:{display:"flex",height:"calc(100vh - 98px)"}},
      React.createElement("div",{style:{flex:1,overflow:"auto",padding:14}},tabContent),
      React.createElement("div",{style:{width:240,borderLeft:"1px solid #1e2a3a",overflow:"auto",background:"#111825",padding:14,display:"flex",flexDirection:"column",gap:10}},
        inspectorContent,
        React.createElement("div",{style:{marginTop:"auto"}},
          React.createElement("div",{style:{fontSize:10,fontWeight:600,color:"#94a3b8",marginBottom:4,letterSpacing:".05em",textTransform:"uppercase"}},"Log"),
          React.createElement("div",{style:{maxHeight:200,overflow:"auto",fontSize:10,fontFamily:"'IBM Plex Mono',monospace",color:"#64748b",lineHeight:1.6}},logItems)
        )
      )
    )
  );
}

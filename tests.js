// Container Farm Engine Tests — Graph Edition
// Run: node container-farm-tests.js

// ============================================================
// Engine (graph-based, copied from game)
// ============================================================
var mkRng=function(seed){var s=seed|0;return function(){s=(s+0x6d2b79f5)|0;var t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};};
var rr=function(rng,a,b){return a+rng()*(b-a);};
var rg=function(rng,m,s){var u1=rng(),u2=rng();return m+Math.sqrt(-2*Math.log(Math.max(u1,.0001)))*Math.cos(2*Math.PI*u2)*s;};
var TRAITS=["flavorIntensity","growthSpeed","yield","hardiness","appearance","shelfLife"];
var TL={flavorIntensity:"Flavor",growthSpeed:"Growth",yield:"Yield",hardiness:"Hardy",appearance:"Looks",shelfLife:"Shelf"};

var mkPlant=function(gen,gn){
  if(gn===undefined) gn=0;
  return{id:"p"+Math.floor(Math.random()*99999),traits:Object.fromEntries(TRAITS.map(function(t){return[t,{genetic:gen[t],expression:1}];})),health:100,growthStage:0,age:0,markedForBreeding:false,seedsCollected:false,generation:gn};
};

var stress=function(v){return Math.abs(v-50)/50;};

var EVALUATORS={
  stress_penalty:function(s,g,p){return -(s*p.base*(1-g/(p.modGene||999)));},
  threshold_bonus:function(s,g,p){
    if(s>p.lo&&s<p.hi) return p.bonus*(1-(g/(p.modGene||999)));
    if(s>=p.hi) return -(s*p.penalty);
    return 0;
  },
  linear_penalty:function(s,g,p){return -(s*p.base);},
  low_stress_bonus:function(s,g,p){return s<p.threshold?p.bonus:-(s*p.penalty);},
  genetic_shield:function(s,g,p){return -(s*p.base*(1-g/100));},
  avg_stress:function(s,g,p){return s<p.threshold?(s*p.bonus):(-(s*p.penalty*(1-g/(p.modGene||999))));},
  hp_threshold:function(s,g,p){return Math.max(0,s-p.threshold)*p.mult;},
};

var SIM_GRAPH=[
  {source:"nutrients",target:"flavorIntensity",eval:"threshold_bonus",params:{lo:0.1,hi:0.5,bonus:0.1,modGene:200,penalty:0.2},desc:"Nutrient→flavor"},
  {source:"water",target:"flavorIntensity",eval:"threshold_bonus",params:{lo:0.1,hi:0.4,bonus:0.08,modGene:999,penalty:0.15},desc:"Water→flavor"},
  {source:"temperature",target:"flavorIntensity",eval:"threshold_bonus",params:{lo:0.1,hi:0.5,bonus:0.05,modGene:999,penalty:0.15},desc:"Temp→flavor"},
  {source:"nutrients",target:"growthSpeed",eval:"linear_penalty",params:{base:0.15},desc:"Nutrient→growth"},
  {source:"water",target:"growthSpeed",eval:"linear_penalty",params:{base:0.15},desc:"Water→growth"},
  {source:"light",target:"growthSpeed",eval:"linear_penalty",params:{base:0.15},desc:"Light→growth"},
  {source:"nutrients",target:"yield",eval:"stress_penalty",params:{base:0.4,modGene:200},desc:"Nutrient→yield"},
  {source:"water",target:"yield",eval:"stress_penalty",params:{base:0.3,modGene:250},desc:"Water→yield"},
  {source:"light",target:"yield",eval:"low_stress_bonus",params:{threshold:0.15,bonus:0.05,penalty:0},desc:"Light→yield"},
  {source:"temperature",target:"hardiness",eval:"genetic_shield",params:{base:0.3},desc:"Temp→hardiness"},
  {source:"water",target:"appearance",eval:"stress_penalty",params:{base:0.2,modGene:-200},desc:"Water→appearance"},
  {source:"nutrients",target:"appearance",eval:"stress_penalty",params:{base:0.15,modGene:-200},desc:"Nutrient→appearance"},
  {source:"light",target:"appearance",eval:"low_stress_bonus",params:{threshold:0.2,bonus:0.06,penalty:0.1},desc:"Light→appearance"},
  {source:"_avg_nwt",target:"shelfLife",eval:"avg_stress",params:{threshold:0.3,bonus:0.1,penalty:0.15,modGene:150},desc:"AvgStress→shelf"},
  {source:"temperature",target:"health",eval:"hp_threshold",params:{threshold:0.5,mult:20},desc:"Temp→HP"},
  {source:"water",target:"health",eval:"hp_threshold",params:{threshold:0.6,mult:15},desc:"Water→HP"},
  {source:"nutrients",target:"health",eval:"hp_threshold",params:{threshold:0.7,mult:10},desc:"Nutrient→HP"},
];

var evaluateGraph=function(env,plant){
  var stresses={light:stress(env.light),temperature:stress(env.temperature),nutrients:stress(env.nutrients),water:stress(env.water)};
  stresses._avg_nwt=(stresses.nutrients+stresses.water+stresses.temperature)/3;
  var mods={};var hpDmg=0;var results=[];
  for(var i=0;i<TRAITS.length;i++) mods[TRAITS[i]]=0;
  for(var e=0;e<SIM_GRAPH.length;e++){
    var edge=SIM_GRAPH[e];var s=stresses[edge.source]||0;
    var g=plant.traits[edge.target]?plant.traits[edge.target].genetic:0;
    var fn=EVALUATORS[edge.eval];var delta=fn(s,g,edge.params);
    results.push({edge:edge,stress:s,genetic:g,delta:delta});
    if(edge.target==="health") hpDmg+=delta; else mods[edge.target]+=delta;
  }
  var hardGen=plant.traits.hardiness?plant.traits.hardiness.genetic:0;
  var hardExp=1+mods.hardiness;
  var shield=Math.max(0,Math.min(0.5,hardGen*Math.max(0,hardExp)/200));
  hpDmg=hpDmg*(1-shield);
  return{mods:mods,hpDamage:hpDmg,stresses:stresses,edgeResults:results,hardinessShield:shield};
};

var growOnce=function(plants,env){return plants.map(function(p){
  if(p.health<=0) return p;
  var ge=evaluateGraph(env,p);var nt={};
  for(var i=0;i<TRAITS.length;i++){var t=TRAITS[i];nt[t]=Object.assign({},p.traits[t],{expression:Math.max(0,Math.min(1.3,1+ge.mods[t]))});}
  var hd=ge.hpDamage;var gt=nt.growthSpeed;
  var inc=(0.01+(gt.genetic/100)*gt.expression*0.09)*Math.max(0,p.health-hd)/100;
  return Object.assign({},p,{traits:nt,health:Math.max(0,Math.round(p.health-hd)),growthStage:Math.min(1,p.growthStage+inc),age:p.age+1});
});};

var collectSeeds=function(plant,rng){
  if(plant.growthStage<.8) return [];
  var n=2+Math.floor(rng()*3);
  return Array.from({length:n},function(){return{id:"s"+Math.floor(Math.random()*99999),genetics:Object.fromEntries(TRAITS.map(function(t){return[t,Math.round(Math.max(0,Math.min(100,rg(rng,plant.traits[t].genetic,5))))];})),generation:plant.generation+1,source:"collected"};});
};
var breedSeeds=function(p1,p2,rng){
  if(p1.growthStage<.8||p2.growthStage<.8) return [];
  var n=4+Math.floor(rng()*3);var mg=Math.max(p1.generation,p2.generation);
  return Array.from({length:n},function(){var g={};for(var i=0;i<TRAITS.length;i++){var t=TRAITS[i];var w=.3+rng()*.4;g[t]=Math.round(Math.max(0,Math.min(100,rg(rng,p1.traits[t].genetic*w+p2.traits[t].genetic*(1-w),8))));}return{id:"s"+Math.floor(Math.random()*99999),genetics:g,generation:mg+1,source:"bred"};});
};

var harvestPlant=function(plant,currentDay){
  var maxFresh=3+(plant.traits.shelfLife.genetic*plant.traits.shelfLife.expression/100)*7;
  return{id:"h"+Math.floor(Math.random()*99999),traits:Object.assign({},plant.traits),generation:plant.generation,health:plant.health,harvestDay:currentDay,freshness:1.0,maxFreshDays:Math.round(maxFresh),daysOnShelf:0};
};
var ageHarvest=function(items){return items.map(function(h){
  var nd=h.daysOnShelf+1;var fresh=Math.max(0,1-(nd/h.maxFreshDays));
  return Object.assign({},h,{daysOnShelf:nd,freshness:fresh});
}).filter(function(h){return h.freshness>0;});};

var MARKET_CATEGORIES=[
  {name:"Fresh Greens",demandTraits:["yield","appearance"],icon:"🥬"},
  {name:"Gourmet Herbs",demandTraits:["flavorIntensity","appearance"],icon:"🌿"},
];
var marketPrice=function(item,demand){
  var relevance=0;
  for(var i=0;i<demand.category.demandTraits.length;i++){
    var t=demand.category.demandTraits[i];relevance+=item.traits[t].genetic*item.traits[t].expression;
  }
  relevance=relevance/(demand.category.demandTraits.length*100);
  var f=item.traits.flavorIntensity.genetic*item.traits.flavorIntensity.expression;
  var y=item.traits.yield.genetic*item.traits.yield.expression;
  var a=item.traits.appearance.genetic*item.traits.appearance.expression;
  var s=item.traits.shelfLife.genetic*item.traits.shelfLife.expression;
  var overall=(f*.3+y*.25+a*.3+s*.15)/100;
  var base=2+overall*13;
  return Math.round(base*demand.priceMultiplier*item.freshness*(1-demand.competition*.4)*(0.5+relevance)*100)/100;
};

// ============================================================
// Test framework
// ============================================================
var passed=0,failed=0,errors=[];
function assert(cond,name,detail){
  if(cond){passed++;console.log("  ✅ "+name);}
  else{failed++;var m="  ❌ "+name+(detail?" — "+detail:"");errors.push(m);console.log(m);}
}
function assertClose(a,e,tol,name){assert(Math.abs(a-e)<=tol,name,"expected ~"+e+", got "+a+" (±"+tol+")");}
function section(name){console.log("\n"+name+"\n"+"-".repeat(name.length));}
function uniformPlant(val){var g={};TRAITS.forEach(function(t){g[t]=val;});return mkPlant(g,0);}
function plantWith(overrides){var g={};TRAITS.forEach(function(t){g[t]=50;});Object.assign(g,overrides);return mkPlant(g,0);}
function growN(plant,env,n){var a=[plant];for(var i=0;i<n;i++)a=growOnce(a,env);return a[0];}
var idealEnv={light:50,temperature:50,nutrients:50,water:50};

console.log("🌱 Container Farm Graph Engine Tests\n"+"=".repeat(45));

// ============================================================
// GRAPH STRUCTURE
// ============================================================
section("Graph Structure");
assert(SIM_GRAPH.length===17,"Graph has 17 edges","got "+SIM_GRAPH.length);
var exprEdges=SIM_GRAPH.filter(function(e){return e.target!=="health";});
var hpEdges=SIM_GRAPH.filter(function(e){return e.target==="health";});
assert(exprEdges.length===14,"14 expression edges","got "+exprEdges.length);
assert(hpEdges.length===3,"3 health damage edges","got "+hpEdges.length);
TRAITS.forEach(function(t){
  var n=SIM_GRAPH.filter(function(e){return e.target===t;}).length;
  assert(n>0,"Trait '"+t+"' has ≥1 inbound edge","count="+n);
});
SIM_GRAPH.forEach(function(e){
  assert(typeof EVALUATORS[e.eval]==="function","Evaluator '"+e.eval+"' exists for "+e.source+"→"+e.target);
});

// ============================================================
// EVALUATOR UNIT TESTS
// ============================================================
section("Evaluator: stress_penalty");
var sp=EVALUATORS.stress_penalty;
assertClose(sp(0,50,{base:0.4,modGene:200}),0,0.001,"Zero stress → zero penalty");
assertClose(sp(0.5,0,{base:0.4,modGene:200}),-0.2,0.001,"Stress 0.5 gene 0 → full penalty");
assert(Math.abs(sp(0.5,100,{base:0.4,modGene:200}))<Math.abs(sp(0.5,0,{base:0.4,modGene:200})),"Higher gene reduces penalty");
assert(Math.abs(sp(0.5,90,{base:0.2,modGene:-200}))>Math.abs(sp(0.5,10,{base:0.2,modGene:-200})),"Negative modGene → high gene = MORE penalty (fragility)");

section("Evaluator: threshold_bonus");
var tb=EVALUATORS.threshold_bonus;
assert(tb(0.05,50,{lo:0.1,hi:0.5,bonus:0.1,modGene:200,penalty:0.2})===0,"Below lo → no effect");
assert(tb(0.3,50,{lo:0.1,hi:0.5,bonus:0.1,modGene:200,penalty:0.2})>0,"In sweet spot → bonus");
assert(tb(0.7,50,{lo:0.1,hi:0.5,bonus:0.1,modGene:200,penalty:0.2})<0,"Above hi → penalty");

section("Evaluator: genetic_shield");
var gs=EVALUATORS.genetic_shield;
assertClose(gs(0.5,100,{base:0.3}),0,0.001,"Gene 100 → immune");
assertClose(gs(0.5,0,{base:0.3}),-0.15,0.001,"Gene 0 → full penalty");

section("Evaluator: hp_threshold");
var ht=EVALUATORS.hp_threshold;
assertClose(ht(0.3,0,{threshold:0.5,mult:20}),0,0.001,"Below threshold → no damage");
assertClose(ht(0.8,0,{threshold:0.5,mult:20}),6,0.001,"Above threshold → damage");

section("Evaluator: avg_stress");
var av=EVALUATORS.avg_stress;
assert(av(0.2,50,{threshold:0.3,bonus:0.1,penalty:0.15,modGene:150})>0,"Low stress → bonus");
assert(av(0.5,50,{threshold:0.3,bonus:0.1,penalty:0.15,modGene:150})<0,"High stress → penalty");

// ============================================================
// STRESS FUNCTION
// ============================================================
section("Stress Function");
assert(stress(50)===0,"50 → 0%");
assert(stress(0)===1,"0 → 100%");
assert(stress(100)===1,"100 → 100%");
assertClose(stress(25),0.5,0.01,"25 → 50%");
assertClose(stress(75),0.5,0.01,"75 → 50% (symmetry)");

// ============================================================
// EXPRESSION: FLAVOR INTENSITY
// ============================================================
section("Expression: Flavor Intensity");
var ge1=evaluateGraph({light:50,temperature:50,nutrients:35,water:50},uniformPlant(50));
assert(ge1.mods.flavorIntensity>0,"Nutrients=35 → flavor bonus");

var ge2=evaluateGraph({light:50,temperature:50,nutrients:5,water:50},uniformPlant(50));
assert(ge2.mods.flavorIntensity<0,"Nutrients=5 → flavor penalty");

// Low flavor gene benefits MORE from mild stress
var fLow=evaluateGraph({light:50,temperature:50,nutrients:35,water:50},plantWith({flavorIntensity:20}));
var fHigh=evaluateGraph({light:50,temperature:50,nutrients:35,water:50},plantWith({flavorIntensity:80}));
assert(fLow.mods.flavorIntensity>fHigh.mods.flavorIntensity,
  "Low flavor gene benefits more from mild nutrient stress",
  "low="+fLow.mods.flavorIntensity.toFixed(4)+", high="+fHigh.mods.flavorIntensity.toFixed(4));

// Water and temperature bonuses
var ge3=evaluateGraph({light:50,temperature:50,nutrients:50,water:38},uniformPlant(50));
assert(ge3.mods.flavorIntensity>0,"Water=38 → flavor bonus");

var ge4=evaluateGraph({light:50,temperature:62,nutrients:50,water:50},uniformPlant(50));
assert(ge4.mods.flavorIntensity>0,"Temp=62 → flavor bonus");

var ge5=evaluateGraph(idealEnv,uniformPlant(50));
assertClose(ge5.mods.flavorIntensity,0,0.001,"Ideal → zero flavor mod");

// ============================================================
// EXPRESSION: YIELD
// ============================================================
section("Expression: Yield");
var ge6=evaluateGraph({light:50,temperature:50,nutrients:15,water:15},uniformPlant(50));
assert(ge6.mods.yield<0,"Low nutrients+water → yield penalty");

// High yield gene resists stress
var yLow=evaluateGraph({light:50,temperature:50,nutrients:15,water:50},plantWith({yield:20}));
var yHigh=evaluateGraph({light:50,temperature:50,nutrients:15,water:50},plantWith({yield:90}));
assert(yHigh.mods.yield>yLow.mods.yield,
  "High yield gene resists nutrient stress better",
  "high="+yHigh.mods.yield.toFixed(4)+", low="+yLow.mods.yield.toFixed(4));

// Good light bonus
var ge7=evaluateGraph({light:52,temperature:50,nutrients:50,water:50},uniformPlant(50));
assert(ge7.mods.yield>0,"Light stress<0.15 → yield bonus");

// ============================================================
// EXPRESSION: APPEARANCE (fragility)
// ============================================================
section("Expression: Appearance");
var ge8=evaluateGraph({light:50,temperature:50,nutrients:50,water:15},uniformPlant(50));
assert(ge8.mods.appearance<0,"Water stress → appearance penalty");

// High appearance gene is MORE fragile
var aLow=evaluateGraph({light:50,temperature:50,nutrients:50,water:15},plantWith({appearance:20}));
var aHigh=evaluateGraph({light:50,temperature:50,nutrients:50,water:15},plantWith({appearance:90}));
assert(aHigh.mods.appearance<aLow.mods.appearance,
  "High appearance gene MORE fragile under stress",
  "high="+aHigh.mods.appearance.toFixed(4)+", low="+aLow.mods.appearance.toFixed(4));

// Good light boosts
var ge9=evaluateGraph({light:52,temperature:50,nutrients:50,water:50},uniformPlant(50));
assert(ge9.mods.appearance>0,"Good light → appearance bonus");

// ============================================================
// EXPRESSION: HARDINESS
// ============================================================
section("Expression: Hardiness");
var hLow=evaluateGraph({light:50,temperature:90,nutrients:50,water:50},plantWith({hardiness:10}));
var hHigh=evaluateGraph({light:50,temperature:90,nutrients:50,water:50},plantWith({hardiness:90}));
var hMax=evaluateGraph({light:50,temperature:90,nutrients:50,water:50},plantWith({hardiness:100}));
assert(hHigh.mods.hardiness>hLow.mods.hardiness,"High hardiness gene → less expression loss");
assertClose(hMax.mods.hardiness,0,0.001,"Hardiness=100 → immune to temp expression loss");

// ============================================================
// EXPRESSION: SHELF LIFE
// ============================================================
section("Expression: Shelf Life");
var ge10=evaluateGraph({light:50,temperature:55,nutrients:55,water:55},uniformPlant(50));
assert(ge10.mods.shelfLife>0,"Low avg stress → shelf life bonus");

var ge11=evaluateGraph({light:50,temperature:90,nutrients:90,water:90},uniformPlant(50));
assert(ge11.mods.shelfLife<0,"High avg stress → shelf life penalty");

// High shelfLife gene resists
var slLow=evaluateGraph({light:50,temperature:90,nutrients:90,water:90},plantWith({shelfLife:10}));
var slHigh=evaluateGraph({light:50,temperature:90,nutrients:90,water:90},plantWith({shelfLife:90}));
assert(slHigh.mods.shelfLife>slLow.mods.shelfLife,
  "High shelfLife gene resists stress better",
  "high="+slHigh.mods.shelfLife.toFixed(4)+", low="+slLow.mods.shelfLife.toFixed(4));

// ============================================================
// EXPRESSION: GROWTH SPEED
// ============================================================
section("Expression: Growth Speed");
var ge12=evaluateGraph({light:10,temperature:50,nutrients:10,water:10},uniformPlant(50));
assert(ge12.mods.growthSpeed<0,"Light+nutrient+water stress → growth penalty");

// Growth gene controls actual rate
var pFast=plantWith({growthSpeed:95});
var pSlow=plantWith({growthSpeed:5});
var fastR=growN(pFast,idealEnv,1);
var slowR=growN(pSlow,idealEnv,1);
assert(fastR.growthStage>slowR.growthStage*3,"Speed 95 grows >3x faster than 5");

// ============================================================
// HEALTH DAMAGE
// ============================================================
section("Health Damage");
var ge13=evaluateGraph(idealEnv,uniformPlant(50));
assertClose(ge13.hpDamage,0,0.001,"Ideal → zero HP damage");

var geT=evaluateGraph({light:50,temperature:95,nutrients:50,water:50},uniformPlant(50));
assert(geT.hpDamage>0,"High temp → HP damage");

var geW=evaluateGraph({light:50,temperature:50,nutrients:50,water:95},uniformPlant(50));
assert(geW.hpDamage>0,"High water → HP damage");

var geN=evaluateGraph({light:50,temperature:50,nutrients:95,water:50},uniformPlant(50));
assert(geN.hpDamage>0,"High nutrients → HP damage");

var geL=evaluateGraph({light:5,temperature:50,nutrients:50,water:50},uniformPlant(50));
assertClose(geL.hpDamage,0,0.001,"Light alone → no HP damage");

// ============================================================
// HARDINESS HP SHIELD
// ============================================================
section("Hardiness HP Shield");
var lethalEnv={light:50,temperature:95,nutrients:95,water:95};
var fragile=evaluateGraph(lethalEnv,plantWith({hardiness:0}));
var hardy=evaluateGraph(lethalEnv,plantWith({hardiness:90}));
assert(hardy.hpDamage<fragile.hpDamage,"High hardiness reduces HP damage taken",
  "hardy="+hardy.hpDamage.toFixed(2)+", fragile="+fragile.hpDamage.toFixed(2));
assert(hardy.hardinessShield>0,"Hardy plant has positive shield");
assert(hardy.hardinessShield<=0.5,"Shield caps at 50%");

// ============================================================
// DEAD PLANTS
// ============================================================
section("Dead Plants");
var doomed=growN(uniformPlant(30),{light:50,temperature:100,nutrients:100,water:100},100);
assert(doomed.health===0,"Extreme stress kills plant");
var afterDeath=growN(doomed,{light:50,temperature:100,nutrients:100,water:100},10);
assert(afterDeath.health===0,"Dead stays dead");
assert(afterDeath.growthStage===doomed.growthStage,"Dead stops growing");

// ============================================================
// IDEAL vs EXTREME
// ============================================================
section("Ideal vs Extreme Environment");
var idealR=growN(uniformPlant(50),idealEnv,20);
var extremeR=growN(uniformPlant(50),{light:100,temperature:100,nutrients:100,water:100},20);
assert(idealR.health>extremeR.health,"Ideal preserves health");
assert(idealR.growthStage>extremeR.growthStage,"Ideal grows faster");
assert(idealR.health===100,"No health loss in ideal");

// ============================================================
// BREEDING
// ============================================================
section("Breeding");
var par1=uniformPlant(80);par1.growthStage=1.0;
var par2=uniformPlant(40);par2.growthStage=1.0;
var seeds=breedSeeds(par1,par2,mkRng(42));
assert(seeds.length>=4&&seeds.length<=6,"Produces 4-6 seeds","got "+seeds.length);
assert(seeds[0].generation===1,"Generation increments");
seeds.forEach(function(s,i){TRAITS.forEach(function(t){
  assert(s.genetics[t]>=0&&s.genetics[t]<=100,"Seed "+i+" "+t+" in [0,100]");
});});
var imm=uniformPlant(50);imm.growthStage=0.5;
assert(breedSeeds(imm,imm,mkRng(99)).length===0,"Immature can't breed");

// ============================================================
// SEED COLLECTION
// ============================================================
section("Seed Collection");
var mat=uniformPlant(60);mat.growthStage=0.9;
var coll=collectSeeds(mat,mkRng(77));
assert(coll.length>=2&&coll.length<=4,"Collect 2-4 seeds","got "+coll.length);
assert(coll[0].generation===1,"Collected gen = plant gen + 1");
var young=uniformPlant(60);young.growthStage=0.3;
assert(collectSeeds(young,mkRng(88)).length===0,"Can't collect from immature");

// ============================================================
// HARVEST & FRESHNESS
// ============================================================
section("Harvest & Freshness");
var hp=uniformPlant(50);hp.growthStage=1.0;
var hv=harvestPlant(hp,10);
assert(hv.freshness===1.0,"Harvested at 100% freshness");
assert(hv.maxFreshDays>0,"Positive max fresh days");

// High shelfLife gene → longer freshness
var pHighSL=plantWith({shelfLife:90});pHighSL.growthStage=1.0;
var pLowSL=plantWith({shelfLife:10});pLowSL.growthStage=1.0;
var hHighSL=harvestPlant(pHighSL,0);
var hLowSL=harvestPlant(pLowSL,0);
assert(hHighSL.maxFreshDays>hLowSL.maxFreshDays,
  "High shelfLife → longer freshness",
  "high="+hHighSL.maxFreshDays+", low="+hLowSL.maxFreshDays);

// Decay
var aged=ageHarvest([Object.assign({},hv)]);
assert(aged.length===1,"Survives 1 day");
assert(aged[0].freshness<1,"Freshness decreases");

// Expiration
var expiring=[Object.assign({},hv)];
for(var d=0;d<20;d++) expiring=ageHarvest(expiring);
assert(expiring.length===0,"Items fully expire");

// ============================================================
// MARKET PRICING
// ============================================================
section("Market Pricing");
var demand={category:MARKET_CATEGORIES[0],priceMultiplier:1.0,competition:0.3,crowded:false};

// Freshness premium
var freshItem=harvestPlant(uniformPlant(60),0);freshItem.freshness=1.0;
var staleItem=Object.assign({},freshItem,{freshness:0.3});
assert(marketPrice(freshItem,demand)>marketPrice(staleItem,demand),"Fresh sells for more");

// Competition penalty
var calmD=Object.assign({},demand,{competition:0.1});
var crowdedD=Object.assign({},demand,{competition:0.9});
assert(marketPrice(freshItem,calmD)>marketPrice(freshItem,crowdedD),"Crowded market → lower price");

// Trait quality premium
var pPrem=uniformPlant(90);pPrem.growthStage=1.0;
var pJunk=uniformPlant(15);pJunk.growthStage=1.0;
var hPrem=harvestPlant(pPrem,0);var hJunk=harvestPlant(pJunk,0);
assert(marketPrice(hPrem,demand)>marketPrice(hJunk,demand),"Premium traits → higher price");

// Price multiplier
var hiMult=Object.assign({},demand,{priceMultiplier:1.5});
var loMult=Object.assign({},demand,{priceMultiplier:0.5});
assert(marketPrice(freshItem,hiMult)>marketPrice(freshItem,loMult),"Higher multiplier → higher price");

// ============================================================
// ECONOMIC PRESSURE
// ============================================================
section("Economic Pressure");
var DAILY_UPKEEP=4;var startMoney=250;
var runway=Math.floor(startMoney/DAILY_UPKEEP);
assert(runway>0&&runway<100,"Upkeep creates finite runway",runway+"d");
var MARKET_INTERVAL=7;
assert(MARKET_INTERVAL<runway,"Market before bankruptcy");

// ============================================================
// GRAPH INTROSPECTION
// ============================================================
section("Graph Introspection");
// Query: "What affects yield?"
var yieldEdges=SIM_GRAPH.filter(function(e){return e.target==="yield";});
assert(yieldEdges.length===3,"Yield has 3 inbound edges (nutrients, water, light)","got "+yieldEdges.length);
var yieldSources=yieldEdges.map(function(e){return e.source;}).sort();
assert(yieldSources.join(",")=="light,nutrients,water","Yield sources are light, nutrients, water");

// Query: "What does temperature affect?"
var tempEdges=SIM_GRAPH.filter(function(e){return e.source==="temperature";});
assert(tempEdges.length===3,"Temperature has 3 outbound edges","got "+tempEdges.length);
var tempTargets=tempEdges.map(function(e){return e.target;}).sort();
assert(tempTargets.join(",")=="flavorIntensity,hardiness,health","Temp targets: flavor, hardiness, health");

// Query: "What has no light dependency?"
var lightTargets={};SIM_GRAPH.filter(function(e){return e.source==="light";}).forEach(function(e){lightTargets[e.target]=true;});
assert(!lightTargets.flavorIntensity,"Flavor not affected by light");
assert(!lightTargets.hardiness,"Hardiness not affected by light");
assert(!lightTargets.shelfLife,"Shelf life not directly affected by light");
assert(lightTargets.growthSpeed,"Growth IS affected by light");
assert(lightTargets.yield,"Yield IS affected by light");
assert(lightTargets.appearance,"Appearance IS affected by light");

// ============================================================
// INTEGRATION: FULL CYCLE
// ============================================================
section("Integration: Full Growth Cycle");
var testP=uniformPlant(50);
var testR=growN(testP,idealEnv,50);
assert(testR.growthStage>=0.8,"Matures in ~50 days ideal");
assert(testR.health===100,"No health loss ideal full cycle");

var testH=harvestPlant(testR,50);
assert(testH.freshness===1.0,"Fresh at harvest");
var testPrice=marketPrice(testH,demand);
assert(testPrice>0,"Positive market value");
assert(testPrice>DAILY_UPKEEP,"Single harvest > 1 day upkeep","$"+testPrice);

// Strategy test: flavor farming (mild nutrient stress)
section("Strategy: Flavor Farming");
var flavorEnv={light:50,temperature:58,nutrients:37,water:40};
var normalEnv=idealEnv;
var flavorPlant=plantWith({flavorIntensity:70,yield:40});
var normalPlant=plantWith({flavorIntensity:70,yield:40});
var flavorResult=growN(flavorPlant,flavorEnv,30);
var normalResult=growN(normalPlant,normalEnv,30);
assert(flavorResult.traits.flavorIntensity.expression>normalResult.traits.flavorIntensity.expression,
  "Flavor farming env → higher flavor expression than ideal",
  "farm="+flavorResult.traits.flavorIntensity.expression.toFixed(3)+
  ", ideal="+normalResult.traits.flavorIntensity.expression.toFixed(3));
assert(flavorResult.traits.yield.expression<normalResult.traits.yield.expression,
  "Flavor farming env → lower yield expression (tradeoff)");

// ============================================================
// SUMMARY
// ============================================================
console.log("\n"+"=".repeat(45));
console.log("Results: "+passed+" passed, "+failed+" failed");
if(failed>0){
  console.log("\nFailures:");
  errors.forEach(function(e){console.log(e);});
  process.exit(1);
} else {
  console.log("🎉 All "+passed+" tests passing!");
  process.exit(0);
}

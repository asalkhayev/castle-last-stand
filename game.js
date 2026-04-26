const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const screens=document.querySelectorAll(".screen");
const levelScene=document.getElementById("levels");

const ASSETS={
  levels:[
    "assets/bakground levels/level1-castle.png",
    "assets/bakground levels/level2-forest.png",
    "assets/bakground levels/level3-crypt.png"
  ],
  player:"assets/player/DREADKNIGHT.PNG",
  enemies:[
    "assets/enemies/DEMON.PNG",
    "assets/enemies/MAGMAR.PNG",
    "assets/enemies/MIMIC.PNG",
    "assets/enemies/SKULLET.PNG",
    "assets/enemies/WIGHT.PNG"
  ]
};

const images={};
function loadImage(name,src){const img=new Image();img.src=src;images[name]=img}
ASSETS.levels.forEach((src,i)=>loadImage("level"+i,src));
loadImage("player",ASSETS.player);
ASSETS.enemies.forEach((src,i)=>loadImage("enemy"+i,src));

// ─── AUDIO ENGINE ──────────────────────────────────────────────────────────────
let audioReady=false;
let sfxVolume=0.7,musicVolume=0.35;

let audioCtx=null;
let bgmAudio=null;

// Pre-load SFX as Audio elements — works with file:// and http://
const sfxPool={
  attack:[],enemyDie:[],shockwave:[]
};
const SFX_SRCS={
  attack:"sounds/sword_swing.wav",
  enemyDie:"sounds/monster_death.wav",
  shockwave:"sounds/magic_explosion.wav"
};
const POOL_SIZE=4; // allow overlapping same sound
Object.entries(SFX_SRCS).forEach(([key,src])=>{
  for(let i=0;i<POOL_SIZE;i++){
    const a=new Audio(src);
    a.preload="auto";
    sfxPool[key].push(a);
  }
});

async function initAudio(){
  if(audioReady)return;
  audioReady=true;
}
function resumeAudio(){}

function playSFX(key,vol=1){
  const pool=sfxPool[key];
  if(!pool)return;
  // find one that's free (ended or not started)
  let snd=pool.find(a=>a.paused||a.ended);
  if(!snd){snd=pool[0];snd.currentTime=0;}
  snd.volume=Math.min(1,sfxVolume*vol);
  snd.currentTime=0;
  snd.play().catch(()=>{});
}

// ─── SOUND FX ─────────────────────────────────────────────────────────────────
function sndAttack(){playSFX("attack",0.85);}
function sndHitEnemy(){}
function sndEnemyDie(){playSFX("enemyDie",0.9);}
function sndShockwave(){playSFX("shockwave",1.0);}
function sndPlayerHit(){}
function sndWaveUp(){}
function sndGameOver(){}
function sndVictory(){}
function sndButtonClick(){}

// ─── BACKGROUND MUSIC ─────────────────────────────────────────────────────────
const BGM_MENU_VOL=0.12;
const BGM_GAME_VOL=0.55;
let bgmFadeTimer=null;

function startBGM(){
  if(bgmAudio)return;
  bgmAudio=new Audio("sounds/back.mp3");
  bgmAudio.loop=true;
  bgmAudio.volume=BGM_MENU_VOL*musicVolume;
  bgmAudio.play().catch(()=>{});
}
function setBGMVolume(target,durationMs=600){
  if(!bgmAudio)return;
  if(bgmFadeTimer)clearInterval(bgmFadeTimer);
  const start=bgmAudio.volume;
  const diff=target-start;
  const steps=30;
  const stepMs=durationMs/steps;
  let i=0;
  bgmFadeTimer=setInterval(()=>{
    i++;
    bgmAudio.volume=Math.min(1,Math.max(0,start+diff*(i/steps)));
    if(i>=steps)clearInterval(bgmFadeTimer);
  },stepMs);
}
function stopBGM(){
  if(!bgmAudio)return;
  if(bgmFadeTimer)clearInterval(bgmFadeTimer);
  bgmAudio.pause();
  bgmAudio.currentTime=0;
  bgmAudio=null;
}

function syncVolumes(){
  const mv=document.getElementById("music-vol");
  const sv=document.getElementById("sfx-vol");
  if(mv){
    musicVolume=Number(mv.value)/100;
    const target=gameState==="playing"?BGM_GAME_VOL*musicVolume:BGM_MENU_VOL*musicVolume;
    if(bgmAudio)bgmAudio.volume=Math.min(1,Math.max(0,target));
  }
  if(sv)sfxVolume=Number(sv.value)/100*0.9;
}

// ─── GAME STATE ───────────────────────────────────────────────────────────────
let gameState="menu",currentLevel=0,difficulty=1,particlesOn=true;
let keys={},mouse={x:640,y:360};
let player,enemies,particles,score,wave,spawnTimer,attackTimer,dashTimer,stamina,lastTime=0;
let prevWave=1;

function resetGame(){
  player={x:canvas.width/2,y:canvas.height/2,r:24,speed:260,hp:100,maxHp:100,invincible:0};
  enemies=[];particles=[];score=0;wave=1;prevWave=1;spawnTimer=0;attackTimer=0;dashTimer=0;stamina=100;
}
function hideScreens(){screens.forEach(s=>s.classList.remove("show"))}
function showScreen(id){hideScreens();const el=document.getElementById(id);if(el)el.classList.add("show");if(id==="menu")gameState="menu";updatePauseBtn()}
function updatePauseBtn(){const btn=document.getElementById("game-pause-btn");if(btn)btn.classList.toggle("visible",gameState==="playing")}
async function startGame(){resetGame();gameState="playing";hideScreens();updatePauseBtn();await initAudio();resumeAudio();startBGM();setBGMVolume(BGM_GAME_VOL*musicVolume,700);}
function pauseGame(){if(gameState==="playing"){gameState="pause";showScreen("pause");updatePauseBtn();setBGMVolume(BGM_MENU_VOL*musicVolume,600);}}
function resumeGame(){gameState="playing";hideScreens();updatePauseBtn();setBGMVolume(BGM_GAME_VOL*musicVolume,600);}
function endGame(win=false){
  gameState="end";
  document.getElementById("endTitle").textContent=win?"VICTORY":"GAME OVER";
  document.getElementById("endText").textContent=`Score: ${score} | Wave: ${wave}`;
  showScreen("end");updatePauseBtn();
  setBGMVolume(BGM_MENU_VOL*musicVolume,1000);
  if(win)sndVictory();else sndGameOver();
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
document.addEventListener("keydown",e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key==="Escape"){if(gameState==="playing")pauseGame();else if(gameState==="pause")resumeGame();}
  if(e.code==="Space"){attack();stamina=Math.max(0,stamina-15);}
  if(e.key==="Shift"){shockwave();}
});
document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener("mousemove",e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*(canvas.width/r.width);mouse.y=(e.clientY-r.top)*(canvas.height/r.height)});
canvas.addEventListener("mousedown",()=>{resumeAudio();attack();});

document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  initAudio();startBGM();sndButtonClick();
  const action=b.dataset.action,screen=b.dataset.screen,level=b.dataset.level;
  if(action==="start")startGame();
  if(action==="resume")resumeGame();
  if(action==="restart")startGame();
  if(action==="pause")pauseGame();
  if(b.id==="settings-back-btn"){if(gameState==="pause")showScreen("pause");else showScreen("menu");return;}
  if(screen)showScreen(screen);
  if(b.id==="particles-toggle"){particlesOn=!particlesOn;b.textContent=particlesOn?"ON":"OFF";b.classList.toggle("active",particlesOn)}
  if(b.id==="fullscreen-toggle"){if(!document.fullscreenElement){document.documentElement.requestFullscreen();b.textContent="ON";b.classList.add("active")}else{document.exitFullscreen();b.textContent="OFF";b.classList.remove("active")}}
  if(b.id==="diff-toggle"){const vals=["EASY","NORMAL","HARD"];const speeds=[0.85,1,1.25];let idx=vals.indexOf(b.textContent)+1;if(idx>=vals.length)idx=0;b.textContent=vals[idx];difficulty=speeds[idx];}
  if(level!==undefined){
    currentLevel=Number(level);
    document.querySelectorAll(".level").forEach(btn=>btn.classList.remove("selected"));
    b.classList.add("selected");
    if(levelScene)levelScene.style.backgroundImage=`linear-gradient(rgba(0,0,0,.34),rgba(0,0,0,.76)), url("${ASSETS.levels[currentLevel]}")`;
  }
  syncVolumes();
});

const difficultySelect=document.getElementById("difficulty");
if(difficultySelect)difficultySelect.addEventListener("change",()=>difficulty=Number(difficultySelect.value));
const musicVol=document.getElementById("music-vol");
const sfxVol=document.getElementById("sfx-vol");
const brightnessSlider=document.getElementById("brightness-val");
if(musicVol)musicVol.addEventListener("input",()=>{document.getElementById("music-vol-display").textContent=musicVol.value;syncVolumes();});
if(sfxVol)sfxVol.addEventListener("input",()=>{document.getElementById("sfx-vol-display").textContent=sfxVol.value;syncVolumes();});
if(brightnessSlider)brightnessSlider.addEventListener("input",()=>{
  const v=Number(brightnessSlider.value);
  document.getElementById("brightness-display").textContent=v;
  const overlay=document.getElementById("brightness-overlay");
  if(overlay){
    if(v<100){overlay.style.background=`rgba(0,0,0,${((100-v)/100)*0.6})`}
    else{overlay.style.background=`rgba(255,220,100,${((v-100)/100)*0.18})`}
  }
});

// ─── GAMEPLAY ─────────────────────────────────────────────────────────────────
function attack(){
  if(gameState!=="playing"||attackTimer>0)return;
  attackTimer=.3;
  sndAttack();
  enemies.forEach(en=>{
    if(dist(player.x,player.y,en.x,en.y)<105){
      en.hp--;createSparks(en.x,en.y,8);
      if(en.hp<=0){score+=10;createSparks(en.x,en.y,18);en.dead=true;sndEnemyDie();}
      else{sndHitEnemy();}
    }
  });
  enemies=enemies.filter(e=>!e.dead);
}
function shockwave(){
  if(gameState!=="playing"||stamina<50)return;
  stamina=Math.max(0,stamina-50);
  sndShockwave();
  enemies.forEach(en=>{score+=10;createSparks(en.x,en.y,22);en.dead=true});
  enemies=[];
  createSparks(player.x,player.y,30);
}
function update(dt){
  if(gameState!=="playing")return;
  attackTimer-=dt;dashTimer-=dt;player.invincible-=dt;
  if(dashTimer<=0)stamina=Math.min(100,stamina+dt*18);
  movePlayer(dt);
  spawnTimer-=dt;if(spawnTimer<=0){spawnEnemy();spawnTimer=Math.max(.4,1.25-wave*.05)/difficulty}
  updateEnemies(dt);updateParticles(dt);
  if(score>=wave*80){
    wave++;
    if(wave>prevWave){prevWave=wave;if(wave<=10)sndWaveUp();}
  }
  if(wave>10)endGame(true);
  if(player.hp<=0)endGame(false);
}
function movePlayer(dt){
  let dx=0,dy=0;
  if(keys.w||keys.arrowup)dy--;if(keys.s||keys.arrowdown)dy++;if(keys.a||keys.arrowleft)dx--;if(keys.d||keys.arrowright)dx++;
  const l=Math.hypot(dx,dy)||1;
  player.x+=dx/l*player.speed*dt;player.y+=dy/l*player.speed*dt;
  player.x=clamp(player.x,45,canvas.width-45);player.y=clamp(player.y,60,canvas.height-45);
}
function spawnEnemy(){
  const side=Math.floor(Math.random()*4);let x,y;
  if(side===0){x=Math.random()*canvas.width;y=-60}else if(side===1){x=canvas.width+60;y=Math.random()*canvas.height}else if(side===2){x=Math.random()*canvas.width;y=canvas.height+60}else{x=-60;y=Math.random()*canvas.height}
  const type=Math.floor(Math.random()*ASSETS.enemies.length);
  enemies.push({x,y,r:24,hp:(type===1||type===2)?2:1,speed:(70+Math.random()*45+wave*5)*difficulty,type,size:76+Math.random()*22});
}
function updateEnemies(dt){
  enemies.forEach(en=>{
    const a=Math.atan2(player.y-en.y,player.x-en.x);
    en.x+=Math.cos(a)*en.speed*dt;en.y+=Math.sin(a)*en.speed*dt;
    if(dist(player.x,player.y,en.x,en.y)<player.r+en.r&&player.invincible<=0){
      player.hp-=10;player.invincible=.7;
      createSparks(player.x,player.y,12);
      sndPlayerHit();
    }
  });
}
function createSparks(x,y,n){
  if(!particlesOn)return;
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=70+Math.random()*200;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+Math.random()*.35,max:.6,size:2+Math.random()*3})}
}
function updateParticles(dt){particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.9;p.vy*=.9;p.life-=dt});particles=particles.filter(p=>p.life>0)}

// ─── DRAW ─────────────────────────────────────────────────────────────────────
function draw(){drawBackground();if(gameState==="playing"||gameState==="pause"){drawPlayer();drawEnemies();drawParticles();drawHUD();if(attackTimer>.18)drawSlash()}}
function drawBackground(){
  const bg=images["level"+currentLevel];
  if(bg&&bg.complete&&bg.naturalWidth>0)ctx.drawImage(bg,0,0,canvas.width,canvas.height);else{ctx.fillStyle="#15100b";ctx.fillRect(0,0,canvas.width,canvas.height)}
  ctx.fillStyle="rgba(0,0,0,.62)";ctx.fillRect(0,0,canvas.width,canvas.height);
  const g=ctx.createRadialGradient(canvas.width/2,canvas.height/2,180,canvas.width/2,canvas.height/2,850);
  g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.72)");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
}
function drawPlayer(){
  const img=images.player,size=104;ctx.save();if(player.invincible>0)ctx.globalAlpha=.72;
  ctx.shadowColor="rgba(255,185,60,.95)";ctx.shadowBlur=30;ctx.filter="brightness(1.35) contrast(1.08) saturate(1.12)";
  if(img&&img.complete&&img.naturalWidth>0)ctx.drawImage(img,player.x-size/2,player.y-size/2,size,size);else{ctx.fillStyle="#f2c45f";ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill()}
  ctx.restore();
}
function drawEnemies(){
  enemies.forEach(en=>{const img=images["enemy"+en.type],s=en.size;ctx.save();ctx.shadowColor="rgba(255,90,30,.9)";ctx.shadowBlur=24;ctx.filter="brightness(1.32) contrast(1.1) saturate(1.2)";
  if(img&&img.complete&&img.naturalWidth>0)ctx.drawImage(img,en.x-s/2,en.y-s/2,s,s);else{ctx.fillStyle="#d12a1e";ctx.beginPath();ctx.arc(en.x,en.y,en.r,0,Math.PI*2);ctx.fill()}ctx.restore()});
}
function drawSlash(){const a=Math.atan2(mouse.y-player.y,mouse.x-player.x);ctx.save();ctx.translate(player.x,player.y);ctx.rotate(a);ctx.strokeStyle="rgba(255,205,85,.95)";ctx.lineWidth=8;ctx.shadowColor="orange";ctx.shadowBlur=24;ctx.beginPath();ctx.arc(0,0,92,-.5,.5);ctx.stroke();ctx.restore()}
function drawParticles(){particles.forEach(p=>{ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle="#ffbd45";ctx.shadowColor="#ff6a00";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore()})}
function drawHUD(){
  ctx.save();ctx.fillStyle="rgba(0,0,0,.72)";ctx.fillRect(25,25,305,105);ctx.strokeStyle="#9b743d";ctx.lineWidth=2;ctx.strokeRect(25,25,305,105);
  drawBar(45,45,220,18,player.hp/player.maxHp,"#b91616");drawBar(45,78,220,18,stamina/100,"#d6a12c");
  ctx.fillStyle="#f0d9a0";ctx.font="22px Georgia";ctx.fillText(`Score: ${score}`,970,55);ctx.fillText(`Wave: ${wave}`,970,88);ctx.fillText(`Level: ${currentLevel+1}`,970,121);
  ctx.font="16px Georgia";ctx.fillText("HP",275,60);ctx.fillText("ST",275,93);ctx.restore();
}
function drawBar(x,y,w,h,v,c){ctx.fillStyle="#1b1008";ctx.fillRect(x,y,w,h);ctx.fillStyle=c;ctx.fillRect(x,y,w*clamp(v,0,1),h);ctx.strokeStyle="#d4a64d";ctx.strokeRect(x,y,w,h)}
function loop(t){const dt=Math.min(.033,(t-lastTime)/1000||0);lastTime=t;update(dt);draw();requestAnimationFrame(loop)}
function dist(x1,y1,x2,y2){return Math.hypot(x1-x2,y1-y2)}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
resetGame();requestAnimationFrame(loop);

//----------------------------------------------IMPORTAZIONE LIBRERIE LIVE-------------------------------------------------------//
//Three.js core
import * as THREE from 'three';

/*Controls*/
import { OrbitControls } from 'addons/controls/OrbitControls.js';
//import { MapControls } from 'three/addons/controls/MapControls.js';

/*Utils*/
import * as BufferGeometryUtils from 'addons/utils/BufferGeometryUtils.js';
//import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
//import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
//import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
//import { OBB } from '../node_modules/three/examples/jsm/math/OBB.js';

/*Loaders*/
import { GLTFLoader } from 'addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'addons/loaders/KTX2Loader.js';
import { HDRLoader } from 'addons/loaders/HDRLoader.js';

/*GUI*/
import { GUI } from 'addons/libs/lil-gui.module.min.js';

/*Objects*/
import { Lensflare, LensflareElement } from 'addons/objects/Lensflare.js';

/*Eventuali librerie del progetto*/
import { Update } from '../Game.js';
import { Geometrie } from '../EngineParameters.js';

//Three-mesh-bvh (se locale) UTILE PER IL MOTORE FISICO, VELOCIZZA IL BOUNDING PER LE COLLISIONI
//import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVHVisualizer } from './three-mesh-bvh/index.module.0.6.0.js';

let MultiObjects = 0;         //CONTO DELLE MESH GENERATE CON GLI ARRAY "Multi"
let GenericObjects = 0;         //CONTO DELLE MESH GENERATE CON GLI ARRAY "Generic"
let MeshMultiObjects = 0;
let MeshGroupObjects = 0;
let MultiGeom = 0;
let RecycledGeom = 0;
/*-------------------------------------------------PLUGIN CAPACITOR-------------------------------------------------------*/
//#region
//NASCONDERE LA STATUSBAR DI ANDROID
export async function S0_CapacitorStatusBar(LogAlert) {
   const { StatusBar } = await import('@capacitor/status-bar');

   document.addEventListener("deviceready", async () => {
      try {
         await StatusBar.hide();
         if (LogAlert == true) alert("StatusBar nascosta con successo");
      } catch (error) {
         alert("Errore nel nascondere la StatusBar: " + error);
      }
   });
};

//ADMOB
export async function S0_CapacitorAdmob(BannerId, VideoId, LogAlert) {
   const { AdMob, BannerAdSize, BannerAdPosition, RewardAdPluginEvents } = await import('@capacitor-community/admob');

   /*------------------------------------------------ADMOB--------------------------------------------*/
   //Inizializza AdMob
   AdMob.initialize({
      requestTrackingAuthorization: true,          //Per iOS, chiede il consenso per il tracking
      testingDevices: [],                          //Aggiungi qui gli ID dei dispositivi di test
      initializeForTesting: true,                  //Attiva la modalità test
   }).then(() => {
      //Verifica la pagina corrente
      let Page = sessionStorage.getItem('Page');

      if (Page !== "Game" && Page !== "Station") {
         mostraBanner(); //Mostra il banner se la pagina non è "Game"
      } else {
         nascondiBanner(); //Nasconde il banner se la pagina è "Game"
      };
   }).catch(error => {
      if (LogAlert == true) alert("Errore nell'inizializzazione di AdMob: " + error);
   });

   //Funzione per mostrare il banner
   function mostraBanner() {
      AdMob.showBanner({
         adId: BannerId,
         adSize: BannerAdSize.ADAPTIVE_BANNER,
         position: BannerAdPosition.BOTTOM_CENTER,
         margin: 0
      }).then(() => {
         if (LogAlert == true) alert("Banner mostrato!");
      }).catch(error => {
         if (LogAlert == true) alert("Errore nel mostrare il banner: " + error);
      });
   };

   //Funzione per nascondere il banner
   function nascondiBanner() {
      AdMob.hideBanner().then(() => {
         //console.log("Banner nascosto!");
      }).catch(error => {
         //console.error("Errore nel nascondere il banner:", error);
      });
   };

   //Variabile per tracciare se il video è pronto
   let videoPronto = false;

   //Precarica il video premiante
   function caricaVideoPremiante() {
      AdMob.prepareRewardVideoAd({
         adId: VideoId,
      }).catch(error => {
         if (LogAlert == true) alert("Errore nel precaricare il video premiante: " + error);
      });
   };

   //Evento quando il video è caricato
   AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
      videoPronto = true;
      if (LogAlert == true) alert("Video premiante pronto!");
      window.dispatchEvent(new Event("VideoPronto"));
   });

   //Ascolta una sola volta il premio ricevuto
   AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
      window.Premio = { Reward: true };
   });

   //Funzione per mostrare il video premiante
   function mostraVideoPremiante() {
      return new Promise((resolve, reject) => {
         if (!videoPronto) {
            return reject({ Reward: false });
         }

         window.Premio = { Reward: false }; //Reset del premio

         AdMob.showRewardVideoAd()
            .then(() => {
               setTimeout(() => {
                  resolve(window.Premio);
               }, 2000);
            })
            .catch(error => {
               reject({ Reward: false });
            });
      });
   };

   return { caricaVideoPremiante, mostraVideoPremiante };
};

//MANTENERE LO SCHERMO ATTIVO
export async function S0_CapacitorKeepAwake() {
   const { KeepAwake } = await import('@capacitor-community/keep-awake');
};
//#endregion

/*------------------------------------------------FUNZIONI ANDROID-----------------------------------------------------------*/
//#region
export function S0_AndroidAlerts(timeoutSec = 0) {
   let hideTimer = null;
   let visible = false;

   function showError(msg) {
      //Crea (solo quando serve) un overlay fisso per mostrare errori
      let box = document.getElementById("android-error-box");
      if (!box) {
         box = document.createElement("div");
         box.id = "android-error-box";
         box.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            max-height: 50%;
            overflow-y: auto;
            background: rgba(0,0,0,0.85);
            color: #ff5555;
            font-family: monospace;
            font-size: 13px;
            white-space: pre-wrap;
            z-index: 999999;
            padding: 10px;
            display: none;
         `;
         document.body.appendChild(box);
      }

      const time = new Date().toLocaleTimeString();

      //Se il box non è visibile (perché era stato nascosto)
      //ripulisce il testo e lo riapre
      if (!visible) {
         box.textContent = `[${time}] ${msg}\n`;
         box.style.display = "block";
         visible = true;
      } else {
         //Se è già visibile, aggiunge il nuovo messaggio
         box.textContent += `\n[${time}] ${msg}\n`;
      }

      //Se è previsto un timeout, pianifica la scomparsa
      if (timeoutSec > 0) {
         if (hideTimer) clearTimeout(hideTimer);
         hideTimer = setTimeout(() => {
            box.style.display = "none";
            visible = false;
            hideTimer = null;
         }, timeoutSec * 1000);
      }
   }

   window.onerror = function (message, source, lineno, colno, error) {
      const errorMsg =
         `Errore: ${message}\n` +
         `Fonte: ${source}\n` +
         `Linea: ${lineno}, Colonna: ${colno}\n` +
         (error && error.stack ? `Stack:\n${error.stack}` : '');
      showError(errorMsg);
      return true;
   };

   window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason || "Errore sconosciuto (Promise)";
      const msg =
         `Promise non gestita:\n${reason}\n` +
         (reason && reason.stack ? `Stack:\n${reason.stack}` : '');
      showError(msg);
   });
};

//#endregion

/*-------------------------------------------VARIABILI GLOBALI ENGINE--------------------------------------------------------*/
const Version = `1.0.${THREE.REVISION}`;

//#region
let Language = Number(window.localStorage.getItem(`Language`));      //LUNGUA DI SISTEMA - 0 INGLESE - 1 ITALIANO
let Resolution = Number(window.localStorage.getItem(`Resolution`));      //RISOLUZIONE 0 DIMEZZATA - 1 NORMALE
let Antialiasing = Number(window.localStorage.getItem(`Antialiasing`));      //0 OFF - 1 ON
let Par;             //PARAMETRI IMPORTATI
let Oggetti;         //PARAMETRI DEGLI OGGETTI DA CREARE IMPORTATI
let Materiali;       //PARAMETRI DEI MATERIALI DA CREARE IMPORTATI
let PaceDone;
let isPaused = false;

const Testi = {
   Hours: ["Hours", "Ore"]
};

function resumeGame() {
   if (isPaused) {
      isPaused = false;
      animate();
   };
};

function pauseGame() {
   isPaused = true;
};

let renderer;

//CREAZIONE SCENA
const Scene = new THREE.Scene();
Scene.name = "Scene";
var delta = 0;

//CREAZIONE CAMERA
const Camera = new THREE.PerspectiveCamera;        //0 - CAMERA
const CameraGroup = new THREE.Group();             //3 - GRUPPO INERME
CameraGroup.name = "CameraGroup";
const CameraGimbal = new THREE.Group();            //2 - ROTAZIONE MANUALE VISUALE
CameraGimbal.name = "CameraGimbal";
const CameraControl = new THREE.Group();           //1 - GRUPPO TREMOLIO
CameraControl.name = "CameraControl";

//CREAZIONE LUCI
let LuceDirezionale;
const DirLightTarget = new THREE.Object3D();
let LuceAmbientale;
let LuceEmisferica;
let LucePuntiforme;

//VETTORI GENERICI
const VetAsseX = new THREE.Vector3(1, 0, 0);        //VETTORE GENERICO ASSE X
const VetAsseY = new THREE.Vector3(0, 1, 0);        //VETTORE GENERICO ASSE Y
const VetAsseZ = new THREE.Vector3(0, 0, 1);        //VETTORE GENERICO ASSE Z

//GRUPPI E OGGETTI USER
const GroupUser = new THREE.Group();            //GRUPPO GENERALE
GroupUser.name = "GroupUser";
Scene.add(GroupUser);

const UserObjects = new THREE.Group();     //GRUPPO DI OGGETTI ATTACCATI ALLA NAVE SPAZIALE
UserObjects.name = "UserObjects";
UserObjects.add(CameraGroup);

const DirectionGeom = new THREE.CylinderGeometry(0, 5, 10);
DirectionGeom.rotateX(Math.PI / 2);
const DirectionMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const DirectionObject = new THREE.Mesh(DirectionGeom, DirectionMat);
DirectionObject.visible = false;
DirectionObject.name = "DirectionObject";
UserObjects.add(DirectionObject);

GroupUser.add(UserObjects);

const UserModel = new THREE.Group();       //GRUPPO MODELLO 3D DELLA NAVE SPAZIALE
UserModel.name = "UserModel";
GroupUser.add(UserModel);

/*----------------------SCHERMATA DI CARICAMENTO-------------------*/
//LOADER DELLE TEXTURE
let LoaderScreen;
let Loader;
let LoaderKTX2;
let Manager;                        //LOAD MANAGER DI THREE.JS PER LA BARRA DI AVANZAMENTO
//CONTATORI OGGETTI
let TotalTextures = 0;              //TOTALE DELLE TEXTURE DA CARICARE
let LoadedTextures = 0;             //TEXTURE CARICATE
let UrlTexture;                     //NOME TEXTURE IN CARICAMENTO
let TotalGeomPromises = 0;          //TOTALE DELLE PROMISES GEOMETRIE/OGGETTI 3D DA CARICARE
let ActualGeomPromises = 0;         //GEOMETRIE/OGGETTI 3D CARICATI
let PromiseName;
let TotalModules = 0;               //TOTALE DELLI MODULI DA CARICARE
let ActualModules = 0;              //MODULI CARICATI
let UrlModule;                      //NOME MODULO IN CARICAMENTO
let Gamecharge = 0;
let Loaded = false;

const UserDummy = new THREE.Object3D();    //FALSO OGGETTO PER RUOTARE CORRETTAMENTE LA NAVE SPAZIALE
UserDummy.name = "UserDummy";

const GenericGroup = new THREE.Group();      //GRUPPO DI OGGETTI 3D GENERATI O IMPORTATI CHE NON FANNO PARTE DI NESSUNA DIRECTORY

let RotatedObjects = [];                      //GRUPPO OGGETTI ROTANTI
let MotorLights = [];                         //GRUPPO LUCI MOTORE

/*--------------------MOTORE FISICO-------------------------------*/
let PhysicsEngine;         //OGGETTO MOTORE FISICO

/*--------------------DYNAMIC PLANETARY SYSTEM------------------------*/
let Planetary;
let VarPlanetSystem;
let PlanetarySystem;

/*--------------------DYNAMIC PLANET MAP------------------------*/
let VarPlanetMap;

/*-----------------------------------------------------OGGETTI ENGINE---------------------------------------------------*/
let CreationEngine;    //OGGETTO RISULTATO DELLA FUNZIONE CreateObj
const Promises = [];
let MaterialArray;
const MaterialExportArray = [];        //MATERIALI ESPORTATI
const Oggetti3D = {
   Spaceship: {
      Model: [],
   },
   PlanetarySystem: {
      Model: [],
   },
   Generic: {
      Model: [],
   }
};
const UniversalGeom = [];         //ARRAYGEOM

const MicEnginereturn = {
   User: {},
   Lights: {},
   Raycaster: {},
   Monitor: null,
};
//MicEnginereturn.Loader = Loader;

//#endregion

export function S0_SaveSystem() {
   let platform = "local";
   let cache = {};

   function init() {
      try {
         if (typeof PokiSDK !== "undefined" && PokiSDK.getGameData) {
            platform = "poki";
            cache = PokiSDK.getGameData() || {};
            return;
         }
         if (typeof CGSDK !== "undefined" && CGSDK.getGameData) {
            platform = "crazy";
            cache = CGSDK.getGameData() || {};
            return;
         }
      } catch (err) {
         console.error("Errore SDK getGameData:", err);
      }
      platform = "local";
   }

   function setItem(key, value) {
      if (platform === "local") {
         localStorage.setItem(key, value);
      } else {
         cache[key] = value; //aggiorna solo la cache
      }
   }

   function getItem(key) {
      if (platform === "local") return localStorage.getItem(key);
      return cache.hasOwnProperty(key) ? cache[key] : null;
   }

   function removeItem(key) {
      if (platform === "local") {
         localStorage.removeItem(key);
      } else {
         if (cache.hasOwnProperty(key)) {
            delete cache[key]; //solo cache
         }
      }
   }

   function clear() {
      if (platform === "local") {
         localStorage.clear();
      } else {
         cache = {}; //solo cache
      }
   }

   //NUOVO: forza scrittura completa su Poki / CrazyGames
   function update() {
      try {
         if (platform === "poki") PokiSDK.setGameData(cache);
         if (platform === "crazy") CGSDK.setGameData(cache);
      } catch (err) {
         console.error("Errore SDK setGameData:", err);
      }
   }

   //metodi pubblici
   return { init, setItem, getItem, removeItem, clear, update };
};

const SaveSystem = S0_SaveSystem();
SaveSystem.init();

const Bech1 = "3DMark Wild Life Unlimited";
const Bech2 = "3DMark Wild Life Extreme Unlimited";

const GPU = {
   //https://www.notebookcheck.net/
   //3DMark Wild Life Unlimited, voto median
   //3DMark Wild Life Extreme Unlimited, voto median
   Mobile: {
      Adreno: {
         A600: {
            A605: { Score1: null, Score2: null },
            A608: { Score1: null, Score2: null },
            A610: { Score1: 434, Score2: 123 },
            A612: { Score1: 482, Score2: null },
            A613: { Score1: 667, Score2: null },
            A615: { Score1: null, Score2: null },
            A616: { Score1: null, Score2: null },
            A618: { Score1: 934, Score2: null },
            A619L: { Score1: 817.5, Score2: null },
            A619: { Score1: 1196.5, Score2: null },
            A620: { Score1: 1604, Score2: null },
            A630: { Score1: null, Score2: null },
            A640: { Score1: 3436, Score2: null },
            A642L: { Score1: 2493.5, Score2: null },
            A642: { Score1: 3212, Score2: null },
            A643: { Score1: 3135, Score2: null },
            A644: { Score1: 3137, Score2: null },
            A650: { Score1: 4230, Score2: null },
            A660: { Score1: 5761.5, Score2: null },
            A663: { Score1: null, Score2: null },
            A675: { Score1: null, Score2: null },
            A680: { Score1: null, Score2: null },
            A685: { Score1: null, Score2: null },
            A690: { Score1: null, Score2: 3067 },
            A695: { Score1: null, Score2: null },
         },
         A700: {
            A702: { Score1: 0, Score2: null },
            A710: { Score1: 3066, Score2: 793 },
            A720: { Score1: 5496, Score2: 1473.5 },
            A722: { Score1: 7662, Score2: 2042 },
            A725: { Score1: 7701, Score2: 1968 },
            A730: { Score1: 10412, Score2: 2568 },
            A732: { Score1: 11443, Score2: 2937 },
            A735: { Score1: 12074, Score2: 3040 },
            A740: { Score1: 14012, Score2: 3700 },
            A750: { Score1: 19025.5, Score2: 4765 },
         },
         A800: {
            A810: { Score1: 4182, Score2: 1068 },
            A825: { Score1: 17885, Score2: 4490 },
            A829: { Score1: null, Score2: null },
            A830: { Score1: 25212.5, Score2: 6529.5 },
            A840: { Score1: 27032.5, Score2: 6972 },
         },
      },
      Mali_Immortalis: {
         Bifrost_1st: {
            G51_MP4: { Score1: 564, Score2: 155 },
            G71_MP2: { Score1: null, Score2: null },
            G71_MP8: { Score1: null, Score2: null },
            G71_MP20: { Score1: null, Score2: null },
         },
         Bifrost_2nd: {
            G52_MP1: { Score1: 426, Score2: 117 },
            G52_MP2: { Score1: 713.5, Score2: 180 },
            G52_MP6: { Score1: null, Score2: null },
            G72_MP3: { Score1: 652.5, Score2: 185 },
            G72_MP12: { Score1: null, Score2: null },
            G72_MP18: { Score1: null, Score2: null },
         },
         Bifrost_3rd: {
            G76_MP4: { Score1: 1387, Score2: 381 },
            G76_MP10: { Score1: null, Score2: null },
            G76_MP12: { Score1: null, Score2: null },
         },
         Valhall_1st: {
            G57_MP1: { Score1: 422, Score2: 113 },
            G57_MP2: { Score1: 1209, Score2: 334.5 },
            G57_MP3: { Score1: 1226, Score2: 366 },
            G57_MP4: { Score1: 1620, Score2: 434 },
            G57_MP5: { Score1: null, Score2: null },
            G77_MP9: { Score1: 4405, Score2: 1256 },
            G77_MP11: { Score1: 4221.5, Score2: 1391 },
         },
         Valhall_2nd: {
            G68_MP2: { Score1: 1351, Score2: 351 },
            G68_MP4: { Score1: 2242.5, Score2: 619 },
            G68_MP5: { Score1: 2955, Score2: 825 },
         },
         Valhall_3rd: {
            G310: null,
            G510: null,
            G610_MP3: { Score1: 2583, Score2: 693 },
            G710_MP7: { Score1: 6721, Score2: 1807 },
            G710_MP10: { Score1: 8644, Score2: 2373 },
         },
         Valhall_4th: {
            G615_MP2: { Score1: 3140, Score2: 851.5 },
            G615_MP6: { Score1: 10371, Score2: 2953 },
            G715_MP7: { Score1: 9150, Score2: 2560.5 },
            IG715_MP11: { Score1: 12831, Score2: 3454 },
         },
         Valhall_5th: {
            G620: null,
            G720_MP7: { Score1: 12954.5, Score2: 3817 },
            G720_MP8: { Score1: null, Score2: null },
            IG720_MP12: { Score1: 17982.5, Score2: 5268.5 },
            G625: null,
            G725: null,
            IG925_MP11: { Score1: null, Score2: null },
            IG925_MP12: { Score1: 22436, Score2: 6076 },
            IG925_MP16: { Score1: 21789, Score2: 6294 },
            G1_PRO: null,
            G1_PREMIUM: null,
            G1_ULTRA_MP12: { Score1: 26432.5, Score2: 7149.5 },
         },
      },
   },
   Desktop: {

   },
};

/*-------------------------------------------------GEOMETRIE THREE.JS-------------------------------------------------------*/
/*IMPLEMENTARE IN TUTTO IL CODICE PER RIDURRE LE CHIAMATE ALLA LIBRERIA THREE.JS*/
//#region
function E3_GeoBox(DimX, DimY, DimZ, SegX, SegY, SegZ) {
   //const BoxGeom = E3_GeoBox(10, 10, 10, 1, 1, 1);
   const Geometry = new THREE.BoxGeometry(DimX, DimY, DimZ, SegX, SegY, SegZ);
   return Geometry;
};

function E3_GeoCylinder(RadTop, RadBottom, Height, RadSeg, HeightSeg, OpenEnded, thetaStart, thetaLength) {
   //const LiquidGeom = E3_GeoCylinder(1.9, 1.9, 3.5, 32, 1, false, 0, Math.PI * 2);
   const Geometry = new THREE.CylinderGeometry(RadTop, RadBottom, Height, RadSeg, HeightSeg, OpenEnded, thetaStart, thetaLength);
   return Geometry;
};

function E3_GeoSphere(Rad, RadSeg, HeightSeg, Start, Length, thetaStart, thetaLength) {
   //const PlanetGeom1 = E3_GeoSphere(1000, RadSeg[0], HeightSeg[0], 0, Math.PI * 2, 0, Math.PI);
   const Geometry = new THREE.SphereGeometry(Rad, RadSeg, HeightSeg, Start, Length, thetaStart, thetaLength);
   return Geometry;
};

function E3_GeoRing(InRad, OutRad, DiamSeg, HeightSeg, thetaStart, thetaLength) {
   //const RingGeom1 = E3_GeoRing(0, 1000, 64, 2, 0, Math.PI * 2);
   const Geometry = new THREE.RingGeometry(InRad, OutRad, DiamSeg, HeightSeg, thetaStart, thetaLength);
   return Geometry;
};

function E3_GeoPlane(DimX, DimY, SegX, SegY) {
   const Geometry = new THREE.PlaneGeometry(DimX, DimY, SegX, SegY);
   return Geometry;
};

function E3_GeoCircle(Rad, RadSeg, thetaStart, thetaLength) {
   //const CircleGeom = E3_GeoCircle(Obj.lensRadius, 64, 0, Math.PI);
   const Geometry = new THREE.CircleGeometry(Rad, RadSeg, thetaStart, thetaLength);
   return Geometry;
};
//NUVOLA DI PUNTI PARAMETRIZZATA
function E3_GenerateFilamentCloud(options = {}) {
   //VALORI DI DEFAULT IN CASO NON VENGANO INSERITI
   const shape = options.shape || "cube";                      //FORMA "cube" o "sphere"
   const count = options.count || 1000;                        //NUMERO DI PUNTI
   const spaceSize = options.spaceSize || 20;                  //LATO DEL CUBO O DIAMETRO DELLA SFERA
   const numFilaments = options.numFilaments || 5;             //NUMERO DI FILAMENTI
   const filamentLength = options.filamentLength || 10;        //LUNGHEZZA DEI FILAMENTI
   const filamentSegments = options.filamentSegments || 5;     //NUMERO DEI SEGMENTI PER FILAMENTO
   const filamentRadius = options.filamentRadius || 1;         //RAGGIO MASSIMO ATTORNO AL QUALE SI DISTRIBUISCONO I PUNTI ATTORNO AL FILAMENTO
   const filamentDensity = options.filamentDensity || 0.7;     //PERCENTUALE DEI PUNTI CHE VANNO ATTORNO AI FILAMENTI (0-1)

   //Genera filamenti come array di punti intermedi
   const filaments = [];
   for (let i = 0; i < numFilaments; i++) {
      const startX = (Math.random() - 0.5) * spaceSize;
      const startY = (Math.random() - 0.5) * spaceSize;
      const startZ = (Math.random() - 0.5) * spaceSize;

      const filament = [];
      for (let s = 0; s <= filamentSegments; s++) {
         const t = s / filamentSegments;
         filament.push({
            x: startX + (Math.random() - 0.5) * filamentLength * 0.3 + t * (Math.random() - 0.5) * filamentLength,
            y: startY + (Math.random() - 0.5) * filamentLength * 0.3 + t * (Math.random() - 0.5) * filamentLength,
            z: startZ + (Math.random() - 0.5) * filamentLength * 0.3 + t * (Math.random() - 0.5) * filamentLength
         });
      }
      filaments.push(filament);
   }

   const positions = new Float32Array(count * 3);

   for (let i = 0; i < count; i++) {
      let x, y, z;

      if (Math.random() < filamentDensity) {
         //Punto vicino a un filamento
         const filament = filaments[Math.floor(Math.random() * filaments.length)];
         const segIndex = Math.floor(Math.random() * (filament.length - 1));
         const p1 = filament[segIndex];
         const p2 = filament[segIndex + 1];
         const t = Math.random();
         const px = p1.x + t * (p2.x - p1.x);
         const py = p1.y + t * (p2.y - p1.y);
         const pz = p1.z + t * (p2.z - p1.z);
         const r = Math.random() * filamentRadius;
         const theta = Math.random() * 2 * Math.PI;
         const phi = Math.acos(2 * Math.random() - 1);
         x = px + r * Math.sin(phi) * Math.cos(theta);
         y = py + r * Math.sin(phi) * Math.sin(theta);
         z = pz + r * Math.cos(phi);
      } else {
         //Punto sparso nello spazio (cube o sphere)
         if (shape === "sphere") {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = Math.cbrt(Math.random()) * (spaceSize * 0.5); //distribuzione uniforme
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
         };
         if (shape === "cube") {
            x = (Math.random() - 0.5) * spaceSize;
            y = (Math.random() - 0.5) * spaceSize;
            z = (Math.random() - 0.5) * spaceSize;
         };
      };

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
   }

   const geometry = new THREE.BufferGeometry();
   geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
   return geometry;
};

/*ESTRUSIONE*/
function ExtrudeGeom(Object) {
   //-----------------------------SEZIONI--------------------------------//
   function RettangoloForato(sizeX, sizeY, width, Hole) {
      let shape = new THREE.Shape([
         new THREE.Vector2(0, 0),
         new THREE.Vector2(sizeX, 0),
         new THREE.Vector2(sizeX, sizeY),
         new THREE.Vector2(0, sizeY)
      ]);
      if (Hole == true) {
         let hole = new THREE.Path([
            new THREE.Vector2(width, width),
            new THREE.Vector2(width, sizeY - width),
            new THREE.Vector2(sizeX - width, sizeY - width),
            new THREE.Vector2(sizeX - width, width)
         ]);
         shape.holes.push(hole);
      };
      return shape;
   };
   function Cerchio(Inizio, Fine, Raggio, width, Hole) {
      const Curve = new THREE.Shape();
      Curve.arc(0, 0, Raggio, Inizio, Fine);
      if (Hole == true) {
         const hole = new THREE.Shape();
         hole.arc(0, 0, Raggio - width, Inizio, Fine);
         Curve.holes.push(hole);
      };
      return Curve;
   };
   function Custom(Points, Smooth) {
      let Shape;

      //LINEE RETTE TRA I PUNTI
      if (Smooth == false) {
         let ShapePoints = [];
         for (let i = 0; i < Points.length; i++) {
            ShapePoints.push(new THREE.Vector2(Points[i].x, Points[i].y));
         };
         Shape = new THREE.Shape(ShapePoints);
      };

      //LINEE MORBIDE TRA I PUNTI
      if (Smooth == true) {
         Shape = new THREE.Shape();
         function drawSmoothCurve(Points) {
            Shape.moveTo(Points[0].x, Points[0].y);
            for (let i = 1; i < Points.length - 1; i++) {
               const xc = (Points[i].x + Points[i + 1].x) / 2;
               const yc = (Points[i].y + Points[i + 1].y) / 2;
               Shape.quadraticCurveTo(Points[i].x, Points[i].y, xc, yc);
            };
            Shape.lineTo(Points[Points.length - 1].x, Points[Points.length - 1].y);
         };
         drawSmoothCurve(Points)
      };

      return Shape
   };

   let Shape;
   if (Object.Sezione == "Rettangolo") Shape = RettangoloForato(Object.Altezza, Object.Larghezza, Object.Spessore, Object.Foro);
   if (Object.Sezione == "Cerchio") Shape = Cerchio(Object.CerchioInizio, Object.CerchioFine, Object.CerchioRaggio, Object.CerchioSpessore, Object.CerchioForo);
   if (Object.Sezione == "Custom") Shape = Custom(Object.CustomPoints, Object.CustomSmooth);

   //------------------------------------CURVE------------------------------------//
   const CatmullRom = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-100, 0, 0),
      new THREE.Vector3(0, -100, 0),
      new THREE.Vector3(100, 0, 0),
   ]);
   CatmullRom.curveType = 'catmullrom';    //centripetal, chordal and catmullrom.
   CatmullRom.closed = false;

   const QuadraticBezier = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-100, 0, 0),
      new THREE.Vector3(0, 0, -100),
      new THREE.Vector3(100, 0, 0),
   );

   const Linear = new THREE.Shape();
   Linear.moveTo(0, 0);
   Linear.lineTo(0, 100);

   const Curve = new THREE.Curve();
   Curve.getPoint = function (t) {
      //var segment = (Object.CurveStart - Object.CurveEnd) * t;
      var segment = Object.CurveStart + (Object.CurveEnd - Object.CurveStart) * t;
      if (Object.CurveAxe == "YZ") {
         if (Object.CurveAngle == "CosSin") return new THREE.Vector3(
            0,
            Object.CurveRaggio * Math.cos(segment),
            Object.CurveRaggio * Math.sin(segment),
         );
         if (Object.CurveAngle == "SinCos") return new THREE.Vector3(
            0,
            Object.CurveRaggio * Math.sin(segment),
            Object.CurveRaggio * Math.cos(segment),
         );
      };
      if (Object.CurveAxe == "XY") {
         if (Object.CurveAngle == "CosSin") return new THREE.Vector3(
            Object.CurveRaggio * Math.cos(segment),
            Object.CurveRaggio * Math.sin(segment),
            0,
         );
         if (Object.CurveAngle == "SinCos") return new THREE.Vector3(
            Object.CurveRaggio * Math.sin(segment),
            Object.CurveRaggio * Math.cos(segment),
            0,
         );
      };
      if (Object.CurveAxe == "XZ") {
         if (Object.CurveAngle == "CosSin") return new THREE.Vector3(
            Object.CurveRaggio * Math.cos(segment),
            0,
            Object.CurveRaggio * Math.sin(segment),
         );
         if (Object.CurveAngle == "SinCos") return new THREE.Vector3(
            Object.CurveRaggio * Math.sin(segment),
            0,
            Object.CurveRaggio * Math.cos(segment),
         );
      };
   };

   //--------------------------PARAMETRI FORMA ESTRUSA---------------------------//
   const extrudeSettings = {
      //curveSegments:12,
      steps: Object.Segmenti,
      bevelEnabled: Object.Smusso,    //Applica la smussatura alla forma
      bevelThickness: Object.SmussoSpessore,     //Quanto in profondità nella forma originale va la smussatura (0.2)
      bevelSize: Object.SmussoDimensione,    //Distanza dal contorno della forma a cui si estende lo smusso (0.1)
      bevelOffset: Object.SmussoOffset,       //Distanza dal contorno della forma a cui inizia lo smusso (0)
      bevelSegments: Object.SmussoSeg,     //Numero di strati di smusso (3)
   };
   if (Object.Estrusione == "CatmullRom") extrudeSettings.extrudePath = CatmullRom;
   if (Object.Estrusione == "QuadraticBezier") extrudeSettings.extrudePath = QuadraticBezier;
   if (Object.Estrusione == "Linear") extrudeSettings.depth = Object.LinearZ;
   if (Object.Estrusione == "Curve") extrudeSettings.extrudePath = Curve;

   //----------------------------GEOMETRIA ESTRUSA------------------------------//
   const Geometry = new THREE.ExtrudeGeometry(Shape, extrudeSettings);

   return Geometry;
};

//#endregion

/*-------------------------------------------------MATERIALI THREE.JS-------------------------------------------------------*/
//#region
/*FUNZIONE CON ISTRUZIONI COMUNI A TUTTI I MATERIALI*/
function E2_CommonMaterialsSettings(Obj, texture, rgb) {
   texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
   texture.repeat.set(Obj.RepeatX, Obj.RepeatY);
   if (rgb == true) texture.colorSpace = THREE.SRGBColorSpace;
   if (rgb == false) texture.colorSpace = THREE.LinearSRGBColorSpace;

   /*
   map (diffuse)	   colore	   THREE.SRGBColorSpace
   emissiveMap	      colore	   THREE.SRGBColorSpace
   lightMap	         colore	   THREE.SRGBColorSpace
   envMap	         colore	   THREE.SRGBColorSpace
   normalMap	      non colore	THREE.LinearSRGBColorSpace
   roughnessMap	   non colore	THREE.LinearSRGBColorSpace
   metalnessMap	   non colore	THREE.LinearSRGBColorSpace
   displacementMap	non colore	THREE.LinearSRGBColorSpace
   bumpMap	         non colore	THREE.LinearSRGBColorSpace
   aoMap	            non colore	THREE.LinearSRGBColorSpace
   alphaMap	         non colore	THREE.LinearSRGBColorSpace
   */
};

async function E3_LoadEditTexture(Obj, TextureMap, rgb) {
   const url = TextureMap;
   //RICONOSCIMENTO ESTENSIONE
   const extension = url.split('.').pop().toLowerCase();
   //CARICAMENTO LOADER CORRETTO
   let SelectedLoader;
   if (extension == "jpg" || extension == "png" || extension == "webp") SelectedLoader = Loader;
   if (extension == "ktx2") SelectedLoader = LoaderKTX2;
   const texture = await SelectedLoader.loadAsync(url);
   //EDITAZIONE TEXTURE
   texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
   //REPEAT, MAPLOD, ALPHAROTATION
   if (Obj) {
      texture.repeat.set(Obj.RepeatX, Obj.RepeatY);
      if (Obj.MapLod) {
         texture.generateMipmaps = true;  //Abilita il mipmapping
         texture.minFilter = THREE.LinearMipmapLinearFilter; //Migliora la qualità a distanza
         texture.magFilter = THREE.LinearFilter; //Mantiene una buona qualità da vicino
      };
      if (Obj.AlphaMapRotation) texture.rotation = Obj.AlphaMapRotation;
   };
   //COLORSPACE
   if (rgb == true) texture.colorSpace = THREE.SRGBColorSpace;
   if (rgb == false) texture.colorSpace = THREE.LinearSRGBColorSpace;

   /*
   map (diffuse)	   colore	   THREE.SRGBColorSpace
   emissiveMap	      colore	   THREE.SRGBColorSpace
   lightMap	         colore	   THREE.SRGBColorSpace
   envMap	         colore	   THREE.SRGBColorSpace
   normalMap	      non colore	THREE.LinearSRGBColorSpace
   roughnessMap	   non colore	THREE.LinearSRGBColorSpace
   metalnessMap	   non colore	THREE.LinearSRGBColorSpace
   displacementMap	non colore	THREE.LinearSRGBColorSpace
   bumpMap	         non colore	THREE.LinearSRGBColorSpace
   aoMap	            non colore	THREE.LinearSRGBColorSpace
   alphaMap	         non colore	THREE.LinearSRGBColorSpace
   */

   return texture;
};

/*MATERIALE BASE COMPLETO UNICO (MeshBasicMaterial)*/
async function E3_MaterialeBase(Object) {
   /*
   E3_MaterialeBase({
        RepeatX: 1,
        RepeatY: 1,
        Side: "Double",          //"Front", "Double"
        Color: 0x00ff00,
        Transparent: true,
        DepthWrite: true,             //SI COMPORTA DA MATERIALE SOLIDO OPACO (DEFAULT TRUE)
        Opacity: 1,
        Blink: 0,            //TEMPO LAMPEGGIO
        //MAPPA COLORE
        Map: false,
        //MapTexture: ``,
        AlphaMap: true,
        AlphaMapTexture: `../../SpaceGame/texture/Sfumato.jpg`,
        AlphaMapRotation: Math.PI / 2
   });
   */
   const Materiale = new THREE.MeshBasicMaterial({
      color: Object.Color,
      transparent: Object.Transparent,
      opacity: Object.Opacity,
   });
   Materiale.name = Object.Name;

   if (Object.Side == "Front") Materiale.side = THREE.FrontSide;
   if (Object.Side == "Double") Materiale.side = THREE.DoubleSide;
   if (Object.Side == "Back") Materiale.side = THREE.BackSide;

   if (Object.DepthWrite == false) Materiale.depthWrite = Object.DepthWrite;

   //Array di promesse per caricare le texture in parallelo
   const texturePromises = [];

   //MAPPA BASE
   if (Object.Map) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.MapTexture, true)
            .then(tex => {
               Materiale.map = tex;
            })
      );
   };
   //MAPPA ALPHA
   if (Object.AlphaMap === true) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.AlphaMapTexture, false)
            .then(tex => {
               Materiale.alphaMap = tex;
            })
      );
   };
   //MAPPA ALPHA CIRCOLARE
   if (Object.AlphaMap === "CircularGradient") {
      Materiale.alphaMap = E3_CircularGradient(Object.CircularGradient);
   };
   //Aspetta che tutte le texture siano caricate
   await Promise.all(texturePromises);

   Materiale.needsUpdate = true;
   return Materiale;
};

function E3_MaterialeBaseColor(Color) {
   /* 
   const Esempio = VarObjectExport.E3_MaterialeBase(0xd1ffff);
    */
   const Materiale = new THREE.MeshBasicMaterial({
      color: Color
   });
   Materiale.needsUpdate = true;
   return Materiale;
};

/*MATERIALE STANDARD COMPLETO UNICO (MeshStandardMaterial)*/
async function E3_MaterialeStandard(Object) {
   const Materiale = new THREE.MeshStandardMaterial({
      normalScale: new THREE.Vector2(1, 1),
      flatShading: Object.FlatShading,
      color: Object.Color,
      transparent: Object.Transparent,
      opacity: Object.Opacity,
      emissive: Object.Emissive,
      emissiveIntensity: Object.EmissiveIntensity,
      metalness: Object.Metalness,
      roughness: Object.Roughness,
   });
   Materiale.name = Object.Name;

   if (Object.Side == "Front") Materiale.side = THREE.FrontSide;
   if (Object.Side == "Double") Materiale.side = THREE.DoubleSide;
   if (Object.Side == "Back") Materiale.side = THREE.BackSide;

   if (Object.DepthWrite == false) Materiale.depthWrite = Object.DepthWrite;

   //Array di promesse per caricare le texture in parallelo
   const texturePromises = [];

   if (Object.Map) texturePromises.push(E3_LoadEditTexture(Object, Object.MapTexture, true).then(tex => { Materiale.map = tex; }));
   if (Object.NormalMap) texturePromises.push(E3_LoadEditTexture(Object, Object.NormalMapTexture, false).then(tex => { Materiale.normalMap = tex; }));
   if (Object.MetalMap) texturePromises.push(E3_LoadEditTexture(Object, Object.MetalMapTexture, false).then(tex => { Materiale.metalnessMap = tex; }));
   if (Object.RoughMap) texturePromises.push(E3_LoadEditTexture(Object, Object.RoughMapTexture, false).then(tex => { Materiale.roughnessMap = tex; }));
   if (Object.DisplacementMap) texturePromises.push(E3_LoadEditTexture(Object, Object.DisplacementMapTexture, false).then(tex => { Materiale.displacementMap = tex; Materiale.displacementScale = Object.Displacement; }));
   if (Object.EmissiveMap) texturePromises.push(E3_LoadEditTexture(Object, Object.EmissiveMapTexture, true).then(tex => { Materiale.emissiveMap = tex; }));

   //Aspetta che tutte le texture siano pronte
   await Promise.all(texturePromises);

   Materiale.needsUpdate = true;
   return Materiale;
};

/*MATERIALE LUCIDO COMPLETO UNICO (MeshPhongMaterial)*/
async function E3_MaterialeLucido(Object) {
   const Materiale = new THREE.MeshPhongMaterial({
      normalScale: new THREE.Vector2(1, 1),
      flatShading: Object.FlatShading,
      shininess: Object.Shininess,
      specular: Object.Specular,
      color: Object.Color,
      transparent: Object.Transparent,
      opacity: Object.Opacity,
      emissive: Object.Emissive,
      emissiveIntensity: Object.EmissiveIntensity,
   });
   Materiale.name = Object.Name;

   if (Object.Side == "Front") Materiale.side = THREE.FrontSide;
   if (Object.Side == "Double") Materiale.side = THREE.DoubleSide;
   if (Object.Side == "Back") Materiale.side = THREE.BackSide;

   if (Object.DepthWrite == false) Materiale.depthWrite = Object.DepthWrite;

   //Array di promesse per caricare le texture in parallelo
   const texturePromises = [];

   //MAPPA BASE
   if (Object.Map) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.MapTexture, true)
            .then(tex => { Materiale.map = tex; })
      );
   };

   //MAPPA NORMALE
   if (Object.NormalMap) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.NormalMapTexture, false)
            .then(tex => { Materiale.normalMap = tex; })
      );
   };

   //MAPPA SPESSORE
   if (Object.DisplacementMap) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.DisplacementMapTexture, false)
            .then(tex => {
               Materiale.displacementMap = tex;
               Materiale.displacementScale = Object.Displacement;
            })
      );
   };

   //Aspetta che tutte le texture siano caricate
   await Promise.all(texturePromises);

   Materiale.needsUpdate = true;
   return Materiale;
};

//MATERIALE OPACO COMPLETO UNICO (MeshLambertMaterial)
async function E3_MaterialeOpaco(Object) {
   const Materiale = new THREE.MeshLambertMaterial({
      normalScale: new THREE.Vector2(1, 1),
      flatShading: Object.FlatShading,
      color: Object.Color,
      transparent: Object.Transparent,
      opacity: Object.Opacity,
      emissive: Object.Emissive,
      emissiveIntensity: Object.EmissiveIntensity,
   });
   Materiale.name = Object.Name;

   if (Object.Side == "Front") Materiale.side = THREE.FrontSide;
   if (Object.Side == "Double") Materiale.side = THREE.DoubleSide;
   if (Object.Side == "Back") Materiale.side = THREE.BackSide;

   if (Object.DepthWrite == false) Materiale.depthWrite = Object.DepthWrite;

   //Array di promesse per caricare le texture in parallelo
   const texturePromises = [];

   //MAPPA BASE
   if (Object.Map) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.MapTexture, true)
            .then(tex => {
               if (Object.MapLod) {
                  tex.generateMipmaps = true;
                  tex.minFilter = THREE.LinearMipmapLinearFilter;
                  tex.magFilter = THREE.LinearFilter;
               }
               Materiale.map = tex;
            })
      );
   };
   //MAPPA NORMALE
   if (Object.NormalMap) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.NormalMapTexture, false)
            .then(tex => { Materiale.normalMap = tex; })
      );
   };
   //MAPPA SPESSORE
   if (Object.DisplacementMap) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.DisplacementMapTexture, false)
            .then(tex => {
               Materiale.displacementMap = tex;
               Materiale.displacementScale = Object.Displacement;
            })
      );
   };
   //MAPPA EMISSIVA
   if (Object.EmissiveMap) {
      texturePromises.push(
         E3_LoadEditTexture(Object, Object.EmissiveMapTexture, true)
            .then(tex => { Materiale.emissiveMap = tex; })
      );
   };

   //Aspetta che tutte le texture siano caricate
   await Promise.all(texturePromises);

   Materiale.needsUpdate = true;
   return Materiale;
};

function E3_MaterialePunti(Object) {
   /*
   const Esempio = E3_MaterialePunti({
      Color: 0xd1ffff,
      Size: 1,
      SizeAttenuation: true
    });
   */
   const Materiale = new THREE.PointsMaterial({
      color: Object.Color,
      size: Object.Size,
      sizeAttenuation: Object.SizeAttenuation
   });

   return Materiale;
};

//MATERIALE SPRITE
function E3_MaterialeSprite(Object) {
   /* 
   const Esempio = E3_MaterialeSprite({
      RepeatX: 1,
      RepeatY: 1,
      Color: 0xd1ffff,
      Transparent: true,
      SizeAttenuation: true,            //L'OGGETTO CAMBIA LA SUA DIMENSIONE CON LA DISTANZA
      //Opacity: 1,
      //MAPPA COLORE
      Map: true,
      MapTexture: `../../SpaceGame/texture/AmbientCG/MetalPlates004_1K/Base2.jpg`,
    });
    */

   const Materiale = new THREE.SpriteMaterial({
      color: Object.Color,
      transparent: Object.Transparent,
      sizeAttenuation: Object.SizeAttenuation,
   });

   //MAPPA BASE
   if (Object.Map == true) {
      Loader.load(Object.MapTexture, (texture) => {
         E2_CommonMaterialsSettings(Object, texture, true);
         Materiale.map = texture;
         Materiale.needsUpdate = true;
      });
   };

   return Materiale;
};
//#endregion

/*--------------------------------------------MATERIALI PERSONALIZZATI THREE.JS----------------------------------------------*/
//#region
//MATERIALE SHADER PERSONALIZZATO BAGLIORE SFUMATO COLORATO E ANIMATO
function E3_ShaderGlow(Obj) {
   const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
         glowColor: { value: new THREE.Color(Obj.Color) },
         viewVector: { value: new THREE.Vector3(1, 0, 0) },
         glowIntensity: { value: Obj.Intensity }
      },
      vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
      fragmentShader: `
      uniform vec3 glowColor;
      uniform float glowIntensity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        float angle = dot(vNormal, normalize(vViewPosition));
        float intensity = pow(max(0.0, 0.6 - angle), 3.0) * glowIntensity;

        //Manteniamo la sfumatura originale senza pulsazione
        gl_FragColor = vec4(glowColor * intensity, intensity);
      }
    `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
   });

   function SetColor(Color) {          //IMPOSTA UN NUOVO COLORE
      glowMaterial.uniforms.glowColor.value.setHex(Color);
   };
   function SetIntensity(Intensity) {  //IMPOSTA UNA NUOVA INTENSITÀ
      glowMaterial.uniforms.glowIntensity.value = Intensity;
   };

   glowMaterial.SetColor = SetColor;
   glowMaterial.SetIntensity = SetIntensity;

   return glowMaterial;
};

//MATERIALE SHADER PERSONALIZZATO LENTE CAMBIO DI TEXTURE
async function E3_ShaderLens2(Obj) {

   const Texture1 = await E3_LoadEditTexture(null, Obj.Texture1, true);

   const Texture2 = [];
   for (let i = 0; i < Obj.Texture2.length; i++) {
      Texture2[i] = await E3_LoadEditTexture(null, Obj.Texture2[i], true);
   }

   //UNIFORM DATI LENTE
   const lensWorldPos = E3_Vector3(
      Obj.lensPosition[0],
      Obj.lensPosition[1],
      Obj.lensPosition[2]
   );

   const lensWorldNormal = E3_Vector3(
      Obj.lensNormal[0],
      Obj.lensNormal[1],
      Obj.lensNormal[2]
   ).normalize();

   const material = new THREE.ShaderMaterial({

      extensions: { derivatives: true },

      uniforms: {

         //texture
         map1: { value: Texture1 },
         map2: { value: Texture2[0] },

         //lente IN VIEW SPACE
         lensPosition: { value: new THREE.Vector3() },
         lensNormal: { value: new THREE.Vector3(0, 0, -1) },
         lensRadius: {
            value: Obj.lensType === 'circular'
               ? Obj.lensRadius
               : Obj.lensSize * Math.SQRT1_2
         },

         //luci
         ambientColor: { value: new THREE.Color(1, 1, 1) },
         ambientIntensity: { value: 0.0 },
         directionalColor: { value: new THREE.Color(1, 1, 1) },
         directionalIntensity: { value: 0.0 },
         lightDirection: { value: new THREE.Vector3(0, 1, 0) },

         gamma: { value: Obj.gamma }
      },

      //VERTEX SHADER (VIEW SPACE)
      vertexShader: `
         varying vec3 vViewPos;
         varying vec3 vViewNormal;
         varying vec2 vUv;

         void main() {

            vUv = uv;

            vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
            vViewPos = viewPos.xyz;

            vViewNormal = normalize(normalMatrix * normal);

            gl_Position = projectionMatrix * viewPos;
         }
      `,

      //FRAGMENT SHADER (STABILE)
      fragmentShader: `
         precision highp float;

         uniform sampler2D map1;
         uniform sampler2D map2;

         uniform vec3 lensPosition;   //VIEW SPACE
         uniform vec3 lensNormal;     //VIEW SPACE
         uniform float lensRadius;

         uniform vec3 ambientColor;
         uniform float ambientIntensity;
         uniform vec3 directionalColor;
         uniform float directionalIntensity;
         uniform vec3 lightDirection;

         uniform float gamma;

         varying vec3 vViewPos;
         varying vec3 vViewNormal;
         varying vec2 vUv;

         void main() {

            //Camera in view space = (0,0,0)
            vec3 rayDir = normalize(vViewPos);

            float denom = dot(lensNormal, rayDir);

            vec4 texColor = texture2D(map1, vUv);

            if (denom > 0.0001) {

               float t = dot(lensPosition, lensNormal) / denom;

               if (t > 0.0) {

                  vec3 intersect = rayDir * t;
                  vec3 offset = intersect - lensPosition;

                  vec4 lensColor = texture2D(map2, vUv);

                  ${Obj.lensType === 'circular' ? `
                     float dist = length(offset);
                     float w = fwidth(dist);
                     float a = 1.0 - smoothstep(lensRadius - w, lensRadius + w, dist);
                     texColor = mix(texColor, lensColor, a);
                  ` : `
                     float dx = abs(offset.x);
                     float dy = abs(offset.y);

                     float wx = fwidth(dx);
                     float wy = fwidth(dy);

                     float ax = 1.0 - smoothstep(lensRadius - wx, lensRadius + wx, dx);
                     float ay = 1.0 - smoothstep(lensRadius - wy, lensRadius + wy, dy);

                     float a = ax * ay;
                     texColor = mix(texColor, lensColor, a);
                  `}
               }
            }

            //Illuminazione
            vec3 N = normalize(vViewNormal);
            vec3 L = normalize(lightDirection);
            float diff = max(dot(N, L), 0.0);

            vec3 linearTex = pow(texColor.rgb, vec3(2.2));

            vec3 litColor =
               linearTex *
               (ambientColor * ambientIntensity +
                directionalColor * directionalIntensity * diff);

            vec3 finalColor = pow(litColor, vec3(gamma));

            gl_FragColor = vec4(finalColor, texColor.a);
         }
      `
   });

   //UPDATE FUNCTIONS (FONDAMENTALI – NON TOCCARE)
   const tmpVec3 = E3_Vector3();
   const tmpQuat = E3_Quaternion();

   function UpdateLensPosition(lensObj) {
      //World → View space
      lensObj.getWorldPosition(tmpVec3);
      tmpVec3.applyMatrix4(Camera.matrixWorldInverse);
      material.uniforms.lensPosition.value.copy(tmpVec3);
   };

   function UpdateLensRotation(lensObj) {
      lensObj.getWorldQuaternion(tmpQuat);

      const worldNormal = lensWorldNormal.clone().applyQuaternion(tmpQuat);
      worldNormal.transformDirection(Camera.matrixWorldInverse);

      material.uniforms.lensNormal.value.copy(worldNormal.normalize());
   };

   function UpdateAmbientlLight(AmbientLight) {
      material.uniforms.ambientColor.value.copy(AmbientLight.color);
      material.uniforms.ambientIntensity.value = AmbientLight.intensity;
   };

   function UpdateDirectionalLight(DirectionalLight, ObjectTarget) {

      const lightWorldPos = E3_Vector3();
      const objWorldPos = E3_Vector3();

      DirectionalLight.getWorldPosition(lightWorldPos);
      ObjectTarget.getWorldPosition(objWorldPos);

      //direzione luce in WORLD space
      const lightDirWorld = lightWorldPos.sub(objWorldPos).normalize();

      //WORLD → VIEW space
      lightDirWorld.transformDirection(Camera.matrixWorldInverse);

      material.uniforms.lightDirection.value.copy(lightDirWorld.normalize());
      material.uniforms.directionalColor.value.copy(DirectionalLight.color);
      material.uniforms.directionalIntensity.value = DirectionalLight.intensity;
   };

   function UpdateMap2(Texture2Index) {
      material.uniforms.map2.value = Texture2[Texture2Index];
   };

   material.UpdateLensPosition = UpdateLensPosition;
   material.UpdateLensRotation = UpdateLensRotation;
   material.UpdateAmbientlLight = UpdateAmbientlLight;
   material.UpdateDirectionalLight = UpdateDirectionalLight;
   material.UpdateMap2 = UpdateMap2;

   return material;
};

//STAMPA NUMERO DOCK
function E3_StampCanvas(Oggetto, GroupNum, Num) {
   /*
   const Stamp = MicEnginereturn.VarObject.E3_StampCanvas({
         Width: 300,              //LARGHEZZA MESH PIANO
         Height: 300,             //ALTEZZA MESH PIANO
         Font: 100,              //GRANDEZZA FONT IN PIXEL (MINORE DI HEIGHT)
         Color: "#ff0000",       //COLORE FONT
         InitGroup: "",           //GRUPPO INIZIALE
         InitNum: "",             //NUMERO INIZIALE
      }, "", 2);
            */
   //----------------------------------CANVAS--------------------------------------//
   const Canvas = document.createElement('canvas');
   const ImageCanvas = Canvas.getContext('2d');
   Canvas.height = Oggetto.Width;
   Canvas.width = Oggetto.Height;
   ImageCanvas.font = `${Oggetto.Font}px Serif`;
   const TextureCanvas = new THREE.Texture(Canvas);
   ImageCanvas.fillStyle = Oggetto.Color;

   //CREAZIONE MESH INDICATORE DESTINAZIONE
   const MatCanvas = new THREE.MeshBasicMaterial({
      map: TextureCanvas,
      transparent: true,
      depthWrite: false
   });

   //AGGIORNAMENTO CANVAS
   let PosY = (Oggetto.Height - Oggetto.Font) / 2 + Oggetto.Font;
   ImageCanvas.clearRect(0, 0, Oggetto.Width, Oggetto.Height);
   if (GroupNum != "") ImageCanvas.fillText(`${Oggetto.InitGroup}${GroupNum}-${Oggetto.InitNum}${Num}`, 0, PosY);
   else ImageCanvas.fillText(`${Oggetto.InitNum}${Num}`, 0, PosY);
   MatCanvas.map.needsUpdate = true;

   return MatCanvas;
};

function E3_ShaderOverlay(Obj) {
   /*
   const overlayMaterial = E3_ShaderOverlay({
      Color: 0x000000,
      Softness: 0.2,
   });
   */
   const overlayMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
         uTime: { value: 0.0 },                                   //animazione
         uColor: { value: new THREE.Color(Obj.Color) },           //colore di sfumatura
         uSoftness: { value: Obj.Softness }                       //morbidezza del bordo
      },
      vertexShader: `
         varying vec2 vUv;
         void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
         }
      `,
      fragmentShader: `
         uniform float uTime;
         uniform vec3 uColor;
         uniform float uSoftness;
         varying vec2 vUv;
         void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);

            //Raggio che parte da 0 (tutto visibile) e si allarga fino a coprire il centro
            float radius = uTime;

            //Calcola quanto il pixel deve essere coperto
            float alpha = smoothstep(radius - uSoftness, radius, dist);

            gl_FragColor = vec4(uColor, alpha);
         }
      `
   });

   /*IMPOSTA IL TEMPO*/
   /*
   0-1 FADE 100%-0% - RISVEGLIO
   1-0 FADE 0%-100% - ADDORMENTAMENTO
   if (Time < 1) {
         Time += 0.005;
         overlayMaterial.SetTime(Time);
      }
   */
   overlayMaterial.SetFade = function (Fade) {
      overlayMaterial.uniforms.uTime.value = Fade;
   };

   return overlayMaterial;
};

//#endregion

/*-------------------------------------------------OGGETTI THREE.JS-------------------------------------------------------*/
//#region
/*GRUPPO THREE.JS*/
function E3_Group(Name) {
   const group = new THREE.Group();
   if (Name) group.name = Name;
   return group;
};

function E3_Object3D(Name) {
   const object = new THREE.Object3D();
   if (Name) object.name = Name;
   return object;
};

function E3_Vector3(X, Y, Z) {
   const vector = new THREE.Vector3();
   if (X) vector.setX(X);
   if (Y) vector.setY(Y);
   if (Z) vector.setZ(Z);
   return vector;
};

function E3_Quaternion(X, Y, Z, W) {
   const quaternion = new THREE.Quaternion();
   if (X) quaternion.x = X;
   if (Y) quaternion.y = Y;
   if (Z) quaternion.z = Z;
   if (W) quaternion.w = W;
   return quaternion;
};

function E3_Matrix4() {
   const matrix4 = new THREE.Matrix4();
   return matrix4;
};

function E3_Euler() {
   const euler = new THREE.Euler();
   return euler;
};

/*GENERATORE MESH AGGIUNTO AL GRUPPO*/
function E3_GenMesh(Group, Geom, Material, Position, Rotation, Scale, Name, Visible, Shadows) {
   //E3_GenMesh(TerminalGroup, TerminalGeom1, StructureMaterial1, [0, 0, 0], [0, 0, 0], [1, 1, 1], "", true, false);
   const Mesh = new THREE.Mesh(Geom, Material);
   if (Position[0] != 0 || Position[1] != 0 || Position[2] != 0) Mesh.position.set(Position[0], Position[1], Position[2]);
   if (Rotation[0] != 0 || Rotation[1] != 0 || Rotation[2] != 0) Mesh.rotation.set(Rotation[0], Rotation[1], Rotation[2]);
   if (Scale[0] != 0 || Scale[1] != 0 || Scale[2] != 0) Mesh.scale.set(Scale[0], Scale[1], Scale[2]);
   if (Name != "") Mesh.name = Name;
   if (Visible == false) Mesh.visible = false;
   if (Shadows == true) Mesh.receiveShadow = true;

   Group.add(Mesh);

   return Mesh;
};

function E3_UniversalMesh(Object) {
   /*
   const Mesh = E3_UniversalMesh({
      //PARAMETRI OBBLIGATORI:
      Geom: GEOMETRIA,
      Material: MATERIALE,
      //PARAMETRI OPZIONALI
      Type: "Mesh",
      Name: "Nome",
      Position: [0, 0, 0],
      Rotation: [0, 0, 0],
      Scale: [0, 0, 0],
      Visible: true,
      Shadows: false,
      Group: GROUP
   });
   */
   let Mesh;
   /*
   NOTA: "Type" in Object CONTROLLA SOLO SE IL PARAMETRO ESISTE QUINDI DA true ANCHE SE È undefined, QUINDI SI VERIFICA ANCHE CHE NON
   SIA undefined, IN QUESTO MODO FUNZIONA SIA CHE OMETTO IL PARAMETRO, SIA CHE IL PARAMETRO SIA undefined
   */

   if ("Type" in Object && Object.Type != undefined) {
      if (Object.Type == "Mesh") Mesh = new THREE.Mesh(Object.Geom, Object.Material);
      if (Object.Type == "Points") Mesh = new THREE.Points(Object.Geom, Object.Material);
   }
   else Mesh = new THREE.Mesh(Object.Geom, Object.Material);

   if ("Name" in Object && Object.Name != undefined) Mesh.name = Object.Name;
   if ("Visible" in Object && Object.Visible != undefined) Mesh.visible = Object.Visible;
   if ("Shadows" in Object && Object.Shadows != undefined) Mesh.receiveShadow = Object.Shadows;
   if ("Position" in Object && Object.Position != undefined) Mesh.position.set(Object.Position[0], Object.Position[1], Object.Position[2]);
   if ("Rotation" in Object && Object.Rotation != undefined) Mesh.rotation.set(Object.Rotation[0], Object.Rotation[1], Object.Rotation[2]);
   if ("Scale" in Object && Object.Scale != undefined) Mesh.scale.set(Object.Scale[0], Object.Scale[1], Object.Scale[2]);

   if ("Group" in Object && Object.Group != undefined) Object.Group.add(Mesh);

   return Mesh;
};

//DISEGNO LINEA GENERICA
function E3_GenericLine(Object) {
   /*
   const line = E3_GenericLine({
      Color: 0x0000ff,
      Linewidth: 10,
      StartLine: {
      x: 0,
      y: 0,
      z: 0
      },
      EndLine: {
      x: PosWorld.x,
      y: PosWorld.y,
      z: PosWorld.z
      }
   });
*/
   const material = new THREE.LineBasicMaterial({
      color: Object.Color,
      linewidth: 1
   });

   if (Object.Linewidth) material.linewidth = Object.Linewidth;

   const points = [];
   points.push(new THREE.Vector3(Object.StartLine.x, Object.StartLine.y, Object.StartLine.z));
   points.push(new THREE.Vector3(Object.EndLine.x, Object.EndLine.y, Object.EndLine.z));

   const geometry = new THREE.BufferGeometry().setFromPoints(points);

   const line = new THREE.Line(geometry, material);
   Scene.add(line);

   //FUNZIONE CHE AGGIORNA I PUNTI DELLA LINEA
   line.UpdateLine = function (start, end) {
      /*
      Laser[i].UpdateLine({ x: 0, y: -1, z: 0 }, { x: 2, y: 2, z: 2 });
      */
      const newPoints = [
         new THREE.Vector3(start.x, start.y, start.z),
         new THREE.Vector3(end.x, end.y, end.z)
      ];
      this.geometry.setFromPoints(newPoints);
   };

   return line;
};

function CreateSpotLight(Object) {
   const LuceSpot = new THREE.SpotLight(Object.Color, Object.Intensity, Object.Distance, Object.Angle, Object.Penumbra, Object.Decay);
   LuceSpot.name = "LuceSpot";
   LuceSpot.position.set(Object.PosX, Object.PosY, Object.PosZ);
   LuceSpot.target.position.set(Object.TargetX, Object.TargetY, Object.TargetZ);
   Scene.add(LuceSpot);
   Scene.add(LuceSpot.target);
   return LuceSpot;
};

//MAPPE ALPHA
function E3_CircularGradient(Obj) {
   /*
   const Texture = E3_CircularGradient({
      Size: 512,             //RISOLUZIOBNE DELLA TEXTURE
      InnerRadius: 0.8,       //RAGGIO INTERNO DELLA SFUMATURA (COEFFICIENTE DEL RAGGIO)
      Feather: 0.2,           //RAGGIO SFUMATO (COEFFICIENTE DEL RAGGIO)(MAX=1-InnerRadius)
      Invert: false           //INVERSIONE
   });
   */

   const canvas = document.createElement('canvas');
   canvas.width = canvas.height = Obj.Size;
   const ctx = canvas.getContext('2d');

   const gradient = ctx.createRadialGradient(
      Obj.Size / 2, Obj.Size / 2, 0,       //centro
      Obj.Size / 2, Obj.Size / 2, Obj.Size / 2   //bordo
   );

   if (!Obj.Invert) {
      //centro invisibile → bordo opaco
      gradient.addColorStop(0, 'black');
      gradient.addColorStop(Obj.InnerRadius, 'black');
      gradient.addColorStop(Obj.InnerRadius + Obj.Feather, 'white');
      gradient.addColorStop(1, 'white');
   } else {
      //centro opaco → bordo trasparente
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(Obj.InnerRadius, 'white');
      gradient.addColorStop(Obj.InnerRadius + Obj.Feather, 'black');
      gradient.addColorStop(1, 'black');
   }

   ctx.fillStyle = gradient;
   ctx.fillRect(0, 0, Obj.Size, Obj.Size);

   const texture = new THREE.CanvasTexture(canvas);
   texture.minFilter = THREE.LinearFilter;
   texture.magFilter = THREE.LinearFilter;
   return texture;
};

//CREA UN GRUPPO CON UNO SPRITE ALL'INTERNO
function E3_GroupCanvasSprite(Obj) {
   /*
   const GroupSole = E3_GroupCanvasSprite({
      GroupName: "GroupSunlight",
      SpriteName: "SpriteSole",
      Sprite: Par.DynamicCockpit.SunSprite,
      SpritePos: { x: 0, y: 0, z: Par.Camera.CameraFar / 100 },
      Opacity: 0.8,
   });
   */
   const GroupObj = E3_Group(Obj.GroupName)
   const SpriteObj = new THREE.Sprite(new THREE.SpriteMaterial({
      map: Loader.load(Obj.Sprite),
      depthWrite: false,
      depthTest: true,
      opacity: Obj.Opacity,
   }));
   SpriteObj.name = Obj.SpriteName;
   SpriteObj.position.set(Obj.SpritePos.x, Obj.SpritePos.y, Obj.SpritePos.z);

   GroupObj.add(SpriteObj);

   return GroupObj;
};

//#endregion

/*---------------------------------------------------FUNZIONI CANVAS------------------------------------------------------*/
//#region
/*GENERAZIONE MENU HUD*/
export function S0_GenerateHUDCanvas(config) {
   /* ISTRUZIONI
      CREAZIONE
      const CommonStaticStationHUD = S0_GenerateHUDCanvas(CommonStaticStationHUDObj, {
            DispatchEvent: "Render",    //"Render", null
            Width: 1,                   //LARGHEZZA
            Height: 1,                  //ALTEZZA
            Top: 0,                     //POSIZIONE VERTICALE DALL'ALTO
         });
   
      RIDISEGNA L'INTERO CANVAS
      HUD.render();

      RESETTA I PARAMETRI DEL CANVAS A SEGUITO DEL RESIZE
      HUD.resetCanvas();
   
      -------------------------------PULSANTI-------------------------------------
      MOSTRA O NASCONDI UN PULSANTE
      HUD.showButton(0, true);

      IMPOSTA IL LAYER DI UN PULSANTE (true=ALTO, false=DEFAULT BASSO)
      HUDObj.topLayerButto(0, true);

      CAMBIA IL COLORE DEL PULSANTE
      HUD.setButtonColor(0, "#ff0000");

      IMPOSTA IL TESTO DEL PULSANTE (OPZIONALE FONTSIZE "15px", ALTRIMENTI PRENDE QUELLO DI DEFAULT)
      HUD.setButtonText(0, "Ciao", "15px");

      IMPOSTA LA POSIZIONE DEL PULSANTE (COMPLETA)
      HUD.setButtonPos(0, "Left", "100px", "Top", "100px");

      IMPOSTA LA POSIZIONE X DEL PULSANTE MANTENENDO I FLAG E LA POSIZIONE Y INVARIATA
      HUD.setButtonPosX(0, "100px");

      IMPOSTA LA POSIZIONE Y DEL PULSANTE MANTENENDO I FLAG E LA POSIZIONE X INVARIATA
      HUD.setButtonPosY(0, "100px");

      IMPOSTA L'ALTEZZA DEL PULSANTE
      HUD.setButtonHeight(1, "100%");

      IMPOSTA LA LARGHEZZA DEL PULSANTE
      HUD.setButtonWidth(1, "100%");

      ASSOCIA UNA FUNZIONE ALLA PRESSIONE (METODO POINTER)
      HUD.setButtonCallback(0, () => {
         console.log("Pulsante 0 premuto!");
      });

      ASSOCIA UNA FUNZIONE AL RILASCIO (METODO POINTER)
      HUD.setButtonCallbackUp(0, () => {
         console.log("Pulsante 0 premuto!");
      });

      --------------------------------BARRE---------------------------------------
      MOSTRA O NASCONDI UNA BARRA
      HUD.showBar(0, true);

      IMPOSTA IL LAYER DI UNA BARRA (true=ALTO, false=DEFAULT BASSO)
      HUDObj.topLayerBar(0, true);

      CAMBIA IL COLORE DELLA BARRA (BarColor, BarColorValue)
      HUD.setBarColor(0, "#222222", "#00ff00");

      IMPOSTA IL TESTO DELLA BARRA
      HUD.setBarText(0, "Ciao");

      IMPOSTA LA POSIZIONE DELLA BARRA (COMPLETA)
      HUD.setBarPos(0, "Left", "100px", "Top", "100px");

      IMPOSTA LA POSIZIONE X DELLA BARRA MANTENENDO I FLAG E LA POSIZIONE Y INVARIATA
      HUD.setBarPosX(0, "100px");

      IMPOSTA LA POSIZIONE Y DELLA BARRA MANTENENDO I FLAG E LA POSIZIONE X INVARIATA
      HUD.setBarPosY(0, "100px");

      IMPOSTA IL VALORE DELLA BARRA (0-1)
      HUD.setBarValue(0, 0.5);

      CREA UNA SECONDA BARRA SIPRA QUELLA ESISTENTE IMPOSTANDO INDICE, COLORE, INIZIO (0-1), VALORE (-1 - 0 - 1)
      HUD.createSecondBar(0, "rgb(255,0,0)", FuelBarValue, VarObject.BarRadarPerc * 0.01);
      ELIMINA LA SECONDA BARRA
      HUD.createSecondBar(0, null, 0, 0);


      ASSOCIA UNA FUNZIONE ALLA PRESSIONE (METODO POINTER)
      HUD.setBarCallback(0, () => {
         console.log("Pulsante 0 premuto!");
      });

      ASSOCIA UNA FUNZIONE AL RILASCIO (METODO POINTER)
      HUD.setBarCallbackUp(0, () => {
         console.log("Pulsante 0 premuto!");
      });

      --------------------------------IMMAGINI---------------------------------------
      MOSTRA O NASCONDI UN'IMMAGINE
      HUD.showImage(0, true);

      IMPOSTA IL LAYER DI UN'IMMAGINE (true=ALTO, false=DEFAULT BASSO)
      HUDObj.topLayerImage(0, true);

      IMPOSTA LA POSIZIONE DEL PULSANTE (COMPLETA)
      HUD.setImagePos(0, "Left", "100px", "Top", "100px");

      IMPOSTA LA POSIZIONE X DEL PULSANTE MANTENENDO I FLAG E LA POSIZIONE Y INVARIATA
      HUD.setImagePosX(0, "100px");

      IMPOSTA LA POSIZIONE Y DEL PULSANTE MANTENENDO I FLAG E LA POSIZIONE X INVARIATA
      HUD.setImagePosY(0, "100px");

      IMPOSTA LA TEXTURE DELL'IMMAGINE
      HUD.setImageUrl(0, "SpaceGame/texture/Clip/DestinazioneGiallo50.png");

      IMPOSTA UNA SFOCATURA ALL'IMMAGINE (IL VALORE DI BLUR SARÀ CONVERTITO IN PX DENTRO LA FUNZIONE, UN VALORE PARI A 0 DISATTIVA IL BLUR)
      HUD.setBlur(0, 12);

      SCURISCI L'IMMAGINE (0-1)
      HUD.setDark(0, 1);
      */

   /*----------------------------GENERAZIONE CANVAS---------------------------------------*/
   const canvas = document.createElement('canvas');
   const ratio = window.devicePixelRatio;
   canvas.width = window.innerWidth * config.Width * ratio;
   canvas.height = window.innerHeight * config.Height * ratio;
   canvas.style.width = `${window.innerWidth * config.Width}px`;
   canvas.style.height = `${window.innerHeight * config.Height}px`;
   canvas.style.position = 'absolute';
   canvas.style.top = `${config.Top * 100}%`;
   if (config.Left) canvas.style.left = `${config.Left * 100}%`;
   else canvas.style.left = `${(window.innerWidth - window.innerWidth * config.Width) * 0.5}px`;

   canvas.style.pointerEvents = 'auto';
   canvas.style.touchAction = "none";
   canvas.style.zIndex = config.ZIndex;

   //PARENT DI DEFAULT DOCUMENT
   if (!config.Parent || config.Parent == "Document") document.body.appendChild(canvas);
   //PARENT DIV SCROLLABILE
   if (config.Parent == "ScrollDiv") {
      const canvasContainer = document.createElement("div");

      canvasContainer.style.position = "relative";
      canvasContainer.style.top = `${window.innerHeight * config.ScrollDiv.Top}px`;        //parte dello schermo
      canvasContainer.style.left = `${window.innerWidth * config.ScrollDiv.Left}px`;        //parte dello schermo
      canvasContainer.style.width = `${window.innerWidth * config.ScrollDiv.Width}px`;        //parte dello schermo
      canvasContainer.style.height = `${window.innerHeight * config.ScrollDiv.Height}px`;        //parte dello schermo
      canvasContainer.style.overflowY = "auto";     //scroll verticale
      canvasContainer.style.overflowX = "hidden";
      canvasContainer.style.touchAction = "pan-y";  //abilita swipe verticale

      document.body.appendChild(canvasContainer);
      canvasContainer.appendChild(canvas);
   };

   const ctx = canvas.getContext('2d');

   const HUDObj = {
      canvas,
      ctx,
      Pulsanti: [],
      Barre: [],
      Immagini: [],
      callbacks: {},
      callbacksUp: {},
      callbacksBar: {},
      callbacksUpBar: {},
   };

   //--- Utility per convertire "px" e "%" ---
   function parseSize(value, reference, axisRefs = {}) {
      if (typeof value === "string") {

         //percentuale di un asse specifico
         if (value.endsWith("%w")) {
            return (parseFloat(value) / 100) * axisRefs.width;
         }

         if (value.endsWith("%h")) {
            return (parseFloat(value) / 100) * axisRefs.height;
         }

         //percentuale normale (asse corrente)
         if (value.endsWith("%")) {
            return (parseFloat(value) / 100) * reference;
         }

         //pixel
         if (value.endsWith("px")) {
            return parseFloat(value) * ratio;
         }
      }

      return parseFloat(value);
   };

   function parsePos2(flag, PosX, topFlag, PosY, Rotate) {
      let x, y;

      if (flag === "Left") x = parseSize(PosX, canvas.width, canvas);
      else x = canvas.width - parseSize(PosX, canvas.width, canvas);

      if (topFlag === "Top") y = parseSize(PosY, canvas.height, canvas);
      else y = canvas.height - parseSize(PosY, canvas.height, canvas);

      return { x, y };
   };

   //A CAPO AUTOMATICO
   function wrapText(ctx, text, maxWidth) {
      const paragraphs = text.split("\n");
      const lines = [];

      paragraphs.forEach(paragraph => {
         const words = paragraph.split(" ");
         let currentLine = "";

         words.forEach(word => {
            const testLine = currentLine ? currentLine + " " + word : word;
            const width = ctx.measureText(testLine).width;

            if (width <= maxWidth) {
               currentLine = testLine;
            } else {
               if (currentLine) lines.push(currentLine);
               currentLine = word;
            }
         });

         if (currentLine) lines.push(currentLine);
      });

      return lines;
   }

   function GenerateObjects() {
      HUDObj.Pulsanti = [];
      HUDObj.Barre = [];
      HUDObj.Immagini = [];

      //-----PULSANTI-----
      for (let i = 0; i < config.Pulsanti; i++) {
         const pos = parsePos2(
            config.PulsPos[i].RightFlag || "Left",
            config.PulsPos[i].PosX,
            config.PulsPos[i].TopFlag || "Top",
            config.PulsPos[i].PosY,
            null
         );

         const width = parseSize(config.PulsSize[i].Width, canvas.width, canvas);
         const height = parseSize(config.PulsSize[i].Height, canvas.height, canvas);

         HUDObj.Pulsanti.push({
            x: pos.x,
            y: pos.y,
            width,
            height,
            color: config.PulsColor[i],
            text: config.PulsName[i],
            fontSize: ratio * parseInt(config.PulsFontSize) || 20,
            fontFamily: config.FontFamily,
            visible: true,
            topLayer: false
         });
      };

      //-----BARRE-----
      for (let i = 0; i < (config.Barre || 0); i++) {
         const pos = parsePos2(
            config.BarPos[i].RightFlag || "Left",
            config.BarPos[i].PosX,
            config.BarPos[i].TopFlag || "Top",
            config.BarPos[i].PosY,
            config.BarRotate[i]
         );

         const width = parseSize(config.BarSize[i].Width, canvas.width, canvas);
         const height = parseSize(config.BarSize[i].Height, canvas.height, canvas);

         HUDObj.Barre.push({
            x: pos.x,
            y: pos.y,
            width,
            height,
            color: config.BarColor[i],
            valueColor: config.BarColorValue[i],
            value: 1.0,
            fontSize: ratio * parseInt(config.BarFontSize) || 20,
            fontFamily: config.FontFamily,
            rotate: config.BarRotate[i] || 0,
            text: "",
            visible: true,
            topLayer: false,
            //DATI SECONDA BARRA
            valueColor2: null,
            value2Start: 0,
            value2: 0,
         });

      };

      //-----IMMAGINI-----
      for (let i = 0; i < (config.Immagini || 0); i++) {
         const pos = parsePos2(
            config.ImgPos[i].RightFlag || "Left",
            config.ImgPos[i].PosX,
            config.ImgPos[i].TopFlag || "Top",
            config.ImgPos[i].PosY,
            null
         );

         const width = parseSize(config.ImgSize[i].Width, canvas.width, canvas);
         const height = parseSize(config.ImgSize[i].Height, canvas.height, canvas);

         const img = new Image();
         if (config.ImgUrl[i]) img.src = config.ImgUrl[i];

         HUDObj.Immagini.push({
            img,
            x: pos.x,
            y: pos.y,
            width,
            height,
            visible: true,
            blur: 0,
            dark: 0,
            topLayer: false
         });
      };
   };
   GenerateObjects();

   //--- Render ---
   HUDObj.render = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      function DrawButton(p) {
         ctx.save();

         //Centra il disegno
         ctx.translate(p.x, p.y);

         if (config.Style === "Neon") {
            ctx.shadowColor = 'rgba(0,255,255,0.5)';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = 'rgba(0,255,255,0.4)';
            ctx.lineWidth = 2;
         }

         //Rettangolo centrato
         ctx.fillStyle = p.color;
         ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
         if (config.Style === "Neon") ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height);

         //Testo
         ctx.fillStyle = config.PulsFontColor;
         ctx.shadowColor = (config.Style === "Neon") ? 'rgba(0,255,255,0.7)' : 'transparent';
         ctx.shadowBlur = (config.Style === "Neon") ? 5 : 0;
         ctx.font = `${p.fontSize}px ${p.fontFamily}`;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';

         //const lines = p.text.split("\n");
         const padding = 10;
         const maxTextWidth = p.width - padding * 2;
         const lines = wrapText(ctx, p.text, maxTextWidth);

         const lineHeight = p.fontSize * 1.2;
         const totalHeight = lineHeight * lines.length;
         const startY = -totalHeight / 2 + lineHeight / 2;

         lines.forEach((line, i) => {
            ctx.fillText(line.trim(), 0, startY + i * lineHeight);
         });
         ctx.restore();
      };
      function DrawBar(b) {
         ctx.save();

         //Muove l'origine nel centro della barra
         ctx.translate(b.x, b.y);

         //Rotazione della barra
         const rot = (b.rotate * Math.PI) / 180;
         ctx.rotate(rot);

         //--- Disegno barra ruotata ---
         if (config.Style === "Neon") {
            ctx.shadowColor = 'rgba(0,255,255,0.5)';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = 'rgba(0,255,255,0.4)';
            ctx.lineWidth = 2;
         }

         //Sfondo barra
         ctx.fillStyle = b.color;
         ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
         if (config.Style === "Neon") ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

         //Riempimento barra dal basso verso l'alto
         ctx.fillStyle = b.valueColor;
         ctx.fillRect(
            -b.width / 2,
            b.height / 2 - b.height * b.value,
            b.width,
            b.height * b.value
         );

         //RIEMPIMENTO SECONDA BARRA
         if (b.valueColor2) {
            ctx.fillStyle = b.valueColor2;
            ctx.fillRect(
               -b.width / 2,      //stessa larghezza
               b.height / 2 - b.height * b.value2Start,                 //metà di b.height rispetto al centro
               b.width,
               -b.height * b.value2
            );
         };

         //--- Testo sempre dritto ---
         ctx.save();           //salva lo stato dopo la rotazione
         ctx.rotate(-rot);     //rotazione inversa → testo non ruotato

         ctx.fillStyle = config.BarFontColor;
         ctx.shadowColor = (config.Style === "Neon") ? 'rgba(0,255,255,0.7)' : 'transparent';
         ctx.shadowBlur = (config.Style === "Neon") ? 5 : 0;
         ctx.font = `${b.fontSize}px ${b.fontFamily}`;
         ctx.textAlign = "center";
         ctx.textBaseline = "middle";

         const lines = b.text.split("\n");
         const lineHeight = b.fontSize * 1.2;
         const totalHeight = lineHeight * lines.length;
         const startY = -totalHeight / 2 + lineHeight / 2;

         lines.forEach((line, i) => {
            ctx.fillText(line.trim(), 0, startY + i * lineHeight);
         });

         ctx.restore();  //ripristina dopo solo per il testo
         ctx.restore();  //ripristina tutto
      };
      function DrawImage(i) {
         ctx.save();
         if (i.blur > 0) ctx.filter = `blur(${i.blur}px)`;
         ctx.translate(i.x, i.y);

         ctx.drawImage(
            i.img,
            -i.width / 2,
            -i.height / 2,
            i.width,
            i.height
         );
         ctx.restore();

         if (i.dark > 0) {
            ctx.save();
            ctx.translate(i.x, i.y);
            ctx.fillStyle = `rgba(0, 0, 0, ${i.dark})`;
            ctx.fillRect(-i.width / 2, -i.height / 2, i.width, i.height);
            ctx.restore();
         };
         //RICHIAMA IL RENDER APPENA L'IMMAGINE È CARICATA
         i.img.onload = () => {
            HUDObj.render();
         };
      };


      //LAYER0 --- Pulsanti ---
      HUDObj.Pulsanti.forEach(p => {
         if (!p.visible) return;
         if (p.topLayer) return;
         DrawButton(p);
      });

      //LAYER1 --- Barre ---
      HUDObj.Barre.forEach(b => {
         if (!b.visible) return;
         if (b.topLayer) return;
         DrawBar(b);
      });

      //LAYER2 --- IMMAGINI ---
      HUDObj.Immagini.forEach(i => {
         if (!i.visible) return;
         if (i.topLayer) return;
         DrawImage(i);
      });

      /*----ELEMENTI CON TOPLAYER TRUE--------*/
      //LAYER3 --- Pulsanti ---
      HUDObj.Pulsanti.forEach(p => {
         if (!p.visible) return;
         if (!p.topLayer) return;
         DrawButton(p);
      });

      //LAYER4 --- Barre ---
      HUDObj.Barre.forEach(b => {
         if (!b.visible) return;
         if (!b.topLayer) return;
         DrawBar(b);
      });

      //LAYER5 --- IMMAGINI ---
      HUDObj.Immagini.forEach(i => {
         if (!i.visible) return;
         if (!i.topLayer) return;
         DrawImage(i);
      });

   };

   HUDObj.resetCanvas = function () {
      const ratio = window.devicePixelRatio;
      canvas.width = window.innerWidth * config.Width * ratio;
      canvas.height = window.innerHeight * config.Height * ratio;
      canvas.style.width = `${window.innerWidth * config.Width}px`;
      canvas.style.height = `${window.innerHeight * config.Height}px`;
      canvas.style.position = 'absolute';
      canvas.style.top = `${config.Top * 100}%`;
      if (config.Left) canvas.style.left = `${config.Left * 100}%`;
      else canvas.style.left = `${(window.innerWidth - window.innerWidth * config.Width) * 0.5}px`;
      canvas.style.pointerEvents = 'auto';
      canvas.style.touchAction = "none";
      canvas.style.zIndex = config.ZIndex;

      GenerateObjects();
   };



   //------------------------ CALLBACK PULSANTI ---------------------------------//
   HUDObj.setButtonCallback = function (index, callback) {
      HUDObj.callbacks[index] = callback;
   };

   HUDObj.setButtonCallbackUp = function (index, callback) {
      HUDObj.callbacksUp[index] = callback;
   };

   //-------------------------- CALLBACK BARRE ----------------------------------//
   HUDObj.setBarCallback = function (index, callback) {
      HUDObj.callbacksBar[index] = callback;
   };

   HUDObj.setBarCallbackUp = function (index, callback) {
      HUDObj.callbacksUpBar[index] = callback;
   };

   /*-------------------------- COLLISIONE CLICK --------------------------------*/
   //CONFRONTO CON UN RETTANGOLO RUOTATO (BARRA)
   function pointInRotatedRect(px, py, rect) {
      const cx = rect.x;
      const cy = rect.y;
      const w = rect.width;
      const h = rect.height;
      const rot = (rect.rotate * Math.PI) / 180;

      //Trasla il punto nel sistema del rettangolo
      const dx = px - cx;
      const dy = py - cy;

      //Ruotazione inversa
      const cos = Math.cos(-rot);
      const sin = Math.sin(-rot);

      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;

      //Test AABB locale
      return (
         localX >= -w / 2 &&
         localX <= w / 2 &&
         localY >= -h / 2 &&
         localY <= h / 2
      );
   };

   function hitTest(x, y) {
      let handled = false;

      HUDObj.Pulsanti.forEach((p, i) => {
         if (!p.visible) return;

         //Poiché x, y ora rappresentano il centro
         const left = p.x - p.width / 2;
         const right = p.x + p.width / 2;
         const top = p.y - p.height / 2;
         const bottom = p.y + p.height / 2;

         if (x >= left && x <= right && y >= top && y <= bottom) {
            if (HUDObj.callbacks[i]) HUDObj.callbacks[i]();
            handled = true;
         }
      });
      HUDObj.Barre.forEach((b, i) => {
         if (!b.visible) return;

         if (pointInRotatedRect(x, y, b)) {
            if (HUDObj.callbacksBar[i]) {
               HUDObj.callbacksBar[i]();
            }
            handled = true;
         }
      });
      return handled;
   };

   function ResetHitTest() {
      HUDObj.Pulsanti.forEach((p, i) => {
         if (HUDObj.callbacksUp[i]) HUDObj.callbacksUp[i]();
      });
      HUDObj.Barre.forEach((b, i) => {
         if (HUDObj.callbacksUpBar[i]) HUDObj.callbacksUpBar[i]();
      });
   };

   //Mappa per tenere traccia dei tocchi attivi e se sono stati gestiti dal menu
   const activePointers = new Map();

   //Helper per dispatch al renderer o altro target
   function dispatchToUnderCanvas(e, overrideType) {
      if (!config.DispatchEvent) return;

      let UnderCanvas;

      if (config.DispatchEvent === "Render") UnderCanvas = renderer.domElement;
      else UnderCanvas = config.DispatchEvent;

      const newEvent = new PointerEvent(overrideType || e.type, {
         bubbles: true,
         cancelable: true,
         clientX: e.clientX,
         clientY: e.clientY,
         button: e.button,
         pointerId: e.pointerId,
         pointerType: e.pointerType,
         isPrimary: e.isPrimary,
         buttons: e.buttons,
         width: e.width,
         height: e.height,
         pressure: e.pressure
      });

      UnderCanvas.dispatchEvent(newEvent);
   };

   if (config.Events == true) {
      canvas.addEventListener('contextmenu', e => {
         e.preventDefault();
      });

      //POINTERDOWN
      canvas.addEventListener('pointerdown', e => {
         const rect = canvas.getBoundingClientRect();
         const x = (e.clientX - rect.left) * ratio;
         const y = (e.clientY - rect.top) * ratio;

         const handled = hitTest(x, y);
         activePointers.set(e.pointerId, handled);

         if (!handled && config.DispatchEvent) {
            dispatchToUnderCanvas(e);
         } else {
            e.preventDefault();
         };
      }, { passive: false });

      //POINTERMOVE (MODIFICATO PER PERMETTERE LO SCROLL)
      canvas.addEventListener('pointermove', e => {
         const handled = activePointers.get(e.pointerId);

         if (handled === true) {
            e.preventDefault(); //drag su canvas
         } else {
            //lascia scorrere il container
            if (config.DispatchEvent) {
               dispatchToUnderCanvas(e);
            }
         }
      }, { passive: false });

      //POINTERUP
      canvas.addEventListener('pointerup', e => {
         const handled = activePointers.get(e.pointerId);

         if (handled === false) {
            if (config.DispatchEvent) dispatchToUnderCanvas(e);
         } else {
            ResetHitTest();
            e.preventDefault();
         }

         activePointers.delete(e.pointerId);
      }, { passive: false });

      //POINTERCANCEL
      canvas.addEventListener('pointercancel', e => {
         const handled = activePointers.get(e.pointerId);

         if (handled === false) {
            if (config.DispatchEvent) dispatchToUnderCanvas(e, "pointerup");
         } else {
            ResetHitTest();
            e.preventDefault();
         }

         activePointers.delete(e.pointerId);
      }, { passive: false });
   }
   else canvas.style.pointerEvents = 'none';



   /* --------------------------- FUNZIONI UTILITÀ -------------------------------*/
   //PULSANTI
   HUDObj.showButton = function (index, show = true) {
      if (HUDObj.Pulsanti[index]) HUDObj.Pulsanti[index].visible = show;
   };
   HUDObj.topLayerButton = function (index, topLayer) {
      if (HUDObj.Pulsanti[index]) HUDObj.Pulsanti[index].topLayer = topLayer;
   };
   HUDObj.setButtonColor = function (index, color) {
      if (HUDObj.Pulsanti[index]) {
         HUDObj.Pulsanti[index].color = color;
      }
   };
   HUDObj.setButtonText = function (index, text, fontSize) {
      if (HUDObj.Pulsanti[index]) {
         HUDObj.Pulsanti[index].text = text;
         if (fontSize) HUDObj.Pulsanti[index].fontSize = ratio * parseInt(fontSize);
      }
   };
   HUDObj.setButtonPos = function (index, RightFlag, PosX, TopFlag, PosY) {
      const pos = parsePos2(RightFlag, PosX, TopFlag, PosY, null);
      if (HUDObj.Pulsanti[index]) {
         HUDObj.Pulsanti[index].x = pos.x;
         HUDObj.Pulsanti[index].y = pos.y;
      };
   };
   HUDObj.setButtonPosX = function (index, PosX) {
      const pos = parsePos2(
         config.PulsPos[index].RightFlag || "Left",
         PosX,
         config.PulsPos[index].TopFlag || "Top",
         config.PulsPos[index].PosY,
         null
      );
      if (HUDObj.Pulsanti[index]) {
         HUDObj.Pulsanti[index].x = pos.x;
         HUDObj.Pulsanti[index].y = pos.y;
      };
   };
   HUDObj.setButtonPosY = function (index, PosY) {
      const pos = parsePos2(
         config.PulsPos[index].RightFlag || "Left",
         config.PulsPos[index].PosX,
         config.PulsPos[index].TopFlag || "Top",
         PosY,
         null
      );
      if (HUDObj.Pulsanti[index]) {
         HUDObj.Pulsanti[index].x = pos.x;
         HUDObj.Pulsanti[index].y = pos.y;
      };
   };
   HUDObj.setButtonHeight = function (index, Height) {
      const height = parseSize(Height, canvas.height, canvas);
      if (HUDObj.Pulsanti[index]) HUDObj.Pulsanti[index].height = height;
   };
   HUDObj.setButtonWidth = function (index, Width) {
      const width = parseSize(Width, canvas.width, canvas);
      if (HUDObj.Pulsanti[index]) HUDObj.Pulsanti[index].width = width;
   };

   //BARRE
   HUDObj.showBar = function (index, show = true) {
      if (HUDObj.Barre[index]) HUDObj.Barre[index].visible = show;
   };
   HUDObj.topLayerBar = function (index, topLayer) {
      if (HUDObj.Barre[index]) HUDObj.Barre[index].topLayer = topLayer;
   };
   HUDObj.setBarColor = function (index, color, valueColor) {
      if (HUDObj.Barre[index]) {
         HUDObj.Barre[index].color = color ?? HUDObj.Barre[index].color;
         HUDObj.Barre[index].valueColor = valueColor ?? HUDObj.Barre[index].valueColor;
      }
   };
   HUDObj.setBarText = function (index, text) {
      if (HUDObj.Barre[index]) {
         HUDObj.Barre[index].text = text;
      }
   };
   HUDObj.setBarPos = function (index, RightFlag, PosX, TopFlag, PosY) {
      const pos = parsePos2(RightFlag, PosX, TopFlag, PosY, null);
      if (HUDObj.Barre[index]) {
         HUDObj.Barre[index].x = pos.x;
         HUDObj.Barre[index].y = pos.y;
      };
   };
   HUDObj.setBarPosX = function (index, PosX) {
      const pos = parsePos2(
         config.BarPos[index].RightFlag || "Left",
         PosX,
         config.BarPos[index].TopFlag || "Top",
         config.BarPos[index].PosY,
         null
      );
      if (HUDObj.Barre[index]) {
         HUDObj.Barre[index].x = pos.x;
         HUDObj.Barre[index].y = pos.y;
      };
   };
   HUDObj.setBarPosY = function (index, PosY) {
      const pos = parsePos2(
         config.BarPos[index].RightFlag || "Left",
         config.BarPos[index].PosX,
         config.BarPos[index].TopFlag || "Top",
         PosY,
         null
      );
      if (HUDObj.Barre[index]) {
         HUDObj.Barre[index].x = pos.x;
         HUDObj.Barre[index].y = pos.y;
      };
   };
   HUDObj.setBarValue = function (index, value) {
      if (HUDObj.Barre[index]) {
         HUDObj.Barre[index].value = Math.min(Math.max(value, 0), 1);
      }
   };
   HUDObj.createSecondBar = function (index, valueColor2, start, value) {
      if (HUDObj.Barre[index]) {
         HUDObj.Barre[index].valueColor2 = valueColor2;
         HUDObj.Barre[index].value2Start = start;
         HUDObj.Barre[index].value2 = value;
      }
   };

   //IMMAGINI
   HUDObj.showImage = function (index, show = true) {
      if (HUDObj.Immagini[index]) HUDObj.Immagini[index].visible = show;
   };
   HUDObj.topLayerImage = function (index, topLayer) {
      if (HUDObj.Immagini[index]) HUDObj.Immagini[index].topLayer = topLayer;
   };
   HUDObj.setImagePos = function (index, RightFlag, PosX, TopFlag, PosY) {
      const pos = parsePos2(RightFlag, PosX, TopFlag, PosY, null);
      if (HUDObj.Immagini[index]) {
         HUDObj.Immagini[index].x = pos.x;
         HUDObj.Immagini[index].y = pos.y;
      };
   };
   HUDObj.setImagePosX = function (index, PosX) {
      const pos = parsePos2(
         config.ImgPos[index].RightFlag || "Left",
         PosX,
         config.ImgPos[index].TopFlag || "Top",
         config.ImgPos[index].PosY,
         null
      );
      if (HUDObj.Immagini[index]) {
         HUDObj.Immagini[index].x = pos.x;
         HUDObj.Immagini[index].y = pos.y;
      };
   };
   HUDObj.setImagePosY = function (index, PosY) {
      const pos = parsePos2(
         config.ImgPos[index].RightFlag || "Left",
         config.ImgPos[index].PosX,
         config.ImgPos[index].TopFlag || "Top",
         PosY,
         null
      );
      if (HUDObj.Immagini[index]) {
         HUDObj.Immagini[index].x = pos.x;
         HUDObj.Immagini[index].y = pos.y;
      };
   };
   HUDObj.setImageUrl = function (index, url) {
      if (HUDObj.Immagini[index]) {
         HUDObj.Immagini[index].img.src = url;
      }
   };
   HUDObj.setBlur = function (index, blur) {
      if (HUDObj.Immagini[index]) HUDObj.Immagini[index].blur = blur;
   };
   HUDObj.setDark = function (index, dark) {
      if (HUDObj.Immagini[index]) HUDObj.Immagini[index].dark = dark;
   };

   return HUDObj;
};

function E3_FillValueBarCanvas(Obj) {
   /*
  const FuelFill = MicEnginereturn.Canvas.E3_FillValueBarCanvas({
      //VARIABILE
      Money: GlobalVar.Money,                                     //VARIABILE DEL DENARO POSSEDUTO
      MaxValue: Economy.FuelUpgrade[VarObjectsHub.UpgradeTank],   //MASSIMO VALORE RAGGIUNGIBILE DALLA VARIABILE
      Value: GlobalVar.Fuel,                                      //VARIABILE
      //CANVAS
      MoneySymbol: Economy.MoneySymbol,                           //SIMBOLO DENARO
      Hud: DynamicHubHUD,                                         //CANVAS DI RIFERIMENTO
   });

   FuelFill.UpdatePuls(2, 1, Economy.PriceFuel);

   FuelFill.Fill(0, 2, 1, Economy.PriceFuel);

   GlobalVar.Fuel = G0_SpendMoneyButton(DynamicHubHUD, GlobalVar.Fuel, FuelFill, 240);
   */

   //AGGIORNA IL TESTO DEL PULSANTE DI RIEMPIMENTO
   function UpdatePuls(IndexPuls, FillValue, PriceUnit) {
      //SE IL VALORE È MAGGIORE DEL PIENO MENO LA FRAZIONE DEL PIENO IMPOSTATA
      if (Obj.Value >= Obj.MaxValue * (1 - FillValue)) {
         Obj.Hud.setButtonText(IndexPuls, `FILL
         ${((Obj.MaxValue - Obj.Value) * PriceUnit).toFixed(0)}${Obj.MoneySymbol}`);
      }
      //ALTRIMENTI RIEMPI DELLA FRAZIONE DEL PIENO IMPOSTATA
      else {
         if (Obj.Value > Obj.MaxValue * (1 - FillValue)) Obj.Hud.setButtonText(IndexPuls, `FILL
         ${((Obj.MaxValue - Obj.Value) * PriceUnit).toFixed(0)}${Obj.MoneySymbol}`);
         else Obj.Hud.setButtonText(IndexPuls, `FILL 1/${1 / FillValue}
         ${(Obj.MaxValue * FillValue * PriceUnit).toFixed(0)}${Obj.MoneySymbol}`);
      };
      Obj.Hud.render();
   };

   function Fill(IndexBar, IndexPuls, FillValue, PriceUnit, Money) {
      //SE IL VALORE È MAGGIORE DEL PIENO MENO LA FRAZIONE DEL PIENO IMPOSTATA
      if (Obj.Value >= Obj.MaxValue * (1 - FillValue)) {
         //SE IL PREZZO PER UN PIENO È MINORE DEL DENARO POSSEDUTO
         if (Math.floor((Obj.MaxValue - Obj.Value) * PriceUnit) <= Money) {
            //FAI IL PIENO
            Money -= Math.floor((Obj.MaxValue - Obj.Value) * PriceUnit);
            //AGGIORNA IL VALORE DI CARBURANTE
            Obj.Value = Obj.MaxValue;
         }
         //SE IL PREZZO PER UN PIENO È MAGGIORE DEL DENARO POSSEDUTO
         else {
            //AGGIORNA IL VALORE DI CARBURANTE
            Obj.Value += Math.floor(Money / PriceUnit);
            //SPENDI TUTTI I SOLDI E COMPRA QUELLO CHE RIESCI
            Money = 0;
         };
      }
      //ALTRIMENTI RIEMPI DELLA FRAZIONE DEL PIENO IMPOSTATA
      else {
         //SE IL PREZZO PER 1/4 DEL PIENO È MINORE DEL DENARO POSSEDUTO
         if (Math.floor((Obj.MaxValue * FillValue) * PriceUnit) <= Money) {
            //FAI IL PIENO
            Money -= Math.floor((Obj.MaxValue * FillValue) * PriceUnit);
            //AGGIORNA IL VALORE DI CARBURANTE
            Obj.Value += Obj.MaxValue * FillValue;
         }
         //SE IL PREZZO PER UN PIENO È MAGGIORE DEL DENARO POSSEDUTO
         else {
            //AGGIORNA IL VALORE DI CARBURANTE
            Obj.Value += Math.floor(Money / PriceUnit);
            //SPENDI TUTTI I SOLDI E COMPRA QUELLO CHE RIESCI
            Money = 0;
         };
      };

      //AGGIORNA L´ALTEZZA DELLA BARRA
      Obj.Hud.setBarValue(IndexBar, Obj.Value / Obj.MaxValue);
      //AGGIORNA IL TESTO DELLA BARRA
      Obj.Hud.setBarText(IndexBar, `${(Obj.Value).toFixed(0)}/${Obj.MaxValue}`);

      UpdatePuls(IndexPuls, FillValue, PriceUnit);
      Obj.Hud.render();

      Obj.Money = Money;
   };

   return { Fill, UpdatePuls, get Money() { return Obj.Money; }, get Value() { return Obj.Value; } };
};

async function E3_BenchmarkCanvas(Obj) {
   const BenchmarkHUDObj = {                     //S0_GenerateHUDCanvas
      Parent: "Document",
      Events: true,           //ABILITAZIONE DEGLI EVENTI AL CLICK
      DispatchEvent: null,    //"Render"
      Width: 1,                   //LARGHEZZA
      Height: 1,                  //ALTEZZA
      Top: 0,                     //POSIZIONE VERTICALE DALL'ALTO
      ZIndex: '10',               //PROFONDITÀ Z
      //STILE
      Style: Obj.Style,
      //PARAMETRI GENERICI
      Opacity: "1",
      FontFamily: "'Orbitron', sans-serif",
      //TESTO PULSANTI/SPIE
      PulsFontSize: "12px",
      PulsFontColor: "#FFFFFF",
      //PULSANTI/SPIE
      Pulsanti: 3,
      PulsName: [
         "",             //0 VERSIONE ENGINE
         "",             //1 CHECK
         "START",        //2 START
      ],
      PulsSize: [
         { Width: "30%", Height: "12%" },      //0 VERSIONE ENGINE
         { Width: "50%", Height: "36%" },      //1 CHECK
         { Width: "40%", Height: "12%" },      //2 START
      ],
      PulsPos: [
         { RightFlag: "Left", PosX: "25%", TopFlag: "Top", PosY: "55%" },      //0 VERSIONE ENGINE
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "18%" },      //1 CHECK
         { RightFlag: "Left", PosX: "25%", TopFlag: "Top", PosY: "75%" },      //2 START
      ],
      PulsColor: [
         Obj.Color1,     //0 VERSIONE ENGINE
         Obj.Color1,     //1 CHECK
         Obj.Color1,     //2 START
      ],
      //TESTO BARRE
      BarFontSize: "12px",
      BarFontColor: "#ffffff",
      //BARRE
      Barre: 9,
      BarName: ["", "", "", "", "", "", "", "", "", ""],
      BarSize: [
         { Width: "5%h", Height: "50%w" },    //0 BARRA TEXTURE
         { Width: "5%h", Height: "50%w" },    //1 BARRA BUFFER
         { Width: "5%h", Height: "50%w" },    //2 BARRA VERTEX
         { Width: "5%h", Height: "50%w" },    //3 BARRA BENCHMARK 1
         { Width: "5%h", Height: "50%w" },    //4 BARRA BENCHMARK 2
         { Width: "5%h", Height: "50%w" },    //5 BARRA VertexUniformVectors
         { Width: "5%h", Height: "50%w" },    //6 BARRA FragmentUniformVectors
         { Width: "5%h", Height: "50%w" },    //7 BARRA VaryingVectors
         { Width: "5%h", Height: "50%w" },    //8 BARRA PRECISION
      ],
      BarPos: [
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "58.5%" },      //0 BARRA TEXTURE
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "63.5%" },      //1 BARRA BUFFER
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "68.5%" },      //2 BARRA VERTEX
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "73.5%" },      //3 BARRA BENCHMARK 1
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "78.5%" },      //4 BARRA BENCHMARK 2
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "53.5%" },      //5 BARRA VertexUniformVectors
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "48.5%" },      //6 BARRA FragmentUniformVectors
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "43.5%" },      //7 BARRA VaryingVectors
         { RightFlag: "Right", PosX: "25%", TopFlag: "Top", PosY: "38.5%" },      //8 BARRA PRECISION
      ],
      BarColor: [Obj.Color1, Obj.Color1, Obj.Color1, Obj.Color1, Obj.Color1, Obj.Color1, Obj.Color1, Obj.Color1, Obj.Color1],
      BarColorValue: [Obj.Color2, Obj.Color2, Obj.Color2, Obj.Color2, Obj.Color2, Obj.Color2, Obj.Color2, Obj.Color2, Obj.Color2],
      BarRotate: ["90", "90", "90", "90", "90", "90", "90", "90", "90"],
      //IMMAGINI
      Immagini: 1,
      ImgSize: [
         { Width: "150px", Height: "150px" },    //0 LOGO
      ],
      ImgPos: [
         { RightFlag: "Left", PosX: "25%", TopFlag: "Top", PosY: "80px" },     //0 LOGO
      ],
      ImgUrl: [
         Obj.Logo,                    //0 LOGO
      ],
   };

   const BenchmarkHUDCanvas = S0_GenerateHUDCanvas(BenchmarkHUDObj);

   const Performance = await E3_Benchmark({});

   function DrawHud() {
      BenchmarkHUDCanvas.setButtonText(0, `MicGames Studio
      ${MicEnginereturn.VarObject.VersionText}`);

      BenchmarkHUDCanvas.setButtonText(1, `Device: ${Performance.evaluation.deviceType}, Core CPU: ${Performance.device.cores}
            Total RAM: ${Performance.device.deviceMemoryGB}GB, Limit RAM: ${Performance.memory.limitMB}MB
            ----------------------
            GPU: ${Performance.detect.vendor} ${Performance.detect.family} ${Performance.detect.model}
            Database GPU: ${Performance.detect.key}
            SupportsStandard: ${Performance.limits.supportsStandard}
            `);

      //0 BARRA TEXTURE
      if (Obj.LimitTexture / Performance.limits.maxTextureSize <= 1)
         BenchmarkHUDCanvas.setBarValue(0, Obj.LimitTexture / Performance.limits.maxTextureSize);
      else {
         BenchmarkHUDCanvas.setBarValue(0, 1);
         BenchmarkHUDCanvas.setBarColor(0, Obj.Color1, Obj.Color3);
      };
      //1 BARRA BUFFER
      if (Obj.LimitBuffer / Performance.limits.maxRenderBufferSize <= 1)
         BenchmarkHUDCanvas.setBarValue(1, Obj.LimitBuffer / Performance.limits.maxRenderBufferSize);
      else {
         BenchmarkHUDCanvas.setBarValue(1, 1);
         BenchmarkHUDCanvas.setBarColor(1, Obj.Color1, Obj.Color3);
      };
      //2 BARRA VERTEX
      if (Obj.LimitVertex / Performance.limits.maxVertexAttribs <= 1)
         BenchmarkHUDCanvas.setBarValue(2, Obj.LimitVertex / Performance.limits.maxVertexAttribs);
      else {
         BenchmarkHUDCanvas.setBarValue(2, 1);
         BenchmarkHUDCanvas.setBarColor(2, Obj.Color1, Obj.Color3);
      };
      //3 BARRA BENCHMARK 1
      BenchmarkHUDCanvas.setBarValue(3, Performance.detect.Bar1);
      //4 BARRA BENCHMARK 2
      BenchmarkHUDCanvas.setBarValue(4, Performance.detect.Bar2);
      //5 BARRA VertexUniformVectors
      if (Obj.LimitVertexUniformVectors / Performance.limits.maxVertexUniformVectors <= 1)
         BenchmarkHUDCanvas.setBarValue(5, Obj.LimitVertexUniformVectors / Performance.limits.maxVertexUniformVectors);
      else {
         BenchmarkHUDCanvas.setBarValue(5, 1);
         BenchmarkHUDCanvas.setBarColor(0, Obj.Color1, Obj.Color3);
      };
      //6 BARRA FragmentUniformVectors
      if (Obj.LimitFragmentUniformVectors / Performance.limits.maxFragmentUniformVectors <= 1)
         BenchmarkHUDCanvas.setBarValue(6, Obj.LimitFragmentUniformVectors / Performance.limits.maxFragmentUniformVectors);
      else {
         BenchmarkHUDCanvas.setBarValue(6, 1);
         BenchmarkHUDCanvas.setBarColor(6, Obj.Color1, Obj.Color3);
      };
      //7 BARRA VaryingVectors
      if (Obj.LimitVaryingVectors / Performance.limits.maxVaryingVectors <= 1)
         BenchmarkHUDCanvas.setBarValue(7, Obj.LimitVaryingVectors / Performance.limits.maxVaryingVectors);
      else {
         BenchmarkHUDCanvas.setBarValue(7, 1);
         BenchmarkHUDCanvas.setBarColor(7, Obj.Color1, Obj.Color3);
      };
      //8 BARRA PRECISION
      if (Obj.LimitPrecision / Performance.gpu.precision <= 1)
         BenchmarkHUDCanvas.setBarValue(8, Obj.LimitPrecision / Performance.gpu.precision);
      else {
         BenchmarkHUDCanvas.setBarValue(8, 1);
         BenchmarkHUDCanvas.setBarColor(8, Obj.Color1, Obj.Color3);
      };

      BenchmarkHUDCanvas.setBarText(0, `Texture: ${Obj.LimitTexture}/${Performance.limits.maxTextureSize}`);
      BenchmarkHUDCanvas.setBarText(1, `Buffer: ${Obj.LimitBuffer}/${Performance.limits.maxRenderBufferSize}`);
      BenchmarkHUDCanvas.setBarText(2, `Vertex: ${Obj.LimitVertex}/${Performance.limits.maxVertexAttribs}`);
      BenchmarkHUDCanvas.setBarText(3, `${Performance.benchmark[0]} ${Performance.detect.Score1}`);
      BenchmarkHUDCanvas.setBarText(4, `${Performance.benchmark[1]} ${Performance.detect.Score2}`);
      BenchmarkHUDCanvas.setBarText(5, `VertexUniformVectors: ${Obj.LimitVertexUniformVectors}/${Performance.limits.maxVertexUniformVectors}`);
      BenchmarkHUDCanvas.setBarText(6, `FragmentUniformVectors: ${Obj.LimitFragmentUniformVectors}/${Performance.limits.maxFragmentUniformVectors}`);
      BenchmarkHUDCanvas.setBarText(7, `VaryingVectors: ${Obj.LimitVaryingVectors}/${Performance.limits.maxVaryingVectors}`);
      BenchmarkHUDCanvas.setBarText(8, `Precision: ${Obj.LimitPrecision}/${Performance.gpu.precision}`);
   };
   DrawHud();
   BenchmarkHUDCanvas.render();

   //RESIZE RENDERER
   window.addEventListener("resize", windowResizeHandler);
   function windowResizeHandler() {
      //ORIENTAMENTO ORIZZONTALE
      if (window.innerWidth >= window.innerHeight) {
         //0 VERSIONE ENGINE
         BenchmarkHUDObj.PulsSize[0].Width = "30%";
         BenchmarkHUDObj.PulsPos[0].PosX = "25%";
         BenchmarkHUDObj.PulsPos[0].PosY = "55%";
         //1 CHECK
         BenchmarkHUDObj.PulsSize[1].Width = "50%";
         BenchmarkHUDObj.PulsSize[1].Height = "36%";
         BenchmarkHUDObj.PulsPos[1].PosX = "25%";
         BenchmarkHUDObj.PulsPos[1].PosY = "18%";
         //2 START
         BenchmarkHUDObj.PulsSize[2].Width = "40%";
         BenchmarkHUDObj.PulsPos[2].PosX = "25%";
         BenchmarkHUDObj.PulsPos[2].PosY = "75%";

         //0 BARRA TEXTURE
         BenchmarkHUDObj.BarSize[0].Height = "50%w";
         BenchmarkHUDObj.BarPos[0].PosX = "25%";
         BenchmarkHUDObj.BarPos[0].PosY = "58.5%";
         //1 BARRA BUFFER
         BenchmarkHUDObj.BarSize[1].Height = "50%w";
         BenchmarkHUDObj.BarPos[1].PosX = "25%";
         BenchmarkHUDObj.BarPos[1].PosY = "63.5%";
         //2 BARRA VERTEX
         BenchmarkHUDObj.BarSize[2].Height = "50%w";
         BenchmarkHUDObj.BarPos[2].PosX = "25%";
         BenchmarkHUDObj.BarPos[2].PosY = "68.5%";
         //3 BARRA BENCHMARK 1
         BenchmarkHUDObj.BarSize[3].Height = "50%w";
         BenchmarkHUDObj.BarPos[3].PosX = "25%";
         BenchmarkHUDObj.BarPos[3].PosY = "73.5%";
         //4 BARRA BENCHMARK 2
         BenchmarkHUDObj.BarSize[4].Height = "50%w";
         BenchmarkHUDObj.BarPos[4].PosX = "25%";
         BenchmarkHUDObj.BarPos[4].PosY = "78.5%";
         //5 BARRA VertexUniformVectors
         BenchmarkHUDObj.BarSize[5].Height = "50%w";
         BenchmarkHUDObj.BarPos[5].PosX = "25%";
         BenchmarkHUDObj.BarPos[5].PosY = "53.5%";
         //6 BARRA FragmentUniformVectors
         BenchmarkHUDObj.BarSize[6].Height = "50%w";
         BenchmarkHUDObj.BarPos[6].PosX = "25%";
         BenchmarkHUDObj.BarPos[6].PosY = "48.5%";
         //7 BARRA VaryingVectors
         BenchmarkHUDObj.BarSize[7].Height = "50%w";
         BenchmarkHUDObj.BarPos[7].PosX = "25%";
         BenchmarkHUDObj.BarPos[7].PosY = "43.5%";
         //8 BARRA PRECISION
         BenchmarkHUDObj.BarSize[8].Height = "50%w";
         BenchmarkHUDObj.BarPos[8].PosX = "25%";
         BenchmarkHUDObj.BarPos[8].PosY = "38.5%";
      }
      //ORIENTAMENTO VERTICALE
      else {
         //0 VERSIONE ENGINE
         BenchmarkHUDObj.PulsSize[0].Width = "40%";
         BenchmarkHUDObj.PulsPos[0].PosX = "75%";
         BenchmarkHUDObj.PulsPos[0].PosY = "10%";
         //1 CHECK
         BenchmarkHUDObj.PulsSize[1].Width = "100%";
         BenchmarkHUDObj.PulsSize[1].Height = "20%";
         BenchmarkHUDObj.PulsPos[1].PosX = "50%";
         BenchmarkHUDObj.PulsPos[1].PosY = "45%";
         //2 START
         BenchmarkHUDObj.PulsSize[2].Width = "50%";
         BenchmarkHUDObj.PulsPos[2].PosX = "75%";
         BenchmarkHUDObj.PulsPos[2].PosY = "25%";

         //0 BARRA TEXTURE
         BenchmarkHUDObj.BarSize[0].Height = "100%w";
         BenchmarkHUDObj.BarPos[0].PosX = "50%";
         BenchmarkHUDObj.BarPos[0].PosY = "77.5%";
         //1 BARRA BUFFER
         BenchmarkHUDObj.BarSize[1].Height = "100%w";
         BenchmarkHUDObj.BarPos[1].PosX = "50%";
         BenchmarkHUDObj.BarPos[1].PosY = "82.5%";
         //2 BARRA VERTEX
         BenchmarkHUDObj.BarSize[2].Height = "100%w";
         BenchmarkHUDObj.BarPos[2].PosX = "50%";
         BenchmarkHUDObj.BarPos[2].PosY = "87.5%";
         //3 BARRA BENCHMARK 1
         BenchmarkHUDObj.BarSize[3].Height = "100%w";
         BenchmarkHUDObj.BarPos[3].PosX = "50%";
         BenchmarkHUDObj.BarPos[3].PosY = "92.5%";
         //4 BARRA BENCHMARK 2
         BenchmarkHUDObj.BarSize[4].Height = "100%w";
         BenchmarkHUDObj.BarPos[4].PosX = "50%";
         BenchmarkHUDObj.BarPos[4].PosY = "97.5%";
         //5 BARRA VertexUniformVectors
         BenchmarkHUDObj.BarSize[5].Height = "100%w";
         BenchmarkHUDObj.BarPos[5].PosX = "50%";
         BenchmarkHUDObj.BarPos[5].PosY = "72.5%";
         //6 BARRA FragmentUniformVectors
         BenchmarkHUDObj.BarSize[6].Height = "100%w";
         BenchmarkHUDObj.BarPos[6].PosX = "50%";
         BenchmarkHUDObj.BarPos[6].PosY = "67.5%";
         //7 BARRA VaryingVectors
         BenchmarkHUDObj.BarSize[7].Height = "100%w";
         BenchmarkHUDObj.BarPos[7].PosX = "50%";
         BenchmarkHUDObj.BarPos[7].PosY = "62.5%";
         //8 BARRA PRECISION
         BenchmarkHUDObj.BarSize[8].Height = "100%w";
         BenchmarkHUDObj.BarPos[8].PosX = "50%";
         BenchmarkHUDObj.BarPos[8].PosY = "57.5%";
      };

      //RESET CANVAS
      BenchmarkHUDCanvas.resetCanvas();
      DrawHud();
      BenchmarkHUDCanvas.render();
   };
   windowResizeHandler();

   return BenchmarkHUDCanvas;
};
//#endregion

/*---------------------------------------------------FUNZIONI DOM---------------------------------------------------------*/
//#region
/*FUNZIONE CSS STANDARD*/
function StandardCSS(Element, TopFlag, PosT, LeftFlag, PosL, DimY, DimX, ZIndex = "10") {
   /*
   MicEnginereturn.VarObject.StandardCSS(Buttons[i], "top", "180px", "left", `${120 + (i - 4) * 130}px`, "150px", "150px");
   Element - Elemento da stilare e da inserire
   TopFlag - top, bottom
   PosT - Posizione Top
   LeftFlag - left, right
   DimY - Altezza height
   DimX - Larghezza width
   */

   Element.style.display = "block";
   Element.style.position = "absolute";
   if (TopFlag == "bottom") Element.style.bottom = PosT;
   if (TopFlag == "top") Element.style.top = PosT;
   if (LeftFlag == "right") Element.style.right = PosL;
   if (LeftFlag == "left") Element.style.left = PosL;
   Element.style.width = DimX;
   Element.style.height = DimY;
   Element.style.zIndex = ZIndex;
   document.body.appendChild(Element);
};

export function S0_StandardCSS(Element, TopFlag, PosT, LeftFlag, PosL, DimY, DimX) {
   /*
   MicEnginereturn.VarObject.StandardCSS(Buttons[i], "top", "180px", "left", `${120 + (i - 4) * 130}px`, "150px", "150px");
   Element - Elemento da stilare e da inserire
   TopFlag - top, bottom
   PosT - Posizione Top
   LeftFlag - left, right
   DimY - Altezza height
   DimX - Larghezza width
   */

   Element.style.display = "block";
   Element.style.position = "absolute";
   if (TopFlag == "bottom") Element.style.bottom = PosT;
   if (TopFlag == "top") Element.style.top = PosT;
   if (LeftFlag == "right") Element.style.right = PosL;
   if (LeftFlag == "left") Element.style.left = PosL;
   Element.style.width = DimX;
   Element.style.height = DimY;
   Element.style.zIndex = "10";
   document.body.appendChild(Element);
};

/*FUNZIONE CSS STANDARD TEXT*/
function StandardCSSText(Element, Font, Align, Size, Color, TopFlag, PosT, LeftFlag, PosL, DimX) {
   /*
   Element - Elemento da stilare e da inserire
   TopFlag - top, bottom
   PosT - Posizione Top
   LeftFlag - left, right
   DimY - Altezza height
   DimX - Larghezza width
   const LoadText = document.createElement('p');
   MicEnginereturn.VarObject.StandardCSSText(LoadText, "sans-serif", "center", "small", "#FFFFFF", "top", "40px", "right", "50px", "50px");
   */

   Element.style.position = "absolute";
   Element.style.fontFamily = Font;
   Element.style.textAlign = Align;
   Element.style.fontSize = Size;
   Element.style.color = Color;
   if (TopFlag == "bottom") Element.style.bottom = PosT;
   if (TopFlag == "top") Element.style.top = PosT;
   if (LeftFlag == "right") Element.style.right = PosL;
   if (LeftFlag == "left") Element.style.left = PosL;
   Element.style.width = DimX;
   Element.style.zIndex = "10";

   document.body.appendChild(Element);
};

/*FUNZIONE LAMPEGGIO SPIA CON AGGIORNAMENTO OGNI 100MS*/
function LampeggioSpia(Elem, Color1, Color2, Count, Set) {
   if (Set == 0) {
      //ESEGUI LA FUNZIONE UNA SOLA VOLTA
      if (Elem.style.backgroundColor != Color1) Elem.style.backgroundColor = Color1;
   };
   if (Set > 0) {
      Count += 100;
      if (Count < Set) {
         //ESEGUI LA FUNZIONE UNA SOLA VOLTA
         if (Elem.style.backgroundColor != Color1) Elem.style.backgroundColor = Color1;
      };
      if (Count > Set && Count < Set * 2) {
         //ESEGUI LA FUNZIONE UNA SOLA VOLTA
         if (Elem.style.backgroundColor != Color2) Elem.style.backgroundColor = Color2;
      };
      if (Count > Set * 2) Count = 0;

   };
   return Count;
};

/*FUNZIONE CLICK DOM COL METODO POINTER*/
function E3_PointerButton(Elem, FunctionDown, FunctionUp) {
   Elem.addEventListener('contextmenu', function (ev) {
      ev.preventDefault();
   });
   Elem.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      FunctionDown();
   }, { passive: false });
   Elem.addEventListener('pointerup', function (ev) {
      ev.preventDefault();
      FunctionUp();
   }, { passive: false });
};

/*SCHERMATA DI CARICAMENTO*/
function S0_LoaderScreen(Par) {
   function CommonCssLoader(Elem, TopFlag, Top) {        //FUNZIONE DI ELEMENTI CSS COMUNI
      Elem.style.position = 'absolute';
      Elem.style.transform = "translate(-50%, -50%)";
      Elem.style.left = "50%";
      if (TopFlag == "Top") Elem.style.top = Top;
      if (TopFlag == "Bottom") Elem.style.bottom = Top;
      LoaderDiv.appendChild(Elem);
   };
   const LoaderDiv = document.createElement('div');
   LoaderDiv.style.display = "block";
   LoaderDiv.style.position = "absolute";
   LoaderDiv.style.height = "100%";
   LoaderDiv.style.width = "100%";
   LoaderDiv.style.backgroundColor = "black";
   LoaderDiv.style.zIndex = "50";

   const LoaderLabel = document.createElement('div');
   LoaderLabel.style.color = "white";
   LoaderLabel.style.fontSize = "3vh";
   LoaderLabel.style.fontFamily = "Sans-serif";
   LoaderLabel.innerText = `Neptune Engine V${Version}`;
   CommonCssLoader(LoaderLabel, "Bottom", "30%");

   const LoaderSubLabel = document.createElement('div');
   LoaderSubLabel.style.color = "white";
   LoaderSubLabel.style.fontSize = "2vh";
   LoaderSubLabel.style.fontFamily = "Sans-serif";
   LoaderSubLabel.innerText = "MicGames Studio";
   CommonCssLoader(LoaderSubLabel, "Bottom", "25%");

   const LoaderSymbol = document.createElement('div');
   LoaderSymbol.style.height = "150px";
   LoaderSymbol.style.width = "150px";
   CommonCssLoader(LoaderSymbol, "Top", "40%");

   const LoaderImg = document.createElement('img');
   LoaderImg.style.height = "100%";
   LoaderImg.style.width = "100%";
   LoaderImg.src = "/Engine/Media/Nettuno150.png";
   LoaderSymbol.appendChild(LoaderImg);

   //BARRA DI CARICAMENTO
   const loadingBar = document.createElement('div');
   loadingBar.style.width = '300px';
   loadingBar.style.height = '20px';
   loadingBar.style.background = '#333';
   loadingBar.style.border = '1px solid #888';
   loadingBar.style.borderRadius = '4px';
   loadingBar.style.overflow = 'hidden';
   loadingBar.style.zIndex = '1000';
   loadingBar.style.display = 'block';
   CommonCssLoader(loadingBar, "Bottom", '15%');

   const LoadingFill = document.createElement('div');
   LoadingFill.style.height = '100%';
   LoadingFill.style.width = '0%';
   LoadingFill.style.background = '#00ffff';
   loadingBar.appendChild(LoadingFill);

   //TEXTO FILE IN CARICAMENTO
   const Texture = document.createElement('div');
   Texture.style.color = "white";
   Texture.style.fontSize = "8px";
   Texture.style.fontFamily = "Sans-serif";
   CommonCssLoader(Texture, "Bottom", "10%");

   //TEXTO FILE IN CARICAMENTO
   const LoaderFile = document.createElement('div');
   LoaderFile.style.color = "white";
   LoaderFile.style.fontSize = "8px";
   LoaderFile.style.fontFamily = "Sans-serif";
   CommonCssLoader(LoaderFile, "Bottom", "5%");

   LoaderDiv.style.display = 'none';
   document.body.appendChild(LoaderDiv);

   let LoadingHUDObj;
   if (Par) {
      //HUD
      if (Par.Hud) {
         LoadingHUDObj = S0_GenerateHUDCanvas(Par.Hud, {
            DispatchEvent: "Render",
            Width: 1,                   //LARGHEZZA
            Height: 1,                  //ALTEZZA
            Top: 0,                     //POSIZIONE VERTICALE DALL'ALTO
            ZIndex: '51',               //PROFONDITÀ Z
         });
         LoadingHUDObj.render();
      };
      //FUNZIONE
      if (Par.FunctHud) Par.FunctHud(LoadingHUDObj);
   };

   return { LoaderDiv, LoadingFill, Texture, LoaderFile, LoadingHUDObj };
};

/*SCHERMATA VUOTA PRIMA DEL CARICAMENTO*/
export function S0_BlankScreen(Color) {
   const LoaderDiv = document.createElement('div');
   LoaderDiv.style.display = "block";
   LoaderDiv.style.position = "absolute";
   LoaderDiv.style.height = "100%";
   LoaderDiv.style.width = "100%";
   LoaderDiv.style.backgroundColor = Color;
   LoaderDiv.style.zIndex = "49";

   document.body.appendChild(LoaderDiv);

   return LoaderDiv;
};

function E3_RadarCanvas(values, labels = [], options = {}) {
   /*
   const Attributes = MicEnginereturn.VarObject.E3_GenerateAttributes(0.5, 4, 0.2, 0.8);
   Radar[i] = MicEnginereturn.VarObject.E3_RadarCanvas(Attributes, labels, {
      size: 150,
      color: "#00ff00",
      font: "10px Arial",
      top: 60,
      left: 120 + i * 130,
      zIndex: "10",
   });

   //UTILIZZO FUNZIONI DI UPDATE
   Radar[0].UpdateAttributes([0.6, 0.9, 0.7, 0.8]);
   Radar[0].UpdateLabels(["HP", "SPD", "STR", "INT"]);
   Radar[0].UpdateOptions({ color: "#ff0000", top: 80 });
   */

   const size = options.size;
   const color = options.color;
   const font = options.font;
   const top = options.top;
   const left = options.left;

   const container = document.createElement('div');
   const canvas = document.createElement("canvas");
   const displaySize = size;
   const scaleFactor = window.devicePixelRatio || 2;
   const realSize = displaySize * scaleFactor;
   canvas.style.width = canvas.style.height = displaySize + "px";
   canvas.width = canvas.height = realSize;
   const ctx = canvas.getContext("2d");
   ctx.scale(scaleFactor, scaleFactor);

   container.appendChild(canvas);
   container.style.display = "block";
   container.style.position = "absolute";
   container.style.top = top + "px";
   container.style.left = left + "px";
   container.style.zIndex = options.zIndex;
   container.style.pointerEvents = "none";
   document.body.appendChild(container);

   //Valori dinamici
   let currentValues = values.slice();
   let currentLabels = labels.slice();
   let currentOptions = { size, color, font, top, left };

   function drawRadar() {
      const size = currentOptions.size;
      const color = currentOptions.color;
      const font = currentOptions.font;
      const radius = size * 0.75 / 2 - 20;
      const center = size / 2;
      const count = currentValues.length;
      const angleStep = (Math.PI * 2) / count;

      ctx.clearRect(0, 0, size, size);
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      //Cerchi concentrici
      ctx.strokeStyle = "rgba(255,255,255,1)";
      ctx.setLineDash([4, 4]);
      for (let r = 0.2; r <= 1.0; r += 0.2) {
         ctx.beginPath();
         ctx.arc(center, center, radius * r, 0, Math.PI * 2);
         ctx.stroke();
      }

      //Assi e etichette
      ctx.setLineDash([]);
      for (let i = 0; i < count; i++) {
         const angle = i * angleStep;
         const x = center + Math.cos(angle) * radius;
         const y = center + Math.sin(angle) * radius;

         ctx.strokeStyle = "rgba(255,255,255,1)";
         ctx.beginPath();
         ctx.moveTo(center, center);
         ctx.lineTo(x, y);
         ctx.stroke();

         if (currentLabels[i]) {
            const lx = center + Math.cos(angle) * (radius + 10);
            const ly = center + Math.sin(angle) * (radius + 10);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(currentLabels[i], lx, ly);
         }
      }

      //Poligono radar
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
         const angle = i * angleStep;
         const r = currentValues[i];
         const x = center + Math.cos(angle) * radius * r;
         const y = center + Math.sin(angle) * radius * r;
         if (i === 0) ctx.moveTo(x, y);
         else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = color;
      ctx.stroke();
   }

   //--- Metodi di aggiornamento ---
   container.UpdateAttributes = function (newValues) {
      currentValues = newValues.slice();
      drawRadar();
   };

   container.UpdateLabels = function (newLabels) {
      currentLabels = newLabels.slice();
      drawRadar();
   };

   container.UpdateOptions = function (newOptions) {
      //Aggiorna solo le chiavi che esistono
      Object.assign(currentOptions, newOptions);

      //Applica modifiche visive se necessarie
      if (newOptions.top !== undefined) container.style.top = newOptions.top + "px";
      if (newOptions.left !== undefined) container.style.left = newOptions.left + "px";
      if (newOptions.color !== undefined || newOptions.font !== undefined) {
         drawRadar();
      }
   };

   //Disegna inizialmente
   drawRadar();

   return container;
}

function E3_CreateLines(n, lineeData) {
   const Container = document.createElement('div');
   const Linee = [];
   for (let i = 0; i < n; i++) {
      const { x1, y1, x2, y2, height, colore } = lineeData[i];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const lunghezza = Math.sqrt(dx * dx + dy * dy);
      const angolo = Math.atan2(dy, dx) * 180 / Math.PI;

      const linea = document.createElement('div');
      linea.style.position = 'absolute';
      linea.style.left = `${x1}px`;
      linea.style.top = `${y1}px`;
      linea.style.width = `${lunghezza}px`;
      linea.style.height = `${height}px`; //spessore linea
      linea.style.backgroundColor = colore;
      linea.style.transformOrigin = '0 0';
      linea.style.transform = `rotate(${angolo}deg)`;

      Linee[i] = linea;
      Container.appendChild(linea);
   };
   document.body.appendChild(Container);

   return { Container, Linee };
};

function E4_PositionNPCText(Elem, Obj) {
   let FlagX;
   let FlagY;
   let PositionX;
   let PositionY;
   if (Obj.PosX >= 0) {
      FlagX = "left";
      PositionX = Obj.PosX;
   };
   if (Obj.PosX < 0) {
      FlagX = "right";
      PositionX = -Obj.PosX;
   };
   if (Obj.PosY >= 0) {
      FlagY = "top";
      PositionY = Obj.PosY;
   };
   if (Obj.PosY < 0) {
      FlagY = "bottom";
      PositionY = -Obj.PosY;
   };

   if (Obj.PositionText == "Down") StandardCSS(Elem, FlagY, `${PositionY + Obj.AtImage}px`, FlagX, `${PositionX}px`, `${Obj.AltText}px`, `${Obj.LargText}px`);
   if (Obj.PositionText == "Side") StandardCSS(Elem, FlagY, `${PositionY}px`, FlagX, `${PositionX + Obj.LargImage}px`, `${Obj.AltText}px`, `${Obj.LargText}px`);
};
/*FUNZIONE CHE VISUALIZZA UN RIQUADRO CON L'IMMAGINE E IL TESTO DI UN NPC, TIMER E PRESSIONE PER ELIMINARE*/
function E3_DisplayNPC(Obj, Func) {
   /*
   MicEnginereturn.VarObject.E3_DisplayNPC({
         //GENERICI
         Font: 15,                                             //FONT IN PIXEL
         PosX: -200,                                            //POSIZIONE X (POSITIVA=SINISTRA, NEGATIVA=DESTRA)
         PosY: 0,                                              //POSIZIONE Y (POSITIVA=TOP, NEGATIVA=BOTTOM)
         zIndex: "11",
         //IMMAGINE
         LargImage: 150,                                       //LARGHEZZA IMMAGINE
         AtImage: 100,                                         //ALTEZZA IMMAGINE
         Image: NPC.Radio.Immagini[GlobalVar.StationType - 1][GlobalVar.GenderNPC],               //IMMAGINE
         //TESTO
         PositionText: "Down",                               //POSIZIONE DEL TESTO RELATIVA ALL'IMMAGINE "Down" "Side"
         AltText: 170,                                          //ALTEZZA TESTO
         ColorText: "#000000ff",                             //COLORE SFONDO TESTO
         ColorFontText: "#ffffffff",                         //COLORE FONT TESTO
         Text: NPC.Welcome.Testi[GlobalVar.StationType - 1][GlobalVar.Language + 1],               //TESTO
         //TESTO CONTINUA
         Text1: `${NPC.Click[GlobalVar.Language]}`,                      //TESTO CONTINUA
         Time: NPC.Welcome.Testi[GlobalVar.StationType - 1][0]                           //TEMPO
      },
         function () { });             //FUNZIONE
   */

   //POSIZIONE A SINISTRA O A DESTRA IN BASE AL SEGNO
   let FlagX;
   let FlagY;
   let PositionX;
   let PositionY;
   if (Obj.PosX >= 0) {
      FlagX = "left";
      PositionX = Obj.PosX;
   };
   if (Obj.PosX < 0) {
      FlagX = "right";
      PositionX = -Obj.PosX;
   };
   if (Obj.PosY >= 0) {
      FlagY = "top";
      PositionY = Obj.PosY;
   };
   if (Obj.PosY < 0) {
      FlagY = "bottom";
      PositionY = -Obj.PosY;
   };

   //CREAZIONE IMMAGINE PERSONAGGIO
   const DivImage = document.createElement("img");
   DivImage.src = Obj.Image;
   StandardCSS(DivImage, FlagY, `${PositionY}px`, FlagX, `${PositionX}px`, `${Obj.AtImage}px`, `${Obj.LargImage}px`, Obj.zIndex);

   //TESTO PERSONAGGIO
   const DivText = document.createElement("div");
   E4_PositionNPCText(DivText, Obj);
   DivText.style.backgroundColor = Obj.ColorText;
   DivText.style.color = Obj.ColorFontText;
   DivText.style.fontSize = Obj.Font + "px";
   DivText.style.zIndex = Obj.zIndex;
   DivText.innerText = Obj.Text;

   //TESTO CONTINUA
   let DivText1;
   if (Obj.Text1 != ``) {
      DivText1 = document.createElement("div");
      if (Obj.PositionText == "Down") StandardCSS(DivText1, FlagY, `${PositionY + Obj.AtImage + Obj.AltText}px`, FlagX, `${PositionX}px`, "20px", `${Obj.LargText}px`, Obj.zIndex);
      if (Obj.PositionText == "Side") StandardCSS(DivText1, FlagY, `${PositionY + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargImage}px`, "20px", `${Obj.LargText}px`, Obj.zIndex);
      DivText1.style.backgroundColor = Obj.ColorText;
      DivText1.style.color = Obj.ColorFontText;
      DivText1.style.fontSize = Obj.Font + "px";
      DivText1.innerText = Obj.Text1;
   };

   //BARRA TEMPO
   function RiduzioneBarra() {
      LarghBarra -= (Obj.LargImage * 1.1) / (Obj.Time / 100);
      DivBar1.style.width = `${LarghBarra}px`;
   };

   let DivBar;
   let DivBar1;
   let LarghBarra;
   let myInterval;
   if (Obj.Time > 0) {
      DivBar = document.createElement("div");
      StandardCSS(DivBar, FlagY, `${PositionY}px`, FlagX, `${PositionX}px`, "10px", `${Obj.LargImage}px`, Obj.zIndex);

      DivBar1 = document.createElement("div");
      DivBar1.style.backgroundColor = "#808080";
      StandardCSS(DivBar1, FlagY, `${PositionY}px`, FlagX, `${PositionX}px`, "10px", `${Obj.LargImage}px`, Obj.zIndex);

      //RIDUZIONE BARRA A TEMPO
      LarghBarra = Obj.LargImage;
      myInterval = setInterval(RiduzioneBarra, 100);
   };

   let Erased = false;

   //ELIMINAZIONE
   function Erase() {
      document.body.removeChild(DivImage);
      document.body.removeChild(DivText);
      if (Obj.Text1 != ``) document.body.removeChild(DivText1);
      if (Obj.Time > 0) {
         document.body.removeChild(DivBar);
         document.body.removeChild(DivBar1);
      };
      clearInterval(myInterval);
      setTimeout(() => {
         Func();
      }, 500);
      Erased = true;
   };

   DivImage.addEventListener('click', function () { if (Erased == false) Erase(); });
   DivText.addEventListener('click', function () { if (Erased == false) Erase(); });
   if (Obj.Time > 0) setTimeout(() => { if (Erased == false) Erase(); }, Obj.Time);
};

/*FUNZIONE CHE VISUALIZZA UN RIQUADRO CON L'IMMAGINE E IL TESTO DI UN NPC, SINGOLO TASTO E SINGOLA FUNZIONE, NO TIMER*/
function E3_DisplayNPCSingleButton(Obj, Func1) {
   /*
   MicEnginereturn.VarObject.E3_DisplayNPCSingleButton({
         //GENERICI
         Font: 15,                                             //FONT IN PIXEL
         PosX: -200,                                            //POSIZIONE X (POSITIVA=SINISTRA, NEGATIVA=DESTRA)
         PosY: 0,                                              //POSIZIONE Y (SOLO TOP)
         zIndex: "11",
         //IMMAGINE
         LargImage: 150,                                       //LARGHEZZA IMMAGINE
         AtImage: 100,                                         //ALTEZZA IMMAGINE
         Image: NPC.Radio.Immagini[GlobalVar.StationType - 1][GlobalVar.GenderNPC],               //IMMAGINE
         //TESTO
                  PositionText: "Down",                               //POSIZIONE DEL TESTO RELATIVA ALL'IMMAGINE "Down" "Right "Left
         LargText: 200,
         AltText: 120,                                          //ALTEZZA TESTO
         ColorText: "#000000ff",                             //COLORE SFONDO TESTO
         ColorFontText: "#ffffffff",                         //COLORE FONT TESTO
         Text: NPC.Welcome.Testi[GlobalVar.StationType - 1][GlobalVar.Language + 1],               //TESTO
         //PULSANTE
         AltPuls: 40,                   //ALTEZZA PULSANTI
         ColorPuls: "#000000ff",                             //COLORE SFONDO PULSANTI
         ColorFontPuls: "#ffffffff",                         //COLORE FONT PULSANTI
         ColorBorderPuls: "#ffffffff",                      //COLORE BORDO PULSANTI
         Text1: "1",                   //TESTO PULSANTE 1
      },
         function () { console.log("1") });
   */

   //POSIZIONE A SINISTRA O A DESTRA IN BASE AL SEGNO
   let FlagX;
   let PositionX;
   if (Obj.PosX >= 0) {
      FlagX = "left";
      PositionX = Obj.PosX;
   };
   if (Obj.PosX < 0) {
      FlagX = "right";
      PositionX = -Obj.PosX;
   };

   //CREAZIONE IMMAGINE PERSONAGGIO
   const DivImage = document.createElement("img");
   DivImage.src = Obj.Image;
   StandardCSS(DivImage, "top", `${Obj.PosY}px`, FlagX, `${PositionX}px`, `${Obj.AtImage}px`, `${Obj.LargImage}px`, Obj.zIndex);

   //TESTO PERSONAGGIO
   const DivText = document.createElement("div");
   E4_PositionNPCText(DivText, Obj);
   //StandardCSS(DivText, "top", `${Obj.PosY + Obj.AtImage}px`, FlagX, `${PositionX}px`, `${Obj.AltText}px`, `${Obj.LargText}px`);
   DivText.style.backgroundColor = Obj.ColorText;
   DivText.style.color = Obj.ColorFontText;
   DivText.style.fontSize = Obj.Font + "px";
   DivText.style.zIndex = Obj.zIndex;
   DivText.innerText = Obj.Text;

   //PULSANTE
   const Puls1 = document.createElement("div");
   if (Obj.PositionText == "Down") StandardCSS(Puls1, "top", `${Obj.PosY + Obj.AtImage + Obj.AltText}px`, FlagX, `${PositionX}px`, `${Obj.AltPuls}px`, `${Obj.LargText}px`, Obj.zIndex);
   if (Obj.PositionText == "Side") StandardCSS(Puls1, "top", `${Obj.PosY + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargImage}px`, `${Obj.AltPuls}px`, `${Obj.LargText}px`, Obj.zIndex);
   Puls1.style.backgroundColor = Obj.ColorPuls;
   Puls1.style.color = Obj.ColorFontPuls;
   Puls1.style.fontSize = Obj.Font + "px";
   Puls1.style.textAlign = "center";
   Puls1.innerText = Obj.Text1;
   Puls1.style.boxSizing = "border-box";
   Puls1.style.border = "2px solid";
   Puls1.style.borderColor = Obj.ColorBorderPuls;

   let Erased = false;

   //ELIMINAZIONE
   function Erase() {
      document.body.removeChild(DivImage);
      document.body.removeChild(DivText);
      document.body.removeChild(Puls1);
      Erased = true;
   };

   Puls1.addEventListener('click', function () {
      Func1();
      if (Erased == false) Erase();
   });
};

/*FUNZIONE CHE VISUALIZZA UN RIQUADRO CON L'IMMAGINE E IL TESTO DI UN NPC, DOPPIO TASTO E DOPPIA FUNZIONE, NO TIMER*/
function E3_DisplayNPCDoubleButton(Obj, Func1, Func2) {
   /*
   MicEnginereturn.VarObject.E3_DisplayNPCDoubleButton({
         //GENERICI
         Font: 15,                                             //FONT IN PIXEL
         PosX: -200,                                            //POSIZIONE X (POSITIVA=SINISTRA, NEGATIVA=DESTRA)
         PosY: 0,                                              //POSIZIONE Y (SOLO TOP)
         zIndex: "11",
         //IMMAGINE
         LargImage: 150,                                       //LARGHEZZA IMMAGINE
         AtImage: 100,                                         //ALTEZZA IMMAGINE
         Image: NPC.Radio.Immagini[GlobalVar.StationType - 1][GlobalVar.GenderNPC],               //IMMAGINE
         //TESTO
         PositionText: "Down",                               //POSIZIONE DEL TESTO RELATIVA ALL'IMMAGINE "Down" "Right "Left
         AltText: 120,                                          //ALTEZZA TESTO
         ColorText: "#000000ff",                             //COLORE SFONDO TESTO
         ColorFontText: "#ffffffff",                         //COLORE FONT TESTO
         Text: NPC.Welcome.Testi[GlobalVar.StationType - 1][GlobalVar.Language + 1],               //TESTO
         //PULSANTI
         AltPuls: 40,                   //ALTEZZA PULSANTI
         ColorPuls: "#000000ff",                             //COLORE SFONDO PULSANTI
         ColorFontPuls: "#ffffffff",                         //COLORE FONT PULSANTI
         ColorBorderPuls: "#ffffffff",                      //COLORE BORDO PULSANTI
         Text1: "1",                   //TESTO PULSANTE 1
         Text2: "2",                   //TESTO PULSANTE 2
      },
         function () { console.log("1") },
         function () { console.log("2") });
   */

   //POSIZIONE A SINISTRA O A DESTRA IN BASE AL SEGNO
   let FlagX;
   let PositionX;
   if (Obj.PosX >= 0) {
      FlagX = "left";
      PositionX = Obj.PosX;
   };
   if (Obj.PosX < 0) {
      FlagX = "right";
      PositionX = -Obj.PosX;
   };

   //CREAZIONE IMMAGINE PERSONAGGIO
   const DivImage = document.createElement("img");
   DivImage.src = Obj.Image;
   StandardCSS(DivImage, "top", `${Obj.PosY}px`, FlagX, `${PositionX}px`, `${Obj.AtImage}px`, `${Obj.LargImage}px`, Obj.zIndex);

   //TESTO PERSONAGGIO
   const DivText = document.createElement("div");
   E4_PositionNPCText(DivText, Obj);
   DivText.style.backgroundColor = Obj.ColorText;
   DivText.style.color = Obj.ColorFontText;
   DivText.style.fontSize = Obj.Font + "px";
   DivText.style.zIndex = Obj.zIndex;
   DivText.innerText = Obj.Text;

   //PULSANTE SX
   const Puls1 = document.createElement("div");
   if (Obj.PositionText == "Down") StandardCSS(Puls1, "top", `${Obj.PosY + Obj.AtImage + Obj.AltText}px`, FlagX, `${PositionX}px`, `${Obj.AltPuls}px`, `${Obj.LargText / 2}px`, Obj.zIndex);
   if (Obj.PositionText == "Side") StandardCSS(Puls1, "top", `${Obj.PosY + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargImage}px`, `${Obj.AltPuls}px`, `${Obj.LargText / 2}px`, Obj.zIndex);
   Puls1.style.backgroundColor = Obj.ColorPuls;
   Puls1.style.color = Obj.ColorFontPuls;
   Puls1.style.fontSize = Obj.Font + "px";
   Puls1.style.textAlign = "center";
   Puls1.innerText = Obj.Text1;
   Puls1.style.boxSizing = "border-box";
   Puls1.style.border = "2px solid";
   Puls1.style.borderColor = Obj.ColorBorderPuls;

   //PULSANTE DX
   const Puls2 = document.createElement("div");
   if (Obj.PositionText == "Down") StandardCSS(Puls2, "top", `${Obj.PosY + Obj.AtImage + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargText / 2}px`, `${Obj.AltPuls}px`, `${Obj.LargText / 2}px`, Obj.zIndex);
   if (Obj.PositionText == "Side") StandardCSS(Puls2, "top", `${Obj.PosY + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargImage + Obj.LargText / 2}px`, `${Obj.AltPuls}px`, `${Obj.LargText / 2}px`, Obj.zIndex);
   Puls2.style.backgroundColor = Obj.ColorPuls;
   Puls2.style.color = Obj.ColorFontPuls;
   Puls2.style.fontSize = Obj.Font + "px";
   Puls2.style.textAlign = "center";
   Puls2.innerText = Obj.Text2;
   Puls2.style.boxSizing = "border-box";
   Puls2.style.border = "2px solid";
   Puls2.style.borderColor = Obj.ColorBorderPuls;

   let Erased = false;

   //ELIMINAZIONE
   function Erase() {
      document.body.removeChild(DivImage);
      document.body.removeChild(DivText);
      document.body.removeChild(Puls1);
      document.body.removeChild(Puls2);
      Erased = true;
   };

   Puls1.addEventListener('click', function () {
      Func1();
      if (Erased == false) Erase();
   });
   Puls2.addEventListener('click', function () {
      Func2();
      if (Erased == false) Erase();
   });
};

/*MECCANICHE DELLA PAGINA DI DIARIO DI MISSIONE DIVISE PER CAPITOLI*/
export function S0_MissionDiary(Obj) {
   /*
   ChaptersHUD, MissionsHUD - OGGETTI GENERATI CON S0_GenerateHUD CHE CONTENGONO I PULSANTI DI CAPITOLO E DI MISSIONE DISPOSTI
   IN VERTICALE, NON È NECESSARIO CREARE IL NUMERO PRECISO DI PULSANTI, BASTA CHE SIANO UGUALI O MAGGIORI DEL NUMERO DI CAPITOLI
   O DI MISSIONI
   Testi - ARRAY CON I TESTI DA VISUALIZZARE
   [
        {
            Testo: [`PROLOGUE
                    Economy and Energy`, `PROLOGO
                    Economia ed energia`],
            Missioni: [
                ["1 Modify the ship", "1 Modifica la nave"],
                ["2 First mission", "2 Prima missione"],
                ["3 Expand the load", "3 Espandi il carico"],
            ]
        },
        {
            Testo: [`CHAPTER 1
                    Rewarding Missions`, `CAPITOLO 1
                    Missioni remunerative`],
            Missioni: [
                ["1", "0"],
                ["0", "0"],
                ["0", "0"],
            ]
        },

   ESEMPIO:
   S0_MissionDiary({
      ChaptersHUD: ChaptersHUD,                                //OGGETTO PULSANTI CAPITOLI
      MissionsHUD: MissionsHUD,                                //OGGETTO PULSANTI MISSIONI
      Testi: Testi.Missions,                                   //ARRAY CON I TESTI
      Capitolo: GlobalVar.Capitolo,                            //VALORE ATTUALE DI CAPITOLO SBLOCCATO
      Missione: GlobalVar.Missione,                            //VALORE ATTUALE DI MISSIONE SBLOCCATA
      ColorActive: Colors.ActivePuls,                          //COLORE DEL PULSANTE SBLOCCATO
      ColorUnactive: Colors.DisabledMission,                   //COLORE DEL PULSANTE BLOCCATO
      ColorSelected: Colors.SelectedPuls,                      //COLORE DEL PULSANTE SELEZIONATO
      CapitoloText: Testi.Menu.Capitolo[GlobalVar.Language],   //TESTO MULTILINGUA "CAPITOLO", OMETTERE PER IL SOLO NUMERO
      Language: GlobalVar.Language,                            //LINGUA DI SISTEMA
   });
   */
   let SelectChapter = Obj.Capitolo;           //CAPITOLO SELEZIONATO NEL MENU

   //CREAZIONE DIV CONTENITORE SCROLLABILE VERTICALE
   function ScrollDiv(Right, Width) {
      const scrollDiv1 = document.createElement('div');
      scrollDiv1.style.width = Width;
      scrollDiv1.style.height = '100%';
      scrollDiv1.style.right = Right;
      scrollDiv1.style.position = "absolute";
      scrollDiv1.style.overflowY = 'auto';
      scrollDiv1.style.overflowX = 'hidden';
      document.body.appendChild(scrollDiv1);
      return scrollDiv1;
   };
   //AGGIORNA TESTI MISSIONI IN BASE AL CAPITOLO SELEZIONATO
   function UpdateMissions() {
      for (let i = 0; i < Obj.MissionsHUD.Pulsanti.length; i++) {
         //MOSTRA LE MISSIONI DISPONIBILI E RINOMINALE, NASCONDI LE ALTRE
         if (i < Obj.Testi[SelectChapter].Missioni.length) {
            Obj.MissionsHUD.Pulsanti[i].style.display = "block";
            //SE IL CAPITOLO SELEZIONATO È STATO SBLOCCATO RINOMINA LE MISSIONI
            if (SelectChapter < Obj.Capitolo || Obj.Blocco == false) {
               Obj.MissionsHUD.Pulsanti[i].children[0].innerText = Obj.Testi[SelectChapter].Missioni[i][Obj.Language];
               Obj.MissionsHUD.Pulsanti[i].style.backgroundColor = Obj.ColorActive;
            }
            else if (SelectChapter == Obj.Capitolo || Obj.Blocco == false) {
               /*CAMBIA TESTO ALLE MISSIONI E CAMBIA COLORE SE NON LI SI HA ANCORA SBLOCCATI*/
               //SE LA MISSIONE È STATA SBLOCCATA RINOMINALA
               if (i <= Obj.Missione || Obj.Blocco == false) {
                  Obj.MissionsHUD.Pulsanti[i].children[0].innerText = Obj.Testi[SelectChapter].Missioni[i][Obj.Language];
                  Obj.MissionsHUD.Pulsanti[i].style.backgroundColor = Obj.ColorActive;
               }
               //ALTRIMENTI NUMERALA
               else {
                  Obj.MissionsHUD.Pulsanti[i].children[0].innerText = `${i}`;
                  Obj.MissionsHUD.Pulsanti[i].style.backgroundColor = Obj.ColorUnactive;
               };
            }
            //ALTRIMENTI
            else {
               Obj.MissionsHUD.Pulsanti[i].children[0].innerText = `${i}`;
               Obj.MissionsHUD.Pulsanti[i].style.backgroundColor = Obj.ColorUnactive;
            };
         }
         else Obj.MissionsHUD.Pulsanti[i].style.display = "none";
      };
   };
   UpdateMissions();
   //AGGIORNA IL COLORE DEI PULSANTI DEI CAPITOLI IN BASE A QUELLO SELEZIONATO E A QUELLI SBLOCCATI
   function UpdateChapters() {
      for (let b = 0; b < Obj.ChaptersHUD.Pulsanti.length; b++) {
         if (b > Obj.Capitolo && Obj.Blocco == true) {
            Obj.ChaptersHUD.Pulsanti[b].children[0].innerText = `${Obj.CapitoloText} ${b}`;
            Obj.ChaptersHUD.Pulsanti[b].style.backgroundColor = Obj.ColorUnactive;
         }
         else Obj.ChaptersHUD.Pulsanti[b].style.backgroundColor = Obj.ColorActive;
         if (b == SelectChapter) Obj.ChaptersHUD.Pulsanti[b].style.backgroundColor = Obj.ColorSelected;
      };
   };
   UpdateChapters();

   //LISTA CAPITOLI
   const Scroll1 = ScrollDiv(Obj.ChaptersRight, Obj.ChaptersWidth);
   for (let i = 0; i < Obj.ChaptersHUD.Pulsanti.length; i++) {
      Scroll1.appendChild(Obj.ChaptersHUD.Pulsanti[i]);
      Obj.ChaptersHUD.Pulsanti[i].children[0].innerText = Obj.Testi[i].Testo[Obj.Language];
      //CAMBIA TESTO AI CAPITOLI E CAMBIA COLORE SE NON LI SI HA ANCORA SBLOCCATI
      if (i > Obj.Capitolo && Obj.Blocco == true) {
         Obj.ChaptersHUD.Pulsanti[i].children[0].innerText = `${Obj.CapitoloText} ${i}`;
         Obj.ChaptersHUD.Pulsanti[i].style.backgroundColor = Obj.ColorUnactive;
      };
      //FUNZIONE CLICK
      Obj.ChaptersHUD.Pulsanti[i].addEventListener('click', function () {
         SelectChapter = i;
         UpdateChapters();
         UpdateMissions();
      });
   };
   //LISTA MISSIONI
   const Scroll2 = ScrollDiv(Obj.MissionsRight, Obj.MissionsWidth);
   for (let i = 0; i < Obj.MissionsHUD.Pulsanti.length; i++) {
      Scroll2.appendChild(Obj.MissionsHUD.Pulsanti[i]);
   };

   //METTI LO SCROLL AUTOMATICO DELLE MISSIONI SU QUELLA ATTUALE
   const target = Scroll2.children[Obj.Missione]; //ad esempio il terzo elemento
   if (target) {
      target.scrollIntoView({ behavior: "instant", block: "nearest" });
      //puoi usare anche "smooth" al posto di "instant"
   }
};

/*AGGIORNA UN TESTO HTML SENZA CREARE GARBAGE--------------------ELIMINARE*/
function E3_UpdateText(el, text) {
   if (!el.firstChild) {
      el.appendChild(document.createTextNode(""));
   };
   el.firstChild.nodeValue = text;
};
//#endregion

/*--------------------------------------------------------VARIE-----------------------------------------------------------*/
//#region
//VISUALIZZAZIONE CONSOLE LOG OGGETTI//
function LogEngine(Oggetti) {
   Object.defineProperty(Scene, 'uuid', {
      enumerable: false
   });

   for (let a = 0; a < Object.keys(Scene.children).length; a++) {
      Object.defineProperty(Scene.children[a], 'uuid', {
         enumerable: false
      });

      for (let b = 0; b < Object.keys(Scene.children[a].children).length; b++) {
         Object.defineProperty(Scene.children[a].children[b], 'uuid', {
            enumerable: false
         });

         for (let c = 0; c < Object.keys(Scene.children[a].children[b].children).length; c++) {
            Object.defineProperty(Scene.children[a].children[b].children[c], 'uuid', {
               enumerable: false
            });

            for (let d = 0; d < Object.keys(Scene.children[a].children[b].children[c].children).length; d++) {
               Object.defineProperty(Scene.children[a].children[b].children[c].children[d], 'uuid', {
                  enumerable: false
               });

               for (let e = 0; e < Object.keys(Scene.children[a].children[b].children[c].children[d].children).length; e++) {
                  Object.defineProperty(Scene.children[a].children[b].children[c].children[d].children[e], 'uuid', {
                     enumerable: false
                  });

                  for (let f = 0; f < Object.keys(Scene.children[a].children[b].children[c].children[d].children[e].children).length; f++) {
                     Object.defineProperty(Scene.children[a].children[b].children[c].children[d].children[e].children[f], 'uuid', {
                        enumerable: false
                     });

                     for (let g = 0; g < Object.keys(Scene.children[a].children[b].children[c].children[d].children[e].children[f].children).length; g++) {
                        Object.defineProperty(Scene.children[a].children[b].children[c].children[d].children[e].children[f].children[g], 'uuid', {
                           enumerable: false
                        });

                        for (let h = 0; h < Object.keys(Scene.children[a].children[b].children[c].children[d].children[e].children[f].children[g].children).length; h++) {
                           Object.defineProperty(Scene.children[a].children[b].children[c].children[d].children[e].children[f].children[g].children[h], 'uuid', {
                              enumerable: false
                           });

                           for (let i = 0; i < Object.keys(Scene.children[a].children[b].children[c].children[d].children[e].children[f].children[g].children[h].children).length; i++) {
                              Object.defineProperty(Scene.children[a].children[b].children[c].children[d].children[e].children[f].children[g].children[h].children[i], 'uuid', {
                                 enumerable: false
                              });



                           };

                        };

                     };

                  };

               };

            };
         };
      };
   };

   console.log(Oggetti);
   console.log(Scene);
};

//----------------------------------------------FUNZIONI MATEMATICHE---------------------------------------------//
function E3_AngleZero(VectorIn, VectorOut) {
   function ValueZero(In) {
      let Out;

      if (In < -Math.PI * 3) Out = Math.PI + (In + Math.PI * 3);
      else if (In < -Math.PI && In > -Math.PI * 3) Out = Math.PI + (In + Math.PI);
      else if (In > Math.PI * 3) Out = -Math.PI + (In - Math.PI * 3);
      else if (In > Math.PI && In < Math.PI * 3) Out = -Math.PI + (In - Math.PI);
      else Out = In;

      return Out;
   };

   VectorOut.set(ValueZero(VectorIn.x), ValueZero(VectorIn.y), ValueZero(VectorIn.z));

   return VectorOut;
};

function CompareIncrement(Vector, SetX, SetY, SetZ, Incr) {
   if (Vector.x < SetX) {
      Vector.x += Incr;
   };
   if (Vector.x > SetX) {
      Vector.x -= Incr;
   };
   if (Vector.y < SetY) {
      Vector.y += Incr;
   };
   if (Vector.y > SetY) {
      Vector.y -= Incr;
   };
   if (Vector.z < SetZ) {
      Vector.z += Incr;
   };
   if (Vector.z > SetZ) {
      Vector.z -= Incr;
   };
};

//CONVERSIONE DI DUE ANGOLI DI EULERO IN QUATERNIONI E ROTAZIONE PROGRESSIVA SENZA GIMBAL LOCK O ANGOLI ERRATI
function E3_EulerQuaternionInterpolation() {
   /*
   const Rotazione = E3_EulerQuaternionInterpolation();
   Rotazione.SetVectors(V0, V1, 0.1);
 
   //NEL CICLO DI RENDER
   Rotazione.Update(delta);
   Obj.quaternion.copy(Rotazione.QuatLerp);
   */
   const EulerStart = new THREE.Euler(0, 0, 0);
   const EulerEnd = new THREE.Euler(0, 0, 0);

   const QuatStart = new THREE.Quaternion();
   const QuatEnd = new THREE.Quaternion();
   const QuatLerp = new THREE.Quaternion();     //QUATERNIONE DI INTERPOLAZIONE

   let elapsed = 0;
   let duration = 1;  //Durata di default, può essere cambiata
   let VectorSet = false;     //FLAG DI VETTORI IMPOSTATI
   let End = false;           //FLAG DI ROTAZIONE ESEGUITA

   //FUNZIONE DI AGGIORNAMENTO DEI PARAMETRI
   function SetVectors(VectorStart, EndX, EndY, EndZ, Seconds) {
      if (VectorSet == false) {
         EulerStart.set(VectorStart.x, VectorStart.y, VectorStart.z);
         EulerEnd.set(EndX, EndY, EndZ);
         QuatStart.setFromEuler(EulerStart);
         QuatEnd.setFromEuler(EulerEnd);
         elapsed = 0;
         End = false;
         duration = Seconds;
         VectorSet = true;    //IMPOSTAIL FLAG DI VETTORI IMPOSTATI PER FARLO ESEGUIRE UNA SOLA VOLTA
      };
   };

   //FUNZIONE DI UPDATE
   function Update(delta) {
      //Avanza il tempo in base alla velocità
      elapsed += delta;

      //Calcola la frazione, clampa tra 0 e 1
      const t = Math.min(elapsed / duration, 1);

      //Interpola tra i quaternioni
      QuatLerp.slerpQuaternions(QuatStart, QuatEnd, t);

      if (t >= 1) End = true;
   };

   return { SetVectors, Update, QuatLerp, get End() { return End; } };
};

//CONVERTE E VISUALIZZA LA DISTANZA (Num=1 METRO NEL GIOCO)
function E3_DisplayDistance(Num, UA) {
   let Value;
   if (Num < 1000) Value = `${(Num).toFixed(0)} m`;
   if (Num > 1000 && Num < 10000) Value = `${(Num / 1000).toFixed(2)} km`;
   if (Num > 10000 && Num < 100000) Value = `${(Num / 1000).toFixed(1)} km`;
   if (Num > 100000 && Num < 1000000) Value = `${(Num / 1000).toFixed(0)} km`;
   if (Num > 1000000 && Num < 10000000) Value = `${(Num / 1000).toFixed(3)} km`;
   if (Num > 10000000 && Num < 100000000) Value = `${(Num / 1000000).toFixed(2)} k km`;
   if (Num > 100000000 && Num < 1000000000) Value = `${(Num / 1000000).toFixed(1)} k km`;
   if (Num > 1000000000 && Num < 10000000000) Value = `${(Num / 1000000).toFixed(0)} k km`;
   if (Num > 10000000000 && Num < 100000000000) Value = `${(Num / 1000000000).toFixed(2)} M km`;
   if (UA == false) {
      if (Num > 100000000000) Value = `${(Num / 1000000000).toFixed(1)} M km`;
   };
   if (UA == true) {
      if (Num > 100000000000 && Num < 149597870707) Value = `${(Num / 1000000000).toFixed(1)} M km`;
      if (Num > 149597870707) Value = `${(Num / 149597870707).toFixed(3)} UA`;
   };

   return Value;
};

//CONVERTE E VISUALIZZA LA VELOCITÀ (Num=m/s NEL GIOCO)
function DisplaySpeed(Num) {     //NUM=M/S
   let Value;

   if (Num < 1000) {
      Value = `${Num.toFixed(0)}m/s`;
   };
   if (Num >= 1000 && Num < 10000) {
      Value = `${(Num / 1000).toFixed(3)}km/s`;
   };
   if (Num >= 10000 && Num < 100000) {
      Value = `${(Num / 1000).toFixed(2)}km/s`;
   };
   if (Num >= 100000 && Num < 1000000) {
      Value = `${(Num / 1000).toFixed(1)}km/s`;
   };
   if (Num >= 1000000 && Num < 10000000) {
      Value = `${(Num / 1000).toFixed(0)}km/s`;
   };
   if (Num >= 10000000 && Num < 300000000) {
      Value = `${(Num / 300000000).toFixed(3)}C`;
   };
   if (Num >= 300000000 && Num < 3000000000) {
      Value = `${(Num / 300000000).toFixed(2)}C`;
   };
   if (Num >= 3000000000 && Num < 30000000000) {
      Value = `${(Num / 300000000).toFixed(1)}C`;
   };
   if (Num >= 30000000000) {
      Value = `${(Num / 300000000).toFixed(0)}C`;
   };

   return Value;
};
/*VALORE TEMPO ARRIVO E UNITÀ DI MISURA DA SECONDI A ORE*/
function E3_DisplayTime(Num) {      //NUM=SECONDI
   let Value;
   let Numb = Number(Num);
   if (Numb < 60) Value = `${Numb.toFixed(1)} sec`;
   if (Numb > 60 && Numb < 3600) Value = `${(Numb / 60).toFixed(1)} min`;
   if (Numb > 3600) Value = `${(Numb / 3600).toFixed(1)} ${Testi.Hours[Language]}`;

   return Value;
};
/*CALCOLO DELLA SCALA DI UN OGGETTO IN BASE ALLA DISTANZA MINIMA E MASSIMA E ALLA DIMENSIONE MASSIMA*/
function DynamicScale(Dist, DistMin, DistMax, MinScale, MaxScale) {
   if (Dist >= DistMax) {
      return MinScale;
   } else if (Dist <= DistMin) {
      return MaxScale;
   } else {
      //Interpolazione lineare tra MaxScale e MinScale
      let t = (Dist - DistMin) / (DistMax - DistMin); //da 0 a 1
      return MaxScale + (MinScale - MaxScale) * t;
   }
}

/*FUNZIONE CHE MAPPA UNA VARIABILE IN BASE AI VALORI MINIMI E MASSIMI DI UN'ALTRA*/
function CoeffMap(Var, Min, Max, MinCoeff, MaxCoeff) {
   if (Var <= Min) {
      return MinCoeff;
   } else if (Var >= Max) {
      return MaxCoeff;
   } else {
      //CALCOLO PROPORZIONALE DAL MINIMO AL MASSIMO COEFFICIENTE
      return MinCoeff + (Var - Min) * ((MaxCoeff - MinCoeff) / (Max - Min));
   };
};

/*FUNZIONE CHE METTE IN ORDINE CRESCENTE I VALORI DI UN ARRAY*/
function E3_SortedArray(Array, SortedValue) {
   /*
   Restituisce il valore richiesto e l'indice corrispondente all'array originale
   */
   const sorted = [...Array].sort((a, b) => a - b);
   const Val = sorted[SortedValue];               //valore più piccolo
   const Index = Array.indexOf(Val);      //primo indice in arr
   return { Val, Index };
};

/*--------------------FUNZIONI DI MODIFICA ARRAY------------------*/
function E3_ModifyArray(Array) {
   /*
   Array: Array da modificare
   */

   //AGGIUNGE NUMERI
   function Add(Indice, Numeri) {
      /*
      Indice: Indice dove aggiungere numeri
      Numeri: Array di numeri da aggiungere
      */
      Array.splice(Indice, 0, ...Numeri);
   };
   //TOGLIE NUMERI
   function Sub(Indice, Num) {
      /*
      Indice: Indice dove togliere numeri
      Num: Numeri da togliere
      */
      Array.splice(Indice, Num);
   };
   //SCAMBIA CON IL PRECEDENTE
   function SwitchUp(Indice, Num) {
      /*
      Indice: Indice dove scambiare i numeri
      Num: Numeri da scambiare
      */
      //MEMORIZZA I NUMERI ORIGINALI DA SCAMBIARE
      let NumeriOriginali = [];
      for (let i = 0; i < Num; i++) {
         NumeriOriginali.push(Array[Indice + i]);
      };
      let NumeriPrecedenti = [];
      for (let i = 0; i < Num; i++) {
         NumeriPrecedenti.push(Array[Indice + i - Num]);
      };
      //SOSTITUISCI IL MODULO SELEZIONATO CON QUELLO A SINISTRA
      Array.splice(Indice, Num, ...NumeriPrecedenti);
      //SOSTITUISCI IL MODULO A SINISTRA CON QUELLO SELEZIONATO
      Array.splice(Indice - Num, Num, ...NumeriOriginali);
   };
   //SCAMBIA CON IL SUCCESSIVO
   function SwitchDown(Indice, Num) {
      /*
      Indice: Indice dove scambiare i numeri
      Num: Numeri da scambiare
      */
      //MEMORIZZA I NUMERI ORIGINALI DA SCAMBIARE
      let NumeriOriginali = [];
      for (let i = 0; i < Num; i++) {
         NumeriOriginali.push(Array[Indice + i]);
      };
      let NumeriSuccessivi = [];
      for (let i = 0; i < Num; i++) {
         NumeriSuccessivi.push(Array[Indice + i + Num]);
      };
      //SOSTITUISCI GLI INDICI SELEZIONATI CON QUELLI 
      Array.splice(Indice, Num, ...NumeriSuccessivi);
      //SOSTITUISCI IL MODULO A SINISTRA CON QUELLO SELEZIONATO
      Array.splice(Indice + Num, Num, ...NumeriOriginali);
   };
   //SOSTITUISCI
   function Replace(Indice, Numeri) {
      /*
      Indice: Indice dove sostituire i numeri
      Numeri: Array di numeri da sostituire
      */
      //SOSTITUISCI GLI INDICI CON I NUOVI
      Array.splice(Indice, Numeri.length, ...Numeri);
   };
   function UpdateArray(NewArray) {
      Array = NewArray;
   };

   //TROVA L'INDICE IN BASE AL VALORE
   function GetIndex(Val) {
      return Array.indexOf(Val);
   };

   return { Add, Sub, SwitchUp, SwitchDown, Replace, UpdateArray, GetIndex };
};

/*FUNZIONE CHE GENERA I VALORI DI ATTRIBUTI MANTENENDO FISSA LA MEDIA*/
function E3_GenerateAttributes(mean, count, min, max, seed = Math.random) {
   /*
   const Attributes = MicEnginereturn.VarObject.E3_GenerateAttributes(0.5, 4, 0.2, 0.8);
   */

   const total = mean * count;
   const maxTotal = max * count;
   const minTotal = min * count;

   //Verifica se è possibile rispettare i limiti
   if (total < minTotal || total > maxTotal) {
      throw new Error("Impossibile rispettare limiti con questa media.");
   }

   //Genera valori iniziali casuali entro il range
   let values = Array.from({ length: count }, () =>
      min + (max - min) * seed()
   );

   //Calcola la somma iniziale
   let currentSum = values.reduce((a, b) => a + b, 0);
   let diff = total - currentSum;

   //Redistribuzione per correggere la somma
   while (Math.abs(diff) > 1e-10) {
      const adjustable = values
         .map((val, i) => ({ val, i }))
         .filter(({ val }) =>
            diff > 0 ? val < max : val > min
         );

      if (adjustable.length === 0) break;

      const delta = diff / adjustable.length;
      for (let { i, val } of adjustable) {
         const newVal = val + delta;
         values[i] = Math.max(min, Math.min(max, newVal));
      }

      currentSum = values.reduce((a, b) => a + b, 0);
      diff = total - currentSum;
   }

   return values;
};

/*FUNZIONE CHE SCEGLIE UN PUNTO CASUALE IN UNA CORONA CIRCOLARE AVENTE RAGGIO MASSIMO E RAGGIO MINIMO*/
function E3_RandomPointInRing(rMin, rMax) {
   /*
   UTILIZZATO PER GENERARE CASUALMENTE LA POSIZIONE DELLA NUVOLA DI ELEMENTO IGNOTO TRA LE ORBITE DI NETTUNO E PLUTONE
   CON POSIZIONE FISSA, MA CASUALE AD OGNI INIZIO DI AVVENTURA
   */
   const angle = Math.random() * Math.PI * 2;
   const r = Math.sqrt(Math.random() * (rMax * rMax - rMin * rMin) + rMin * rMin);

   const x = r * Math.cos(angle);
   const z = r * Math.sin(angle);

   return { x, z };
};

/*--------------------------------------------------CLASSI GENERICHE-----------------------------------------------*/
/*CLASSE CHE ESEGUE UNA FUNZIONE AL VARIARE DI UNA VARIABILE*/
class OnceFunction {
   //ISTRUZIONI
   //const Oggetto = new OnceFunction(function () {FUNZIONE DA ESEGUIRE});
   //Oggetto.Update(VARIABILE DI CONTROLLO);
   //LA FUNZIONE Update() PUÒ ESSERE INSERITA ALL'INTERNO DI UN LOOP E FINCHÈ LA VARIABILE DI CONTROLLO
   //NON VARIA LA FUNZIONE NON VERRÀ ESEGUITA
   /*
   const MissionText = new MicEnginereturn.VarObject.OnceFunction(function () {
      G1_ShowMissionText();
      VarObject.BlinkMissions = true;
   }, GlobalVar.Capitolo * 10 + GlobalVar.Missione);     //VALORE INIZIALE DI INPUT (OPZIONALE)

   MissionText.Update(GlobalVar.Capitolo * 10 + GlobalVar.Missione);

   NOTA: CON QUESTO ESEMPIO LA FUNZIONE È ESEGUITA UNA SOLA VOLTA MA SOLO QUANDO LA VARIABILE DI CONTROLLO EFFETTIVAMENTE CAMBIA E NON QUANDO PASSA DA ZERO A UN VALORE
   */

   constructor(Func, InitialValue = 0) {
      this.Variable = InitialValue;
      this.Func = Func;
   };
   Update(Input) {
      if (this.Variable != Input) {
         this.Func();
         this.Variable = Input;
      };
   };
};

class OnceFunctionBool {
   constructor(Func) {
      this.previousValue = false; //inizialmente false
      this.Func = Func;
   }

   /*
   NPCRisveglio.Update(true);    //FUNZIONA ANCHE SENZA VARIABILE ESTERNA
   */
   Update(currentValue) {
      if (!this.previousValue && currentValue === true) {
         //la variabile è passata da false a true
         this.Func();
      }
      this.previousValue = currentValue;
   }
};
//#endregion

/*----------------------------------------------------FUNZIONI THREE.JS-------------------------------------------------------*/
//#region
//CREA UN VETTORE E LO SRESTITUISCE CON LE COORDINATE WORLD DI UN OGGETTO (ADATTO PER ESSERE USATO UNA VOLTA SOLA)
function WorldPos(Object) {
   const Vector = new THREE.Vector3();
   Object.getWorldPosition(Vector);
   return Vector;
};

//UNIFORMA GLI ATTRIBUTI UV
function resetUVs(object) {
   var pos = object.getAttribute('position'),
      nor = object.getAttribute('normal'),
      uvs = object.getAttribute('uv');

   for (var i = 0; i < pos.count; i++) {
      var x = 0,
         y = 0;
      var nx = Math.abs(nor.getX(i)),
         ny = Math.abs(nor.getY(i)),
         nz = Math.abs(nor.getZ(i));

      if (nx >= ny && nx >= nz) {
         x = pos.getZ(i);
         y = pos.getY(i);
      };
      if (ny >= nx && ny >= nz) {
         x = pos.getX(i);
         y = pos.getZ(i);
      };
      if (nz >= nx && nz >= ny) {
         x = pos.getX(i);
         y = pos.getY(i);
      };
      uvs.setXY(i, x, y);
   };
};

//SPARO RAGGI LASER RIUTILIZZABILI
function LaserShots(Oggetto, Vehicle, Target, ParObj) {
   /*
   Oggetto: OGGETTO 3D A CUI AGGIUNGERE I RAGGI LASER E DA CUI PARTIRANNO
   Vehicle: OGGETTO IL CUI GENITORE È LA SCENA
   Target:  VETTORE WORLD DA COLPIRE
   {
     Position: { x: 0, y: 5, z: 0 },
     LunghRaggio: 20,
     VelRaggio: 100,             //DISTANZA CHE IL RAGGIO COPRE OGNI 20MS
     Gittata: 1000,             //DISTANZA OLTRE LA QUALE IL RAGGIO SPARISCE
     CadenzaFuoco: 200,         //MS TRA UN COLPO E L'ALTRO
     Angolo: { x: 0, y: Math.PI, z: 0 },
   }
   */
   /*
   TEMPO DI VOLO = (Gittata/VelRaggio)*20                 2000
   TEMPO SVUOTAMENTO RAGGI = NumRaggi*CadenzaFuoco        5000
   (NumRaggi*CadenzaFuoco)>(Gittata/VelRaggio)*20
 
   CALCOLO AUTOMATICO NUMERO DI RAGGI
   num=((Gittata/VelRaggio)*20)/CadenzaFuoco
*/
   let Hits = 0;                    //VARIABILE DEI COLPI SUBITI

   //MODELLO CANNONE (LINEA)
   const LaserArray = [];              //ARRAY DI OGGETTI LASER
   const LaserPositionArray = [];      //ARRAY DI POSIZIONI INIZIALI LASER

   const LineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
   });

   const LinePoints = [];
   LinePoints.push(new THREE.Vector3(0, 0, 0));
   LinePoints.push(new THREE.Vector3(0, 0, ParObj.LunghRaggio));
   const LineGeometry = new THREE.BufferGeometry().setFromPoints(LinePoints);

   //CALCOLO NUMERO DI RAGGI
   let NumRaggi = Math.floor(((ParObj.Gittata / ParObj.VelRaggio) * 20) / ParObj.CadenzaFuoco + 5);

   //COLLISIONE CON IL TARGET
   for (let i = 0; i < NumRaggi; i++) {
      //CREAZIONE OGGETTO PROIETTILE
      LaserArray[i] = new THREE.Line(LineGeometry, LineMaterial);
      LaserArray[i].position.set(ParObj.Position.x, ParObj.Position.y, ParObj.Position.z);
      LaserArray[i].rotation.set(ParObj.Angolo.x, ParObj.Angolo.y, ParObj.Angolo.z);
      LaserArray[i].visible = false;
      Oggetto.add(LaserArray[i]);
      LaserPositionArray[i] = new THREE.Vector3();          //CREAZIONE VETTORI POSIZIONE INIZIALE PROIETTILI
   };

   //MOVIMENTO DEI PROIETTILI
   setInterval(() => {
      //PER OGNI PROIETTILE
      for (let i = 0; i < LaserArray.length; i++) {
         //SE SONO STATI SPARATI
         if (LaserArray[i].visible == true) {
            //SPOSTA IN AVANTI
            LaserArray[i].translateOnAxis(MicEnginereturn.User.VetAsseZ, ParObj.VelRaggio);
            //SE È TROPPO DISTANTE RESETTALO
            if (LaserArray[i].position.distanceTo(LaserPositionArray[i]) > ParObj.Gittata) {
               LaserArray[i].visible = false;
               LaserArray[i].position.set(ParObj.Position.x, ParObj.Position.y, ParObj.Position.z);
               LaserArray[i].rotation.set(ParObj.Angolo.x, ParObj.Angolo.y, ParObj.Angolo.z);
               Oggetto.add(LaserArray[i]);
            };

            //COLLISIONE CON IL TARGET
            if (LaserArray[i].position.distanceTo(Target) < ParObj.Tolleranza) {
               Hits++;
               LaserArray[i].visible = false;
               LaserArray[i].position.set(ParObj.Position.x, ParObj.Position.y, ParObj.Position.z);
               LaserArray[i].rotation.set(ParObj.Angolo.x, ParObj.Angolo.y, ParObj.Angolo.z);
               Oggetto.add(LaserArray[i]);
            };
         };
      };
   }, 20);

   //SEQUENZA DEI PROIETTILI (UNO OGNI CADENZA DI FUOCO)
   let Bullet = 0;

   //RENDI VISIBILE I RAGGI IN SEQUENZA CICLICA
   function IntervalShot() {
      if (Bullet >= LaserArray.length) Bullet = 0;    //DOPO L'ULTIMO RAGGIO RICOMINCIA DAL PRIMO
      if (Bullet < LaserArray.length) {
         //SPOSTAMENTO PROIETTILE NEL GENITORE ATTUALE DELLA NAVE SPAZIALE (PER VOLARE IN ORBITA)
         Vehicle.parent.attach(LaserArray[Bullet]);
         LaserArray[Bullet].visible = true;
         //MEMORIZZAZIONE POSIZIONE INIZIALE PROIETTILE
         LaserPositionArray[Bullet].set(Vehicle.position.x, Vehicle.position.y, Vehicle.position.z);
      };
      Bullet++;
   };

   let Shooting;           //FUNZIONE SETINTERVAL DA INTERROMPERE CON "STOP"
   let ShotOnce = 0;       //FLAG DI SHOOTING IN CORSO

   function Shot() {
      if (ShotOnce == 0) Shooting = setInterval(IntervalShot, ParObj.CadenzaFuoco);
      ShotOnce = 1;
   };
   function Stop() {
      if (ShotOnce == 1) clearInterval(Shooting);
      ShotOnce = 0;
   };

   return { Shot, Stop, get Hits() { return Hits; } };
};

//CREAZIONE DI UN NEMICO SPAZIALE
function SpaceEnemy(Enemy, Target, Oggetto) {
   //Enemy = OGGETTO 3D NEMICO
   //Target = VETTORE POSIZIONE WORLD NAVE SPAZIALE

   //Variabili per il movimento
   let currentDirection = new THREE.Vector3(1, 0, 0);
   let targetDirection = new THREE.Vector3(1, 0, 0);
   let LaserShotObj;                                     //OGGETTO FUNZIONE LASERSHOT
   let dotProduct;
   let distance;

   //Converte la tolleranza angolare in un valore per il dotProduct
   const dotTolerance = Math.cos(THREE.MathUtils.degToRad(Oggetto.angleTolerance));

   //Funzione per generare una nuova direzione casuale o verso il target
   function getNewDirection() {
      if (Math.random() < Oggetto.attackFrequency) {
         //**Probabilità di attaccare il target**
         return Target.clone().sub(Enemy.position).normalize();
      } else {
         //Direzione casuale
         return new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
         ).normalize();
      };
   };

   //Funzione per mantenere la nave vicino al target
   function limitDistance() {
      let distance = Enemy.position.distanceTo(Target);
      if (distance > Oggetto.maxDistance) {
         let toTarget = Target.clone().sub(Enemy.position).normalize();
         targetDirection.lerp(toTarget, 0.01);
      };
   };

   //Funzione per verificare se la nave sta puntando al target
   function checkIfPointingAtTarget() {
      let toTarget = Target.clone().sub(Enemy.position).normalize();
      dotProduct = currentDirection.dot(toTarget); //Controlla se è allineato

      distance = Enemy.position.distanceTo(Target);

      if (dotProduct > dotTolerance && distance < Oggetto.alertDistance) {
         LaserShotObj.Shot();
      }
      else {
         LaserShotObj.Stop();
      };
   };

   //ABILITAZIONE LASERSHOT
   if (Oggetto.LaserShot.Enable == true) {
      LaserShotObj = MicEnginereturn.VarObject.LaserShots(
         Enemy,                                 //Oggetto
         Enemy,                                 //Vehicle
         Target,                                //Target
         Oggetto.LaserShot.Obj                  //OGGETTO PARAMETRI
      );
   };

   function Update() {
      //Cambia direzione lentamente
      if (Math.random() < 0.01) {
         targetDirection = getNewDirection();
      };

      //Interpolazione per curve ampie
      currentDirection.lerp(targetDirection, Oggetto.Curve);//0.02

      //Mantiene la nave vicino al target
      limitDistance();

      //Muove la nave nella direzione attuale
      Enemy.position.add(currentDirection.clone().multiplyScalar(Oggetto.Speed));

      //**Orientamento corretto: allinea il cono al movimento**
      Enemy.quaternion.setFromUnitVectors(
         VetAsseY, //Direzione iniziale (punta in alto)
         currentDirection.clone().normalize() //Direzione attuale
      );

      //Controlla se sta puntando al target e cambia colore se necessario
      checkIfPointingAtTarget();
   };
   return { Update, get Hits() { return LaserShotObj.Hits; }, get Distance() { return distance; } };
};

//BRACCIO ROBOTICO A DUE ASSI
function E3_Braccio2Assi(Obj) {
   /*---------------------OGGETTO PARAMETRI--------------------*/
   /*
   const Braccio = E3_Braccio2Assi({
      LunghBraccio: 5,
      VelBraccio: 0.03,
      MinYPinza: -5,
      Basamento: true,
   });*/

   let MaxDist = Obj.LunghBraccio * 1.9 / Math.sqrt(2);

   //GEOMETRIE
   const BraccioGeom = E3_GeoCylinder(Obj.RaggioBraccio, Obj.RaggioBraccio, Obj.LunghBraccio, 16, 1, false, 0, Math.PI * 2);

   //PINZA
   const claw = E3_UniversalMesh({
      //PARAMETRI OBBLIGATORI:
      Geom: E3_GeoSphere(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI),
      Material: Obj.MatPinza,
   });
   Scene.add(claw);

   //BRACCIO 1
   const Braccio1 = new THREE.Group();
   const Braccio1Mesh = new THREE.Mesh(BraccioGeom, Obj.MatBraccio1);
   Braccio1.add(Braccio1Mesh);
   Scene.add(Braccio1);

   //BRACCIO 2
   const Braccio2 = new THREE.Group();
   const Braccio2Mesh = new THREE.Mesh(BraccioGeom, Obj.MatBraccio2);
   Braccio2.add(Braccio2Mesh);
   Scene.add(Braccio2);

   //BASAMENTO
   if (Obj.Basamento == true) {
      const Basamento = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32), new THREE.MeshStandardMaterial({ color: 0x808080 }));
      Basamento.position.set(0, -1, 0);
      Scene.add(Basamento);
   };

   //Movimento della pinza
   let PinzaTarget = new THREE.Vector3(0, 0, 0);

   //COMANDI X E Y -100 0 +100
   function UpdateBraccio(ComX, ComY, ComZ, delta) {
      claw.position.lerp(PinzaTarget, 0.1); //Interpolazione fluida

      //MOVIMENTO Y PINZA
      if (ComY < 0 && PinzaTarget.y < 0) PinzaTarget.y -= ComY * Obj.VelBraccio * delta;
      if (ComY > 0 && PinzaTarget.y > Obj.MinYPinza) PinzaTarget.y -= ComY * Obj.VelBraccio * delta;

      //MOVIMENTO X PINZA
      if (ComX < 0 && PinzaTarget.x > - MaxDist) PinzaTarget.x += ComX * Obj.VelBraccio * delta;
      if (ComX > 0 && PinzaTarget.x < MaxDist) PinzaTarget.x += ComX * Obj.VelBraccio * delta;

      //MOVIMENTO Z PINZA
      if (ComZ < 0 && PinzaTarget.z > - MaxDist) PinzaTarget.z += ComZ * Obj.VelBraccio * delta;
      if (ComZ > 0 && PinzaTarget.z < MaxDist) PinzaTarget.z += ComZ * Obj.VelBraccio * delta;


      //POSIZIONE BRACCIO 1
      Braccio1.position.x = claw.position.x / 4;
      Braccio1.position.y = Math.cos(Braccio1Mesh.rotation.z) * Obj.LunghBraccio * 0.5 + Math.cos(Braccio1Mesh.rotation.x) * Obj.LunghBraccio * 0.5 - Obj.LunghBraccio * 0.5;
      Braccio1.position.z = claw.position.z / 4;

      //ANGOLO BRACCIO 1
      Braccio1Mesh.rotation.z = -Math.asin(claw.position.x / (Obj.LunghBraccio * 2));
      Braccio1Mesh.rotation.x = Math.asin(claw.position.z / (Obj.LunghBraccio * 2));
      Braccio1Mesh.rotation.y = -Math.sin(Braccio2Mesh.rotation.x) * Math.sin(Braccio1Mesh.rotation.z) * 0.7;

      //POSIZIONE BRACCIO 2
      Braccio2.position.x = (claw.position.x / 4) * 3;
      Braccio2.position.y = Math.cos(Braccio2Mesh.rotation.z) * Obj.LunghBraccio * 0.5 + Math.cos(Braccio2Mesh.rotation.x) * Obj.LunghBraccio * 0.5 - Obj.LunghBraccio * 0.5;
      Braccio2.position.z = (claw.position.z / 4) * 3;

      //ANGOLO BRACCIO 2
      Braccio2Mesh.rotation.z = Math.asin(claw.position.x / (Obj.LunghBraccio * 2));
      Braccio2Mesh.rotation.x = -Math.asin(claw.position.z / (Obj.LunghBraccio * 2));
      Braccio2Mesh.rotation.y = -Math.sin(Braccio2Mesh.rotation.x) * Math.sin(Braccio1Mesh.rotation.z) * 0.7;
   };

   function Reset() {
      PinzaTarget.set(0, 0, 0);
   };

   return { UpdateBraccio, Reset, get PinzaTarget() { return PinzaTarget; } };
};

//SFERA COLPIBILE
async function E3_SferaColpibile(Obj) {
   /*
   MatObj: Obj.MatObj,
   Displace: Obj.Displace,
   SphereDetail: 64,
   //TARGET
   TargetImg: Obj.TargetImg,
   TargetTollerance: Obj.DistanzaMax,          //TOLLERANZA PER CONSIDERARE IL TARGET COLPITO
   TargetDistance: 0.4,            //DISTANZA DEL TARGET DALLA SUPERFICIE DELLA SFERA
   */
   let NearTarget = 0;
   let originalGeometry; //questa sarà la geometria "di fabbrica"

   //Raycaster
   const raycaster = new THREE.Raycaster();
   const Target = new THREE.Vector2();

   //Parametri del cratere
   const craterRadius = 0.3;  //Raggio del cratere 0.15
   const craterDepth = 0.2;   //Profondità del cratere 0.05
   const falloff = 1;          //Più alto = crateri più arrotondati 3

   //CREAZIONE DELLA SFERA COLPIBILE
   const Material2 = await E3_MaterialeOpaco(Obj.MatObj);
   Material2.displacementScale = Obj.Displace;
   const geometry = E3_GeoSphere(1, Obj.SphereDetail, Obj.SphereDetail / 2, 0, Math.PI * 2, 0, Math.PI);
   const sphere = new THREE.Mesh(geometry, Material2);
   originalGeometry = geometry.clone(); //salva una copia profonda
   sphere.position.set(0, 0, 0);
   Scene.add(sphere);

   //CREAZIONE DEL BERSAGLIO
   const targetPosition = E3_Vector3(); //Salva posizione corrente del bersaglio
   const targetTexture = Loader.load(Obj.TargetImg); //Sostituisci con il tuo file
   const targetMaterial = new THREE.SpriteMaterial({ map: targetTexture });
   const targetSprite = new THREE.Sprite(targetMaterial);
   targetSprite.scale.set(0.2, 0.2, 0.2); //Dimensione del bersaglio
   sphere.add(targetSprite); //Aggiunto alla sfera

   function EventRaycast(PosX, PosY) {
      Target.x = PosX;
      Target.y = PosY;

      //Esegui il raycasting
      raycaster.setFromCamera(Target, Camera);
      const intersects = raycaster.intersectObjects([sphere, targetSprite], true);

      if (intersects.length > 0) {
         //Cerca la prima intersezione con la mesh della sfera
         const intersection = intersects.find(i => i.object === sphere);
         createCrater(sphere.geometry, intersection.point);

         const intersection2 = intersects.find(i => i.object === targetSprite);
         if (intersection2) {
            if (intersection2.point.distanceTo(targetPosition) < Obj.TargetTollerance) {
               NearTarget = intersection2.point.distanceTo(targetPosition);
               RandomTarget();
            }
            else {
               NearTarget = 100;
            };
         }
         else {
            NearTarget = 100;
         };

      };
   };

   function createCrater(geometry, point) {
      const position = geometry.attributes.position;
      const vertices = position.array;
      const posVec = new THREE.Vector3();

      for (let i = 0; i < vertices.length; i += 3) {
         posVec.set(vertices[i], vertices[i + 1], vertices[i + 2]);

         const distance = posVec.distanceTo(point);
         if (distance < craterRadius) {
            //Funzione falloff per un effetto morbido
            const deformation = craterDepth * Math.exp(-falloff * (distance / craterRadius) ** 2);
            posVec.addScaledVector(posVec.clone().normalize(), -deformation);

            vertices[i] = posVec.x;
            vertices[i + 1] = posVec.y;
            vertices[i + 2] = posVec.z;
         };
      };

      position.needsUpdate = true;
      geometry.computeVertexNormals(); //Aggiorna le normali per ombre corrette
   };

   //IMPOSTA LA POSIZIONE X E Y DEL TARGET (-1 0 +1)
   function Shot(PosX, PosY) {
      EventRaycast(PosX, PosY);
   };

   function RandomTarget() {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      const dir = new THREE.Vector3(
         Math.sin(phi) * Math.cos(theta),
         Math.cos(phi),
         Math.sin(phi) * Math.sin(theta)
      );

      const posAttr = geometry.attributes.position;
      const normAttr = geometry.attributes.normal;
      const vertex = new THREE.Vector3();
      let closestIndex = 0;
      let minAngle = Infinity;

      //Trova il vertice più vicino alla direzione scelta
      for (let i = 0; i < posAttr.count; i++) {
         vertex.fromBufferAttribute(posAttr, i).normalize();
         const angle = dir.angleTo(vertex);
         if (angle < minAngle) {
            minAngle = angle;
            closestIndex = i;
         };
      };

      //Calcola la posizione esatta e la normale in quel punto
      const closestVertex = new THREE.Vector3().fromBufferAttribute(posAttr, closestIndex);
      const normal = new THREE.Vector3().fromBufferAttribute(normAttr, closestIndex);

      //Posiziona il target leggermente sopra la superficie
      targetPosition.copy(closestVertex).addScaledVector(normal, Obj.TargetDistance);
      targetSprite.position.copy(targetPosition);

      //Orienta lo sprite verso l’esterno
      targetSprite.lookAt(normal.clone().add(targetPosition));
   };
   RandomTarget();

   function Reset() {
      sphere.geometry.dispose(); //libera la vecchia geometria
      sphere.geometry = originalGeometry.clone(); //usa una nuova copia
   };

   return { Shot, RandomTarget, Reset, get NearTarget() { return NearTarget; } };
};

//STAMPA CONSOLE OGGETTO PERSONALIZZATO
function E2_SimpleObject(obj, excludeKeys, seen = new WeakSet()) {
   if (obj === null || typeof obj !== 'object') return obj;

   if (seen.has(obj)) return '[Circular]';
   seen.add(obj);

   if (Array.isArray(obj)) {
      return obj.map(item => E2_SimpleObject(item, excludeKeys, seen));
   }

   const result = {};
   for (let key in obj) {
      if (excludeKeys.includes(key)) continue;

      try {
         const value = obj[key];
         if (typeof value === 'object') {
            if (value instanceof THREE.Object3D) {
               //Solo alcune info base degli oggetti 3D
               result[key] = {
                  type: value.type,
                  name: value.name,
                  position: value.position,
                  children: E2_SimpleObject(value.children, excludeKeys, seen)
               };
            } else {
               result[key] = E2_SimpleObject(value, excludeKeys, seen);
            }
         } else {
            result[key] = value;
         }
      } catch (e) {
         result[key] = `[Unreadable: ${e.message}]`;
      }
   }

   return result;
};

function E3_ConsoleLogSimpleObject(Obj) {
   //PARAMETRI STANDARD PER OGGETTI THREE SU CONSOLE
   const ThreeSimpleParameters = ['animations', 'background', 'backgroundBlurriness', 'backgroundIntensity', 'backgroundRotation', 'castShadow', 'customDepthMaterial', 'customDistanceMaterial', 'environment', 'environmentIntensity', 'environmentRotation', 'fog', 'frustumCulled', 'layers', 'matrix', 'matrixAutoUpdate', 'matrixWorld', 'matrixWorldAutoUpdate', 'matrixWorldNeedsUpdate', 'overrideMaterial', 'quaternion', 'receiveShadow', 'parent', 'renderOrder', 'up', 'userData', 'uuid', 'isGroup', 'isObject3D', 'isScene'];

   const Result = E2_SimpleObject(Obj, ThreeSimpleParameters);

   return Result;
};

function E3_MovimentoInerzia(Obj) {
   let Velocity = new THREE.Vector3();

   function Update(ComX, ComY, ComZ, delta) {
      //MOVIMENTO ASSE X
      if (ComX < 0 && Obj.Oggetto.position.x > -Obj.DimensioneX / 2) Velocity.x += (ComX / 100) * Obj.Accelerazione * delta;
      if (ComX > 0 && Obj.Oggetto.position.x < Obj.DimensioneX / 2) Velocity.x += (ComX / 100) * Obj.Accelerazione * delta;
      //EFFETTO MOLLA CONTRO UN LIMITE
      if (Obj.DimensioneX > 0 && ComX == 0) {
         if (Obj.Oggetto.position.x > Obj.DimensioneX / 2) Velocity.x -= Obj.Accelerazione * 0.1 * delta;
         if (Obj.Oggetto.position.x < -Obj.DimensioneX / 2) Velocity.x += Obj.Accelerazione * 0.1 * delta;
      };

      //MOVIMENTO ASSE Y
      if (ComY < 0 && Obj.Oggetto.position.y > -Obj.DimensioneY / 2) Velocity.y += (ComY / 100) * Obj.Accelerazione * delta;
      if (ComY > 0 && Obj.Oggetto.position.y < Obj.DimensioneY / 2) Velocity.y += (ComY / 100) * Obj.Accelerazione * delta;
      //EFFETTO MOLLA CONTRO UN LIMITE
      if (Obj.DimensioneY > 0 && ComY == 0) {
         if (Obj.Oggetto.position.y > Obj.DimensioneY / 2) Velocity.y -= Obj.Accelerazione * 0.1 * delta;
         if (Obj.Oggetto.position.y < -Obj.DimensioneY / 2) Velocity.y += Obj.Accelerazione * 0.1 * delta;
      };

      //MOVIMENTO ASSE Z
      if (ComZ < 0 && Obj.Oggetto.position.z > -Obj.DimensioneZ / 2) Velocity.z += (ComZ / 100) * Obj.Accelerazione * delta;
      if (ComZ > 0 && Obj.Oggetto.position.z < Obj.DimensioneZ / 2) Velocity.z += (ComZ / 100) * Obj.Accelerazione * delta;
      //EFFETTO MOLLA CONTRO UN LIMITE
      if (Obj.DimensioneZ > 0 && ComZ == 0) {
         if (Obj.Oggetto.position.z > Obj.DimensioneZ / 2) Velocity.z -= Obj.Accelerazione * 0.1 * delta;
         if (Obj.Oggetto.position.z < -Obj.DimensioneZ / 2) Velocity.z += Obj.Accelerazione * 0.1 * delta;
      };

      Velocity.multiplyScalar(Obj.Frizione);
      Obj.Oggetto.position.add(Velocity);
   };
   return { Update, get Position() { return Obj.Oggetto.position; } };
};

async function E3_Explosion(Obj) {
   const fragments = [];
   let active = false;

   //OGGETTO TEMPORANEO PER I FRAMMENTI
   //const geometry = E3_GeoBox(0.5, 0.5, 0.5, 1, 1, 1);
   const geometry = E3_GeoSphere(1, 8, 4, 0, Math.PI * 2, 0, Math.PI);
   const material = await E3_MaterialeBase({
      RepeatX: 1,
      RepeatY: 1,
      Side: "Front",          //"Front", "Double"
      Color: 0xffe7ab,
      Transparent: false,
      Opacity: 1,
      DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
      //MAPPA COLORE
      Map: false,
      MapTexture: './Engine/Texture/FrammentoEsplosione2.jpg',
      AlphaMap: false,
   });
   const fragmentModel = new THREE.Mesh(geometry, material);

   function Enable() {
      fragments.length = 0;
      active = true;

      for (let i = 0; i < Obj.Num; i++) {
         const fragment = fragmentModel.clone();
         fragment.visible = true;

         //Piccola randomizzazione attorno al punto di esplosione
         fragment.position.set(
            (Math.random() - 0.5) * Obj.Spread,
            (Math.random() - 0.5) * Obj.Spread,
            (Math.random() - 0.5) * Obj.Spread
         );

         //Velocità casuale
         if (Obj.Gravity > 0) {
            fragment.userData.velocity = new THREE.Vector3(
               (Math.random() - 0.5) * Obj.Force,
               Math.random() * Obj.Force,
               (Math.random() - 0.5) * Obj.Force
            );
         } else {
            fragment.userData.velocity = new THREE.Vector3(
               (Math.random() - 0.5) * Obj.Force,
               (Math.random() - 0.5) * Obj.Force,
               (Math.random() - 0.5) * Obj.Force
            );
         };


         Obj.Parent.add(fragment);
         fragments.push(fragment);
      };
   };

   function Update(delta) {
      if (!active) return;

      for (let i = 0; i < fragments.length; i++) {
         const frag = fragments[i];
         frag.position.add(frag.userData.velocity.clone().multiplyScalar(delta));
         frag.userData.velocity.y -= Obj.Gravity * delta;

         const distance = frag.position.length();
         if (distance > Obj.MaxDistance) {
            Obj.Parent.remove(frag);
            fragments.splice(i, 1);
            i--;
         };
      };

      if (fragments.length === 0) active = false;
   }

   return { Enable, Update };
};

function DeepRendererProfiler(renderer, scene, camera, options = {}) {
   const originalRender = renderer.render.bind(renderer);
   const refreshRate = options.refreshRate || 1000;
   let lastConsoleTime = performance.now();
   let lastFrameTime = performance.now();
   let frame = 0;
   let fps = 0;

   const updateGame = options.updateGame || (() => { });
   const updatePhysics = options.updatePhysics || (() => { });
   const maxTopMatrices = options.maxTopMatrices || 10;

   function estimateGPUTime(mesh) {
      const tris = mesh.geometry?.index?.count / 3 || mesh.geometry?.attributes?.position?.count / 3 || 0;
      const drawCalls = 1;
      return tris * drawCalls / 100000;
   }

   renderer.render = function (scene, camera) {
      const frameStart = performance.now();

      //Aggiornamento logica gioco
      const tGameStart = performance.now();
      updateGame();
      const tGameEnd = performance.now();

      //Aggiornamento fisica
      const tPhysStart = performance.now();
      updatePhysics();
      const tPhysEnd = performance.now();

      //Aggiornamento matrici e profiling oggetti
      let matrixTimes = [];
      let groupCounts = {};
      let counts = { meshes: 0, lights: 0, groups: 0, others: 0 };
      let estGPUMs = 0;

      scene.traverse(obj => {
         if (obj.isMesh) counts.meshes++;
         else if (obj.isLight) counts.lights++;
         else if (obj.isGroup) counts.groups++;
         else counts.others++;

         //Profiling matrici
         if (obj.matrixAutoUpdate) {
            const t1 = performance.now();
            obj.updateMatrixWorld();
            const t2 = performance.now();
            const gpuCost = estimateGPUTime(obj);
            estGPUMs += gpuCost;

            matrixTimes.push({
               name: obj.name || obj.type,
               time: t2 - t1,
               tris: obj.geometry?.index?.count / 3 || obj.geometry?.attributes?.position?.count / 3 || 0,
               parent: obj.parent?.name || obj.parent?.type || "Scene",
               gpuCost
            });

            const parentName = obj.parent?.name || obj.parent?.type || "Scene";
            if (!groupCounts[parentName]) groupCounts[parentName] = 0;
            groupCounts[parentName] += t2 - t1;
         }
      });

      const tMatrixEnd = performance.now();
      const updateMatrixTime = matrixTimes.reduce((a, b) => a + b.time, 0);

      //Materiali
      const tMatStart = performance.now();
      const materialsUsed = {};
      scene.traverse(obj => {
         if (obj.isMesh && obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach(m => { materialsUsed[m.uuid] = m.type || "Material"; });
         }
      });
      const tMatEnd = performance.now();
      const materialTime = tMatEnd - tMatStart;

      //Render GPU
      const tRenderStart = performance.now();
      originalRender(scene, camera);
      const tRenderEnd = performance.now();
      const drawCallTime = tRenderEnd - tRenderStart;

      //Postprocessing
      const tPostStart = performance.now();
      if (renderer.composer) renderer.composer.render();
      const tPostEnd = performance.now();
      const postProcessTime = tPostEnd - tPostStart;

      const frameEnd = performance.now();
      const totalFrame = frameEnd - frameStart;
      frame++;

      //FPS
      const now = performance.now();
      fps = 1000 / (now - lastFrameTime);
      lastFrameTime = now;

      //Stampa console se passato refreshRate
      if (now - lastConsoleTime >= refreshRate) {
         lastConsoleTime = now;
         console.clear();
         console.log("=== 🔍 DEEP RENDERER PROFILER ===");
         console.log(`🕒 Frame totale: ${totalFrame.toFixed(2)} ms | FPS: ${fps.toFixed(1)}`);
         console.log(`  - Logica gioco: ${(tGameEnd - tGameStart).toFixed(2)} ms`);
         console.log(`  - Fisica:       ${(tPhysEnd - tPhysStart).toFixed(2)} ms`);
         console.log(`  - Update matrici: ${updateMatrixTime.toFixed(2)} ms`);
         console.log(`  - Materiali:      ${materialTime.toFixed(2)} ms`);
         console.log(`  - Draw Calls:     ${drawCallTime.toFixed(2)} ms`);
         console.log(`  - PostProcess:    ${postProcessTime.toFixed(2)} ms`);
         console.log(`📊 Draw calls totali: ${renderer.info.render.calls}`);
         console.log(`🔺 Triangoli: ${renderer.info.render.triangles}`);
         console.log(`🧱 Texture: ${renderer.info.memory.textures}`);
         console.log(`🎨 Materiali unici: ${Object.keys(materialsUsed).length}`);
         console.log(`👁️ Oggetti visibili stimati: ${renderer.info.render.calls}`);
         console.log(`🧩 Conteggio oggetti: meshes:${counts.meshes}, lights:${counts.lights}, groups:${counts.groups}, others:${counts.others}`);

         //Top matrici
         console.log(`Top ${maxTopMatrices} oggetti più pesanti per updateMatrixWorld():`);
         matrixTimes.sort((a, b) => b.time - a.time).slice(0, maxTopMatrices).forEach(o =>
            console.log(`- ${o.name} → ${o.time.toFixed(3)} ms | ${o.tris} tris | GPU stimata: ${o.gpuCost.toFixed(3)} ms | parent: ${o.parent}`)
         );

         //Top gruppi
         console.log("Top gruppi per tempo cumulativo matrici:");
         Object.entries(groupCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([name, time]) => {
            console.log(`- ${name} → ${time.toFixed(3)} ms`);
         });

         //Avviso singolo più grave
         let warnings = [
            { type: "Game", time: tGameEnd - tGameStart, msg: "⚠️ Logica di gioco pesante." },
            { type: "Physics", time: tPhysEnd - tPhysStart, msg: "⚠️ Fisica pesante." },
            { type: "Matrices", time: updateMatrixTime, msg: "⚠️ Matrici pesanti → troppi oggetti dinamici o scene non ottimizzate." },
            { type: "Materials", time: materialTime, msg: "⚠️ Materiali pesanti → troppi materiali o shader complessi." },
            { type: "GPU", time: drawCallTime + estGPUMs, msg: "⚠️ GPU sotto stress → draw calls o geometrie complesse." },
            { type: "PostProcess", time: postProcessTime, msg: "⚠️ Post-processing pesante → effetti multipli o alta risoluzione." }
         ];
         warnings.sort((a, b) => b.time - a.time);
         if (warnings[0].time > 5) console.warn(warnings[0].msg);
      }
   };
};

const FrozenObjects = new Set();

function E4_DisableMatrixAutoUpdate(obj, applyToSelf = true, applyToChildren = true) {
   if (!applyToSelf && !applyToChildren) return;

   if (applyToSelf) {
      obj.matrixAutoUpdate = false;
      obj.matrixWorldNeedsUpdate = false;

      //Blocca aggiornamento world (conserva l’originale per il ripristino)
      if (!obj.userData._originalUpdateMatrixWorld) {
         obj.userData._originalUpdateMatrixWorld = obj.updateMatrixWorld;
      }
      obj.updateMatrixWorld = function () { };

      //Blocca rendering
      obj.visible = false;
      obj.frustumCulled = false;

      //Disattiva callback di render
      obj.onBeforeRender = null;
      obj.onAfterRender = null;
   }

   if (applyToChildren) {
      obj.children.forEach(child => E4_DisableMatrixAutoUpdate(child, true, true));
   }
};

function E4_EnableMatrixAutoUpdate(obj, applyToSelf = true, applyToChildren = true) {
   if (!applyToSelf && !applyToChildren) return;

   if (applyToSelf) {
      obj.matrixAutoUpdate = true;
      obj.matrixWorldNeedsUpdate = true;

      if (obj.userData._originalUpdateMatrixWorld) {
         obj.updateMatrixWorld = obj.userData._originalUpdateMatrixWorld;
         delete obj.userData._originalUpdateMatrixWorld;
      } else {
         obj.updateMatrixWorld = THREE.Object3D.prototype.updateMatrixWorld;
      }

      obj.visible = true;
      obj.frustumCulled = true;
   }

   if (applyToChildren) {
      obj.children.forEach(child => E4_EnableMatrixAutoUpdate(child, true, true));
   }
};

function E4_UpdateDynamicMatrices(obj, applyToSelf = true, applyToChildren = true) {
   if (!applyToSelf && !applyToChildren) return;

   if (applyToSelf) {
      obj.updateMatrix();
      obj.updateMatrixWorld(true);
   }

   if (applyToChildren) {
      obj.children.forEach(child => E4_UpdateDynamicMatrices(child, true, true));
   }
};

//CREA L'OGGETTO 3D DALL'IBRIDO MESH + GEOMETRIA GENERICA
function E3_GenObjectFromGeneric(Obj) {
   let ImportedObject;
   //OGGETTO 3D ABILITATO
   if (Oggetti.Generic.Modular[Obj.Num].Mesh == true) {
      ImportedObject = new THREE.Group();
      ImportedObject.copy(Oggetti3D.Generic.Model[Obj.Num]);
   };
   if (Oggetti.Generic.Modular[Obj.Num].UniversalGeom == true) {
      const Materials = [];
      //CREAZIONE ARRAY DI MATERIALI
      for (let i = 0; i < Geometrie[Oggetti.Generic.Modular[Obj.Num].GeomModel].Multi.length; i++) {
         Materials[i] = MaterialArray[Geometrie[Oggetti.Generic.Modular[Obj.Num].GeomModel].Multi[i].Material];
      };
      //SOLO GEOMETRIA INDICIZZATA
      if (Oggetti.Generic.Modular[Obj.Num].Mesh == false) {     //SE NON ESISTE IL MODELLO 3D NELL'OGGETTO "Oggetti3D"
         ImportedObject = new THREE.Mesh(UniversalGeom[Geometrie[Oggetti.Generic.Modular[Obj.Num].GeomModel].Varianti[Oggetti.Generic.Modular[Obj.Num].Variante].Indice], Materials);
         ImportedObject.name = "MultiUniversalGeom";
      }
      //IBRIDO OGGETTO 3D E GEOMETRIA INDICIZZATA
      else {
         const NewMesh = new THREE.Mesh(UniversalGeom[Geometrie[Oggetti.Generic.Modular[Obj.Num].GeomModel].Varianti[Oggetti.Generic.Modular[Obj.Num].Variante].Indice], Materials);
         NewMesh.name = "MultiUniversalGeom";
         ImportedObject.add(NewMesh);
      };
   };

   ImportedObject.position.set(Obj.PosX, Obj.PosY, Obj.PosZ);

   //SCALA
   ImportedObject.scale.setScalar(Obj.Scale);

   return ImportedObject;
};

//GENERA UN ARRAY DI COLORI CASUALI PER I MATERIALI DI THREE.JS
export function S0_GenerateRandomColors(Num) {
   for (let i = 0; i < Num; i++) {
      const randomColor = "0x" + Math.floor(Math.random() * 0xFFFFFF)
         .toString(16)
         .padStart(6, "0")
         .toUpperCase();
      SaveSystem.setItem(`RandomColors${i}`, randomColor);
   };
   SaveSystem.update();
};

export function S0_LoadRandomColors(SaveSystem, Num) {
   const RandomColors = [];
   for (let i = 0; i < Num; i++) {
      RandomColors[i] = SaveSystem.getItem(`RandomColors${i}`);
   };

   return RandomColors;
};


//#endregion

/*-----------------------------------------------------MODULI ENGINE--------------------------------------------------------*/
/*--------------------FUNZIONI UNIVERSALI------------------*/
function E3_UserPosRot() {
   //POSIZIONE
   GroupUser.position.x = Number(window.localStorage.getItem(`SpaceGame_PosX`));
   GroupUser.position.y = Number(window.localStorage.getItem(`SpaceGame_PosY`));
   GroupUser.position.z = Number(window.localStorage.getItem(`SpaceGame_PosZ`));

   //ROTAZIONE
   UserDummy.rotation.set(
      Number(window.localStorage.getItem(`SpaceGame_RotX`)),
      Number(window.localStorage.getItem(`SpaceGame_RotY`)),
      Number(window.localStorage.getItem(`SpaceGame_RotZ`))
   );
};

function E3_UpdateProgress(End = false) {
   const totalParts = TotalTextures + TotalGeomPromises + TotalModules + 2;
   const currentParts = LoadedTextures + ActualGeomPromises + ActualModules + Gamecharge;
   const progress = (currentParts / totalParts) * 100;
   LoaderScreen.LoadingFill.style.width = `${progress}%`;

   //TESTO TEXTURE
   LoaderScreen.Texture.innerText = UrlTexture;

   //TESTO URL
   if (Gamecharge == 0) LoaderScreen.LoaderFile.innerText = `${PromiseName}`;
   if (Gamecharge == 1) LoaderScreen.LoaderFile.innerText = 'Loading Game';

   //RIMUOVI LA SCHERMATA DI CARICAMENTO
   if (End) {
      LoaderScreen.LoaderDiv.remove();
      if (LoaderScreen.LoadingHUDObj) {
         let Pulsanti = LoaderScreen.LoadingHUDObj.Pulsanti.length;
         let Barre = LoaderScreen.LoadingHUDObj.Barre.length;
         let Immagini = LoaderScreen.LoadingHUDObj.Immagini.length;
         if (Pulsanti > 0) for (let i = 0; i < Pulsanti; i++) {
            LoaderScreen.LoadingHUDObj.showButton(i, false);
         };
         if (Barre > 0) for (let i = 0; i < Barre; i++) {
            LoaderScreen.LoadingHUDObj.showBar(i, false);
         };
         if (Immagini > 0) for (let i = 0; i < Immagini; i++) {
            LoaderScreen.LoadingHUDObj.showImage(i, false);
         };
         LoaderScreen.LoadingHUDObj.render();
      };

      setTimeout(() => {
         Loaded = true;
      }, 1000);

      ActualModules = 0;
   };
   //console.log(ActualModules);
};

function E4_CreateFPSCounter() {
   const Result = {
      Fps: 0,
      LimitMem: 0,
      TotalMem: 0,
      UsedMem: 0,
      UsedPercent: 0
   };

   let _lastTime = performance.now();
   let _frameCount = 0;

   function Update() {
      const now = performance.now();
      _frameCount++;

      //Calcola FPS
      const deltaTime = now - _lastTime;
      if (deltaTime >= 1000) {
         Result.Fps = ((_frameCount * 1000) / deltaTime).toFixed(1);
         _frameCount = 0;
         _lastTime = now;
      }

      //Aggiorna memoria JS
      if (performance.memory) {
         const mem = performance.memory;
         Result.LimitMem = (mem.jsHeapSizeLimit / 1048576).toFixed(1);
         Result.TotalMem = (mem.totalJSHeapSize / 1048576).toFixed(1);
         Result.UsedMem = (mem.usedJSHeapSize / 1048576).toFixed(1);
         Result.UsedPercent = ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(1);
      }
   }

   return { Update, Result };
};

async function E3_Benchmark() {
   const out = {
      timestamp: new Date().toISOString(),
      device: {},
      gpu: {},
      cpu: {},
      memory: {},
      scores: {},
      evaluation: {},
      limits: {},
      //BENCHMARK
      benchmark: [Bech1, Bech2],
      detect: {},
      reference: {
         mobile: [],
         desktop: []
      },
   };

   /*CHECK SISTEMA*/
   //#region
   //DEVICE (solo informativo)
   const ua = navigator.userAgent.toLowerCase();
   const isMobile = /android|iphone|ipad|ipod/.test(ua);

   out.device.userAgent = navigator.userAgent;
   out.device.platform = navigator.platform || 'N/A';
   out.device.cores = navigator.hardwareConcurrency || 1;
   out.device.deviceMemoryGB = navigator.deviceMemory || 0;
   out.device.screen = `${screen.width}x${screen.height}`;
   out.device.pixelRatio = window.devicePixelRatio;

   //Solo informativo, NON influenza score
   out.evaluation.deviceType = isMobile ? "Mobile" : "Desktop";

   //GPU INFO
   const gl = renderer.getContext();
   const dbg = gl.getExtension('WEBGL_debug_renderer_info');

   out.gpu.vendor = dbg
      ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)
      : gl.getParameter(gl.VENDOR);

   out.gpu.renderer = dbg
      ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);

   const vertexHighp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
   out.gpu.precision = vertexHighp.precision;      //highp → 23 bit, mediump → 10 bit, lowp → 8 bit

   //MEMORIA
   if (performance.memory && performance.memory.jsHeapSizeLimit) {
      const used = performance.memory.usedJSHeapSize;
      const limit = performance.memory.jsHeapSizeLimit;

      out.memory.usedMB = Math.round(used / 1024 / 1024);
      out.memory.limitMB = Math.round(limit / 1024 / 1024);
      out.memory.pressure = used / limit;
   } else {
      out.memory.pressure = 0.5; //fallback
   };

   /*LIMITI GPU*/
   //QUESTI LIMITI DIPENDONO DAL GIOCO E VENGONO CALCOLATI DENTRO IL MODULO "DEBUG" SEZIONE "MaxLimits"
   out.limits.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
   out.limits.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
   out.limits.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
   //gl.MAX_VARYING_VECTORS - MeshBasicMaterial 1–2, MeshPhongMaterial 4–6, MeshStandardMaterial 8–10
   out.limits.maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);
   //gl.MAX_FRAGMENT_UNIFORM_VECTORS
   //Desktop 1024+, praticamente infinito per Three.js
   //Mobile 128 (buono), 64 (medio), 32 (basso, molto comune), 16 (fascia bassissima / vecchi device), sotto 64 iniziano i problemi con PBR
   out.limits.maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
   //Desktop 1024+, nessun problema
   //Mobile 256 → buono, 128 → medio, 64 → basso, 32 → molto basso, 16 → critico
   out.limits.maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);

   //ESTENSIONI PER COMPATIBILITÀ MATERIALE STANDARD
   const exts = gl.getSupportedExtensions();
   const isWebGL2 = gl instanceof WebGL2RenderingContext;
   if (isWebGL2) {
      // In WebGL2 sono CORE
      out.limits.supportsStandard = true;
   } else {
      // WebGL1 → servono come estensioni
      const exts = gl.getSupportedExtensions() || [];
      out.limits.supportsStandard =
         exts.includes("OES_standard_derivatives") &&
         exts.includes("EXT_shader_texture_lod");
   }
   //#endregion

   /*BECHMARK*/
   //#region
   const NameGPU = String(out?.gpu?.renderer ?? "");
   const r = NameGPU.toLowerCase();

   let vendor = "Unknown";
   let family = "Unknown";
   let model = "Unknown";

   //ANGLE (estrae il contenuto interno se presente)
   if (r.includes("angle")) {
      const m = NameGPU.match(/ANGLE\s*\((.*?)\)/i);
   }

   //SOFTWARE RENDERER (caso critico)
   if (r.includes("swiftshader") || r.includes("llvmpipe")) {
      return {
         vendor: "software",
         family: "cpu",
         model: "unknown",
         raw: NameGPU
      };
   }

   //NVIDIA
   if (r.includes("nvidia")) {
      vendor = "Nvidia";
      family = "Geforce";

      const m = NameGPU.match(/(rtx|gtx)\s*([0-9]{3,4}\s*(ti)?)/i);
      if (m) model = m[0].toUpperCase();
   }

   //AMD
   else if (r.includes("amd") || r.includes("radeon")) {
      vendor = "Amd";
      family = "Radeon";

      const m = NameGPU.match(/radeon\s*(rx\s*)?([a-z0-9 ]+)/i);
      if (m && m[2]) {
         model = m[2].trim();
      }
   }

   //Intel
   else if (r.includes("intel")) {
      vendor = "Intel";
      family = "Intel";

      const m = NameGPU.match(/(uhd|iris|hd)\s*[a-z0-9 ]+/i);
      if (m) model = m[0].trim();
   }

   //Qualcomm Adreno
   else if (r.includes("adreno")) {
      vendor = "Qualcomm";
      family = "Adreno";

      const m = NameGPU.match(/adreno\s*(?:\(tm\))?\s*([0-9]{3}[a-z]?)/i);
      if (m) {
         model = m[1];
      }
   }

   //ARM Immortalis (NON contiene "mali")
   else if (r.includes("immortalis")) {
      vendor = "Arm";
      family = "Immortalis";

      const m = NameGPU.match(/immortalis[- ]g([0-9]{3})/i);
      if (m) {
         model = "G" + m[1];
      }
   }

   //ARM Mali (classiche)
   else if (r.includes("mali")) {
      vendor = "Arm";
      family = "Mali";

      const m = NameGPU.match(
         /mali[- ]?(g|t)?([0-9]{2,3})\s*(mp|mc)?\s*([0-9]+)?/i
      );

      if (m && m[2]) {
         model =
            (m[1] ? m[1].toUpperCase() : "") +
            m[2] +
            (m[3] && m[4] ? " " + m[3].toUpperCase() + m[4] : "");
      }
   };

   out.detect.vendor = vendor;
   out.detect.family = family;
   out.detect.model = model;
   //#endregion

   /*RICONOSCIMENTO MODELLO GPU*/
   //TROVA IL MODELLO NEL DATABASE E RESTITUISCI GLI SCORE
   function GetMobileGPUData(db, vendor, family, model) {
      if (!db?.Mobile || !vendor || !family || !model) return null;

      vendor = vendor.toLowerCase();
      family = family.toLowerCase();

      function normalizeModel(model) {
         return model
            .toUpperCase()
            .replace(/ADRENO|MALI|IMMORTALIS/gi, "")
            .replace(/[^A-Z0-9]/g, "")
            .trim();
      };

      function normalizeMaliModel(model) {
         return model
            .toUpperCase()
            .replace(/IMMORTALIS|MALI/g, "")
            .replace(/MC(\d+)/g, "_MP$1")
            .replace(/[^A-Z0-9_]/g, "")
            .trim();
      }

      /*QUALCOMM ADRENO*/
      if (vendor === "qualcomm" && family === "adreno") {
         const clean = normalizeModel(model);
         const key = "A" + clean;
         const groups = db.Mobile.Adreno;

         for (const groupName in groups) {
            const group = groups[groupName];
            if (!group) continue;

            if (key in group) {
               return { key, data: group[key] };
            };
         };
         return null;
      };

      /*ARM MALI / IMMORTALIS*/
      //MODIFICATO PER RESTITUIRE LA VERSIONE CON MENO CORE SE QUESTI NON SONO SPECIFICATI
      if (vendor === "arm" && (family === "mali" || family === "immortalis")) {
         const clean = normalizeMaliModel(model);
         const groups = db.Mobile.Mali_Immortalis;

         // 1️⃣ Match diretto (MP / MC noto)
         for (const archName in groups) {
            const arch = groups[archName];
            if (!arch) continue;

            if (clean in arch) {
               return {
                  key: clean,
                  data: arch[clean],
                  cores: "known"
               };
            }

            // Immortalis (IGxxx)
            const iKey = "I" + clean;
            if (iKey in arch) {
               return {
                  key: iKey,
                  data: arch[iKey],
                  cores: "known"
               };
            }
         }

         // 2️⃣ Fallback: MP NON specificato → scegli MP minimo
         if (!clean.includes("_MP")) {
            const candidates = [];

            for (const archName in groups) {
               const arch = groups[archName];
               if (!arch) continue;

               for (const key in arch) {
                  if (key.startsWith(clean + "_MP") && arch[key]) {
                     const mp = parseInt(key.split("_MP")[1], 10);
                     if (!isNaN(mp)) {
                        candidates.push({ key, mp, data: arch[key] });
                     }
                  }
               }
            }

            if (candidates.length) {
               // ordina per MP crescente → prende il minimo
               candidates.sort((a, b) => a.mp - b.mp);

               return {
                  key: candidates[0].key,
                  data: candidates[0].data,
                  cores: "unknown"
               };
            }
         }

         return null;
      };

      // if (vendor === "arm" && (family === "mali" || family === "immortalis")) {
      //    const clean = normalizeMaliModel(model);
      //    const groups = db.Mobile.Mali_Immortalis;

      //    for (const archName in groups) {
      //       const arch = groups[archName];
      //       if (!arch) continue;

      //       if (clean in arch) {
      //          return { key: clean, data: arch[clean] };
      //       }

      //       //Immortalis (IGxxx)
      //       const iKey = "I" + clean;
      //       if (iKey in arch) {
      //          return { key: iKey, data: arch[iKey] };
      //       }
      //    }
      //    return null;
      // };

      return null;
   };

   //TROVA IL RIFERIMENTO MASSIMO
   function GetMobileMaxScores(db) {
      if (!db?.Mobile) return null;

      let maxScore1 = null;
      let maxScore2 = null;
      let maxScore1Key = null;
      let maxScore2Key = null;
      let maxScore1Vendor = null;
      let maxScore2Vendor = null;

      //Helper per scansionare un gruppo di modelli
      const scanModels = (group, vendorName) => {
         for (const key in group) {
            const model = group[key];
            if (!model) continue;

            if (model.Score1 != null) {
               if (maxScore1 == null || model.Score1 > maxScore1) {
                  maxScore1 = model.Score1;
                  maxScore1Key = key;
                  maxScore1Vendor = vendorName;
               }
            }

            if (model.Score2 != null) {
               if (maxScore2 == null || model.Score2 > maxScore2) {
                  maxScore2 = model.Score2;
                  maxScore2Key = key;
                  maxScore2Vendor = vendorName;
               }
            }
         }
      };

      //Scansiona Adreno
      const adrenoGroups = db.Mobile.Adreno;
      for (const groupName in adrenoGroups) {
         scanModels(adrenoGroups[groupName], "Adreno");
      }

      //Scansiona Mali/Immortalis
      const maliGroups = db.Mobile.Mali_Immortalis;
      for (const archName in maliGroups) {
         scanModels(maliGroups[archName], "Mali/Immortalis");
      }

      return {
         Score1: maxScore1,
         Score1Key: maxScore1Key,
         Score1Vendor: maxScore1Vendor,
         Score2: maxScore2,
         Score2Key: maxScore2Key,
         Score2Vendor: maxScore2Vendor
      };
   };

   //REFERENCE PER IL VALORE MASSIMO
   const maxScores = GetMobileMaxScores(GPU);
   out.reference.mobile[0] = {
      vendor: maxScores.Score1Vendor,
      key: maxScores.Score1Key,
      score: maxScores.Score1
   };
   out.reference.mobile[1] = {
      vendor: maxScores.Score2Vendor,
      key: maxScores.Score2Key,
      score: maxScores.Score2
   };

   if (out.evaluation.deviceType == "Mobile") {
      const Detect = GetMobileGPUData(GPU, vendor, family, model);
      if (Detect?.data) {
         out.detect.key = Detect.key;
         out.detect.Score1 = Detect.data.Score1;
         out.detect.Score2 = Detect.data.Score2;
         out.detect.Bar1 = Detect.data.Score1 / out.reference.mobile[0].score;
         out.detect.Bar2 = Detect.data.Score2 / out.reference.mobile[1].score;
      }
      else {
         out.detect.key = "Unknown";
         out.detect.Score1 = "Unknown";
         out.detect.Score2 = "Unknown";
      };
   };
   if (out.evaluation.deviceType == "Desktop") {
      out.detect.key = "Unknown";
      out.detect.Score1 = "Unknown";
      out.detect.Score2 = "Unknown";
   };

   console.log(out);
   return out;
};

function InitRuntimeAlertsDetailed(renderer) {

   const canvas = renderer.domElement;
   const gl = renderer.getContext();

   const shown = {
      contextLost: false,
      webglError: false,
      memory: false,
      js: false
   };

   function alertOnce(key, message) {
      if (shown[key]) return;
      shown[key] = true;
      alert(message);
   }

   /* =========================
      1. WEBGL CONTEXT LOST
      (driver GPU collassato)
   ========================= */

   canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      alertOnce(
         "contextLost",
         "Errore grafico critico (GPU).\n\n" +
         "Il driver grafico del dispositivo ha interrotto il rendering.\n" +
         "Causa probabile:\n" +
         "- Dettagli grafici troppo elevati\n" +
         "- Texture o shader non supportati\n\n" +
         "Riduci i dettagli e riavvia la scena."
      );
   }, false);

   /* =========================
      2. ERRORI JAVASCRIPT
      (bug logici / runtime)
   ========================= */

   window.addEventListener("error", (event) => {
      alertOnce(
         "js",
         "Errore interno dell'applicazione.\n\n" +
         "Tipo: JavaScript runtime error\n" +
         "Messaggio:\n" +
         event.message
      );
   });

   window.addEventListener("unhandledrejection", (event) => {
      alertOnce(
         "js",
         "Errore interno dell'applicazione.\n\n" +
         "Tipo: Promise non gestita\n" +
         "Dettagli:\n" +
         String(event.reason)
      );
   });

   /* =========================
      3. MONITOR WEBGL + MEMORIA
   ========================= */

   let lastCheck = 0;

   function monitor(time) {
      if (time - lastCheck > 2000) {

         /* ---- WEBGL ERROR ---- */
         try {
            const err = gl.getError();
            if (err !== gl.NO_ERROR) {
               alertOnce(
                  "webglError",
                  "Errore WebGL rilevato.\n\n" +
                  "Il driver grafico ha restituito un errore interno (" + err + ").\n" +
                  "Causa probabile:\n" +
                  "- Shader non compatibile\n" +
                  "- Uso eccessivo della GPU\n" +
                  "- Feature WebGL non supportata dal dispositivo"
               );
            }
         } catch (_) {
            // se fallisce anche getError → GPU già in stato instabile
         }

         /* ---- MEMORY PRESSURE ---- */
         if (performance && performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            const ratio = used / limit;

            if (ratio > 0.9) {
               alertOnce(
                  "memory",
                  "Memoria del browser quasi esaurita.\n\n" +
                  "Utilizzo: " +
                  Math.round(used / 1048576) +
                  " MB su " +
                  Math.round(limit / 1048576) +
                  " MB.\n\n" +
                  "Causa probabile:\n" +
                  "- Troppe texture o asset caricati\n" +
                  "- Oggetti non rilasciati\n\n" +
                  "Riduci la qualità o riavvia il gioco."
               );
            }
         }

         lastCheck = time;
      }

      requestAnimationFrame(monitor);
   }

   requestAnimationFrame(monitor);
};

/*--------------------MOTORE FISICO--------------------------*/
function E0_PhysicsEngine(Obj) {
   /*CREAZIONE OGGETTI*/
   const UserPosWorld = E3_Vector3();       //POSIZIONE WORLD

   /*VARIABILI*/
   const VarObject = {
      //ACCELERAZIONE CON LIMITE DI VELOCITÀ SENZA COLLISIONI
      Speed: 0,             //VELOCITÀ EFFETTIVA (M/S NEL GIOCO)
      VelImpostata: 0,      //VALORE DA 0 A 100
      PercLimit: 0,         //VALORE DI VelImpostata DEL LIMITE
   };


   /*FUNZIONE AGGIORNAMENTO*/
   function Update(delta) {
      GroupUser.getWorldPosition(UserPosWorld);
   };

   /*ACCELERAZIONE CON LIMITE DI VELOCITÀ SENZA COLLISIONI*/
   function AccelLimitNoCollision(Object, delta) {             //MOVIMENTO AVANTI SU ASSE Z -100 +100
      /*
      Axe = Valore da -100 a 100
      MaxVel = VELOCITÀ MASSIMA (M/S NEL GIOCO)
      Limit = Limite di velocità (M/S NEL GIOCO)
      CoeffAcc = Coefficiente che si moltiplica all'accelerazione entro il limite
      delta
      */

      //FUNZIONAMENTO
      /*
      Quando l'asse è maggiore di zero e la velocità è dentro il limite accelera fino al limite, l'accelerazione è data dal valore dell'asse.
      Quando l'asse è minore di zero rallenta fino a zero, la decelerazione è data dal valore dell'asse.
      Se la velocità supera il limite rallenta automaticamente
      */
      //AUMENTA VELOCITÀ
      if (Object.Axe > 0 && VarObject.Speed <= Object.Limit) {
         //ACCELERAZIONE
         if (VarObject.VelImpostata < 100) VarObject.VelImpostata += delta * Object.Axe * Obj.AccelLimitNoCollision.Acc * Object.CoeffAcc;
         if (VarObject.VelImpostata > 100) VarObject.VelImpostata = 100;
      };
      //DIMINUISCI VELOCITÀ
      if (Object.Axe < 0) {
         //DECELERAZIONE
         if (VarObject.VelImpostata > 0) VarObject.VelImpostata += delta * Object.Axe * Obj.AccelLimitNoCollision.Dec * Object.CoeffAcc;
         if (VarObject.VelImpostata < 0) VarObject.VelImpostata = 0;
      };
      //DIMINUISCI VELOCITÀ PER IL LIMITE
      if (Object.Limit > 0 && VarObject.Speed > Object.Limit) {
         VarObject.VelImpostata -= delta * Obj.AccelLimitNoCollision.LimitDec;
      };
      if (Object.Limit == 0) VarObject.VelImpostata = 0;

      if (VarObject.VelImpostata > 10) VarObject.Speed = Math.pow(VarObject.VelImpostata / 10, Math.log10(Object.MaxVel));
      else VarObject.Speed = 0;
      if (VarObject.Speed > 0) GroupUser.translateOnAxis(VetAsseZ, -VarObject.Speed * delta);

      //VALORE DI VelImpostata DEL LIMITE
      VarObject.PercLimit = 10 * Math.pow(Object.Limit, 1 / (Math.log10(Object.MaxVel)));
   };

   return {
      Update,
      VarObject,
      UserPosWorld,
      AccelLimitNoCollision
   };
};

/*--------------------MODULAR SHIP------------------------*/
//#region
let VarModularShip;

function E0_ModularShip() {
   /*
   QUESTO MODULO GENERA UNA STRUTTURA MODULARE LUNGO L'ASSE Z
   VarModularShip.Moduli INDICA IL NUMERO TOTALE DI MODULI PRESENTI
   VarModularShip.ModuleArray È UN ARRAY CHE CONTIENE LA DISPOSIZIONE DEI MODULI
   Oggetti.Spaceship.ModuleZ INDICA LA DISTANZA TRA UNA COPPIA DI MODULI E L'ALTRA
   NOTA: IL SISTEMA PREVEDE CHE I MODULI DISPOSTI SIANO A COPPIE, UNO È IL MODULO EFFETTIVO E L'ALTRO È UN SEPARATORE
   */
   if (Par.Log.Moduli == true) console.log("ModularShip");
   UserModel.clear();
   //CARICAMENTO MODELLO NAVE SPAZIALE
   let PositionZ = -(VarModularShip.Moduli / 2) * Oggetti.Spaceship.ModuleZ;
   for (let i = 0; i < VarModularShip.Moduli + 1; i++) {
      //CARICAMENTO MODELLO 3D NAVE
      if (i < VarModularShip.Moduli) {
         let Oggetto = Oggetti.Spaceship.Modular[VarModularShip.ModuleArray[i]];
         let Object;

         //COPIA DEL GRUPPO MESH
         if (Oggetto.Mesh == true) {
            Object = new THREE.Group();
            Object.copy(Oggetti3D.Spaceship.Model[VarModularShip.ModuleArray[i]]);
         };
         if (Oggetto.UniversalGeom == true) {
            const Materials = [];
            //CREAZIONE ARRAY DI MATERIALI
            for (let a = 0; a < Geometrie[Oggetto.GeomModel].Multi.length; a++) {
               Materials[a] = MaterialArray[Geometrie[Oggetto.GeomModel].Multi[a].Material];
            };
            //SOLO GEOMETRIA INDICIZZATA
            if (Oggetto.Mesh == false) {     //SE NON ESISTE IL MODELLO 3D NELL'OGGETTO "Oggetti3D"
               Object = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Varianti[Oggetto.Variante].Indice], Materials);
               Object.name = "MultiUniversalGeom";
            }
            //IBRIDO OGGETTO 3D E GEOMETRIA INDICIZZATA
            else {
               const NewMesh = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Varianti[Oggetto.Variante].Indice], Materials);
               NewMesh.name = "MultiUniversalGeom";
               Object.add(NewMesh);
            };

         };

         Object.module = i;
         Object.position.set(0, 0, PositionZ + i * Oggetti.Spaceship.ModuleZ);

         UserModel.add(Object);
         UserModel.position.set(0, 0, Oggetti.Spaceship.CenterModules * Oggetti.Spaceship.ModuleZ);
      }
      //OGGETTO COLORE
      else {
         const Object1 = new THREE.Group();
         Object1.copy(Oggetti3D.Spaceship.Model[VarModularShip.ModuleArray[i]]);

         UserModel.add(Object1);
      };
   };

   E1_UpdateNumModules();
   E1_UpdateRotatedObjects();    //FUNZIONE CHE AGGIORNA I MODULI ROTANTI DA ESPORTARE
   E1_UpdateLightObjects();      //FUNZIONE CHE AGGIORNA I MODULI LUMINOSI DA ESPORTARE

   //ATTRITO CON L'ATMOSFERA
   setInterval(() => {
      //SE CI SI AVVICINA AL PIANETA CON ATMOSFERA
      if (VarModularShip.AtmFriction == true) {
         if (VarModularShip.ColorStep < Par.ModularShip.FrictionTime) {
            VarModularShip.ColorStep++;
         };
      };

      if (VarModularShip.AtmFriction == false) {
         if (VarModularShip.ColorStep > 0) {
            VarModularShip.ColorStep -= Par.ModularShip.FrictionRatio;
         };
      };

   }, 100);
};
/*FUNZIONE CHE AGGIORNA I MODULI ROTANTI DA ESPORTARE*/
function E1_UpdateRotatedObjects() {
   MicEnginereturn.User.RotatedObjects = [];
   for (let i = 0; i < VarModularShip.Moduli + 1; i++) {
      //OGGETTO ROTANTE
      if (Oggetti.Spaceship.Modular[VarModularShip.ModuleArray[i]].Rot == true) {
         //MEMORIZZA NELL'ARRAY IL NUMERO DEL MODULO DA RUOTARE E COME RUOTARLO
         const OggettoRotante = {
            Modulo: i,
            RotX: Oggetti.Spaceship.Modular[VarModularShip.ModuleArray[i]].RotX,
            RotY: Oggetti.Spaceship.Modular[VarModularShip.ModuleArray[i]].RotY,
            RotZ: Oggetti.Spaceship.Modular[VarModularShip.ModuleArray[i]].RotZ
         };
         MicEnginereturn.User.RotatedObjects.push(OggettoRotante);
      };
   };
};
//FUNZIONE CHE AGGIORNA I MODULI LUMINOSI DA ESPORTARE
function E1_UpdateLightObjects() {
   MotorLights = [];
   MicEnginereturn.User.MotorLights = 0;
   MicEnginereturn.User.MotorLights = MotorLights;

   for (let i = 0; i < VarModularShip.Moduli + 1; i++) {
      //OGGETTO LUCE
      if (Oggetti.Spaceship.Modular[VarModularShip.ModuleArray[i]].LightMotor == true) {
         //MEMORIZZA NELL'ARRAY IL NUMERO DEL MODULO DA RUOTARE E COME RUOTARLO
         const OggettoLuci = {
            Modulo: i,
         };
         MotorLights.push(OggettoLuci);
      };
   };
};

function E2_ModularShipNewGame() {     //DA CHIAMARE PRIMA DEL MODULO PRINCIPALE
   VarModularShip.ModuleArray = Par.ModularShip.ModuleArray;
   VarModularShip.Moduli = VarModularShip.ModuleArray.length - 1; //IL MODULO COLORE ALLA FINE NON VA CONTEGGIATO
   VarModularShip.Color1 = Par.ModularShip.Color1;
   VarModularShip.Color2 = Par.ModularShip.Color2;

   //SALVATAGGIO MODULI NAVE SU LOCAL STORAGE
   window.localStorage.setItem(`Moduli`, VarModularShip.Moduli);
   for (let i = 0; i < VarModularShip.Moduli + 1; i++) {
      window.localStorage.setItem(`Module${i}`, VarModularShip.ModuleArray[i]);
   };
};

function E1_ModularShipLoadGame() {     //DA CHIAMARE PRIMA DEL MODULO PRINCIPALE
   /*
   PosRot: Se true imposta anche la posizione e rotazione della nave nel gioco
   */
   VarModularShip.Moduli = Number(window.localStorage.getItem(`Moduli`));
   VarModularShip.ModuleArray = [];
   for (let i = 0; i < VarModularShip.Moduli + 1; i++) {
      VarModularShip.ModuleArray.push(Number(window.localStorage.getItem(`Module${i}`)));
   };
};
function E1_UpdateNumModules() {
   //RESETTA L'ARRAY
   VarModularShip.NumModules = [];
   //CREA GLI INDICI QUANTI SONO I TIPI DI MODULI
   for (let i = 0; i < Oggetti.Spaceship.Modular.length; i++) {
      VarModularShip.NumModules.push(0);
   };
   //INCREMENTA LA QUANTITÀ OGNI VOLTA CHE SI INCONTRA QUEL MODULO NELL'ARRAY
   for (let i = 0; i < VarModularShip.ModuleArray.length; i++) {
      //PER OGNI MODULO CREATO NELL'ARRAY OGGETTI
      for (let a = 0; a < Oggetti.Spaceship.Modular.length; a++) {
         //SE SI INCONTRA IL MODULO AGGIUNGILO ALLA QUANTITÀ
         if (VarModularShip.ModuleArray[i] == a) VarModularShip.NumModules[a]++;
      };

   };
};

/*FUNZIONE GENERALE DI UPDATE QUANDO SI MODIFICA L'ARRAY*/
//AGGIUNGERE UN AUTOMATISMO CHE MODIFICHI ANCHE L'ARRAY
function E1_ModularShipUpdate() {
   E0_ModularShip();
   E1_UpdateRotatedObjects();
   E1_UpdateLightObjects();
   E1_UpdateNumModules();
};
//#endregion

/*--------------------DYNAMIC COCKPIT--------------------------*/
//#region
let Cockpit;
let DynamCockpit;    //ELIMINARE E SOSTITUIRE CON Cockpit E CON IL REFERENCE
let DynamCockpitVar;

const AreaCanvas = [];           //ARRAY DELLE AREE CANVAS
const AreaCanvasObj = [];        //OGGETTI DI CONFIGURAZIONE S0_GenerateHUDCanvas

const ImageArray = [];                          //ARRAY CONTENENTE LE IMMAGINI CONTENENTI I CANVAS
const PosZero = new THREE.Vector3(0, 0, 0);     //VETTORE DI POSIZIONE FISSA DEL SOLE

function E2_AutoSunlight(Pos0, PosZero) {
   let Scale;
   let Distance = Pos0.distanceTo(PosZero);
   let NearCoeff = 1;

   //DIMENSIONE APPARENTE DEL SOLE
   let SunDim = (Oggetti.PlanetarySystem.Sun.ScaleXZ * 1000000 / 100) / Distance;

   if (Distance > Par.Camera.CameraFar) NearCoeff = 1;
   else if (Distance <= Par.Camera.CameraFar && Distance > Par.DynamicCockpit.SunlightMinDist) NearCoeff = (Distance * Distance * Distance) / (Par.Camera.CameraFar * Par.Camera.CameraFar * Par.Camera.CameraFar);
   else NearCoeff = 0;

   Scale = SunDim * Par.Camera.CameraFar * Par.DynamicCockpit.SunlightScale * NearCoeff;
   return Scale;
};

//MODIFICARE LA DIMENSIONE DELLO SPRITE E DEL TESTO IN BASE ALLA DISTANZA DI PIANETI, LUNE, SUB-LUNE E DESTINAZIONI
function E2_ResizeDist(Child0, Child1, Dist, SpriteScale, MeshScale) {
   DynamCockpitVar.References[Child0][Child1].children[0].scale.setScalar(SpriteScale * DynamicScale(
      Dist, Par.DynamicCockpit.SpriteMinDist, Par.DynamicCockpit.SpriteMaxDist,
      Par.DynamicCockpit.SpriteMinScale, Par.DynamicCockpit.SpriteMaxScale));
   DynamCockpitVar.References[Child0][Child1].children[1].scale.setScalar(MeshScale * DynamicScale(
      Dist, Par.DynamicCockpit.MeshMinDist, Par.DynamicCockpit.MeshMaxDist,
      Par.DynamicCockpit.MeshMinScale, Par.DynamicCockpit.MeshMaxScale));
};

//FUNZIONE AGGIORNAMENTO INDICATORI CANVAS
function E2_IndVisualCanvas(Group, Canvas, Object) {
   const HeightImg = parseInt(Object.HeightImg, 10);     //ESTRAZIONE DEL VALORE NUMERICO DELLA GRANDEZZA DELL'IMMAGINE
   const HeightImgPx = `${HeightImg / 2}px`;

   let I;
   for (let i = 0; i < Object.Num; i++) {
      //ADATTAMENTO PER INCLUDERE IL SOLE NEI PIANETI
      if (Object.Sun == true) I = i + 1;
      else I = i;

      if (Object.Visible[i] == true) {
         //ROTAZIONE Y DENTRO LA VISUALE (QUADRANTI ALTO E BASSO)
         if (Group.children[I].rotation.y > Object.YMin && Group.children[I].rotation.y < Object.YMax) {
            Canvas.showImage(i, true);
            //ROTAZIONE X FUORI DALLA VISUALE IN ALTO
            if (Group.children[I].rotation.x < 0 && Group.children[I].rotation.x > Object.XMin) {
               //RENDI VISIBILE L'INDICATORE IN ALTO
               let Pos = `${(Group.children[I].rotation.y + Object.YMax) / (Object.YMax * 2) * 90}%`;
               Canvas.setImagePos(i, "Left", Pos, "Top", HeightImgPx);
            };
            //ROTAZIONE X FUORI DALLA VISUALE IN BASSO
            if (Group.children[I].rotation.x > 0 && Group.children[I].rotation.x < Object.XMax) {
               //RENDI VISIBILE L'INDICATORE IN BASSO
               let Pos = `${(Group.children[I].rotation.y + Object.YMax) / (Object.YMax * 2) * 90}%`;
               Canvas.setImagePos(i, "Left", Pos, "Bottom", HeightImgPx);
            };
         };

         //ROTAZIONE X DENTRO LA VISUALE (QUADRANTI SINISTRA E DESTRA)
         if ((Group.children[I].rotation.x < 0 && Group.children[I].rotation.x < Object.XMin) ||
            (Group.children[I].rotation.x > 0 && Group.children[I].rotation.x > Object.XMax)) {
            Canvas.showImage(i, true);
            //ROTAZIONE Y FUORI DALLA VISUALE A SINISTRA
            if (Group.children[I].rotation.y < Object.YMin) {
               //RENDI VISIBILE L'INDICATORE A SINISTRA
               let Pos;
               if (Group.children[I].rotation.x < 0) {
                  Pos = `${((-Group.children[I].rotation.x - Math.PI) + (Math.PI - Object.XMax)) / ((Math.PI - Object.XMax) * 2) * 90}%`;
               };
               if (Group.children[I].rotation.x > 0) {
                  Pos = `${((-Group.children[I].rotation.x + Math.PI) + (Math.PI - Object.XMax)) / ((Math.PI - Object.XMax) * 2) * 90}%`;
               };
               Canvas.setImagePos(i, "Left", HeightImgPx, "Top", Pos);
            };
            //ROTAZIONE Y FUORI DALLA VISUALE A DESTRA
            if (Group.children[I].rotation.y > Object.YMax) {
               //RENDI VISIBILE L'INDICATORE A DESTRA
               let Pos;
               if (Group.children[I].rotation.x < 0) {
                  Pos = `${((-Group.children[I].rotation.x - Math.PI) + (Math.PI - Object.XMax)) / ((Math.PI - Object.XMax) * 2) * 90}%`;
               };
               if (Group.children[I].rotation.x > 0) {
                  Pos = `${((-Group.children[I].rotation.x + Math.PI) + (Math.PI - Object.XMax)) / ((Math.PI - Object.XMax) * 2) * 90}%`;
               };
               Canvas.setImagePos(i, "Right", HeightImgPx, "Top", Pos);
            };
         };

         //ROTAZIONE X FUORI DALLA VISUALE IN ALTO (QUADRANTI ALTO SINISTRA E ALTO DESTRA)
         if (Group.children[I].rotation.x < 0 && Group.children[I].rotation.x > Object.XMin) {
            Canvas.showImage(i, true);
            //ROTAZIONE Y FUORI DALLA VISUALE A SINISTRA
            if (Group.children[I].rotation.y < Object.YMin) {
               //RENDI VISIBILE L'INDICATORE IN DIAGONALE ALTO SINISTRA
               Canvas.setImagePos(i, "Left", HeightImgPx, "Top", HeightImgPx);
            };
            //ROTAZIONE Y FUORI DALLA VISUALE A DESTRA
            if (Group.children[I].rotation.y > Object.YMax) {
               //RENDI VISIBILE L'INDICATORE IN DIAGONALE ALTO DESTRA
               Canvas.setImagePos(i, "Right", HeightImgPx, "Top", HeightImgPx);
            };
         };

         //ROTAZIONE X FUORI DALLA VISUALE IN BASSO (QUADRANTI BASSO SINISTRA E BASSO DESTRA)
         if (Group.children[I].rotation.x > 0 && Group.children[I].rotation.x < Object.XMax) {
            Canvas.showImage(i, true);
            //ROTAZIONE Y FUORI DALLA VISUALE A SINISTRA
            if (Group.children[I].rotation.y < Object.YMin) {
               //RENDI VISIBILE L'INDICATORE IN DIAGONALE BASSO SINISTRA
               Canvas.setImagePos(i, "Left", HeightImgPx, "Bottom", HeightImgPx);
            };
            //ROTAZIONE Y FUORI DALLA VISUALE A DESTRA
            if (Group.children[I].rotation.y > Object.YMax) {
               //RENDI VISIBILE L'INDICATORE IN DIAGONALE BASSO DESTRA
               Canvas.setImagePos(i, "Right", HeightImgPx, "Bottom", HeightImgPx);
            };
         };

         //ROTAZIONE X DENTRO LA VISUALE
         if ((Group.children[I].rotation.x < 0 && Group.children[I].rotation.x < Object.XMin) ||
            (Group.children[I].rotation.x > 0 && Group.children[I].rotation.x > Object.XMax)) {
            //ROTAZIONE Y DENTRO LA VISUALE
            if (Group.children[I].rotation.y > Object.YMin && Group.children[I].rotation.y < Object.YMax) {
               //RENDI INVISIBILE L'INDICATORE
               Canvas.showImage(i, false);
            };
         };
      }
      else Canvas.showImage(i, false);
   };
   Canvas.render();
};

//FUNZIONE AGGIORNAMENTO SIMBOLI LUNE E SUBLUNE COCKPIT E HUB, SOLO CON DYNAMIC PLANETARY SYSTEM
function E2_UpdateSimbolsMoons() {
   //AGGIORNAMENTO LUNE
   if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.NumMoons > 0) {
      for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
         //SIMBOLO GENERICO PER LUNE PIANETI
         if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i])
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type == 0) {
               DynamCockpitVar.References[1][i].children[0].material.map = Loader.load(Par.DynamicCockpit.Area[1].Sprite);
               //INDICATORI CANVAS
               AreaCanvas[1].setImageUrl(i, Par.DynamicCockpit.Area[1].Sprite);
            }
            //PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
            else {
               DynamCockpitVar.References[1][i].children[0].material.map = Loader.load(Par.DynamicCockpit.TypeSprite[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type - 1]);
               //INDICATORI CANVAS
               AreaCanvas[1].setImageUrl(i, Par.DynamicCockpit.TypeSprite[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type - 1]);
            };
         DynamCockpitVar.References[1][i].children[0].material.needsUpdate = true;
      };
      AreaCanvas[1].render();
   }

};
function E2_UpdateSimbolsSubMoons() {
   //AGGIORNAMENTO SUB-LUNE
   if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.NumSubMoons > 0) {
      for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
         if (VarPlanetSystem.MoonOrbit > 0) {
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type == 0) {
               DynamCockpitVar.References[2][i].children[0].material.map = Loader.load(Par.DynamicCockpit.Area[2].Sprite);
               //INDICATORI CANVAS
               AreaCanvas[2].setImageUrl(i, Par.DynamicCockpit.Area[2].Sprite);
            }
            //PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
            else {
               DynamCockpitVar.References[2][i].children[0].material.map = Loader.load(Par.DynamicCockpit.TypeSprite[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1]);
               //INDICATORI CANVAS
               AreaCanvas[2].setImageUrl(i, Par.DynamicCockpit.TypeSprite[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1]);
            };
            DynamCockpitVar.References[2][i].children[0].material.needsUpdate = true;
         };
      };
      AreaCanvas[2].render();
   };
};

//CALCOLI PER STABILIRE SE UN OGGETTO È DIETRO UN CORPO CELESTE
function E2_ObjectBehindPlanet(Oggetto) {
   //DIAMETRO APPARENTE CORPO CELESTE
   let DiametroApparente = (Oggetto.Radius / 1000) / (Oggetto.Distance * 2);
   //ANGOLO APPARENTE CORPO CELESTE
   let AngoloApparente = 2 * Math.asin(DiametroApparente);

   //PER OGNI OGGETTO DA CALCOLARE
   for (let i = 0; i < Oggetto.NumObjects; i++) {
      //SE L'OGGETTO È PIÙ LONTANO DEL CORPO CELESTE
      if (Oggetto.DistObjects[i] > Oggetto.Distance) {
         //ANGOLO TRA IL CORPO CELESTE E L'OGGETTO
         let Angolo = Oggetto.CockpitPlanet.quaternion.angleTo(Oggetto.CockpitObjects.children[i].quaternion);
         //SE L'OGGETTO È DIETRO IL CORPO CELESTE
         if (Angolo < AngoloApparente) {
            //GLI OGGETTI NON SONO IL SOLE
            if (Oggetto.Sun == false) {
               if (Oggetto.Array) Oggetto.Array[i] = true;
               Oggetto.Lampeggi[i] += 1;
               if (Oggetto.Lampeggi[i] <= 5) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 0.3;
               if (Oggetto.Lampeggi[i] > 5) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
               if (Oggetto.Lampeggi[i] >= 10) Oggetto.Lampeggi[i] = 0;
            };
            if (Oggetto.Sun == true) Oggetto.CockpitObjects.children[i].children[0].visible = false;
         }
         //SE L'OGGETTO NON È DIETRO IL CORPO CELESTE
         else {
            if (Oggetto.Array) Oggetto.Array[i] = false;
            if (Oggetto.Sun == false) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
            if (Oggetto.Sun == true) Oggetto.CockpitObjects.children[i].children[0].visible = true;
         };
      }
      //SE LA LUNA PIÙ VICINA DEL PIANETA
      else {
         if (Oggetto.Array) Oggetto.Array[i] = false;
         if (Oggetto.Sun == false) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
         if (Oggetto.Sun == true) Oggetto.CockpitObjects.children[i].children[0].visible = true;
      };
   };
};

//CHECK SE LA VISUALE È IN DIREZIONE DI UN INDICATORE THREE 
function E2_CheckLookInd(Area, Num) {
   let Result = (DynamCockpitVar.References[Area][Num].rotation.x > Math.PI - Par.DynamicCockpit.VisDiff ||
      DynamCockpitVar.References[Area][Num].rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) &&
      DynamCockpitVar.References[Area][Num].rotation.y < Par.DynamicCockpit.VisDiff &&
      DynamCockpitVar.References[Area][Num].rotation.y > -Par.DynamicCockpit.VisDiff;

   return Result;
};

/*-----------------------------------FUNZIONI DA ESEGUIRE NEL LOOP RENDER-------------------------------------*/
//FUNZIONE AGGIORNAMENTO DISPLAY COCKPIT
function E2_UpdateLookCockpit() {
   DynamCockpitVar.References[0][0].lookAt(PosZero);     //SUNLIGHT
   DynamCockpitVar.References[0][1].lookAt(PosZero);     //INDICATORE STELLA MADRE

   //INDICATORI RIVOLTI VERSO I PIANETI
   for (let i = 0; i < Object.keys(Cockpit.children[0].children).length - 2; i++) {
      DynamCockpitVar.References[0][i + 2].lookAt(VarPlanetSystem.WorldPosPlanets[i]);
   };
   //INDICATORI RIVOLTI VERSO LE LUNE
   for (let i = 0; i < Object.keys(Cockpit.children[1].children).length; i++) {
      DynamCockpitVar.References[1][i].lookAt(VarPlanetSystem.WorldPosMoons[i]);
   };
   //INDICATORI RIVOLTI VERSO LE SUB-LUNE
   for (let i = 0; i < Object.keys(Cockpit.children[2].children).length; i++) {
      DynamCockpitVar.References[2][i].lookAt(VarPlanetSystem.WorldPosSubMoons[i]);
   };

   //DESTINAZIONE VERSO UN PIANETA
   if (VarPlanetSystem.DestinationPlanet == true && VarPlanetSystem.DestPlanet > 0)
      DynamCockpitVar.References[3][0].lookAt(VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1]);

   //DESTINAZIONE VERSO UNA LUNA
   if (VarPlanetSystem.DestinationMoon == true && VarPlanetSystem.DestMoon > 0)
      DynamCockpitVar.References[3][0].lookAt(VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1]);

   //DESTINAZIONE VERSO UNA SUB-LUNA
   if (VarPlanetSystem.DestinationSubMoon == true && VarPlanetSystem.DestSubMoon > 0)
      DynamCockpitVar.References[3][0].lookAt(VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1]);
};

function E2_UpdateVisual() {
   if (PaceDone == true) {
      /*--------------------------------------DYNAMIC HUD------------------------------------------*/
      //AREA INDICATORI PIANETI
      E2_IndVisualCanvas(Cockpit.children[0], AreaCanvas[0], {
         Sun: true,      //PRESENZA DEL SOLE
         Num: VarPlanetSystem.PlanetsNum + 1,
         HeightImg: Par.DynamicCockpit.Area[0].HeightImg,         //DIMENSIONE IMMAGINE
         YMin: Par.DynamicCockpit.YMin,
         YMax: Par.DynamicCockpit.YMax,
         XMin: Par.DynamicCockpit.XMin,
         XMax: Par.DynamicCockpit.XMax,
         Visible: DynamCockpitVar.PlanetVisible       //ARRAY DI VISIBILITÀ
      });

      //AREA INDICATORI LUNE
      E2_IndVisualCanvas(Cockpit.children[1], AreaCanvas[1], {
         Sun: false,      //PRESENZA DEL SOLE
         Num: VarPlanetSystem.NumMajorMoons,
         HeightImg: Par.DynamicCockpit.Area[1].HeightImg,         //DIMENSIONE IMMAGINE
         YMin: Par.DynamicCockpit.YMin,
         YMax: Par.DynamicCockpit.YMax,
         XMin: Par.DynamicCockpit.XMin,
         XMax: Par.DynamicCockpit.XMax,
         Visible: DynamCockpitVar.MoonVisible       //ARRAY DI VISIBILITÀ
      });

      //AREA INDICATORI SUB-LUNE
      E2_IndVisualCanvas(Cockpit.children[2], AreaCanvas[2], {
         Sun: false,      //PRESENZA DEL SOLE
         Num: VarPlanetSystem.NumMajorSubMoons,
         HeightImg: Par.DynamicCockpit.Area[2].HeightImg,         //DIMENSIONE IMMAGINE
         YMin: Par.DynamicCockpit.YMin,
         YMax: Par.DynamicCockpit.YMax,
         XMin: Par.DynamicCockpit.XMin,
         XMax: Par.DynamicCockpit.XMax,
         Visible: DynamCockpitVar.SubMoonVisible       //ARRAY DI VISIBILITÀ
      });

      //AREA INDICATORE DESTINAZIONE
      E2_IndVisualCanvas(Cockpit.children[3], AreaCanvas[3], {
         Sun: false,      //PRESENZA DEL SOLE
         Num: 1,
         HeightImg: Par.DynamicCockpit.Area[3].HeightImg,         //DIMENSIONE IMMAGINE
         YMin: Par.DynamicCockpit.YMin,
         YMax: Par.DynamicCockpit.YMax,
         XMin: Par.DynamicCockpit.XMin,
         XMax: Par.DynamicCockpit.XMax,
         Visible: DynamCockpitVar.DestinationVisible       //ARRAY DI VISIBILITÀ
      });
   };
};

let frameCounter = 0;
function E2_UpdateDynamicCockpit(delta) {
   frameCounter++;
   //ESEGUE OGNI 2 FRAME
   if (frameCounter % 2 === 0) {
      E2_UpdateLookCockpit();
      E2_UpdateVisual();
   };
   //E3_UpdateDynamicHUD();
};

/*--------------------------------------------FUNZIONE PRINCIPALE----------------------------------------------*/
function E0_DynamicCockpit(Oggetto) {
   if (Par.Log.Moduli == true) console.log("DynamicCockpit");
   Cockpit = new THREE.Group();
   Cockpit.name = "CockpitVisore";

   /*-----------------------CREAZIONE LIVELLI--------------------------*/
   //PER OGNI AREA
   for (let i = 0; i < Par.DynamicCockpit.Area.length; i++) {
      //CREAZIONE LIVELLI  COCKPIT
      const CanvasArray = [];                //ARRAY CONTENENTE I CANVAS DEGLI INDICATORI
      const Array = [];
      ImageArray.push(Array);

      //CREAZIONE REFERENCE
      DynamCockpitVar.References[i] = {};    //CREA UN OGGETTO VUOTO PER OGNI AREA

      //CREAZIONE OGGETTO DI CONFIGURAZIONE
      const HUDObj = {
         Parent: "Document",
         Events: false,           //ABILITAZIONE DEGLI EVENTI AL CLICK
         DispatchEvent: "Render",    //"Render"
         Width: 1,                   //LARGHEZZA
         Height: 1,                  //ALTEZZA
         Top: 0,                     //POSIZIONE VERTICALE DALL'ALTO
         ZIndex: '51',               //PROFONDITÀ Z
         //STILE
         Style: "",
         //PARAMETRI GENERICI
         Opacity: "1",
         FontFamily: "'Orbitron', sans-serif",
         //TESTO PULSANTI/SPIE
         PulsFontSize: "15px",
         PulsFontColor: "#FFFFFF",
         //PULSANTI/SPIE
         Pulsanti: 0,
         Barre: 0,
         Immagini: Par.DynamicCockpit.Area[i].Num,
         ImgSize: [],
         ImgPos: [],
         ImgUrl: [],
      };

      const Group = new THREE.Group();
      Group.name = `GroupCockpit ${i} ${Par.DynamicCockpit.Area[i].Name}`;

      //PER OGNI INDICATORE DENTRO L'AREA
      for (let a = 0; a < Par.DynamicCockpit.Area[i].Num; a++) {
         //SUNLIGHT
         if (i == 0 && a == 0) {
            const GroupSole = E3_GroupCanvasSprite({
               GroupName: "GroupSunlight",
               SpriteName: "SpriteSole",
               Sprite: Par.DynamicCockpit.SunSprite,
               SpritePos: { x: 0, y: 0, z: Par.Camera.CameraFar / 100 },
               Opacity: 0.8,
            });
            //NOTA: QUESTO GRUPPO DIVENTA IL CHILDREN[0] QUINDI GLI INDICATORI PARTONO DAL CHILDREN[1]
            Group.add(GroupSole);
         };

         const GroupVisore = new THREE.Group();
         GroupVisore.name = `GroupVisore ${a}`;

         //---------------------------CANVAS-------------------------//
         const CanvasInd = document.createElement('canvas');
         CanvasArray.push(CanvasInd);
         CanvasArray[a].width = Par.DynamicCockpit.CanvasWidth;
         CanvasArray[a].height = Par.DynamicCockpit.CanvasWidth;

         const ImageInd = CanvasInd.getContext('2d');
         ImageArray[i].push(ImageInd);
         ImageArray[i][a].font = Par.DynamicCockpit.Font;
         const TextureInd = new THREE.Texture(CanvasArray[a]);
         //COLORE DELL'INDICATORE DEL SOLE
         if (i == 0 && a == 0) ImageArray[i][a].fillStyle = Par.DynamicCockpit.Area[0].SunColor;
         //COLORE DELL'INDICATORE NORMALE
         else ImageArray[i][a].fillStyle = Par.DynamicCockpit.Area[i].Color;

         //-----------------------SPRITE VISORE----------------------//
         const SpriteVisore = new THREE.Sprite(new THREE.SpriteMaterial({ depthWrite: false }));
         SpriteVisore.material.map = Loader.load(Par.DynamicCockpit.Area[i].Sprite);
         SpriteVisore.name = `SpriteVisore ${a}`;
         SpriteVisore.scale.setScalar(Par.DynamicCockpit.SpriteScale);
         SpriteVisore.position.set(0, 0, Par.DynamicCockpit.IndPosZ);
         GroupVisore.add(SpriteVisore);

         //----------------------MESH INDICATORE-----------------------//
         const MatInd = new THREE.SpriteMaterial({
            map: TextureInd,
            transparent: true,
            depthWrite: false
         });
         const MeshInd = new THREE.Sprite(MatInd);
         MeshInd.name = a;

         MeshInd.scale.setScalar(Par.DynamicCockpit.MeshScale);
         MeshInd.position.set(0, 0, Par.DynamicCockpit.IndPosZ);
         GroupVisore.add(MeshInd);

         Group.add(GroupVisore);

         ////////////////////////////////////////////////////////////////////////////////////////////////

         //CREAZIONE PARAMETRI INDICATORI CANVAS
         HUDObj.ImgSize[a] = { Width: Par.DynamicCockpit.Area[i].HeightImg, Height: Par.DynamicCockpit.Area[i].HeightImg };
         HUDObj.ImgPos[a] = { RightFlag: "Left", PosX: "0%", TopFlag: "Top", PosY: "0%" };
         HUDObj.ImgUrl[a] = Par.DynamicCockpit.Area[i].Sprite;
      };
      DynamCockpitVar.References[i] = Group.children;
      Cockpit.add(Group);
      AreaCanvasObj[i] = HUDObj;
   };

   /*------------------------GENERAZIONE AREE CANVAS-----------------------*/
   for (let i = 0; i < AreaCanvasObj.length; i++) {
      AreaCanvasObj[i].Width = Par.DynamicCockpit.AreaWidth;
      AreaCanvasObj[i].Height = Par.DynamicCockpit.AreaHeight;
      AreaCanvasObj[i].Top = Par.DynamicCockpit.AreaTop;
      const CanvasHUD = S0_GenerateHUDCanvas(AreaCanvasObj[i], {
         DispatchEvent: "Render",
         Width: Par.DynamicCockpit.AreaWidth,                   //LARGHEZZA
         Height: Par.DynamicCockpit.AreaHeight,                 //ALTEZZA
         Top: Par.DynamicCockpit.AreaTop,                       //POSIZIONE VERTICALE DALL'ALTO
      });
      AreaCanvas[i] = CanvasHUD;
   };

   const LampeggioLune = [];
   const MoonsBehind = [];       //LUNE DIETRO IL PIANETA
   for (let i = 0; i < Par.DynamicCockpit.Area[1].Num + 1; i++) {
      LampeggioLune.push(0);
      MoonsBehind.push(false);
   };
   const LampeggioSubLune = [];
   const SubMoonsBehind = [];      //SUB LUNE DIETRO IL PIANETA
   for (let i = 0; i < Par.DynamicCockpit.Area[2].Num + 1; i++) {
      LampeggioSubLune.push(0);
      SubMoonsBehind.push(false);
   };

   /*FUNZIONE AGGIORNAMENTO SIMBOLI LUNE E SUBLUNE COCKPIT E HUB, SOLO CON DYNAMIC PLANETARY SYSTEM (OK)*/
   const UpdateSymbolsMoons = new OnceFunction(function () {
      E2_UpdateSimbolsMoons();
   });
   const UpdateSymbolsSubMoons = new OnceFunction(function () {
      E2_UpdateSimbolsSubMoons();
   });

   //AGGIORNAMENTO DEI SOMBOLI DELLE LUNE E SUB-LUNE LA PRIMA VOLTA
   setTimeout(() => {
      E2_UpdateSimbolsMoons();
      E2_UpdateSimbolsSubMoons();
   }, 4000);

   /*----------------NOMI DYNAMIC HUD E COCKPIT, DISTANZA E TEMPI ARRIVO, DIMENSIONE SPRITE, SUNLIGHT, OGGETTI DIETRO I PIANETI ------------------*/
   setInterval(() => {
      /*----------------------------SUNLIGHT---------------------------*/
      //APPLICA LA SCALA IN BASE ALLA DISTANZA DAL SOLE
      Cockpit.children[0].children[0].scale.set(E2_AutoSunlight(PhysicsEngine.UserPosWorld, PosZero), E2_AutoSunlight(PhysicsEngine.UserPosWorld, PosZero));

      //PER TUTTI I PIANETI COMPRESO IL SOLE
      for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
         /*-------------------------------------DYNAMIC COCKPIT----------------------------------------------*/
         //SE NON SI È IN ORBITA ATTORNO A UN PIANETA
         if (VarPlanetSystem.PlanetOrbit == 0) {
            //RENDI VISIBILI I PIANETI ENTRO IL RAGGIO IMPOSTATO
            if (VarPlanetSystem.IndDist[i] < Oggetto.DistPlanets) DynamCockpitVar.PlanetVisible[i] = true;
            //RENDI INVISIBILI I PIANETI FUORI DALL RAGGIO IMPOSTATO
            else DynamCockpitVar.PlanetVisible[i] = false;
         }
         //RENDI INVISIBILI I PIANETI TRANNE QUELLO PIÙ VICINO
         else if (i != 0 && i == VarPlanetSystem.NearPlanetIndex) DynamCockpitVar.PlanetVisible[i] = true;
         //RENDI VISIBILE LA STELLA
         else if (i == 0) DynamCockpitVar.PlanetVisible[i] = true;
         else DynamCockpitVar.PlanetVisible[i] = false;

         //VISIBILITÀ INDICATORE DYNAMIC COCKPIT
         if (DynamCockpitVar.PlanetVisible[i] == true) {
            /*SPRITE VISORE*/
            //SE IL PIANETA È LA DESTINAZIONE E NON SI È IN ORBITA ATTORNO AD ESSO
            if (VarPlanetSystem.DestPlanet == i && VarPlanetSystem.PlanetOrbit == 0) {
               DynamCockpitVar.References[0][i + 1].children[0].visible = false;       //SPRITE VISORE
               DynamCockpitVar.References[0][i + 1].children[1].visible = false;       //TESTO INDICATORE
            }
            //ALTRIMENTI
            else {
               DynamCockpitVar.References[0][i + 1].children[0].visible = true;       //SPRITE VISORE
               DynamCockpitVar.References[0][i + 1].children[1].visible = true;       //TESTO INDICATORE
               //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
               if (E2_CheckLookInd(0, i + 1))
                  DynamCockpitVar.PlanetTextVisible[i] = true;
               else DynamCockpitVar.PlanetTextVisible[i] = false;
            };
         }
         else {
            DynamCockpit.children[0].children[i + 1].children[0].visible = false;
            DynamCockpit.children[0].children[i + 1].children[1].visible = false;
         };
         /*-----------------------------TESTO DYNAMIC COCKPIT--------------------------------------*/
         //NOTA: IL clearRect PARTE A CANCELLARE DA Y50 COSÌ MANTIENE IL NOME FISSO DEI PIANETI
         ImageArray[0][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth,
            Par.DynamicCockpit.CanvasWidth);

         //NOME STELLA MADRE
         if (i == 0) {
            //INDICATORI COCKPIT
            if (DynamCockpitVar.PlanetTextVisible[i] == true) ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Sun.Name[Language], 20, 50);
            else ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Sun.Name[Language], 20, 150);
         };
         //NOME PIANETA
         if (i > 0) {
            //INDICATORI COCKPIT
            if (DynamCockpitVar.PlanetTextVisible[i] == true) ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Modular[i - 1].Name[Language], 20, 50);
            else ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Modular[i - 1].Name[Language], 20, 150);
         };

         //DISTANZA E TEMPO DI ARRIVO DAL PIANETA PIÙ VICINO COMPRESA DI DIAMETRO (SE L'INDICATORE È INQUADRATO)
         if (i == VarPlanetSystem.NearPlanetIndex) {
            //DISTANZA, VALORE IN MILIONI DI KM
            if (DynamCockpitVar.PlanetTextVisible[i] == true) ImageArray[0][i].fillText(E3_DisplayDistance((VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000)
               - (VarPlanetSystem.NearPlanetDiameter * Par.DynamicCockpit.ScalaPos), true), 20, 100);
         }
         //DISTANZA ALTRI PIANETI (DIAMETRO TRASCURABILE) (SE L'INDICATORE È INQUADRATO)
         else {
            //DISTANZA, VALORE IN MILIONI DI KM
            if (DynamCockpitVar.PlanetTextVisible[i] == true) ImageArray[0][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
         };

         //TEMPO DI ARRIVO (SE L'INDICATORE È INQUADRATO)
         if (DynamCockpitVar.PlanetTextVisible[i] == true) ImageArray[0][i].fillText(E3_DisplayTime(VarPlanetSystem.TimeDist[i]), 20, 150);

         DynamCockpit.children[0].children[i + 1].children[1].material.map.needsUpdate = true;

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         E2_ResizeDist(0, i + 1, VarPlanetSystem.IndDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);
      };

      //PER TUTTE LE LUNE ATTUALI
      if (VarPlanetSystem.PlanetOrbit > 0)
         for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
            //-----------------------------DYNAMIC COCKPIT--------------------------------------//
            //LUNA DISTANTE
            if (VarPlanetSystem.IndMoonDist[i] > Par.DynamicCockpit.MaxDistHide) DynamCockpitVar.MoonVisible[i] = true;
            //LUNA VICINA, NASCONDERE IL TESTO
            else DynamCockpitVar.MoonVisible[i] = false;

            //VISIBILITÀ INDICATORE DYNAMIC COCKPIT
            if (DynamCockpitVar.MoonVisible[i] == true) {
               //SE LA LUNA È LA DESTINAZIONE
               if (VarPlanetSystem.DestMoon > 0 && VarPlanetSystem.DestMoon == i + 1) {
                  DynamCockpit.children[1].children[i].children[0].visible = true;     //SPRITE VISORE
                  DynamCockpit.children[1].children[i].children[1].visible = false;     //TESTO INDICATORE
               }
               //SE LA LUNA NON È LA DESTINAZIONE
               else {
                  DynamCockpit.children[1].children[i].children[0].visible = true;     //SPRITE VISORE
                  //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
                  if (E2_CheckLookInd(1, i)) {
                     //LUNA PIANETA O STAZIONE SPAZIALE
                     if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i]) {
                        //LUNA STAZIONE SPAZIALE
                        if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type > 0) {
                           //SE DA IMPOSTAZIONI È ABILITATO IL TESTO DIETRO UN PIANETA VISUALIZZA SEMPRE IL TESTO
                           if (Par.DynamicCockpit.Area[1].TextBehindPlanet == true) DynamCockpit.children[1].children[i].children[1].visible = true;
                           //ALTRIMENTI SE NON È DIETRO IL PIANETA VISUALIZZALO
                           else if (MoonsBehind[i] == false) DynamCockpit.children[1].children[i].children[1].visible = true;
                           //ALTRIMENTI DE È DIETRO IL PIANETA NASCONDILO
                           else if (MoonsBehind[i] == true) DynamCockpit.children[1].children[i].children[1].visible = false;
                        }
                        //LUNA PIANETA
                        else {
                           DynamCockpit.children[1].children[i].children[1].visible = true;
                           DynamCockpitVar.MoonTextVisible[i] = true;
                        };
                     };

                  }
                  else {
                     //LUNA STAZIONE SPAZIALE
                     if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i]) {
                        if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type > 0) DynamCockpit.children[1].children[i].children[1].visible = false;
                        //LUNA PIANETA
                        else {
                           DynamCockpit.children[1].children[i].children[1].visible = true;
                           DynamCockpitVar.MoonTextVisible[i] = false;
                        };
                     };

                  };
               };
            }
            else {
               DynamCockpit.children[1].children[i].children[0].visible = false;     //SPRITE VISORE
               DynamCockpit.children[1].children[i].children[1].visible = false;     //TESTO INDICATORE
            };
            //-----------------------------TESTO DYNAMIC COCKPIT--------------------------------------//
            ImageArray[1][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);

            //NOME LUNA
            let Text;
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i]) {
               Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Name[Language];
               //LUNA STAZIONE SPAZIALE
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type > 0) ImageArray[1][i].fillText(Text, 20, 50);
               //LUNA PIANETA
               else {
                  if (DynamCockpitVar.MoonTextVisible[i] == true) ImageArray[1][i].fillText(Text, 20, 50);
                  else ImageArray[1][i].fillText(Text, 20, 150);
               };
            };

            /*DISTANZA LUNA*/
            //LUNA STAZIONE SPAZIALE
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i]) {
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type > 0) {
                  //DISTANZA DALLA LUNA PIÙ VICINA COMPRESA DI DIAMETRO
                  if (i == VarPlanetSystem.NearMoonIndex) {
                     ImageArray[1][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000
                        - (VarPlanetSystem.NearMoonDiameter * Par.DynamicCockpit.ScalaPos), true), 20, 100);		//VALORE IN KM x1000
                  }
                  //DISTANZA ALTRE LUNE (DIAMETRO TRASCURABILE)
                  else {
                     //VALORE IN KM x1000
                     ImageArray[1][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
                  };
               }
               //LUNA PIANETA (SE L'INDICATORE È INQUADRATO)
               else {
                  if (DynamCockpitVar.MoonTextVisible[i] == true) {
                     //DISTANZA DALLA LUNA PIÙ VICINA COMPRESA DI DIAMETRO
                     if (i == VarPlanetSystem.NearMoonIndex) {
                        ImageArray[1][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000
                           - (VarPlanetSystem.NearMoonDiameter * Par.DynamicCockpit.ScalaPos), true), 20, 100);		//VALORE IN KM x1000
                     }
                     //DISTANZA ALTRE LUNE (DIAMETRO TRASCURABILE)
                     else {
                        //VALORE IN KM x1000
                        ImageArray[1][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
                     };
                  };
               };
            };


            /*TEMPO DI ARRIVO*/
            //LUNA STAZIONE SPAZIALE
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i]) {
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type > 0) ImageArray[1][i].fillText(E3_DisplayTime(VarPlanetSystem.TimeMoonDist[i]), 20, 150);
               //LUNA PIANETA (SE L'INDICATORE È INQUADRATO)
               else if (DynamCockpitVar.MoonTextVisible[i] == true) ImageArray[1][i].fillText(E3_DisplayTime(VarPlanetSystem.TimeMoonDist[i]), 20, 150);
            };

            DynamCockpit.children[1].children[i].children[1].material.map.needsUpdate = true;

            //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
            E2_ResizeDist(1, i, VarPlanetSystem.IndMoonDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);
         };

      //PER TUTTE LE SUB-LUNE ATTUALI
      if (VarPlanetSystem.MoonOrbit > 0)
         for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
            //-----------------------------DYNAMIC COCKPIT--------------------------------------//
            //SUB-LUNA DISTANTE
            if (VarPlanetSystem.IndSubMoonDist[i] > Par.DynamicCockpit.MaxDistHide) DynamCockpitVar.SubMoonVisible[i] = true;
            //LUNA VICINA, NASCONDERE IL TESTO
            else DynamCockpitVar.SubMoonVisible[i] = false;

            //VISIBILITÀ INDICATORE DYNAMIC COCKPIT
            if (DynamCockpitVar.SubMoonVisible[i] == true) {
               //SE LA SUB-LUNA È LA DESTINAZIONE
               if (VarPlanetSystem.DestSubMoon > 0 && VarPlanetSystem.DestSubMoon == i + 1) {
                  DynamCockpit.children[2].children[i].children[0].visible = true;     //SPRITE VISORE
                  DynamCockpit.children[2].children[i].children[1].visible = false;     //MESH INDICATORE
               }
               //SE LA SUB-LUNA NON È LA DESTINAZIONE
               else {
                  DynamCockpit.children[2].children[i].children[0].visible = true;     //SPRITE VISORE
                  //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
                  if (E2_CheckLookInd(2, i)) {
                     //SE DA IMPOSTAZIONI È ABILITATO IL TESTO DIETRO UN PIANETA
                     if (Par.DynamicCockpit.Area[2].TextBehindPlanet == true) DynamCockpit.children[2].children[i].children[1].visible = true;
                     else if (SubMoonsBehind[i] == false) DynamCockpit.children[2].children[i].children[1].visible = true;
                     else if (SubMoonsBehind[i] == true) DynamCockpit.children[2].children[i].children[1].visible = false;

                  }
                  else {
                     DynamCockpit.children[2].children[i].children[1].visible = false;
                  };
               };
            }
            else {
               DynamCockpit.children[2].children[i].children[0].visible = false;     //SPRITE VISORE
               DynamCockpit.children[2].children[i].children[1].visible = false;     //MESH INDICATORE
            };
            //-----------------------------TESTO DYNAMIC COCKPIT--------------------------------------//
            ImageArray[2][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);

            //NOME SUB-LUNA
            let Text;
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular.length > 0 && VarPlanetSystem.MoonOrbit > 0)
               Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
                  .Modular[i].Name[Language];
            ImageArray[2][i].fillText(Text, 20, 50);		                                                            //NOME DESTINAZIONE

            //DISTANZA SUB-LUNE (DIAMETRO TRASCURABILE)
            ImageArray[2][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
            ImageArray[2][i].fillText(E3_DisplayTime(VarPlanetSystem.TimeSubMoonDist[i]), 20, 150);  //TEMPO DI ARRIVO
            DynamCockpit.children[2].children[i].children[1].material.map.needsUpdate = true;

            //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
            E2_ResizeDist(2, i, VarPlanetSystem.IndSubMoonDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);
         };

      //DESTINAZIONE VERSO UN PIANETA
      if (VarPlanetSystem.DestinationPlanet == true) {
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
         //NOME PIANETA
         let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Name[Language];
         ImageArray[3][0].fillText(Text, 20, 50);		                                                                     //NOME DESTINAZIONE
         //VALORE IN KM x1000
         ImageArray[3][0].fillText(E3_DisplayDistance(VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * Par.DynamicCockpit.ScalaPos * 1000, true),
            20, 100);
         ImageArray[3][0].fillText(E3_DisplayTime((VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * 1000) / VarPlanetSystem.VelEffettiva),
            20, 150);  //TEMPO DI ARRIVO
         DynamCockpit.children[3].children[0].children[1].material.map.needsUpdate = true;

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         E2_ResizeDist(3, 0, VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet], Par.DynamicCockpit.SpriteDestScale, Par.DynamicCockpit.MeshScale);
      };
      //DESTINAZIONE VERSO UNA LUNA
      if (VarPlanetSystem.DestinationMoon == true) {
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
         //NOME LUNA
         let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1].Name[Language];
         ImageArray[3][0].fillText(Text, 20, 50);		                                                                           //NOME DESTINAZIONE
         //VALORE IN KM x1000
         ImageArray[3][0].fillText(E3_DisplayDistance(VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * Par.DynamicCockpit.ScalaPos * 1000, true),
            20, 100);
         ImageArray[3][0].fillText(E3_DisplayTime((VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * 1000) / VarPlanetSystem.VelEffettiva), 20, 150);  //TEMPO DI ARRIVO
         DynamCockpit.children[3].children[0].children[1].material.map.needsUpdate = true;

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         E2_ResizeDist(3, 0, VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1], Par.DynamicCockpit.SpriteDestScale, Par.DynamicCockpit.MeshScale);
      };
      //DESTINAZIONE VERSO UNA SUB-LUNA
      if (VarPlanetSystem.DestinationSubMoon == true) {
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
         //NOME LUNA
         let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1].Modular[VarPlanetSystem.DestSubMoon - 1].Name[Language];
         ImageArray[3][0].fillText(Text, 20, 50);		                                      //NOME DESTINAZIONE
         //VALORE IN KM x1000
         ImageArray[3][0].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
         ImageArray[3][0].fillText(E3_DisplayTime((VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1] * 1000) / VarPlanetSystem.VelEffettiva), 20, 150);  //TEMPO DI ARRIVO
         DynamCockpit.children[3].children[0].children[1].material.map.needsUpdate = true;

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         E2_ResizeDist(3, 0, VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1], Par.DynamicCockpit.SpriteDestScale, Par.DynamicCockpit.MeshScale);
      };

      /*-------------------------------CALCOLI PER STABILIRE SE UNA LUNA È DIETRO UN PIANETA------------------------------*/
      //DENTRO L'ORBITA DI UN PIANETA
      if (VarPlanetSystem.PlanetOrbit > 0) E2_ObjectBehindPlanet({
         Sun: false,                                                                            //GLI OGGETTI DA CALCOLARE SONO IL SOLE
         Radius: VarPlanetSystem.NearPlanetDiameter * Par.DynamicCockpit.CoeffRadiusBehind,     //RAGGIO CORPO CELESTE
         Distance: VarPlanetSystem.IndDist[VarPlanetSystem.NearPlanetIndex],                    //DISTANZA CORPO CELESTE
         NumObjects: VarPlanetSystem.NumMoons,                                                  //NUMERO DI OGGETTI DA CALCOLARE
         DistObjects: VarPlanetSystem.IndMoonDist,                                              //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
         CockpitPlanet: Cockpit.children[0].children[1 + VarPlanetSystem.NearPlanetIndex],      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
         CockpitObjects: Cockpit.children[1],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
         Lampeggi: LampeggioLune,                                                               //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
         Array: MoonsBehind,                                                                    //ARRAY DI LUNE, FALSE DAVANTI, TRUE DIETRO
      });
      /*-------------------------------CALCOLI PER STABILIRE SE UNA SUB-LUNA È DIETRO UNA LUNA-------------------------------*/
      //DENTRO L'ORBITA DI UNA LUNA
      if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0) E2_ObjectBehindPlanet({
         Sun: false,                                                                      //GLI OGGETTI DA CALCOLARE SONO IL SOLE
         Radius: VarPlanetSystem.NearMoonDiameter * Par.DynamicCockpit.CoeffRadiusBehind, //NUMERO CORPO CELESTE
         Distance: VarPlanetSystem.IndMoonDist[VarPlanetSystem.NearMoonIndex],            //DISTANZA CORPO CELESTE
         NumObjects: VarPlanetSystem.NumSubMoons,                                         //NUMERO DI OGGETTI DA CALCOLARE
         DistObjects: VarPlanetSystem.IndSubMoonDist,                                     //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
         CockpitPlanet: Cockpit.children[1].children[VarPlanetSystem.NearMoonIndex],      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
         CockpitObjects: Cockpit.children[2],                                             //GRUPPO 3D DI OGGETTI COCKPIT
         Lampeggi: LampeggioSubLune,                                                      //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
         Array: SubMoonsBehind,                                                           //ARRAY DI LUNE, FALSE DAVANTI, TRUE DIETRO
      });

      /*-------------------------------CALCOLI PER STABILIRE SE IL SOLE È DIETRO UN PIANETA-------------------------------*/
      if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit == 0) E2_ObjectBehindPlanet({
         Sun: true,                                                                             //GLI OGGETTI DA CALCOLARE SONO IL SOLE
         Radius: VarPlanetSystem.NearPlanetDiameter,                                          //DIAMETRO CORPO CELESTE
         Distance: VarPlanetSystem.IndDist[VarPlanetSystem.NearPlanetIndex],                    //DISTANZA CORPO CELESTE
         NumObjects: 1,                                                                         //NUMERO DI OGGETTI DA CALCOLARE
         DistObjects: VarPlanetSystem.IndDist,                                                  //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
         CockpitPlanet: Cockpit.children[0].children[1 + VarPlanetSystem.NearPlanetIndex],      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
         CockpitObjects: Cockpit.children[0],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
         Lampeggi: null,                                                                        //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
         Array: null,
      });

      /*-------------------------------CALCOLI PER STABILIRE SE IL SOLE È DIETRO UNA LUNA-------------------------------*/
      if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0 && VarPlanetSystem.StationType == 0) E2_ObjectBehindPlanet({
         Sun: true,                                                                             //GLI OGGETTI DA CALCOLARE SONO IL SOLE
         Radius: VarPlanetSystem.NearMoonDiameter,                                          //DIAMETRO CORPO CELESTE
         Distance: VarPlanetSystem.IndMoonDist[VarPlanetSystem.NearMoonIndex],                    //DISTANZA CORPO CELESTE
         NumObjects: 1,                                                                         //NUMERO DI OGGETTI DA CALCOLARE
         DistObjects: VarPlanetSystem.IndMoonDist,                                                  //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
         CockpitPlanet: Cockpit.children[0].children[0],      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
         CockpitObjects: Cockpit.children[0],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
         Lampeggi: null,                                                                        //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
         Array: null,
      });

      DynamCockpitVar.UpdateSymbolsControl = VarPlanetSystem.PlanetOrbit + VarPlanetSystem.MoonOrbit + VarPlanetSystem.SubMoonOrbit;
      UpdateSymbolsMoons.Update(VarPlanetSystem.NumMoons);
      UpdateSymbolsSubMoons.Update(VarPlanetSystem.NumSubMoons);
   }, 100);

   /*--------------------------VISIBILITÀ INDICATORE HUD E SIMBOLO STAZIONE SPAZIALE, VISIBILITÀ TESTI DESTINAZIONE-------------------------------*/
   setInterval(() => {
      //PER TUTTI GLI INDICATORI DELLE LUNE NON UTILIZZATI
      for (let i = 0; i < VarPlanetSystem.NumMajorMoons - VarPlanetSystem.NumMoons; i++) {
         /*-------------------------------INDICATORI CANVAS-------------------------------*/
         DynamCockpitVar.MoonVisible[i + VarPlanetSystem.NumMoons] = false;
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         DynamCockpitVar.References[1][i + VarPlanetSystem.NumMoons].children[0].visible = false;     //SPRITE VISORE
         DynamCockpitVar.References[1][i + VarPlanetSystem.NumMoons].children[1].visible = false;     //MESH INDICATORE
      };

      //PER TUTTI GLI INDICATORI DELLE SUB-LUNE NON UTILIZZATI
      for (let i = 0; i < VarPlanetSystem.NumMajorSubMoons - VarPlanetSystem.NumSubMoons; i++) {
         /*-------------------------------INDICATORI CANVAS------------------------------*/
         DynamCockpitVar.SubMoonVisible[i + VarPlanetSystem.NumMoons] = false;
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         DynamCockpitVar.References[2][i + VarPlanetSystem.NumSubMoons].children[0].visible = false;     //SPRITE VISORE
         DynamCockpitVar.References[2][i + VarPlanetSystem.NumSubMoons].children[1].visible = false;     //MESH INDICATORE
      };

      //VISIBLITÀ COCKPIT E HUD DESTINAZIONE
      if (VarPlanetSystem.DestinationPlanet == false && VarPlanetSystem.DestinationMoon == false && VarPlanetSystem.DestinationSubMoon == false) {
         DynamCockpitVar.DestinationVisible[0] = false;
         DynamCockpitVar.References[3][0].children[0].visible = false;     //SPRITE VISORE
         DynamCockpitVar.References[3][0].children[1].visible = false;     //MESH INDICATORE
      }
      else {
         DynamCockpitVar.DestinationVisible[0] = true;
         DynamCockpitVar.References[3][0].children[0].visible = true;     //SPRITE VISORE
         DynamCockpitVar.References[3][0].children[1].visible = true;     //MESH INDICATORE
      };

   }, 1000);

   UserObjects.add(Cockpit);
   return Cockpit;
};
//#endregion

/*--------------------DYNAMIC PLANETARY SYSTEM------------------------*/
//#region
//FUNZIONE DI SPOSTAMENTO RAPIDO
async function E1_RapidTranslate(Obj) {
   /*
   NOTA: ATTIVARE SOLO DA SPAZIO INTERPLANETARIO, ATTENZIONE, PRIMA SPOSTA LA NAVE ALLE NUOVE COORDINATE E POI LA TRASFERISCE SUL NUOVO PIANETA, VERIFICARE CHE LE NUOVE COORDINATE NON INTERFERISCANO COL PIANETA DI PARTENZA, SE COSÌ FOSSE EFFETTUARE IL SALTO DUE VOLTE, UNO SUL PIANETA DI DESTINAZIONE A COORDINATE DI SICUREZZA COMPATIBILI COL PIANETA DI ORIGINE, E UNO PER LE NUOVE COORDINATE SULLO STESSO PIANETA DI DESTINAZIONE
   
   await MicEnginereturn.E1_RapidTranslate({
      PlanetOrbit: 3,
      MoonOrbit: 0,
      SubMoonOrbit: 0,
      PosX: 30000000,      //DISTANZA METRI NEL GIOCO (ES. GravOrbit*1000)
      PosY: 0,
      PosZ: 0,
      RotX: 0,
      RotY: Math.PI / 2,     //RIVOLTO VERSO IL PIANETA
      RotZ: 0
   });
   */
   VarPlanetSystem.PlanetOrbit = Obj.PlanetOrbit;
   VarPlanetSystem.MoonOrbit = Obj.MoonOrbit;
   VarPlanetSystem.SubMoonOrbit = Obj.SubMoonOrbit;
   //POSIZIONE
   GroupUser.position.x = Obj.PosX;
   GroupUser.position.y = Obj.PosY;
   GroupUser.position.z = Obj.PosZ;

   //ROTAZIONE
   UserDummy.rotation.set(Obj.RotX, Obj.RotY, Obj.RotZ);

   await E2_InsertOrbitOnce();
};

function E2_PlanetsGroups(Name) {
   //0 - GRUPPO ORBITA CHE CONTIENE IL GRUPPO PLANET
   const Level0Group = new THREE.Group();
   Level0Group.name = `${Name} Level0`;

   //1 - GRUPPO PLANET CHE CONTIENE IL GRUPPO MESH
   const Level1Group = new THREE.Group();
   Level1Group.name = `${Name} Level1`;

   //2 - GRUPPO PLANET CHE CONTIENE IL GRUPPO MESH
   const Level2Group = new THREE.Group();
   Level2Group.name = `${Name} Level2`;

   /*-----------------GERARCHIA GRUPPI----------------------*/
   Level0Group.add(Level1Group);
   Level1Group.add(Level2Group);

   return Level0Group;
};

async function E2_GenerateSun(ParObj, PlanetGeom) {
   /*-------------------------------------GRUPPI--------------------------------------*/
   //GRUPPO RING CHE CONTIENE LE MESH DEGLI ANELLI
   const RingGroup = new THREE.Group();
   RingGroup.name = `${ParObj.Name}RingMesh`;

   //GRUPPO OBJECT CHE CONTIENE LE MESH
   const ObjectGroup = new THREE.Group();
   ObjectGroup.name = `${ParObj.Name}Object`;

   /*-------------------------------------OGGETTI 3D--------------------------------------*/
   //MESH
   const PlanetMaterial = await E3_MaterialeBase({
      RepeatX: 1,
      RepeatY: 1,
      Side: "Front",          //"Front", "Double", "Back"
      Color: 0xffffff,
      Transparent: false,
      Opacity: 1,
      DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
      //MAPPA COLORE
      Map: true,
      MapTexture: `${ParObj.TextureDirectory}${ParObj.Texture}${ParObj.TypeImage}`,
      AlphaMap: false,
      AlphaMapTexture: ``,
      AlphaMapRotation: 0
   });
   //GENERO IL PLANETMESH PER POTER INSERIRE AL SUO INTERNO LA NOTTE E LE NUVOLE
   const PlanetMesh = new THREE.Mesh(PlanetGeom, PlanetMaterial);
   PlanetMesh.name = `${ParObj.Name}Mesh`;
   ObjectGroup.add(PlanetMesh);

   //EFFETTO BAGLIORE
   if (ParObj.GlowColor) {
      const glowMaterial = E3_ShaderGlow({
         Color: ParObj.GlowColor,        //COLORE DELLO SHADER
         Intensity: ParObj.GlowInt,         //INTENSITÀ DELLO SHADER
      });
      E3_GenMesh(PlanetMesh, PlanetGeom, glowMaterial, [0, 0, 0], [0, 0, 0], [ParObj.GlowScale, ParObj.GlowScale, ParObj.GlowScale], `${ParObj.Name} Glow`, true, false);
   };
   //ARCHI DI PLASMA
   const PlasmaMat = await E3_MaterialeBase({
      RepeatX: 1,
      RepeatY: 1,
      Side: "Double",          //"Front", "Double", "Back"
      Color: ParObj.PlasmaColor,
      Transparent: true,
      Opacity: 0.5,
      DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
      //MAPPA COLORE
      Map: true,
      MapTexture: `${ParObj.TextureDirectory}${ParObj.Texture}Plasma.png`,
      AlphaMap: false,
      AlphaMapTexture: ``,
      AlphaMapRotation: 0
   });
   const PlasmaGeom = E3_GeoPlane(2000, 2000, 1, 1);

   for (let i = 0; i < ParObj.PlasmaNum; i++) {
      E3_GenMesh(PlanetMesh, PlasmaGeom, PlasmaMat, [0, 0, 0], [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI], [ParObj.PlasmaScale, ParObj.PlasmaScale, 1], `${ParObj.Name} Plasma${i}`, true, false);
   };

   return ObjectGroup;
};

async function E2_GeneratePlanet(Name, PlanetGeom, RingGeom) {
   /*-------------------------------------OGGETTI 3D--------------------------------------*/
   const PlanetMaterial = await E3_MaterialeStandard({
      RepeatX: 1,
      RepeatY: 1,
      FlatShading: false,
      Side: "Front",          //"Front", "Double", "Back"
      Color: 0xffffff,
      Transparent: false,
      Opacity: 1,
      Emissive: 0x000000,
      EmissiveIntensity: 0,
      DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
      TypeImage: "jpg",             //"jpg" "ktx2"
      MapLod: true,
      //MAPPA COLORE
      Map: false,
      MapTexture: "",
      //MAPPA NORMALE
      NormalMap: false,
      NormalMapTexture: "",
      //MAPPA METALLO
      MetalMap: false,
      MetalMapTexture: "",
      Metalness: 0,  //0 OPACO, 1 LUCIDO
      //MAPPA RUVIDEZZA
      RoughMap: false,
      RoughMapTexture: "",
      Roughness: 1,
      //MAPPA SPESSORE
      DisplacementMap: false,
      DisplacementMapTexture: "",
      Displacement: 0,
      //MAPPA EMISSIVA
      EmissiveMap: false,
      EmissiveMapTexture: "",
   });
   PlanetMaterial.name = "PlanetMaterial";

   //GENERO IL PLANETMESH PER POTER INSERIRE AL SUO INTERNO LA NOTTE E LE NUVOLE
   const PlanetMesh = new THREE.Mesh(PlanetGeom, PlanetMaterial);
   PlanetMesh.name = `${Name}Mesh`;
   //SALVO IL MATERIALE PER POTERLO RICARICARE IN CASO VENGA SOSTITUITO
   VarPlanetSystem.PlanetMaterial = PlanetMaterial;

   //EFFETTO BAGLIORE
   if (Oggetti.PlanetarySystem.Glow == true) {
      const glowMaterial = E3_ShaderGlow({
         Color: 0xffffff,        //COLORE DELLO SHADER
         Intensity: 1.0,         //INTENSITÀ DELLO SHADER
      });
      const GlowMesh = E3_GenMesh(PlanetMesh, PlanetGeom, glowMaterial, [0, 0, 0], [0, 0, 0], [1.01, 1.01, 1.01], `${Name} Glow`, true, false);
   }
   else {
      const GlowMesh = E3_GenMesh(PlanetMesh, PlanetGeom, new THREE.MeshBasicMaterial(), [0, 0, 0], [0, 0, 0], [1.01, 1.01, 1.01], `${Name} Glow`, false, false);
   };

   //LOD MESH 1 - NUVOLE
   const CloudMaterial = new THREE.MeshStandardMaterial({
      map: "",
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.5,
   });
   const CloudMesh = E3_GenMesh(PlanetMesh, PlanetGeom, CloudMaterial, [0, 0, 0], [0, 0, 0], [1.002, 1.002, 1.002], `${Name} Cloud`, true, false);

   //ANELLI
   const RingMaterial1 = await E3_MaterialeOpaco({
      RepeatX: 1,
      RepeatY: 1,
      FlatShading: false,
      Side: "Double",          //"Front", "Double"
      Color: 0xffffff,
      Transparent: true,
      Opacity: 1,
      DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
      Emissive: 0x000000,
      EmissiveIntensity: 0,
      //MAPPA COLORE
      Map: false,
      MapTexture: "",
      //MAPPA NORMALE
      NormalMap: false,
      NormalMapTexture: ``,
      //MAPPA SPESSORE
      DisplacementMap: false,
      DisplacementMapTexture: ``,
      Displacement: 0,
      //MAPPA EMISSIVA
      EmissiveMap: false,
      EmissiveMapTexture: ``,
   });
   E3_GenMesh(PlanetMesh, RingGeom, RingMaterial1, [0, 0, 0], [Math.PI / 2, 0, 0], [1, 1, 1], `${Name} Ring`, true, false);

   return PlanetMesh;
};

//FUNZIONE DI CAMBIO TEXTURE PER I PIANETI E LE LUNE
async function E2_ChangeTexturePlanet(Obj) {
   //CONTROLLO SE IL MATERIALE È QUELLO CORRETTO
   if (Obj.Mesh.material.name != "PlanetMaterial") Obj.Mesh.material = VarPlanetSystem.PlanetMaterial;

   //CAMBIO TEXTURE BASE
   Obj.Mesh.material.map = await E3_LoadEditTexture(null, `${Obj.Directory}${Obj.Texture}${Obj.TypeImage}`, true);
   Obj.Mesh.material.needsUpdate = true;

   //EFFETTO GLOW
   if (Oggetti.PlanetarySystem.Glow == true) Obj.Mesh.children[0].material.SetColor(Obj.GlowColor);
   if (Oggetti.PlanetarySystem.Glow == true) Obj.Mesh.children[0].material.SetIntensity(Obj.GlowInt);

   //TEXTURE NOTTE
   if (Obj.NightTexture == "") {
      Obj.Mesh.material.emissiveMap = null;
      Obj.Mesh.material.emissiveIntensity = 0;
   }
   else {
      Obj.Mesh.material.emissiveMap = await E3_LoadEditTexture(null, `${Obj.Directory}${Obj.NightTexture}${Obj.TypeImage}`, true);
      Obj.Mesh.material.needsUpdate = true;
      Obj.Mesh.material.emissiveIntensity = 0.2;
   };

   //MESH NUVOLE
   if (Obj.CloudTexture == "") Obj.Mesh.children[1].visible = false;
   else {
      Obj.Mesh.children[1].visible = true;
      Obj.Mesh.children[1].material.map = await E3_LoadEditTexture(null, `${Obj.Directory}${Obj.CloudTexture}${Obj.TypeImage}`, true);
      Obj.Mesh.children[1].material.needsUpdate = true;
   };
   //MESH ANELLI
   if (Obj.RingTexture == "") Obj.Mesh.children[2].visible = false;
   else {
      Obj.Mesh.children[2].visible = true;
      Obj.Mesh.children[2].material.map = await E3_LoadEditTexture(null, `${Obj.Directory}${Obj.RingTexture}${Obj.TypeRingImage}`, true);
      Obj.Mesh.children[2].material.needsUpdate = true;
      Obj.Mesh.children[2].scale.setScalar(Obj.RingScale);
   };
};

//AGGIORNAMENTO DELLA MESH DEL PIANETA E DELLE TRE MESH PER NOTTE, NUVOLE E ANELLI
async function E2_UpdatePlanetMesh(Num) {
   //INSERIMENTO MESH PIANETA
   if (Num > 0) PlanetarySystem.children[Num].children[0].children[0].add(VarPlanetSystem.MeshPlanet[0]);
   //SCALA SFERA GLOW (SOLO PER I PIANETI)
   if (Num > 0) VarPlanetSystem.MeshPlanet[0].children[0].scale.setScalar(Oggetti.PlanetarySystem.Modular[Num - 1].GlowScale * Par.PlanetarySystem.Parametri.GlowScale);
   //CAMBIO TEXTURE
   if (Num > 0) await E2_ChangeTexturePlanet({
      Mesh: VarPlanetSystem.MeshPlanet[0],               //MESH DEL PIANETA DA MODIFICARE
      Directory: Oggetti.PlanetarySystem.TextureDirectory,
      TypeImage: Oggetti.PlanetarySystem.TypeImage,
      Texture: Oggetti.PlanetarySystem.Modular[Num - 1].Texture,
      GlowColor: Oggetti.PlanetarySystem.Modular[Num - 1].GlowColor,
      GlowInt: Oggetti.PlanetarySystem.Modular[Num - 1].GlowInt,
      NightTexture: Oggetti.PlanetarySystem.Modular[Num - 1].NightTexture,
      CloudTexture: Oggetti.PlanetarySystem.Modular[Num - 1].CloudTexture,
      TypeRingImage: Oggetti.PlanetarySystem.TypeRingImage,
      RingTexture: Oggetti.PlanetarySystem.Modular[Num - 1].RingTexture,
      RingScale: Oggetti.PlanetarySystem.Modular[Num - 1].RingScale / Oggetti.PlanetarySystem.Modular[Num - 1].ScaleXZ
   });

   //INSERIMENTO MESH LUNE
   if (Num > 0) for (let x = 0; x < Oggetti.PlanetarySystem.Modular[Num - 1].Modular.length; x++) {
      //SE LA LUNA È UN PIANETA
      if (Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].Type == 0) {
         //INSERIMENTO MESH LUNA
         PlanetarySystem.children[Num].children[0].children[x + 1].children[0].children[0].add(VarPlanetSystem.MeshMoon[x]);
         //SCALA SFERA GLOW
         VarPlanetSystem.MeshMoon[x].children[0].scale.setScalar(Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].GlowScale * Par.PlanetarySystem.Parametri.GlowScale);
         //CAMBIO TEXTURE
         await E2_ChangeTexturePlanet({
            Mesh: VarPlanetSystem.MeshMoon[x],               //MESH DEL PIANETA DA MODIFICARE
            Directory: Oggetti.PlanetarySystem.TextureDirectory,
            TypeImage: Oggetti.PlanetarySystem.TypeImage,
            Texture: Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].Texture,
            GlowColor: Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].GlowColor,
            GlowInt: Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].GlowInt,
            NightTexture: Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].NightTexture,
            CloudTexture: Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].CloudTexture,
            TypeRingImage: Oggetti.PlanetarySystem.TypeRingImage,
            RingTexture: Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].RingTexture,
            RingScale: Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].RingScale / Oggetti.PlanetarySystem.Modular[Num - 1].Modular[x].ScaleXZ
         });
      };
   };

};

//CREA LA MESH DELLA STAZIONE SPAZIALE E LA EDITA ALL'INTERNO DEL E1_InsertOrbitOnce E DynamicOrbit
function E2_MeshStation(Type) {
   //COPIA LA MESH DELLA STAZIONE AL SUO POSTO NELL'ORBITA
   let Station;
   let Oggetto;
   if (Type == "Moon") {
      //RIFERIMENTI OGGETTI ANNIDATI
      Station = PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].children[VarPlanetSystem.MoonOrbit].children[0].children[0];
      Oggetto = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1];
   };
   if (Type == "SubMoon") {
      //RIFERIMENTI OGGETTI ANNIDATI
      Station = PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].children[VarPlanetSystem.MoonOrbit].children[0].children[VarPlanetSystem.SubMoonOrbit].children[0].children[0];
      Oggetto = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1]
   };
   //COPIA LA MESH DELLA STAZIONE AL SUO POSTO NELL'ORBITA
   Station.copy(Oggetti3D.PlanetarySystem.Model[Oggetto.Model]);

   //GENERA LA MESH CON LA GEOMETRIA INDICIZZATA
   if (Oggetto.UniversalGeom == true) {//ARRAYGEOM
      const Materials = [];
      //CREAZIONE ARRAY DI MATERIALI
      for (let i = 0; i < Geometrie[Oggetto.GeomModel].Multi.length; i++) {
         Materials[i] = MaterialArray[Geometrie[Oggetto.GeomModel].Multi[i].Material];
         if (Materiali[Geometrie[Oggetto.GeomModel].Multi[i].Material].VariableColor == "@Material1") {
            Materials[i].color.setHex(Oggetto.Color1);
         };
         if (Materiali[Geometrie[Oggetto.GeomModel].Multi[i].Material].VariableColor == "@Material2") {
            Materials[i].color.setHex(Oggetto.Color2);
         };
      };
      //CREAZIONE MESH
      const mesh = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Varianti[Oggetto.Variante].Indice], Materials);
      mesh.name = "MultiUniversalGeom";
      Station.children.unshift(mesh);
      mesh.parent = Station;
   };
   //GENERA LA MESH CON LE GEOMETRIE RICICLATE
   if (Geometrie[Oggetto.GeomModel].Recycled)
      for (let i = 0; i < Geometrie[Oggetto.GeomModel].Recycled.length; i++) {      //PER OGNI OGGETTO RICICLATO
         const Materials = [];
         //CREAZIONE ARRAY DI MATERIALI
         for (let a = 0; a < Geometrie[Oggetto.GeomModel].Recycled[i].length - 1; a++) {//PER OGNI SINGOLO MATERIALE E GEOMETRIA
            Materials[a] = MaterialArray[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material];
            if (Materiali[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material].VariableColor == "@Material1")
               Materials[a].color.setHex(Oggetto.Color1);
            if (Materiali[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material].VariableColor == "@Material2")
               Materials[a].color.setHex(Oggetto.Color2);
         };
         //CREAZIONE MESH
         const mesh = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Recycled[i][0].Indice], Materials);
         mesh.name = "RecycledUniversalGeom";
         Station.children.unshift(mesh);
         mesh.parent = Station;
      };

   //CERCA I MODELLI 3D DI COLORE NELLA STAZIONE SPAZIALE E METTILI NELL'ARRAY
   const ColorArray = [];
   Station.getObjectsByProperty('name', `@Material1`, ColorArray);

   //SE LA STAZIONE SPAZIALE NON È DEL COLORE GIUSTO RICOLORALA
   if (ColorArray.length > 0)
      if (ColorArray[0].material.color.getHexString() != Oggetto.Color1) {
         for (let i = 0; i < ColorArray.length; i++) {
            ColorArray[i].material.color.setHex(Oggetto.Color1);
         };
      };

   //CERCA I MODELLI 3D DI COLORE NELLA STAZIONE SPAZIALE E METTILI NELL'ARRAY
   const ColorArray2 = [];
   Station.getObjectsByProperty('name', `@Material2`, ColorArray2);
   //SE LA STAZIONE SPAZIALE NON È DEL COLORE GIUSTO RICOLORALA
   if (ColorArray2.length > 0)
      if (ColorArray2[0].material.color.getHexString() != Oggetto.Color2) {
         for (let i = 0; i < ColorArray2.length; i++) {
            ColorArray2[i].material.color.setHex(Oggetto.Color2);
         };
      };
};

/*INSERIMENTO NELL'ORBITA A PARTITA CARICATA*/
//CONTIENE: COLORE STAZIONE SPAZIALE
async function E2_InsertOrbitOnce() {
   if (VarPlanetSystem.PlanetOrbit > 0) {                //SE SI È DENTRO L'ORBITA DI UN PIANETA
      //AGGIUNGI E MESH PER IL PIANETA
      await E2_UpdatePlanetMesh(VarPlanetSystem.PlanetOrbit);
      if (VarPlanetSystem.MoonOrbit > 0) {               //SE SI È DENTRO L'ORBITA DI UNA LUNA
         if (VarPlanetSystem.SubMoonOrbit > 0) {         //SE SI È DENTRO L'ORBITA DI UNA SUB-LUNA
            //INSERIMENTO DELL'ORBITA DELLA SUB-LUNA
            PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].children[VarPlanetSystem.MoonOrbit]
               .children[0].children[VarPlanetSystem.SubMoonOrbit].children[0].add(GroupUser);
            PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].children[VarPlanetSystem.MoonOrbit]
               .children[0].children[VarPlanetSystem.SubMoonOrbit].children[0].add(UserDummy);

            if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Once SubMoon ${PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0]
               .children[VarPlanetSystem.MoonOrbit].children[0].children[VarPlanetSystem.SubMoonOrbit].children[0].name}`);
            VarPlanetSystem.SubStationOrbit = true;

            /*--------------------------MESH STAZIONE SPAZIALE----------------------------------- */
            //SE LA LUNA È UNA STAZIONE SPAZIALE
            if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0 && VarPlanetSystem.SubMoonOrbit > 0)
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
                  .Modular[VarPlanetSystem.SubMoonOrbit - 1].Type > 0) {
                  //CREA LA MESH DELLA STAZIONE SPAZIALE E LA EDITA ALL'INTERNO DEL E1_InsertOrbitOnce E DynamicOrbit
                  E2_MeshStation("SubMoon");
               };
         }
         //INSERIMENTO DELL'ORBITA DELLA LUNA
         else {
            VarPlanetSystem.SubStationOrbit = false;
            PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].children[VarPlanetSystem.MoonOrbit].children[0].add(GroupUser);
            PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].children[VarPlanetSystem.MoonOrbit].children[0].add(UserDummy);

            if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Once Moon ${PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0]
               .children[VarPlanetSystem.MoonOrbit].children[0].name}`);

            /*--------------------------MESH STAZIONE SPAZIALE----------------------------------- */
            //SE LA LUNA È UNA STAZIONE SPAZIALE
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
               .Type > 0) {
               VarPlanetSystem.StationOrbit = true;

               //CREA LA MESH DELLA STAZIONE SPAZIALE E LA EDITA ALL'INTERNO DEL E1_InsertOrbitOnce E DynamicOrbit
               E2_MeshStation("Moon");
            }
            else VarPlanetSystem.StationOrbit = false;
         };
      }
      //INSERIMENTO DELL'ORBITA DEL PIANETA
      else {
         PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].add(GroupUser);
         PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].add(UserDummy);

         if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Once Planet ${PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].name}`);
         VarPlanetSystem.StationOrbit = false;
      };
   };
};

//ELIMINA LA STAZIONE SPAZIALE DENTRO UN'ORBITA
function E2_DisposeMaterialTextures(material) {
   const textureProps = [
      'map',
      'lightMap',
      'aoMap',
      'emissiveMap',
      'bumpMap',
      'normalMap',
      'displacementMap',
      'roughnessMap',
      'metalnessMap',
      'alphaMap',
      'envMap'
   ];

   textureProps.forEach(prop => {
      if (material[prop] && typeof material[prop].dispose === 'function') {
         material[prop].dispose();
      }
   });
}

function E2_ClearStation(targetGroup) {
   while (targetGroup.children.length > 0) {
      const child = targetGroup.children[0];

      //Ricorsione per gruppi figli
      if (child.children && child.children.length > 0) {
         E2_ClearStation(child, null);
      }

      //Dispose geometria
      if (child.geometry && typeof child.geometry.dispose === 'function') {
         child.geometry.dispose();
      }

      //Dispose materiali e texture
      if (child.material) {
         if (Array.isArray(child.material)) {
            child.material.forEach(m => {
               E2_DisposeMaterialTextures(m);
               if (typeof m.dispose === 'function') m.dispose();
            });
         } else {
            E2_DisposeMaterialTextures(child.material);
            if (typeof child.material.dispose === 'function') {
               child.material.dispose();
            }
         }
      }

      //Rimuove il figlio dal gruppo
      targetGroup.remove(child);
   };
}

//DISATTIVAZIONE TEMPORANEA DEL FRUSTUM CULLING PER 500MS PER IL GRUPPO DEL PIANETA PIÙ VICINO
function E1_FrustumNearPlanet(Num) {
   PlanetarySystem.children[Num].traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = false;
   });
   setTimeout(() => {
      PlanetarySystem.children[Num].traverse((obj) => {
         if (obj.isMesh) obj.frustumCulled = false;
      });
   }, 500);
};

function E1_ShowSystemTextCanvas(Elem, Index) {
   //ALL'INTERNO DI UN'ORBITA DI UN PIANETA
   if (VarPlanetSystem.PlanetOrbit > 0) {
      Elem.showButton(Index, true);
      Elem.topLayerButton(Index, true);

      //IN ORBITA ATTORNO A UN PIANETA
      if (VarPlanetSystem.MoonOrbit == 0 && VarPlanetSystem.SubMoonOrbit == 0) {
         //CONTROLLO DI SICUREZZA SE LA VARIABILE IN OGGETTI ESISTE
         if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Text0 && Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Text1)
            //ASSEGNA IL TESTO A SYSTEMTEXT
            Elem.setButtonText(Index, `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Name[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Text0[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Text1[Language]}`);
      };

      //IN ORBITA ATTORNO A UNA LUNA
      if (VarPlanetSystem.MoonOrbit > 0 && VarPlanetSystem.SubMoonOrbit == 0) {
         //CONTROLLO DI SICUREZZA SE LA VARIABILE IN OGGETTI ESISTE
         if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Text0 && Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Text1)
            //ASSEGNA IL TESTO A SYSTEMTEXT
            Elem.setButtonText(Index, `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Name[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Text0[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Text1[Language]}`);
      };

      //IN ORBITA ATTORNO A UNA SUB-LUNA
      if (VarPlanetSystem.SubMoonOrbit > 0) {
         //CONTROLLO DI SICUREZZA SE LA VARIABILE IN OGGETTI ESISTE
         if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Text0 && Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Text1)
            //ASSEGNA IL TESTO A SYSTEMTEXT
            Elem.setButtonText(Index, `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
               .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Name[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Text0[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Text1[Language]}`);
      };
      //NASCONDERE SYSTEM TEXT DOPO UN CERTO TEMPO
      setTimeout(() => {
         Elem.showButton(Index, false);
      }, Par.PlanetarySystem.Parametri.SystemTextHideTime);
   };
};

/*-----------------------------------FUNZIONI DA ESEGUIRE NEL LOOP RENDER-------------------------------------*/
function E2_UpdateRotation(delta) {
   if (VarPlanetSystem.PlanetOrbit == 0) {
      VarPlanetSystem.CoeffRot = CoeffMap(VarPlanetSystem.VelEffettiva, Par.PlanetarySystem.Parametri.TimeRelMinSpeed, Par.PlanetarySystem.Parametri.TimeRelMaxSpeed, 1, Par.PlanetarySystem.Parametri.TimeRelCoeff);
   }
   else VarPlanetSystem.CoeffRot = 1;

   VarPlanetSystem.OrbitPosition += VarPlanetSystem.CoeffRot * delta * 10;

   /*---------------------------------------------------ROTAZIONE---------------------------------------------------*/
   //PER OGNI PIANETA
   for (let i = 0; i < VarPlanetSystem.PlanetsNum; i++) {
      //ROTAZIONE PIANETI ATTORNO AL PROPRIO ASSE (GIORNO) (level2)
      if (Oggetti.PlanetarySystem.Modular[i].Rot != 0)
         VarPlanetSystem.References[i].DayRot.rotation.y = VarPlanetSystem.OrbitPosition * (Par.PlanetarySystem.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].Rot);
      else VarPlanetSystem.References[i].DayRot.rotation.y = 0;

      //ROTAZIONE PIANETI RIVOLTI NELLA STESSA DIREZIONE (STAGIONI) (level1)
      VarPlanetSystem.References[i].SeasonRot.rotation.y = VarPlanetSystem.OrbitPosition * (Par.PlanetarySystem.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].OrbitRot);

      //ROTAZIONE PIANETI ATTORNO AL SOLE (ROTAZIONE ORBIT) (level0)
      VarPlanetSystem.References[i].YearRot.rotation.y = VarPlanetSystem.RandomRotPlanet[i] + VarPlanetSystem.OrbitPosition * (Par.PlanetarySystem.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].OrbitRot);

      //PRESENZA DI LUNE
      for (let a = 0; a < Oggetti.PlanetarySystem.Modular[i].Modular.length; a++) {
         //ROTAZIONE PIANETI ATTORNO AL PROPRIO ASSE (ROTAZIONE MESH)
         //a+1 PERCHÈ IL CHILDREN[0] È IL PIANETA STESSO
         if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Rot != 0)
            VarPlanetSystem.References[i][a].DayRot.rotation.y = VarPlanetSystem.OrbitPosition * (Par.PlanetarySystem.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].Modular[a].Rot);
         else VarPlanetSystem.References[i][a].DayRot.rotation.y = 0;

         //ROTAZIONE LUNE ATTORNO AL PIANETA (ROTAZIONE ORBIT)
         VarPlanetSystem.References[i][a].YearRot.rotation.y = VarPlanetSystem.OrbitPosition * (Par.PlanetarySystem.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].Modular[a].OrbitRot);

         //PRESENZA DI SUB-LUNE
         for (let b = 0; b < Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular.length; b++) {
            //ROTAZIONE PIANETI ATTORNO AL PROPRIO ASSE (ROTAZIONE MESH)
            //a+1 PERCHÈ IL CHILDREN[0] È IL PIANETA STESSO
            if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Rot != 0)
               VarPlanetSystem.References[i][a][b].DayRot.rotation.y = VarPlanetSystem.OrbitPosition * (Par.PlanetarySystem.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Rot);
            else VarPlanetSystem.References[i][a][b].DayRot.rotation.y.rotation.y = 0;

            //ROTAZIONE SUB-LUNE ATTORNO ALLA LUNA (ROTAZIONE ORBIT)
            VarPlanetSystem.References[i][a][b].YearRot.rotation.y = VarPlanetSystem.OrbitPosition * (Par.PlanetarySystem.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].OrbitRot);
         };
      };
   };

   /*ROTAZIONE EVENTUALE ATMOSFERA*/
   //NOTA: AGGIUNGERE LA ROTAZIONE PER LA LUNA E SUB-LUNA
   if (VarPlanetSystem.PlanetOrbit > 0) {
      if (VarPlanetSystem.References[VarPlanetSystem.PlanetOrbit - 1].DayRot.children[0])
         VarPlanetSystem.References[VarPlanetSystem.PlanetOrbit - 1].DayRot.children[0].children[1].rotation.y += Par.PlanetarySystem.Parametri.CloudRotation * delta * 10;
   };
};

function E2_UpdateDynamicPlanetarySystem(delta) {
   //E2_UpdateRotation(delta);
};

/*--------------------------------------------FUNZIONE PRINCIPALE----------------------------------------------*/
async function E0_DynamicPlanetarySystem() {
   if (Par.Log.Moduli == true) console.log("DynamicPlanetarySystem");
   /*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
   /*------------------------------------------------------BLOCCHI STATICI-----------------------------------------------------------------*/
   /*-----------------------------------CREAZIONE VETTORI E ARRAY ACCESSORI-----------------------------------*/
   //#region
   let TractorMoon = null;
   let TractorSubMoon = null;
   //CREA I VETTORI VUOTI DELL'ARRAY CON LE POSIZIONI WORLD DEI PIANETI
   for (let i = 0; i < VarPlanetSystem.PlanetsNum; i++) {
      const PlanetPos = new THREE.Vector3();
      VarPlanetSystem.WorldPosPlanets.push(PlanetPos);
   };

   //ARRAY CON IL NUMERO DI TUTTE LE LUNE E SUB-LUNE
   for (let i = 0; i < Object.keys(Oggetti.PlanetarySystem.Modular).length; i++) { //TUTTI I PIANETI ESCLUSA LA STELLA
      //ARRAY CON IL NUMERO DI TUTTE LE LUNE
      let MoonsNum = Object.keys(Oggetti.PlanetarySystem.Modular[i].Modular).length;
      VarPlanetSystem.ArrayMoonsNum.push(MoonsNum);       //AGGIUNGE IL NUMERO DI LUNE ATTORNO A QUEL PIANETA

      //ARRAY CON IL NUMERO DI TUTTE LE SUB-LUNE
      for (let a = 0; a < MoonsNum; a++) { //TUTTE LE LUNE
         let SubMoonsNum = Object.keys(Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular).length;
         VarPlanetSystem.ArraySubMoonsNum.push(SubMoonsNum);       //AGGIUNGE IL NUMERO DI SUB-LUNE ATTORNO A QUELLA LUNA
      };
      VarPlanetSystem.NumMajorSubMoons = Math.max(...VarPlanetSystem.ArraySubMoonsNum);    //NUMERO MASSIMO DI SUB-LUNE
   };
   VarPlanetSystem.NumMajorMoons = Math.max(...VarPlanetSystem.ArrayMoonsNum);    //NUMERO MASSIMO DI LUNE

   //CREAZIONE VETTORI POSIZIONE LUNE
   for (let i = 0; i < VarPlanetSystem.NumMajorMoons; i++) {
      //ARRAY CON LE POSIZIONI WORLD DELLE LUNE
      const MoonPos = new THREE.Vector3();
      //VarPlanetSystem.WorldPosMoons.push(MoonPos);
      VarPlanetSystem.WorldPosMoons[i] = MoonPos;
   };

   //CREAZIONE VETTORI POSIZIONE SUB-LUNE
   for (let i = 0; i < VarPlanetSystem.NumMajorSubMoons; i++) {
      //ARRAY CON LE POSIZIONI WORLD DELLE LUNE
      const SubMoonPos = new THREE.Vector3();
      VarPlanetSystem.WorldPosSubMoons.push(SubMoonPos);
   };
   //#endregion

   /*---------------------------------------------CREAZIONE GRUPPO--------------------------------------------*/
   //GRUPPO PLANETARY SYSTEM
   Planetary = new THREE.Group();
   Planetary.name = "PlanetarySystem";

   /*--------------------------------------------GEOMETRIE GENERICHE------------------------------------------*/
   //#region
   //PIANETI E ANELLI
   const PlanetGeom1 = E3_GeoSphere(1000, Par.PlanetarySystem.Parametri.RadSeg, Par.PlanetarySystem.Parametri.HeightSeg, 0, Math.PI * 2, 0, Math.PI);
   const RingGeom1 = E3_GeoRing(0, 1000, Par.PlanetarySystem.Parametri.RingSeg, 2, 0, Math.PI * 2);
   //#endregion

   /*----------------------------------------MESH GENERICHE PIANETI E LUNE------------------------------------*/
   //#region
   VarPlanetSystem.MeshPlanet[0] = await E2_GeneratePlanet("PlanetMesh", PlanetGeom1, RingGeom1);

   for (let i = 0; i < VarPlanetSystem.NumMajorMoons; i++) {
      VarPlanetSystem.MeshMoon[i] = await E2_GeneratePlanet(`MoonMesh ${i}`, PlanetGeom1, RingGeom1);
   };
   //#endregion

   //-------------------------------------------AGGIUNTA STELLA MADRE-----------------------------------------//
   //#region
   const Sun = await E2_GenerateSun({
      Name: Oggetti.PlanetarySystem.Sun.Name[Language],
      TextureDirectory: Oggetti.PlanetarySystem.TextureDirectory,
      TypeImage: Oggetti.PlanetarySystem.TypeImage,
      Texture: Oggetti.PlanetarySystem.Sun.Texture,
      //Emissive: Oggetti.PlanetarySystem.Sun.Emissive,
      GlowColor: Oggetti.PlanetarySystem.Sun.GlowColor,    //COLORE BAGLIORE
      GlowScale: Oggetti.PlanetarySystem.Sun.GlowScale,       //SCALA BAGLIORE
      GlowInt: Oggetti.PlanetarySystem.Sun.GlowInt,       //INTENSITÀ BAGLIORE
      PlasmaScale: Oggetti.PlanetarySystem.Sun.PlasmaScale,       //SCALA PLASMA
      PlasmaColor: Oggetti.PlanetarySystem.Sun.PlasmaColor,       //COLORE PLASMA
      PlasmaNum: Oggetti.PlanetarySystem.Sun.PlasmaNum,              //NUMERO DI PIANI PLASMA
   }, PlanetGeom1);

   //SCALA E SCHIACCIAMENTO AI POLI (MESH)
   let SunScaleXZ = Oggetti.PlanetarySystem.Sun.ScaleXZ;
   let SunScaleY = Oggetti.PlanetarySystem.Sun.ScaleY;
   Sun.scale.set(SunScaleXZ, SunScaleY, SunScaleXZ);
   Planetary.add(Sun);
   //#endregion

   //-----------------------------------AGGIUNTA ORBITE PIANETI, LUNE E REFERENCE-----------------------------//
   for (let i = 0; i < VarPlanetSystem.PlanetsNum; i++) {
      //CREAZIONE GRUPPO PIANETA
      const Planet = E2_PlanetsGroups(Oggetti.PlanetarySystem.Modular[i].Name[Language]);

      //INCLINAZIONE ORBITALE
      Planet.rotation.x = Oggetti.PlanetarySystem.Modular[i].RotX;

      //POSIZIONAMENTO NELLA SUA ORBITA INTORNO AL SOLE
      Planet.children[0].position.set(0, 0, Oggetti.PlanetarySystem.Modular[i].Raggio * 1000);

      //SCALA E SCHIACCIAMENTO AI POLI (MESH)
      let ScaleXZ = Oggetti.PlanetarySystem.Modular[i].ScaleXZ;
      let ScaleY = Oggetti.PlanetarySystem.Modular[i].ScaleY;
      //ORBITGROUP - PLANETGROUP - MESHGROUP - MESH PIANETA
      Planet.children[0].children[0].scale.set(ScaleXZ, ScaleY, ScaleXZ);
      Planetary.add(Planet);

      //CREAZIONE REFERENCE
      VarPlanetSystem.References[i] = {
         DayRot: Planetary.children[i + 1].children[0].children[0],
         SeasonRot: Planetary.children[i + 1].children[0],
         YearRot: Planetary.children[i + 1]
      };

      //----------------------------------------PRESENZA DI LUNE----------------------------------------//
      for (let a = 0; a < Oggetti.PlanetarySystem.Modular[i].Modular.length; a++) {
         //CREAZIONE GRUPPO LUNA
         let Moon;

         Moon = E2_PlanetsGroups(Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language]);
         //INCLINAZIONE ORBITALE
         if (Oggetti.PlanetarySystem.Modular[i].Modular[a].RotX) Moon.rotation.x = Oggetti.PlanetarySystem.Modular[i].Modular[a].RotX;

         //POSIZIONAMENTO NELLA SUA ORBITA INTORNO AL PIANETA
         Moon.children[0].position.set(0, 0, Oggetti.PlanetarySystem.Modular[i].Modular[a].Raggio * 1000);

         //SCALA E SCHIACCIAMENTO AI POLI
         let MoonScaleXZ = Oggetti.PlanetarySystem.Modular[i].Modular[a].ScaleXZ;
         let MoonScaleY = Oggetti.PlanetarySystem.Modular[i].Modular[a].ScaleY;
         Moon.children[0].children[0].scale.set(MoonScaleXZ, MoonScaleY, MoonScaleXZ);

         Planetary.children[i + 1].children[0].add(Moon);

         //CREAZIONE REFERENCE
         VarPlanetSystem.References[i][a] = {
            //a+1 PERCHÈ IL CHILDREN[0] È IL PIANETA STESSO
            DayRot: Planetary.children[i + 1].children[0].children[a + 1].children[0],
            YearRot: Planetary.children[i + 1].children[0].children[a + 1]
         };

         //-------------------------------------PRESENZA DI SUB-LUNE--------------------------------------//
         let SubMoonsNum = Object.keys(Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular).length;
         for (let b = 0; b < SubMoonsNum; b++) {
            //CREAZIONE GRUPPO SUB-LUNA
            let SubMoon;
            if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Type > 0) {
               SubMoon = E2_PlanetsGroups(Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Name[Language]);
            };

            //INCLINAZIONE ORBITALE
            if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].RotX) SubMoon.rotation.x = Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].RotX;

            //POSIZIONAMENTO NELLA SUA ORBITA INTORNO ALLA LUNA
            SubMoon.children[0].position.set(0, 0,
               Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Raggio * 1000);

            //SCALA E SCHIACCIAMENTO AI POLI
            let SubMoonScaleXZ = Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].ScaleXZ;
            let SubMoonScaleY = Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].ScaleY;
            SubMoon.children[0].children[0].scale.set(SubMoonScaleXZ, SubMoonScaleY, SubMoonScaleXZ);

            Moon.children[0].add(SubMoon);

            //CREAZIONE REFERENCE
            VarPlanetSystem.References[i][a][b] = {
               //a+1 PERCHÈ IL CHILDREN[0] È IL PIANETA STESSO
               DayRot: Planetary.children[i + 1].children[0].children[a + 1].children[0].children[b + 1].children[0],
               YearRot: Planetary.children[i + 1].children[0].children[a + 1].children[0].children[b + 1]
            };
         };
      };
   };

   /*FUNZIONE AGGIORNAMENTO PROMISES DEGLI OGGETTI CREATI DALLA FUNZIONE CreateObj*/
   const UpdatePlanSysPromiseExecution = new OnceFunctionBool(async function () {
      await CreationEngine.PlanSysPromiseExecution(VarPlanetSystem.NearPlanetIndex - 1);
      await E2_UpdatePlanetMesh(VarPlanetSystem.NearPlanetIndex);
   });

   /*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
   /*----------------------------------------------BLOCCHI RITARDATI 3000MS LOOP 100MS-----------------------------------------------------*/
   async function DynamicOrbit() {           //INSERIMENTO NELL'ORBITA COSTANTE DURANTE LA PARTITA
      //SE SI ENTRA NEL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DEL PIANETA PIÙ VICINO
      if (VarPlanetSystem.NearPlanetIndex > 0) {
         if (VarPlanetSystem.NearPlanetDist < Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].GravOrbit) {
            //SE SI ENTRA NEL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DEL PIANETA PIÙ VICINO
            if (VarPlanetSystem.PlanetOrbit != VarPlanetSystem.NearPlanetIndex) {
               //ATTACCA LA NAVE SPAZIALE
               Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].attach(GroupUser);
               Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].attach(UserDummy);
               VarPlanetSystem.PlanetOrbit = VarPlanetSystem.NearPlanetIndex;
               //AGGIUNGI LE MESH PER IL PIANETA
               if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Enter Planet ${VarPlanetSystem.NearPlanetIndex - 1}`);
            };

            //SE SI ENTRA NEL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DI UNA SUA LUNA
            let MoonsNum = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular.length;

            if (MoonsNum > 0 && VarPlanetSystem.NearMoonDist > 0) {
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].
                  Modular[VarPlanetSystem.NearMoonIndex])
                  if (VarPlanetSystem.NearMoonDist < Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex].GravOrbit) {
                     if (VarPlanetSystem.MoonOrbit != VarPlanetSystem.NearMoonIndex + 1) {
                        Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].children[VarPlanetSystem.NearMoonIndex + 1].children[0].attach(GroupUser);
                        Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].children[VarPlanetSystem.NearMoonIndex + 1].children[0].attach(UserDummy);

                        VarPlanetSystem.MoonOrbit = VarPlanetSystem.NearMoonIndex + 1;
                        if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Enter Moon ${VarPlanetSystem.NearMoonIndex}`);

                        /*--------------------------COLORE STAZIONE SPAZIALE----------------------------------- */
                        //SE LA LUNA È UNA STAZIONE SPAZIALE
                        if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1]
                           .Modular[VarPlanetSystem.NearMoonIndex].Type > 0) {
                           VarPlanetSystem.StationOrbit = true;

                           //CREA LA MESH DELLA STAZIONE SPAZIALE E LA EDITA ALL'INTERNO DEL E1_InsertOrbitOnce E DynamicOrbit
                           E2_MeshStation("Moon");
                        }
                        else VarPlanetSystem.StationOrbit = false;
                     };

                     //SE SI ENTRA NEL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DI UNA SUA SUB-LUNA
                     let SubMoonsNum = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].
                        Modular[VarPlanetSystem.NearMoonIndex].Modular.length;

                     if (SubMoonsNum > 0 && VarPlanetSystem.NearSubMoonDist > 0) {
                        if (VarPlanetSystem.NearSubMoonDist < Oggetti.PlanetarySystem.Modular[
                           VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex]
                           .Modular[VarPlanetSystem.NearSubMoonIndex].GravOrbit) {
                           if (VarPlanetSystem.SubMoonOrbit != VarPlanetSystem.NearSubMoonIndex + 1) {
                              Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].children[VarPlanetSystem.NearMoonIndex + 1].children[0].children[VarPlanetSystem.NearSubMoonIndex + 1].children[0].attach(GroupUser);
                              Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].children[VarPlanetSystem.NearMoonIndex + 1].children[0].children[VarPlanetSystem.NearSubMoonIndex + 1].children[0].attach(UserDummy);

                              VarPlanetSystem.SubMoonOrbit = VarPlanetSystem.NearSubMoonIndex + 1;
                              if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Enter SubMoon ${VarPlanetSystem.NearSubMoonIndex}`);

                              VarPlanetSystem.SubStationOrbit = true;

                              /*--------------------------MESH STAZIONE SPAZIALE----------------------------------- */
                              //SE LA SUB-LUNA È UNA STAZIONE SPAZIALE
                              if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1]
                                 .Modular[VarPlanetSystem.NearMoonIndex].Modular[VarPlanetSystem.NearSubMoonIndex].Type > 0) {
                                 //CREA LA MESH DELLA STAZIONE SPAZIALE E LA EDITA ALL'INTERNO DEL E1_InsertOrbitOnce E DynamicOrbit
                                 E2_MeshStation("SubMoon");
                              };
                           };
                        }
                        //SE SI ESCE DAL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DI UNA SUA SUB-LUNA +10%
                        //else {
                        if (VarPlanetSystem.NearSubMoonDist > Oggetti.PlanetarySystem.Modular[
                           VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex]
                           .Modular[VarPlanetSystem.NearSubMoonIndex].GravOrbit + Oggetti.PlanetarySystem.Modular[
                              VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex]
                              .Modular[VarPlanetSystem.NearSubMoonIndex].GravOrbit / 10) {
                           if (VarPlanetSystem.SubMoonOrbit > 0) {
                              Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0]
                                 .children[VarPlanetSystem.NearMoonIndex + 1].children[0].attach(GroupUser);
                              Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0]
                                 .children[VarPlanetSystem.NearMoonIndex + 1].children[0].attach(UserDummy);
                              VarPlanetSystem.SubMoonOrbit = 0;
                              if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Leave SubMoon`);
                              E2_ClearStation(Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].children[VarPlanetSystem.NearMoonIndex + 1].children[0].children[VarPlanetSystem.NearSubMoonIndex + 1].children[0].children[0]);
                           };
                           VarPlanetSystem.SubStationOrbit = false;
                        };
                     };
                  };
               //SE SI ESCE DAL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DI UNA SUA LUNA +10%
               //else {
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex])
                  if (VarPlanetSystem.NearMoonDist > Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex].GravOrbit + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex].GravOrbit / 10) {
                     if (VarPlanetSystem.MoonOrbit > 0) {
                        Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].attach(GroupUser);
                        Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].attach(UserDummy);

                        if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Leave Moon`);
                        //SE SI STA LASCIANDO UNA LUNA STAZIONE SPAZIALE
                        if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1]
                           .Modular[VarPlanetSystem.NearMoonIndex].Type > 0)
                           E2_ClearStation(Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].children[VarPlanetSystem.NearMoonIndex + 1].children[0].children[0]);

                        VarPlanetSystem.MoonOrbit = 0;
                        VarPlanetSystem.StationOrbit = false;
                     };
                  };
            };
         }
         //SE SI ESCE DAL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DEL PIANETA PIÙ VICINO
         else {
            if (VarPlanetSystem.PlanetOrbit > 0) {
               Scene.attach(GroupUser);
               Scene.attach(UserDummy);
               VarPlanetSystem.PlanetOrbit = 0;
               if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Leave Planet`);

               VarPlanetSystem.StationOrbit = false;
            };

         };
      };
   };

   /*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
   /*----------------------------------------------BLOCCHI RITARDATI 4000MS LOOP 100MS-----------------------------------------------------*/
   /*CICLO VELOCE (100MS)*/
   /*ROTAZIONE, CALCOLO DISTANZE E POSIZIONI WORLD, VISIBILITÀ STAZIONI, TEMPI DALLA NAVE SPAZIALE, ISTANZA RAGGIO TRAENTE, COLLISIONI*/
   setInterval(async () => {
      if (VarPlanetSystem.OrbitOnceLoaded == true) {
         E2_UpdateRotation(0.1);
         /*---------------------------------------------CALCOLO DELLE DISTANZE---------------------------------------------*/
         //DISTANZA DAL SOLE
         VarPlanetSystem.IndDist[0] = PhysicsEngine.UserPosWorld.distanceTo(PosZero) / 1000;

         //POSIZIONI WORLD DEI PIANETI ESCLUSA LA STELLA MADRE
         for (let i = 0; i < VarPlanetSystem.PlanetsNum; i++) {      //PER OGNI PIANETA ESCLUSA LA STELLA MADRE
            VarPlanetSystem.References[i].SeasonRot.getWorldPosition(VarPlanetSystem.WorldPosPlanets[i]);
         };

         //DISTENZE DAI PIANETI
         for (let i = 0; i < VarPlanetSystem.PlanetsNum; i++) {      //PER OGNI PIANETA ESCLUSA LA STELLA MADRE
            //ARRAY DISTANZE DALLA NAVE SPAZIALE AI PIANETI
            VarPlanetSystem.IndDist[i + 1] = PhysicsEngine.UserPosWorld.distanceTo(VarPlanetSystem.WorldPosPlanets[i]) / 1000;
         };

         //DISTANZA DAL PIANETA PIÙ VICINO E RELATIVO INDICE
         let nearDist = Infinity;
         let nearIndex = -1;
         for (let i = 0; i < VarPlanetSystem.IndDist.length; i++) {
            if (VarPlanetSystem.IndDist[i] < nearDist) {
               nearDist = VarPlanetSystem.IndDist[i];
               nearIndex = i;
            };
         };
         VarPlanetSystem.NearPlanetDist = nearDist;
         VarPlanetSystem.NearPlanetIndex = nearIndex;

         //DIAMETRO DEL PIANETA PIÙ VICINO
         if (VarPlanetSystem.NearPlanetIndex > 0) VarPlanetSystem.NearPlanetDiameter =
            Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].ScaleXZ * 1000;

         /*--------------------POSIZIONE WORLD LUNE RELATIVE, DISTANZA DALLA NAVE SPAZIALE------------------------------------*/
         //SE SIAMO DENTRO UN'ORBITA DI UN PIANETA
         if (VarPlanetSystem.PlanetOrbit > 0) {
            //PRESENZA DI LUNE
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1]) VarPlanetSystem.NumMoons = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular.length;

            //PER IL NUMERO MASSIMO DI LUNE PRESENTI NEL SISTEMA
            for (let a = 0; a < VarPlanetSystem.NumMajorMoons; a++) {
               //INSERIRE IL VALORE PER LE LUNE PRESENTI
               if (VarPlanetSystem.NearPlanetIndex && a < VarPlanetSystem.NumMoons) {
                  VarPlanetSystem.References[VarPlanetSystem.NearPlanetIndex - 1][a].DayRot.getWorldPosition(VarPlanetSystem.WorldPosMoons[a]);
                  VarPlanetSystem.IndMoonDist[a] = PhysicsEngine.UserPosWorld.distanceTo(VarPlanetSystem.WorldPosMoons[a]) / 1000;
               }
               //INSERIRE UN VALORE ALTO PER ESCLUDERE GLI ALTRI VALORI
               else {
                  VarPlanetSystem.IndMoonDist[a] = 10000000;
               }
            };
            //SE CI SONO LUNE
            if (VarPlanetSystem.NumMoons > 0) {
               //DISTANZA DALLA LUNA PIÙ VICINA
               VarPlanetSystem.NearMoonDist = Math.min(...VarPlanetSystem.IndMoonDist);
               //INDICE DELLA LUNA PIÙ VICINA
               VarPlanetSystem.NearMoonIndex = VarPlanetSystem.IndMoonDist.indexOf(VarPlanetSystem.NearMoonDist);
               //TIPO DELLA LUNA PIÙ VICINA
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.NearMoonIndex])
                  VarPlanetSystem.NearMoonType = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.NearMoonIndex].Type;
               //DIAMETRO DELLA LUNA PIÙ VICINA
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.NearMoonIndex])
                  VarPlanetSystem.NearMoonDiameter = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.NearMoonIndex].ScaleXZ * 1000;

               //SE SIAMO DENTRO UN'ORBITA DI UNA LUNA
               if (VarPlanetSystem.MoonOrbit > 0) {
                  //PRESENZA DI SUB-LUNE
                  if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]) VarPlanetSystem.NumSubMoons = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].
                     Modular[VarPlanetSystem.MoonOrbit - 1].Modular.length;

                  //PER IL NUMERO MASSIMO DI SUB-LUNE PRESENTI NEL SISTEMA
                  for (let b = 0; b < VarPlanetSystem.NumMajorSubMoons; b++) {
                     if (b < VarPlanetSystem.NumSubMoons) {
                        VarPlanetSystem.References[VarPlanetSystem.PlanetOrbit - 1][VarPlanetSystem.MoonOrbit - 1][b].DayRot.getWorldPosition(VarPlanetSystem.WorldPosSubMoons[b]);
                        VarPlanetSystem.IndSubMoonDist[b] = PhysicsEngine.UserPosWorld.distanceTo(VarPlanetSystem.WorldPosSubMoons[b]) / 1000;
                     }
                     //INSERIRE UN VALORE ALTO PER ESCLUDERE GLI ALTRI VALORI
                     else {
                        VarPlanetSystem.IndSubMoonDist[b] = 10000000;
                     }
                  };
                  //SE CI SONO SUB-LUNE
                  if (VarPlanetSystem.NumSubMoons > 0) {
                     //DISTANZA DALLA SUB-LUNA PIÙ VICINA
                     VarPlanetSystem.NearSubMoonDist = Math.min(...VarPlanetSystem.IndSubMoonDist);
                     //INDICE DELLA SUB-LUNA PIÙ VICINA
                     VarPlanetSystem.NearSubMoonIndex = VarPlanetSystem.IndSubMoonDist.indexOf(VarPlanetSystem.NearSubMoonDist);
                     //TIPO DELLA SUB-LUNA PIÙ VICINA
                     if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.NearMoonIndex].Modular[VarPlanetSystem.NearSubMoonIndex])
                        VarPlanetSystem.NearSubMoonType = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.NearMoonIndex].Modular[VarPlanetSystem.NearSubMoonIndex].Type;
                  };
               }
               else VarPlanetSystem.NumSubMoons = 0;
            };
         };
         //SE SIAMO FUORI DA UN'ORBITA DI UN PIANETA
         if (VarPlanetSystem.PlanetOrbit == 0) {
            VarPlanetSystem.NumMoons = 0;
         };

         /*---------------------TEMPI DALLA NAVE SPAZIALE ------------------------*/
         //PER TUTTI I PIANETI COMPRESO IL SOLE
         for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
            //TEMPO DI ARRIVO DAL PIANETA PIÙ VICINO COMPRESA DI DIAMETRO
            if (i == VarPlanetSystem.NearPlanetIndex) {
               VarPlanetSystem.TimeDist[i] = (VarPlanetSystem.IndDist[i] * 1000 - VarPlanetSystem.NearPlanetDiameter) / VarPlanetSystem.VelEffettiva;
            }
            //TEMPI DI ARRIVO ALTRI PIANETI (DIAMETRO TRASCURABILE)
            else {
               VarPlanetSystem.TimeDist[i] = (VarPlanetSystem.IndDist[i] * 1000) / VarPlanetSystem.VelEffettiva;
            };
         };

         //PER TUTTE LE LUNE ATTUALI
         for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
            //TEMPI DI ARRIVO LUNE
            VarPlanetSystem.TimeMoonDist[i] =
               (VarPlanetSystem.IndMoonDist[i] * 1000) / VarPlanetSystem.VelEffettiva;
         };

         //PER TUTTE LE SUB-LUNE ATTUALI
         for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {

            //TEMPI DI ARRIVO SUB-LUNE
            VarPlanetSystem.TimeSubMoonDist[i] =
               (VarPlanetSystem.IndSubMoonDist[i] * 1000) / VarPlanetSystem.VelEffettiva;
         };

         /*--------------------DISTANZA RAGGIO TRAENTE PIÙ VICINO (SE ESISTE)-----------------*/
         //SE SIAMO DENTRO UN'ORBITA DI UN PIANETA
         if (VarPlanetSystem.PlanetOrbit > 0) {
            //SE SIAMO DENTRO UN'ORBITA DI UNA LUNA
            if (VarPlanetSystem.MoonOrbit > 0) {
               //SE SIAMO DENTRO UN'ORBITA DI UNA SUB-LUNA
               if (VarPlanetSystem.SubMoonOrbit > 0) {
                  //SE UNA DI QUESTE SUB-LUNE (STAZIONI) HA IL RAGGIO TRAENTE
                  if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                     .Modular[VarPlanetSystem.MoonOrbit - 1]
                     .Modular[VarPlanetSystem.SubMoonOrbit - 1].TractorBeam == true) {
                     //TIPO STAZIONE
                     VarPlanetSystem.StationType = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                        .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Type;

                     if (!TractorSubMoon) {
                        try {
                           TractorSubMoon = PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].children[VarPlanetSystem.MoonOrbit].children[0].children[VarPlanetSystem.SubMoonOrbit].getObjectByName("Tractor");
                        } catch (Error) { };
                     };

                     //DISTANZA DAL PIÙ VICINO RAGGIO TRAENTE
                     VarPlanetSystem.NearTractorDist = VarPlanetSystem.UserPos.distanceTo(TractorSubMoon.position);

                     //SE IL RAGGIO TRAENTE È ATTIVO
                     if (VarPlanetSystem.TractorActive == 1) {
                        //ENTRATA NEL RAGGIO TRAENTE
                        if (VarPlanetSystem.NearTractorDist < Par.PlanetarySystem.TractorBeam.Distance) VarPlanetSystem.NearTractor = 1;
                        //USCITA DAL RAGGIO TRAENTE
                        if (VarPlanetSystem.NearTractorDist > Par.PlanetarySystem.TractorBeam.Distance + Par.PlanetarySystem.TractorBeam.Distance / 10) {
                           VarPlanetSystem.NearTractor = 0;
                           //E SI È STATI RILASCIATI
                           if (VarPlanetSystem.Released == true) {
                              VarPlanetSystem.TractorTime++;
                              if (VarPlanetSystem.TractorTime >= Par.PlanetarySystem.TractorBeam.Time) {
                                 VarPlanetSystem.TractorActive = 0;
                                 VarPlanetSystem.Released = false;
                                 if (Par.PlanetarySystem.Parametri.Log == true) console.log("SUB-MOON RELEASED");
                                 VarPlanetSystem.TractorTime = 0;
                              };
                           };
                        };
                        //SE NON SI È ANCORA ENTRATI DISATTIVALO DOPO UN TEMPO
                        VarPlanetSystem.TractorTime++;
                        if (VarPlanetSystem.TractorTime >= Par.PlanetarySystem.TractorBeam.MaxTime) {
                           VarPlanetSystem.TractorActive = 0;
                           if (Par.PlanetarySystem.Parametri.Log == true) console.log("SUB-MOON DISABLED");
                           VarPlanetSystem.TractorTime = 0;
                        };
                        //SE SI È TROPPO DISTANTI DAL RAGGIO TRAENTE DISATTIVALO
                        if (VarPlanetSystem.NearTractorDist > Par.PlanetarySystem.TractorBeam.RadioDistance) {
                           VarPlanetSystem.TractorActive = 0;
                           if (Par.PlanetarySystem.Parametri.Log == true) console.log("SUB-MOON DISABLED");
                           VarPlanetSystem.TractorTime = 0;
                        };
                     };

                     /*--------ACQUISIZIONE PARAMETRI ROTAZIONE E SPOSTAMENTO NAVE SPAZIALE----------*/
                     //DESTINAZIONE POSIZIONE X NAVE SPAZIALE
                     VarPlanetSystem.TractorPosXShip = TractorSubMoon.position.x + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                        .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.PosXShip;
                     //DESTINAZIONE POSIZIONE Y NAVE SPAZIALE               
                     VarPlanetSystem.TractorPosYShip = TractorSubMoon.position.y + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                        .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.PosYShip;
                     //DESTINAZIONE POSIZIONE Z NAVE SPAZIALE              
                     VarPlanetSystem.TractorPosZShip = TractorSubMoon.position.z + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                        .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.PosZShip;
                     //DESTINAZIONE ROTAZIONE X NAVE SPAZIALE
                     VarPlanetSystem.TractorRotXShip = TractorSubMoon.rotation.x + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.RotXShip;
                     //DESTINAZIONE ROTAZIONE Y NAVE SPAZIALE
                     VarPlanetSystem.TractorRotYShip = TractorSubMoon.rotation.y + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.RotYShip;
                     //DESTINAZIONE ROTAZIONE Z NAVE SPAZIALE
                     VarPlanetSystem.TractorRotZShip = TractorSubMoon.rotation.z + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.RotZShip;
                     //RILASCIO POSIZIONE X NAVE SPAZIALE
                     VarPlanetSystem.TractorPosXShipRelease = TractorSubMoon.position.x + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                        .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.PosXShipRelease;
                     //RILASCIO POSIZIONE Y NAVE SPAZIALE
                     VarPlanetSystem.TractorPosYShipRelease = TractorSubMoon.position.y + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                        .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.PosYShipRelease;
                     //RILASCIO POSIZIONE Z NAVE SPAZIALE
                     VarPlanetSystem.TractorPosZShipRelease = TractorSubMoon.position.z + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                        .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Tractor.PosZShipRelease;

                     //ABILITAZIONE VISIBILITÀ
                     if (VarPlanetSystem.TractorActive == 0) TractorSubMoon.visible = false;
                     if (VarPlanetSystem.TractorActive == 1) TractorSubMoon.visible = true;
                  }
                  else {
                     VarPlanetSystem.NearTractor = 0;
                     TractorSubMoon = null;
                  };
               }
               else {
                  TractorSubMoon = null;
                  //SE UNA DI QUESTE LUNE (STAZIONI) HA IL RAGGIO TRAENTE
                  if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].TractorBeam == true) {
                     //TIPO STAZIONE
                     VarPlanetSystem.StationType = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Type;

                     if (!TractorMoon) {
                        try {
                           TractorMoon = PlanetarySystem.children[VarPlanetSystem.PlanetOrbit].children[0].children[VarPlanetSystem.MoonOrbit].getObjectByName(`Tractor`);
                        } catch (Error) {
                        };
                     };

                     //DISTANZA DAL PIÙ VICINO RAGGIO TRAENTE
                     VarPlanetSystem.NearTractorDist = VarPlanetSystem.UserPos.distanceTo(TractorMoon.position);

                     //SE IL RAGGIO TRAENTE È ATTIVO
                     if (VarPlanetSystem.TractorActive == 1) {
                        //ENTRATA NEL RAGGIO TRAENTE
                        if (VarPlanetSystem.NearTractorDist < Par.PlanetarySystem.TractorBeam.Distance) VarPlanetSystem.NearTractor = 1;
                        //USCITA DAL RAGGIO TRAENTE
                        if (VarPlanetSystem.NearTractorDist > Par.PlanetarySystem.TractorBeam.Distance + Par.PlanetarySystem.TractorBeam.Distance / 10) {
                           VarPlanetSystem.NearTractor = 0;
                           //E SI È STATI RILASCIATI
                           if (VarPlanetSystem.Released == true) {
                              VarPlanetSystem.TractorTime++;
                              if (VarPlanetSystem.TractorTime >= Par.PlanetarySystem.TractorBeam.Time) {
                                 VarPlanetSystem.TractorActive = 0;
                                 VarPlanetSystem.Released = false;
                                 if (Par.PlanetarySystem.Parametri.Log == true) console.log("MOON RELEASED");
                                 VarPlanetSystem.TractorTime = 0;
                              };
                           };
                        };
                        //SE NON SI È ANCORA ENTRATI DISATTIVALO DOPO UN TEMPO
                        VarPlanetSystem.TractorTime++;
                        if (VarPlanetSystem.TractorTime >= Par.PlanetarySystem.TractorBeam.MaxTime) {
                           VarPlanetSystem.TractorActive = 0;
                           if (Par.PlanetarySystem.Parametri.Log == true) console.log("MOON DISABLED");
                           VarPlanetSystem.TractorTime = 0;
                        };
                        //SE SI È TROPPO DISTANTI DAL RAGGIO TRAENTE DISATTIVALO
                        if (VarPlanetSystem.NearTractorDist > Par.PlanetarySystem.TractorBeam.RadioDistance) {
                           VarPlanetSystem.TractorActive = 0;
                           if (Par.PlanetarySystem.Parametri.Log == true) console.log("MOON DISABLED");
                           VarPlanetSystem.TractorTime = 0;
                        };
                     };

                     /*--------ACQUISIZIONE PARAMETRI ROTAZIONE E SPOSTAMENTO NAVE SPAZIALE----------*/
                     //DESTINAZIONE POSIZIONE X NAVE SPAZIALE
                     VarPlanetSystem.TractorPosXShip = TractorMoon.position.x +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.PosXShip;
                     //DESTINAZIONE POSIZIONE Y NAVE SPAZIALE               
                     VarPlanetSystem.TractorPosYShip = TractorMoon.position.y +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.PosYShip;
                     //DESTINAZIONE POSIZIONE Z NAVE SPAZIALE              
                     VarPlanetSystem.TractorPosZShip = TractorMoon.position.z +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.PosZShip;
                     //DESTINAZIONE ROTAZIONE X NAVE SPAZIALE
                     VarPlanetSystem.TractorRotXShip = TractorMoon.rotation.x +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.RotXShip;
                     //DESTINAZIONE ROTAZIONE Y NAVE SPAZIALE
                     VarPlanetSystem.TractorRotYShip = TractorMoon.rotation.y +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.RotYShip;
                     //DESTINAZIONE ROTAZIONE Z NAVE SPAZIALE
                     VarPlanetSystem.TractorRotZShip = TractorMoon.rotation.z +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.RotZShip;
                     //RILASCIO POSIZIONE X NAVE SPAZIALE
                     VarPlanetSystem.TractorPosXShipRelease = TractorMoon.position.x +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.PosXShipRelease;
                     //RILASCIO POSIZIONE Y NAVE SPAZIALE
                     VarPlanetSystem.TractorPosYShipRelease = TractorMoon.position.y +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.PosYShipRelease;
                     //RILASCIO POSIZIONE Z NAVE SPAZIALE
                     VarPlanetSystem.TractorPosZShipRelease = TractorMoon.position.z +
                        Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Tractor.PosZShipRelease;

                     //ABILITAZIONE VISIBILITÀ
                     if (VarPlanetSystem.TractorActive == 0) TractorMoon.visible = false;
                     if (VarPlanetSystem.TractorActive == 1) TractorMoon.visible = true;
                  }
                  else {
                     VarPlanetSystem.NearTractor = 0;
                     TractorMoon = null;
                  };
               };
            }
            else {
               VarPlanetSystem.NearTractor = 0;
               TractorMoon = null;
            };
         }
         else VarPlanetSystem.NearTractor = 0;

         /*------------------------------CALCOLO MINIMI TEMPI DI ARRIVO PER ESEMPIO LA SPIA BRAKE-----------------------------------*/
         VarPlanetSystem.MinTimePlanet = Math.min(...VarPlanetSystem.TimeDist);              //MINIMO TEMPO DI ARRIVO PIANETA
         VarPlanetSystem.MinTimeMoon = Math.min(...VarPlanetSystem.TimeMoonDist);          //MINIMO TEMPO DI ARRIVO LUNA
         VarPlanetSystem.MinTimeSubMoon = Math.min(...VarPlanetSystem.TimeSubMoonDist);       //MINIMO TEMPO DI ARRIVO SUB-LUNA

         /*----------------------------------IMPOSTAZIONE VARIABILI DESTINAZIONE---------------------------------------*/
         //SE SI IMPOSTA LA DESTINAZIONE VERSO UN PIANETA
         if (VarPlanetSystem.DestPlanet > 0) {
            //SE SI È NELL'ORBITA DEL PIANETA DI DESTINAZIONE
            if (VarPlanetSystem.PlanetOrbit == VarPlanetSystem.DestPlanet) {
               //SE SI IMPOSTA LA DESTINAZIONE VERSO UNA LUNA
               if (VarPlanetSystem.DestMoon > 0) {
                  //SE SI È NELL'ORBITA DELLA LUNA DI DESTINAZIONE
                  if (VarPlanetSystem.MoonOrbit == VarPlanetSystem.DestMoon) {
                     //SE SI IMPOSTA LA DESTINAZIONE VERSO UNA SUB-LUNA
                     if (VarPlanetSystem.DestSubMoon > 0) {
                        VarPlanetSystem.DestinationPlanet = false;
                        VarPlanetSystem.DestinationMoon = false;
                        VarPlanetSystem.DestinationSubMoon = true;
                     }
                     //SE NON SI IMPOSTA LA DESTINAZIONE VERSO UNA SUB-LUNA
                     else {
                        VarPlanetSystem.DestinationPlanet = false;
                        VarPlanetSystem.DestinationMoon = true;
                        VarPlanetSystem.DestinationSubMoon = false;
                     };
                  }
                  //SE NON SI È NELL'ORBITA DELLA LUNA DI DESTINAZIONE
                  else {
                     VarPlanetSystem.DestinationPlanet = false;
                     VarPlanetSystem.DestinationMoon = true;
                     VarPlanetSystem.DestinationSubMoon = false;
                  };
               }
               //SE NON SI IMPOSTA LA DESTINAZIONE VERSO UNA LUNA
               else {
                  VarPlanetSystem.DestinationPlanet = true;
                  VarPlanetSystem.DestinationMoon = false;
                  VarPlanetSystem.DestinationSubMoon = false;
               };
            }
            //SE NON SI È NELL'ORBITA DEL PIANETA DI DESTINAZIONE
            else {
               VarPlanetSystem.DestinationPlanet = true;
               VarPlanetSystem.DestinationMoon = false;
               VarPlanetSystem.DestinationSubMoon = false;
            };
         }
         //SE NON SI IMPOSTA NESSUNA DESTINAZIONE
         else {
            VarPlanetSystem.DestinationPlanet = false;
            VarPlanetSystem.DestinationMoon = false;
            VarPlanetSystem.DestinationSubMoon = false;
         };

         /*---------------------------------CALCOLO DEI LIMITI DI VELOCITÀ DA ESPORTARE---------------------------------------*/
         //SPAZIO INTERPLANETARIO - SENZA LIMITE
         if (VarPlanetSystem.PlanetOrbit == 0) {
            VarPlanetSystem.VelLimit = VarPlanetSystem.MaxVel;
         }
         //ORBITA PIANETA O LUNA - LIMITE VelPlanetOrbit
         else if (VarPlanetSystem.StationOrbit == false && VarPlanetSystem.SubStationOrbit == false) {
            //VelLimit = Vmin + (Vmax - Vmin) * Math.pow(d / dMax, γ);
            VarPlanetSystem.VelLimit = (Par.PlanetarySystem.SpeedLimit.VelMin + (Par.PlanetarySystem.SpeedLimit.VelPlanetOrbit - Par.PlanetarySystem.SpeedLimit.VelMin)) * Math.pow(VarPlanetSystem.LimitCollision, 2);
         }
         //ORBITA STAZIONE SPAZIALE - LIMITE VelStationOrbit
         else {
            VarPlanetSystem.VelLimit = Par.PlanetarySystem.SpeedLimit.VelStationOrbit;
         };

         /*---------------------FUNZIONE AGGIORNAMENTO PROMISES DEGLI OGGETTI CREATI DALLA FUNZIONE CreateObj--------------------*/
         //VARIANTE CON LA DISTANZA AL POSTO DEL TEMPO
         let DoubleGravit = 0;
         if (VarPlanetSystem.NearPlanetIndex > 0) DoubleGravit = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].GravOrbit * 2;
         if (VarPlanetSystem.PlanetOrbit === 0 && VarPlanetSystem.NearPlanetDist < DoubleGravit && VarPlanetSystem.LastIndexTrigger !== VarPlanetSystem.NearPlanetIndex) {
            //Stato ATTIVO: posso triggerare
            VarPlanetSystem.NearPlanetUpdate = true;
            VarPlanetSystem.LastIndexTrigger = VarPlanetSystem.NearPlanetIndex;
         }
         else if (VarPlanetSystem.PlanetOrbit !== 0 || VarPlanetSystem.NearPlanetDist >= DoubleGravit) {
            //Stato INATTIVO: reset garantito
            VarPlanetSystem.NearPlanetUpdate = false;
         }
         else {
            //Stato neutro (sotto soglia ma stesso pianeta), IMPORTANTE: reset esplicito
            VarPlanetSystem.NearPlanetUpdate = false;
         };

         UpdatePlanSysPromiseExecution.Update(VarPlanetSystem.NearPlanetUpdate);

         /*-----------------------------------------VISUALIZZAZIONE POSIZIONE ORBITA------------------------------------------*/
         //ORBITA PIANETA
         if (VarPlanetSystem.NearPlanetIndex > 0) {
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1])
               if (VarPlanetSystem.PlanetOrbit > 0) VarPlanetSystem.PlanetOrbitPosition = VarPlanetSystem.NearPlanetDist / Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].GravOrbit;
               else VarPlanetSystem.PlanetOrbitPosition = 1;

            //ORBITA LUNA
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex]) {
               if (VarPlanetSystem.MoonOrbit > 0) VarPlanetSystem.MoonOrbitPosition = VarPlanetSystem.NearMoonDist / Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex].GravOrbit;
               else VarPlanetSystem.MoonOrbitPosition = 1;

               //ORBITA SUB-LUNA
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex].Modular[VarPlanetSystem.NearSubMoonIndex]) {
                  if (VarPlanetSystem.SubMoonOrbit > 0) VarPlanetSystem.SubMoonOrbitPosition = VarPlanetSystem.NearSubMoonDist / Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex].Modular[VarPlanetSystem.NearSubMoonIndex].GravOrbit;
                  else VarPlanetSystem.SubMoonOrbitPosition = 1;
               };
            };
         };

         /*-----------------------------------------------DYNAMIC ORBIT---------------------------------------------------------*/
         if (Loaded == true) await DynamicOrbit();
      };
   }, 100);

   /*CICLO VELOCE RITARDATO (100MS) (3000MS)*/
   /*DYNAMIC ORBIT*/
   setTimeout(() => {
      setInterval(async () => {
         await DynamicOrbit();
      }, 100);
   }, 10000);

   /*CICLO VELOCE RITARDATO (100MS) (4000MS)*/
   //COLLISIONI E ATTRITO CON IL PIANETA
   setTimeout(() => {
      setInterval(() => {
         /*---------------------------------------------COLLISIONI---------------------------------------------------*/
         //ORBITA DEL SOLE
         if (VarPlanetSystem.PlanetOrbit == 0) {
            //LIMITE DI VELOCITÀ
            if ((VarPlanetSystem.IndDist[0] - Oggetti.PlanetarySystem.Sun.ScaleXZ) < Par.PlanetarySystem.Parametri.LimitDist * Oggetti.PlanetarySystem.Sun.ScaleXZ)
               VarPlanetSystem.LimitCollision = (VarPlanetSystem.IndDist[0] - Oggetti.PlanetarySystem.Sun.ScaleXZ) / (Par.PlanetarySystem.Parametri.LimitDist * Oggetti.PlanetarySystem.Sun.ScaleXZ);
            else VarPlanetSystem.LimitCollision = 1;

            //ATTRITO CON ATMOSFERA
            if ((VarPlanetSystem.IndDist[0] - Oggetti.PlanetarySystem.Sun.ScaleXZ) < Par.PlanetarySystem.Parametri.SunCollisionDist * Oggetti.PlanetarySystem.Sun.ScaleXZ) VarPlanetSystem.NearCollision = true;
            else VarPlanetSystem.NearCollision = false;
            //COLLISIONE
            if ((VarPlanetSystem.IndDist[0] - Oggetti.PlanetarySystem.Sun.ScaleXZ) <= 0) {
               VarPlanetSystem.Collision = true;
            }
            else VarPlanetSystem.Collision = false;
         };
         //ORBITA DI UN PIANETA
         if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit == 0 && VarPlanetSystem.SubMoonOrbit == 0) {
            //LIMITE DI VELOCITÀ
            if ((VarPlanetSystem.NearPlanetDist - VarPlanetSystem.NearPlanetDiameter / 1000) < Par.PlanetarySystem.Parametri.LimitDist * (VarPlanetSystem.NearPlanetDiameter / 1000))
               VarPlanetSystem.LimitCollision = (VarPlanetSystem.NearPlanetDist - VarPlanetSystem.NearPlanetDiameter / 1000) / (Par.PlanetarySystem.Parametri.LimitDist * (VarPlanetSystem.NearPlanetDiameter / 1000));
            else VarPlanetSystem.LimitCollision = 1;
            //ATTRITO CON ATMOSFERA
            if ((VarPlanetSystem.NearPlanetDist - VarPlanetSystem.NearPlanetDiameter / 1000) < Par.PlanetarySystem.Parametri.CollisionDist * (VarPlanetSystem.NearPlanetDiameter / 1000)) {
               VarPlanetSystem.NearCollision = true;
            }
            else VarPlanetSystem.NearCollision = false;
            //COLLISIONE
            if ((VarPlanetSystem.NearPlanetDist - VarPlanetSystem.NearPlanetDiameter / 1000) <= 0) {
               VarPlanetSystem.Collision = true;
            }
            else VarPlanetSystem.Collision = false;
         }
         //ORBITA DI UNA LUNA (SE NON È UNA STAZIONE SPAZIALE)
         else if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0 && VarPlanetSystem.SubMoonOrbit == 0 &&
            Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Type == 0) {
            //LIMITE DI VELOCITÀ
            if ((VarPlanetSystem.NearMoonDist - VarPlanetSystem.NearMoonDiameter / 1000) < Par.PlanetarySystem.Parametri.LimitDist * (VarPlanetSystem.NearMoonDiameter / 1000))
               VarPlanetSystem.LimitCollision = (VarPlanetSystem.NearMoonDist - VarPlanetSystem.NearMoonDiameter / 1000) / (Par.PlanetarySystem.Parametri.LimitDist * (VarPlanetSystem.NearMoonDiameter / 1000));
            else VarPlanetSystem.LimitCollision = 1;
            //ATTRITO CON ATMOSFERA
            if ((VarPlanetSystem.NearMoonDist - VarPlanetSystem.NearMoonDiameter / 1000) < Par.PlanetarySystem.Parametri.CollisionDist * (VarPlanetSystem.NearMoonDiameter / 1000)) {
               VarPlanetSystem.NearCollision = true;
            }
            else VarPlanetSystem.NearCollision = false;
            //COLLISIONE
            if ((VarPlanetSystem.NearMoonDist - VarPlanetSystem.NearMoonDiameter / 1000) <= 0) {
               VarPlanetSystem.Collision = true;
            }
            else VarPlanetSystem.Collision = false;
         };
      }, 100);
   }, 4000);

   Scene.add(Planetary);
   return Planetary;
};
//#endregion

/*--------------------DYNAMIC PLANET MAP------------------------*/
//#region
let PlanetMap;

//FUNZIONE ESPORTATA CHE DISEGNA LINEE DALLA POSIZIONE UTENTE AI PIANETI SELEZIONATI
function E1_DestinationsLines(Object) {
   //PIÙ DI UNA LINEA ACCETTA UN ARRAY DI PIANETI
   if (Object.NumLines > 1) for (let i = 0; i < Object.NumLines; i++) {
      const PosWorld = WorldPos(PlanetMap.children[0].children[Object.MissionPlanet[i] + 1].children[0]);
      const Line1 = E3_GenericLine({
         Color: 0x0000ff,
         StartLine: {
            x: 0,
            y: 0,
            z: 0
         },
         EndLine: {
            x: PosWorld.x,
            y: PosWorld.y,
            z: PosWorld.z
         },
      });
   }
   //UNA LINEA ACCETA UN SINGOLO PIANETA
   else {
      const PosWorld = WorldPos(PlanetMap.children[0].children[Object.MissionPlanet + 1].children[0]);
      const Line1 = E3_GenericLine({
         Color: 0x0000ff,
         StartLine: {
            x: 0,
            y: 0,
            z: 0
         },
         EndLine: {
            x: PosWorld.x,
            y: PosWorld.y,
            z: PosWorld.z
         },
      });
   };
};

//CONO CON WIREFRAME DI COLORE DIVERSO
function E1_ConeWireframed(Raggio, Altezza, Segmenti, ColorBase, ColorWire) {
   const UserGroup = new THREE.Group();

   const UserGeom = new THREE.ConeGeometry(Raggio, Altezza, Segmenti);
   UserGeom.rotateX(Math.PI / 2);
   UserGeom.rotateY(Math.PI);

   const UserMat1 = new THREE.MeshBasicMaterial({ color: ColorBase });
   const UserMat2 = new THREE.MeshBasicMaterial({ color: ColorWire, wireframe: true });
   const UserMesh1 = new THREE.Mesh(UserGeom, UserMat1);
   const UserMesh2 = new THREE.Mesh(UserGeom, UserMat2);

   UserGroup.add(UserMesh1);
   UserGroup.add(UserMesh2);
   Scene.add(UserGroup);

   return UserGroup;
};

function E1_CreateOrbit(Thick, Color, Raggio, Shaded) {
   /*
   const OrbitMesh = E1_CreateOrbit(
      Par.DynamicPlanetMap.Orbite.PlanetOrbitThick * Par.DynamicPlanetMap.Zoom[a].OrbitThick,
      Par.DynamicPlanetMap.Orbite.PlanetOrbitColor,
      Oggetti.PlanetarySystem.Modular[i].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000,
      true);
   */
   const segments = 64;
   const geometry = E3_GeoRing(Raggio - Thick, Raggio + Thick, segments, 1, 0, Math.PI * 2);

   const colorStart = new THREE.Color(Color);
   const colorEnd = new THREE.Color(0x000000);
   const colors = [];
   const position = geometry.attributes.position;
   const count = position.count / 2; //Metà sono interni, metà esterni
   const k = 10; //Regola la velocità della sfumatura (prova tra 3 e 10)

   for (let i = 0; i < count; i++) {
      const t = 1 - Math.exp(-k * i / (segments - 1));
      const r = (1 - t) * colorStart.r + t * colorEnd.r;
      const g = (1 - t) * colorStart.g + t * colorEnd.g;
      const b = (1 - t) * colorStart.b + t * colorEnd.b;
      colors.push(r, g, b); //Vertice interno
      colors.push(r, g, b); //Vertice esterno
   };

   const material = new THREE.MeshBasicMaterial({
      //vertexColors: true,
      side: THREE.DoubleSide,
      //blending: THREE.NoBlending,
      transparent: false
   });

   if (Shaded == true) {
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      material.vertexColors = true;
      material.blending = THREE.NoBlending;
   };
   if (Shaded == false) material.color = new THREE.Color(Color);

   const mesh = new THREE.Mesh(geometry, material);
   mesh.rotation.set(Math.PI / 2, 0, Math.PI / 2);

   return mesh;
};

async function E1_GenerateSunMap(ParObj, PlanetGeom1) {
   /*-------------------------------------GRUPPI--------------------------------------*/
   //GRUPPO OBJECT CHE CONTIENE LE MESH
   const ObjectGroup = new THREE.Group();
   ObjectGroup.name = `${ParObj.Name} Object`;

   /*-------------------------------------OGGETTI 3D--------------------------------------*/
   const PlanetMaterial = await E3_MaterialeBase({
      RepeatX: 1,
      RepeatY: 1,
      Side: "Front",          //"Front", "Double", "Back"
      Color: 0xffffff,
      Transparent: false,
      Opacity: 1,
      DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
      //MAPPA COLORE
      Map: true,
      MapTexture: `${ParObj.TextureDirectory}${ParObj.Texture}Map${ParObj.TypeImage}`,
      AlphaMap: false,
      AlphaMapTexture: ``,
      AlphaMapRotation: 0
   });
   const PlanetMesh = new THREE.Mesh(PlanetGeom1, PlanetMaterial);
   PlanetMesh.name = `${ParObj.Name} Mesh`;

   ObjectGroup.add(PlanetMesh);

   return ObjectGroup;
};

async function E1_GeneratePlanetMap(ParObj, PlanetGeom1, RingGeom1) {
   /*-------------------------------------GRUPPI--------------------------------------*/
   //GRUPPO OBJECT CHE CONTIENE LE MESH
   const ObjectGroup = new THREE.Group();
   ObjectGroup.name = `${ParObj.Name} Object`;

   /*-------------------------------------OGGETTI 3D--------------------------------------*/
   const PlanetMaterial = await E3_MaterialeOpaco({
      RepeatX: 1,
      RepeatY: 1,
      FlatShading: false,
      Side: "Front",          //"Front", "Double"
      Color: 0xffffff,
      Transparent: false,
      Opacity: 1,
      DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
      Emissive: 0xffffff,
      EmissiveIntensity: 0,
      //MAPPA COLORE
      Map: true,
      MapLod: false,
      MapTexture: `${ParObj.TextureDirectory}${ParObj.Texture}Map${ParObj.TypeImage}`,
      //MAPPA NORMALE
      NormalMap: false,
      NormalMapTexture: ``,
      //MAPPA SPESSORE
      DisplacementMap: false,
      DisplacementMapTexture: ``,
      Displacement: 0,
      //MAPPA EMISSIVA
      EmissiveMap: false,
      EmissiveMapTexture: ``,
   });
   const PlanetMesh = new THREE.Mesh(PlanetGeom1, PlanetMaterial);
   PlanetMesh.name = `${ParObj.Name} Mesh`;
   PlanetMesh.rotation.x = ParObj.AxialRot;     		//INCLINAZIONE ASSIALE

   //ANELLI
   if (ParObj.RingTexture != "") {
      //LOD MESH 1
      const RingMaterial1 = await E3_MaterialeOpaco({
         RepeatX: 1,
         RepeatY: 1,
         FlatShading: false,
         Side: "Double",          //"Front", "Double"
         Color: 0xffffff,
         Transparent: true,
         Opacity: 1,
         DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
         Emissive: 0x000000,
         EmissiveIntensity: 0,
         //MAPPA COLORE
         Map: true,
         MapTexture: `${ParObj.TextureDirectory}${ParObj.RingTexture}Map${ParObj.TypeRingImage}`,
         //MAPPA NORMALE
         NormalMap: false,
         NormalMapTexture: ``,
         //MAPPA SPESSORE
         DisplacementMap: false,
         DisplacementMapTexture: ``,
         Displacement: 0,
         //MAPPA EMISSIVA
         EmissiveMap: false,
         EmissiveMapTexture: ``,
      });
      E3_GenMesh(PlanetMesh, RingGeom1, RingMaterial1, [0, 0, 0], [Math.PI / 2, 0, 0], [1, 1, 1], `${ParObj.Name}Ring`, true, false);
   };

   ObjectGroup.add(PlanetMesh);

   return ObjectGroup;
};

async function E1_GenerateMoonMap(ParObj, MoonGeom1, RingGeom1) {
   /*-------------------------------------OGGETTI 3D--------------------------------------*/
   const MoonMaterial = await E3_MaterialeOpaco({
      RepeatX: 1,
      RepeatY: 1,
      FlatShading: false,
      Side: "Front",          //"Front", "Double"
      Color: 0xffffff,
      Transparent: false,
      Opacity: 1,
      DepthWrite: true,        //Scrive il materiale nella profondità della scena rispettando l'ordine di visualizzazione
      Emissive: 0xffffff,
      EmissiveIntensity: 0,
      //MAPPA COLORE
      Map: true,
      MapLod: false,
      MapTexture: `${ParObj.TextureDirectory}${ParObj.Texture}Map${ParObj.TypeImage}`,
      //MAPPA NORMALE
      NormalMap: false,
      NormalMapTexture: ``,
      //MAPPA SPESSORE
      DisplacementMap: false,
      DisplacementMapTexture: ``,
      Displacement: 0,
      //MAPPA EMISSIVA
      EmissiveMap: false,
      EmissiveMapTexture: ``,
   });
   const MoonMesh = new THREE.Mesh(MoonGeom1, MoonMaterial);
   MoonMesh.name = `${ParObj.Name} Mesh`;
   MoonMesh.rotation.x = ParObj.AxialRot;     		//INCLINAZIONE ASSIALE

   //ANELLI
   if (ParObj.RingTexture != "") {
      //LOD MESH 1
      const RingMaterial1 = await E3_MaterialeOpaco({
         RepeatX: 1,
         RepeatY: 1,
         FlatShading: false,
         Side: "Double",          //"Front", "Double"
         Color: 0xffffff,
         Transparent: true,
         Opacity: 1,
         Emissive: 0x000000,
         EmissiveIntensity: 0,
         //MAPPA COLORE
         Map: true,
         MapTexture: `${ParObj.TextureDirectory}${ParObj.RingTexture}Map${ParObj.TypeRingImage}`,
         //MAPPA NORMALE
         NormalMap: false,
         NormalMapTexture: ``,
         //MAPPA SPESSORE
         DisplacementMap: false,
         DisplacementMapTexture: ``,
         Displacement: 0,
         //MAPPA EMISSIVA
         EmissiveMap: false,
         EmissiveMapTexture: ``,
      });
      E3_GenMesh(MoonMesh, RingGeom1, RingMaterial1, [0, 0, 0], [0, 0, 0], [1, 1, 1], `${ParObj.Name}Ring`, true, false);

   };

   return MoonMesh;
};

async function E0_DynamicPlanetMap() {
   const MapGroup = new THREE.Group();
   MapGroup.name = "DynamicPlanetMap";

   function Scritte(Text, PosX, PosY, PosZ, Scale, TextColor) {
      const Canvas = document.createElement('canvas');
      Canvas.width = 200;     //400
      Canvas.height = 200;

      const Image = Canvas.getContext('2d');
      Image.font = '20px Serif';    //50
      Image.fillStyle = TextColor;
      Image.fillText(Text, 0, 100);

      const TextureCanvas = new THREE.Texture(Canvas);
      const Scritta = new THREE.Sprite(new THREE.SpriteMaterial({
         map: TextureCanvas,
         transparent: true,
         sizeAttenuation: false,
         depthWrite: false
      }));

      Scritta.position.set(PosX, PosY, PosZ);
      Scritta.scale.set(Scale, Scale);
      TextureCanvas.needsUpdate = true;

      return Scritta;

   };
   function Scritte2(Text, Scale, TextColor) {
      const Canvas = document.createElement('canvas');
      Canvas.width = 200;
      Canvas.height = 200;

      const Image = Canvas.getContext('2d');

      Image.font = '20px Serif';
      Image.fillStyle = TextColor;

      Image.textAlign = 'center';
      Image.textBaseline = 'middle';

      Image.fillText(Text, Canvas.width / 2, Canvas.height / 2);

      const TextureCanvas = new THREE.Texture(Canvas);
      TextureCanvas.needsUpdate = true;

      const Scritta = new THREE.Sprite(
         new THREE.SpriteMaterial({
            map: TextureCanvas,
            transparent: true,
            sizeAttenuation: false,
            depthWrite: false
         })
      );

      Scritta.scale.set(Scale, Scale);

      return Scritta;
   };


   //CREAZIONE GRUPPI SISTEMA PLANETARIO
   const PlanSystem = new THREE.Group();
   PlanSystem.name = `PlanetarySystem`;

   /*--------------------------------------GEOMETRIE GENERICHE-------------------------------------------*/
   const PlanetGeom1 = E3_GeoSphere(1000, 32, 25, 0, Math.PI * 2, 0, Math.PI);
   const RingGeom1 = E3_GeoRing(0, 1000, 32, 2, 0, Math.PI * 2);

   /*-------------------------------------AGGIUNTA STELLA MADRE------------------------------------------*/
   const SunMesh = await E1_GenerateSunMap({
      Name: Oggetti.PlanetarySystem.Sun.Name[Language],
      TextureDirectory: Oggetti.PlanetarySystem.TextureDirectory,
      TypeImage: Oggetti.PlanetarySystem.TypeImage,
      Texture: Oggetti.PlanetarySystem.Sun.Texture,
   }, PlanetGeom1);

   PlanSystem.add(SunMesh);

   //------------------------------------AGGIUNTA PIANETI E LUNE------------------------------------------//
   for (let i = 0; i < Oggetti.PlanetarySystem.Modular.length; i++) {
      //CREAZIONE GRUPPO PIANETA
      const Planet = new THREE.Group();
      Planet.name = Oggetti.PlanetarySystem.Modular[i].Name[Language];
      let PlanetMesh;

      if (Oggetti.PlanetarySystem.Modular[i].Type == 0)
         PlanetMesh = await E1_GeneratePlanetMap({
            Name: Oggetti.PlanetarySystem.Modular[i].Name[Language],             //Name
            TextureDirectory: Oggetti.PlanetarySystem.TextureDirectory,
            TypeImage: Oggetti.PlanetarySystem.TypeImage,
            TypeRingImage: Oggetti.PlanetarySystem.TypeRingImage,
            Texture: Oggetti.PlanetarySystem.Modular[i].Texture,                 //Texture
            AxialRot: Oggetti.PlanetarySystem.Modular[i].AxialRot,               //AxialRot
            RingTexture: Oggetti.PlanetarySystem.Modular[i].RingTexture,         //RingTexture
            RingAxialRot: Oggetti.PlanetarySystem.Modular[i].RingAxialRot,       //RingAxialRot
            NightTexture: Oggetti.PlanetarySystem.Modular[i].NightTexture,       //NightTexture
            CloudTexture: Oggetti.PlanetarySystem.Modular[i].CloudTexture,       //CloudTexture
         }, PlanetGeom1, RingGeom1);

      Planet.add(PlanetMesh);

      //INCLINAZIONE ORBITALE
      Planet.rotation.x = Oggetti.PlanetarySystem.Modular[i].RotX;

      //POSIZIONAMENTO NELLA SUA ORBITA INTORNO AL SOLE
      Planet.children[0].position.set(0, 0, Oggetti.PlanetarySystem.Modular[i].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000);

      //SCALA E SCHIACCIAMENTO AI POLI (MESH)
      let ScaleXZ = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Modular[i].ScaleXZ * Par.DynamicPlanetMap.Zoom[0].PlanetScale;
      PlanSystem.add(Planet);

      //SCALA ANELLI
      if (Oggetti.PlanetarySystem.Modular[i].RingTexture != "") {     //PRESENZA DI ANELLI
         let RingScale = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Modular[i].RingScale * Par.DynamicPlanetMap.Zoom[0].PlanetScale / ScaleXZ;
         Planet.children[0].children[0].children[0].scale.set(RingScale, RingScale, RingScale);
      };

      //CREAZIONE SCRITTA
      const ScrittaMesh = Scritte(
         Oggetti.PlanetarySystem.Modular[i].Name[Language],                                           //Text
         0,                                                                                           //PosX
         Par.DynamicPlanetMap.Zoom[0].TextHeight + ScaleXZ * 1000,                                    //PosY
         Oggetti.PlanetarySystem.Modular[i].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000,  //PosZ
         Par.DynamicPlanetMap.Zoom[0].TextScale,                                                      //Scale
         Par.DynamicPlanetMap.Orbite.PlanetTextColor                                                        //Color
      );
      ScrittaMesh.name = `${Oggetti.PlanetarySystem.Modular[i].Name[Language]} ScrittaMesh`;
      Planet.add(ScrittaMesh);

      //CREAZIONE ORBITE
      for (let a = 0; a < Par.DynamicPlanetMap.Zoom.length; a++) {
         const OrbitMesh = E1_CreateOrbit(
            Par.DynamicPlanetMap.Orbite.PlanetOrbitThick * Par.DynamicPlanetMap.Zoom[a].OrbitThick,
            Par.DynamicPlanetMap.Orbite.PlanetOrbitColor,
            Oggetti.PlanetarySystem.Modular[i].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000,
            true);
         OrbitMesh.name = `${Oggetti.PlanetarySystem.Modular[i].Name[Language]} OrbitMesh${a}`;
         Planet.add(OrbitMesh);
      };

      let NumStations = 0;       //NUMERO DI STAZIONI SPAZIALI IN ORBITA ATTORNO AL PIANETA

      //PRESENZA DI LUNE
      for (let a = 0; a < Oggetti.PlanetarySystem.Modular[i].Modular.length; a++) {
         //SE LA LUNA NON È UNA STAZIONE SPAZIALE INSERISCILA
         if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Type == 0) {
            let MoonMesh;
            const Moon = new THREE.Group();
            Moon.name = Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language];

            MoonMesh = await E1_GenerateMoonMap({
               Name: Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language],           //Name
               TextureDirectory: Oggetti.PlanetarySystem.TextureDirectory,
               TypeImage: Oggetti.PlanetarySystem.TypeImage,
               TypeRingImage: Oggetti.PlanetarySystem.TypeRingImage,
               Texture: Oggetti.PlanetarySystem.Modular[i].Modular[a].Texture,               //Texture
               AxialRot: Oggetti.PlanetarySystem.Modular[i].Modular[a].AxialRot,             //AxialRot
               RingTexture: Oggetti.PlanetarySystem.Modular[i].Modular[a].RingTexture,       //RingTexture
               RingAxialRot: Oggetti.PlanetarySystem.Modular[i].Modular[a].RingAxialRot,     //RingAxialRot
            }, PlanetGeom1, RingGeom1);
            //POSIZIONAMENTO NELLA SUA ORBITA INTORNO AL PIANETA
            MoonMesh.position.set(0, ScaleXZ * 1000 + Par.DynamicPlanetMap.Zoom[0].MoonsHeight,
               Oggetti.PlanetarySystem.Modular[i].Modular[a].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000 * Par.DynamicPlanetMap.Zoom[0].MoonOrbitScale);

            Moon.add(MoonMesh);

            //SCALA E SCHIACCIAMENTO AI POLI
            let MoonScaleXZ = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Modular[i].Modular[a].ScaleXZ * Par.DynamicPlanetMap.Zoom[0].MoonScale;
            PlanSystem.children[i + 1].children[0].add(Moon);

            //CREAZIONE ORBITA
            const MoonOrbitMesh = E1_CreateOrbit(
               Par.DynamicPlanetMap.Orbite.MoonOrbitThick * Par.DynamicPlanetMap.Zoom[0].OrbitThick,
               Par.DynamicPlanetMap.Orbite.MoonOrbitColor,
               Oggetti.PlanetarySystem.Modular[i].Modular[a].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000 * Par.DynamicPlanetMap.Zoom[0].MoonOrbitScale,
               true);
            MoonOrbitMesh.position.set(0, ScaleXZ * 1000 + Par.DynamicPlanetMap.Zoom[0].MoonsHeight, 0);
            MoonOrbitMesh.name = `${Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language]} MoonOrbitMesh`;
            Moon.add(MoonOrbitMesh);

            //CREAZIONE SCRITTA
            const ScrittaMoonMesh = Scritte2(
               Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language],             //Text
               Par.DynamicPlanetMap.Zoom[0].TextScale,
               Par.DynamicPlanetMap.Orbite.MoonTextColor);
            ScrittaMoonMesh.name = `${Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language]} ScrittaMoonMesh`;
            ScrittaMoonMesh.position.set(0, ScaleXZ * 1000 + Par.DynamicPlanetMap.Zoom[0].MoonsHeight + Par.DynamicPlanetMap.Zoom[0].TextHeight,
               Oggetti.PlanetarySystem.Modular[i].Modular[a].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000 * Par.DynamicPlanetMap.Zoom[0].MoonOrbitScale);
            Moon.add(ScrittaMoonMesh);

            let NumSubStations = 0;       //NUMERO DI STAZIONI SPAZIALI IN ORBITA ATTORNO ALLA LUNA

            //SUB-LUNE (STAZIONI SPAZIALI IN ORBITA ATTORNO ALLE LUNE)
            let SubMoonsNum = Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular.length;
            for (let b = 0; b < SubMoonsNum; b++) {
               //SE LA LUNA È UNA STAZIONE SPAZIALE CREA UNO SPRITE SE ABILITATO
               if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Type > 0) {
                  //MATERIALE SPRITE
                  const SubSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                     depthWrite: false,
                     sizeAttenuation: false,
                  }));
                  //TIPO DI STAZIONE
                  for (let x = 0; x < Par.DynamicPlanetMap.Type.length; x++) {
                     SubSprite.material.map = Loader.load(Par.DynamicPlanetMap.Type[Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Type - 1]);
                  };
                  SubSprite.name = `${Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Name[Language]} SubStationMesh`;
                  SubSprite.scale.setScalar(Par.DynamicPlanetMap.Zoom[0].SpriteScale);
                  //DISTANZA VERTICALE SPRITE
                  let MoonDistanza = NumSubStations * Par.DynamicPlanetMap.Zoom[0].SpriteScale * Par.DynamicPlanetMap.Zoom[0].SpriteDist + Par.DynamicPlanetMap.Zoom[0].SpriteHeight + MoonScaleXZ * 1000;
                  SubSprite.position.set(0,
                     ScaleXZ * 1000 + Par.DynamicPlanetMap.Zoom[0].MoonsHeight + MoonDistanza,
                     Oggetti.PlanetarySystem.Modular[i].Modular[a].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000 * Par.DynamicPlanetMap.Zoom[0].MoonOrbitScale);
                  //SubSprite.position.set(0, MoonDistanza, 0);
                  Moon.add(SubSprite);
                  NumSubStations++;
               };
            };
         };
         //SE LA LUNA È UNA STAZIONE SPAZIALE CREA UNO SPRITE SE ABILITATO
         if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Type > 0) {
            //MATERIALE SPRITE
            const Sprite = new THREE.Sprite(new THREE.SpriteMaterial({
               depthWrite: false,
               sizeAttenuation: false,
            }));
            //TIPO DI STAZIONE
            for (let x = 0; x < Par.DynamicPlanetMap.Type.length; x++) {
               Sprite.material.map = Loader.load(Par.DynamicPlanetMap.Type[Oggetti.PlanetarySystem.Modular[i].Modular[a].Type - 1]);
            };
            Sprite.name = `${Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language]} StationMesh`;
            Sprite.scale.setScalar(Par.DynamicPlanetMap.Zoom[0].SpriteScale);

            //DISTANZA VERTICALE SPRITE
            let Distanza = NumStations * Par.DynamicPlanetMap.Zoom[0].SpriteScale * Par.DynamicPlanetMap.Zoom[0].SpriteDist + Par.DynamicPlanetMap.Zoom[0].SpriteHeight + ScaleXZ * 1000;
            Sprite.position.set(0, Distanza, 0);
            Planet.children[0].add(Sprite);
            NumStations++;
         };
      };
   };

   MapGroup.add(PlanSystem);

   //----------------------------------ROTAZIONE-------------------------------------//
   for (let i = 0; i < Oggetti.PlanetarySystem.Modular.length; i++) {
      //ROTAZIONE PIANETI ATTORNO AL SOLE (ROTAZIONE ORBIT)
      PlanSystem.children[i + 1].rotation.y = VarPlanetMap.RandomRotPlanet[i] + VarPlanetMap.OrbitPosition * (Par.DynamicPlanetMap.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].OrbitRot);

      //PRESENZA DI LUNE
      for (let a = 0; a < Oggetti.PlanetarySystem.Modular[i].Modular.length; a++) {
         if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Type == 0) {
            //ROTAZIONE LUNE ATTORNO AL PIANETA (ROTAZIONE ORBIT)
            PlanSystem.children[i + 1].children[0].children[a + 1].rotation.y = VarPlanetMap.OrbitPosition * (Par.DynamicPlanetMap.Parametri.ScalaRot / Oggetti.PlanetarySystem.Modular[i].Modular[a].OrbitRot);
         };
      };
   };

   //CREAZONE SPRITE DESTINAZIONE
   const SpriteDest = new THREE.Sprite(new THREE.SpriteMaterial({ depthWrite: false, sizeAttenuation: false }));
   SpriteDest.material.map = Loader.load(Par.DynamicPlanetMap.DestSprite);
   SpriteDest.scale.setScalar(Par.DynamicPlanetMap.SpriteScale);
   SpriteDest.position.set(0, 0, 0);
   SpriteDest.name = "SpriteDest";
   MapGroup.add(SpriteDest);

   //ZOOM DINAMICO
   setInterval(() => {
      //PER TUTTI I PIANETI COMPRESO IL SOLE
      for (let i = 0; i < MicEnginereturn.DynamicPlanetMap.children[0].children.length; i++) {
         //SOLE
         if (i == 0) {
            //SCALA SOLE MESH
            let SunScaleXZ = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Sun.ScaleXZ * Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].SunScale;
            let SunScaleY = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Sun.ScaleY * Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].SunScale;
            MapGroup.children[0].children[0].children[0].scale.set(SunScaleXZ, SunScaleY, SunScaleXZ);
         }
         //TUTTI GLI ALTRI PIANETI
         else {
            //LUNE NON VISIBILI
            if (Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].Moons == false) {
               //PER OGNI FIGLIO DI PLANET OBJECT CHE COMPRENDE MESH, RINGMESH, LUNE E SPRITE STAZIONI
               for (let a = 0; a < MapGroup.children[0].children[i].children[0].children.length; a++) {
                  //NASCONDI SOLO LE LUNE E LE STAZIONI
                  if (a > 0 && MapGroup.children[0].children[i].children[0].children[a].visible == true) MapGroup.children[0].children[i].children[0].children[a].visible = false;
               };
            }
            //LUNE VISIBILI
            else {
               //PER OGNI FIGLIO DI PLANET OBJECT CHE COMPRENDE MESH, RINGMESH, LUNE E SPRITE STAZIONI
               for (let a = 0; a < MapGroup.children[0].children[i].children[0].children.length; a++) {
                  //NASCONDI SOLO LE LUNE E LE STAZIONI
                  if (a > 0 && MapGroup.children[0].children[i].children[0].children[a].visible == false) MapGroup.children[0].children[i].children[0].children[a].visible = true;
               };
               //SCALA LUNE
               for (let a = 0; a < Oggetti.PlanetarySystem.Modular[i - 1].Modular.length; a++) {
                  //SOLO LE LUNE PIANETA (NON LE STAZIONI SPAZIALI)
                  if (Oggetti.PlanetarySystem.Modular[i - 1].Modular[a].Type == 0) {
                     let ScaleXZ = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Modular[i - 1].Modular[a].ScaleXZ * Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].MoonScale;
                     let ScaleY = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Modular[i - 1].Modular[a].ScaleY * Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].MoonScale;
                     MapGroup.children[0].children[i].children[0].children[a + 1].children[0].scale.set(ScaleXZ, ScaleY, ScaleXZ);
                  };
               };
            };
            //SCALA PIANETI
            let ScaleXZ = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Modular[i - 1].ScaleXZ * Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].PlanetScale;
            let ScaleY = Par.DynamicPlanetMap.Parametri.Scala * Oggetti.PlanetarySystem.Modular[i - 1].ScaleY * Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].PlanetScale;
            MapGroup.children[0].children[i].children[0].children[0].scale.set(ScaleXZ, ScaleY, ScaleXZ);
            //VISUALIZZAZIONE ORBITA
            for (let a = 0; a < Par.DynamicPlanetMap.Zoom.length; a++) {
               if (a == VarPlanetMap.LevelZoom) MapGroup.children[0].children[i].children[a + 2].visible = true;
               else MapGroup.children[0].children[i].children[a + 2].visible = false;
            };
         };

      };

      //CORREZIONE POSIZIONE Y
      MapGroup.children[0].position.y = Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].PosY;
      MapGroup.children[1].position.y = Par.DynamicPlanetMap.Zoom[VarPlanetMap.LevelZoom].PosY;
   }, 100);

   return MapGroup;
};

//#endregion

/*--------------------BACKGROUND SPAZIO------------------------*/
//#region
function E0_Skybox2(Directory, Log) {
   if (Log == true) console.log("E0_Skybox");
   const CubeLoader = new THREE.CubeTextureLoader(Manager);
   CubeLoader.setPath(Directory);
   const textureCube = CubeLoader.load([
      'right.png', 'left.png',
      'top.png', 'bottom.png',
      'front.png', 'back.png'
   ]);
   Scene.background = textureCube;

   const pmremGenerator = new THREE.PMREMGenerator(renderer);
   pmremGenerator.compileCubemapShader();
   //const envMap = pmremGenerator.fromCubemap(textureCube).texture;

   textureCube.dispose();

   //return envMap;
};
//#endregion

/*--------------------VIRTUALPAD-------------------------------*/
//#region
function NipplePad2(Object, Log) {
   if (Log == true) console.log("NipplePad2");
   const PadZone = document.createElement('div');
   PadZone.style.position = "absolute";
   PadZone.style.width = Object.Width;
   PadZone.style.height = Object.Height;
   if (Object.TopFlag == "Top") PadZone.style.top = Object.Top;
   if (Object.TopFlag == "Bottom") PadZone.style.bottom = Object.Bottom;
   if (Object.RightFlag == "Right") PadZone.style.right = Object.Right;
   if (Object.RightFlag == "Left") PadZone.style.left = Object.Left;

   document.body.appendChild(PadZone);

   var Pad = nipplejs.create({
      zone: PadZone,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: Object.Color,
      size: Object.Size,
      shape: Object.Shape,
      lockX: Object.LockY,
      lockY: Object.LockX,
      multitouch: false,
      restOpacity: 1,

   });

   const VarPad = {
      GamePadMove: false,
      ValX: 0,
      ValY: 0,
      Destroy: function () {
         Pad.destroy();
      },
   };

   //ANGOLATURA NAVE SPAZIALE
   Pad.on("move", function (event) {
      VarPad.GamePadMove = true;
      VarPad.ValX = event.target.nipples[0].frontPosition.x * Object.Coeff;       //DESTRA -100 - SINISTRA +100
      VarPad.ValY = -event.target.nipples[0].frontPosition.y * Object.Coeff;      //BASSO -100 - ALTO +100
   });

   Pad.on("end", function () {
      VarPad.GamePadMove = false;
   });

   setInterval(() => {
      if (VarPad.GamePadMove == false) {
         if (VarPad.ValX > 0) {
            if (VarPad.ValX > Object.Rest) VarPad.ValX -= Object.Rest;
            else VarPad.ValX = 0;
         };
         if (VarPad.ValX < 0) {
            if (VarPad.ValX < -Object.Rest) VarPad.ValX += Object.Rest;
            else VarPad.ValX = 0;
         };
         if (VarPad.ValY > 0) {
            if (VarPad.ValY > Object.Rest) VarPad.ValY -= Object.Rest;
            else VarPad.ValY = 0;
         };
         if (VarPad.ValY < 0) {
            if (VarPad.ValY < -Object.Rest) VarPad.ValY += Object.Rest;
            else VarPad.ValY = 0;
         };
      };

   }, 100);

   return VarPad;
};
//#endregion

/*--------------------HYPERLOOP-------------------------------*/
//#region
function Hyperloop(Object) {

   if (Par.Log.Moduli == true) console.log("Hyperloop");

   const dir = new THREE.Vector3();
   const points = [];
   const divergeDirs = [];
   const desiredWorldQuat = new THREE.Quaternion();
   const parentWorldQuatInv = new THREE.Quaternion();
   const lineSpeeds = [];

   //===============================
   //INIZIALIZZAZIONE PUNTI
   //===============================

   for (let i = 0; i < Object.Number; i++) {
      lineSpeeds[i] = Object.SpeedMin + Math.random() * (Object.SpeedMax - Object.SpeedMin);
      let p;

      if (Object.Mode === "REENTRY") {
         p = new THREE.Vector3(
            (Math.random() - 0.5) * Object.ReentrySize,
            (Math.random() - 0.5) * Object.ReentrySize,
            (Math.random() - 0.5) * Object.ReentrySize
         );
      } else {
         p = new THREE.Vector3(
            (Math.random() - 0.5) * Object.Size,
            (Math.random() - 0.5) * Object.Size,
            (Math.random() - 0.5) * Object.Size
         );
      };

      points.push(p);

      //direzione di divergenza (XY)
      const d = new THREE.Vector3(p.x, p.y, 0);

      if (d.lengthSq() === 0) {
         d.set(Math.random() - 0.5, Math.random() - 0.5, 0);
      };

      d.normalize();

      const rand = 1 + (Math.random() - 0.5) * (Object.DivergenceRandom || 0);
      d.multiplyScalar((Object.Divergence || 0) * rand);

      divergeDirs.push(d);
   };

   const positions = new Float32Array(Object.Number * 6);
   const geometry = new THREE.BufferGeometry();
   geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

   const material = new THREE.LineBasicMaterial({ color: Object.Color });
   if (Object.Opacity < 1) {
      material.transparent = true;
      material.opacity = Object.Opacity;
   };
   const Lines = new THREE.LineSegments(geometry, material);
   Scene.add(Lines);

   function Update(Obj, delta) {

      dir.set(0, 0, 1);
      dir.applyQuaternion(Obj.Quaternion).normalize();

      const move = (Obj.Speed - Object.MinSpeed) * Object.Speed * delta;
      const LineLenght = Object.Long * (Obj.Speed - Object.MinSpeed) * Object.Speed;

      for (let i = 0; i < Object.Number; i++) {

         const idx = i * 6;
         const start = points[i];


         if (Object.Mode === "REENTRY") {
            start.addScaledVector(dir, move * lineSpeeds[i]);
         }
         else {
            start.addScaledVector(dir, move);
         };

         const relativeZ = start.dot(dir);
         if (relativeZ > Object.Size / 2) {
            start.addScaledVector(dir, -Object.Size);
         }

         positions[idx] = start.x;
         positions[idx + 1] = start.y;
         positions[idx + 2] = start.z;

         positions[idx + 3] = start.x + (dir.x + divergeDirs[i].x) * LineLenght;
         positions[idx + 4] = start.y + (dir.y + divergeDirs[i].y) * LineLenght;
         positions[idx + 5] = start.z + dir.z * LineLenght;
      };

      geometry.attributes.position.needsUpdate = true;

      Obj.Parent.getWorldQuaternion(parentWorldQuatInv);
      parentWorldQuatInv.invert();

      Lines.quaternion.copy(parentWorldQuatInv.multiply(desiredWorldQuat));
   };

   return { Lines, Update };
};
//#endregion

/*--------------------EDITOR------------------------------------*/
//#region
let ImportedObject = new THREE.Group();
ImportedObject.name = "ImportedObject";
let EditorRotated = [];

//SISTEMA PLANETARIO
async function E2_Generate(Val, Detail) {
   //RESETTA L'ARRAY
   EditorRotated.splice(0, EditorRotated.length);

   /*--------------------------------------GEOMETRIE GENERICHE-------------------------------------------*/
   //DETAIL 0-50, 1-75, 2-100
   let RadSeg = [];
   let HeightSeg = [];
   if (Detail == 0) {
      RadSeg[0] = 50;
      HeightSeg[0] = 25;
   };
   if (Detail == 1) {
      RadSeg[0] = 75;
      HeightSeg[0] = 37;
   };
   if (Detail == 2) {
      RadSeg[0] = 100;
      HeightSeg[0] = 50;
   };
   //LOD PIANETI 1 - DETTAGLI ALTI
   const PlanetGeom1 = E3_GeoSphere(1000, RadSeg[0], HeightSeg[0], 0, Math.PI * 2, 0, Math.PI);
   const RingGeom1 = E3_GeoRing(0, 1000, RadSeg[0], 2, 0, Math.PI * 2);

   //RESETTA L'OGGETTO IMPORTATO
   ImportedObject.clear();

   //CREAZIONE GRUPPO PIANETA
   if (Oggetti.PlanetarySystem.Modular[Val].Type == 0) ImportedObject.add(await E2_GeneratePlanet("PlanetMesh", PlanetGeom1, RingGeom1));

   //SCALA SFERA GLOW
   ImportedObject.children[0].children[0].scale.setScalar(Oggetti.PlanetarySystem.Modular[Val].GlowScale);

   //CAMBIO TEXTURE
   await E2_ChangeTexturePlanet({
      Mesh: ImportedObject.children[0],               //MESH DEL PIANETA DA MODIFICARE
      Directory: Oggetti.PlanetarySystem.TextureDirectory,
      TypeImage: Oggetti.PlanetarySystem.TypeImage,
      Texture: Oggetti.PlanetarySystem.Modular[Val].Texture,
      GlowColor: Oggetti.PlanetarySystem.Modular[Val].GlowColor,
      GlowInt: Oggetti.PlanetarySystem.Modular[Val].GlowInt,
      NightTexture: Oggetti.PlanetarySystem.Modular[Val].NightTexture,
      CloudTexture: Oggetti.PlanetarySystem.Modular[Val].CloudTexture,
      TypeRingImage: Oggetti.PlanetarySystem.TypeRingImage,
      RingTexture: Oggetti.PlanetarySystem.Modular[Val].RingTexture,
      RingScale: Oggetti.PlanetarySystem.Modular[Val].RingScale / Oggetti.PlanetarySystem.Modular[Val].ScaleXZ
   });

   //SCALA E SCHIACCIAMENTO AI POLI (MESH) - TUTTI I PIANETI SONO GRANDI UGUALI
   let ScaleXZ = (Oggetti.PlanetarySystem.Modular[Val].ScaleXZ / Oggetti.PlanetarySystem.Modular[Val].ScaleXZ) * Par.Editor.PlanetarySystem.Scale;
   let ScaleY = (Oggetti.PlanetarySystem.Modular[Val].ScaleY / Oggetti.PlanetarySystem.Modular[Val].ScaleXZ) * Par.Editor.PlanetarySystem.Scale;
   //ORBITGROUP - PLANETGROUP - MESHGROUP - MESH PIANETA
   ImportedObject.scale.set(ScaleXZ, ScaleY, ScaleXZ);

   //CORREZIONE CAMERA
   Camera.position.x = Oggetti.PlanetarySystem.EditorCamera.x;
   Camera.position.y = Oggetti.PlanetarySystem.EditorCamera.y;
   Camera.position.z = Oggetti.PlanetarySystem.EditorCamera.z;

   Scene.add(ImportedObject);
};
async function E2_GenerateSub(Val0, Val1, Detail) {
   //RIFERIMENTI OGGETTI ANNIDATI
   const Oggetto = Oggetti.PlanetarySystem.Modular[Val0].Modular[Val1];

   //RESETTA L'ARRAY
   EditorRotated.splice(0, EditorRotated.length);

   /*--------------------------------------GEOMETRIE GENERICHE-------------------------------------------*/
   //DETAIL 0-50, 1-75, 2-100
   let RadSeg = [];
   let HeightSeg = [];
   if (Detail == 0) {
      RadSeg[0] = 50;
      HeightSeg[0] = 25;
   };
   if (Detail == 1) {
      RadSeg[0] = 75;
      HeightSeg[0] = 37;
   };
   if (Detail == 2) {
      RadSeg[0] = 100;
      HeightSeg[0] = 50;
   };
   //LOD PIANETI 1 - DETTAGLI ALTI
   const PlanetGeom1 = E3_GeoSphere(1000, RadSeg[0], HeightSeg[0], 0, Math.PI * 2, 0, Math.PI);
   const RingGeom1 = E3_GeoRing(0, 1000, RadSeg[0], 2, 0, Math.PI * 2);

   //RESETTA L'OGGETTO IMPORTATO
   ImportedObject.clear();

   //PIANETA
   if (Oggetto.Type == 0) {
      //CREAZIONE GRUPPO PIANETA
      ImportedObject.add(await E2_GeneratePlanet("PlanetMesh", PlanetGeom1, RingGeom1));

      //SCALA SFERA GLOW
      ImportedObject.children[0].children[0].scale.setScalar(Oggetto.GlowScale);

      //CAMBIO TEXTURE
      await E2_ChangeTexturePlanet({
         Mesh: ImportedObject.children[0],               //MESH DEL PIANETA DA MODIFICARE
         Directory: Oggetti.PlanetarySystem.TextureDirectory,
         TypeImage: Oggetti.PlanetarySystem.TypeImage,
         Texture: Oggetto.Texture,
         GlowColor: Oggetto.GlowColor,
         GlowInt: Oggetto.GlowInt,
         NightTexture: Oggetto.NightTexture,
         CloudTexture: Oggetto.CloudTexture,
         TypeRingImage: Oggetti.PlanetarySystem.TypeRingImage,
         RingTexture: Oggetto.RingTexture,
         RingScale: Oggetto.RingScale / Oggetto.ScaleXZ
      });

      //SCALA E SCHIACCIAMENTO AI POLI (MESH) - TUTTI I PIANETI SONO GRANDI UGUALI
      let MoonScaleXZ = (Oggetto.ScaleXZ / Oggetto.ScaleXZ)
         * Par.Editor.PlanetarySystem.Scale;
      let MoonScaleY = (Oggetto.ScaleY / Oggetto.ScaleXZ)
         * Par.Editor.PlanetarySystem.Scale;

      //ORBITGROUP - PLANETGROUP - MESHGROUP - MESH PIANETA
      ImportedObject.scale.set(MoonScaleXZ, MoonScaleY, MoonScaleXZ);
   };

   //STAZIONE SPAZIALE
   if (Oggetto.Type > 0) {
      ImportedObject.copy(Oggetti3D.PlanetarySystem.Model[Oggetto.Model]);

      //SCALA E SCHIACCIAMENTO AI POLI (MESH) - TUTTI I PIANETI SONO GRANDI UGUALI
      let MoonScaleXZ = (Oggetto.ScaleXZ / Oggetto.ScaleXZ)
         * Par.Editor.PlanetarySystem.Scale;
      let MoonScaleY = (Oggetto.ScaleY / Oggetto.ScaleXZ)
         * Par.Editor.PlanetarySystem.Scale;

      //ORBITGROUP - PLANETGROUP - MESHGROUP - MESH PIANETA
      ImportedObject.scale.set(MoonScaleXZ, MoonScaleY, MoonScaleXZ);

      //GENERA LA MESH CON LA GEOMETRIA INDICIZZATA
      if (Oggetto.UniversalGeom == true) {//ARRAYGEOM
         const Materials = [];
         //CREAZIONE ARRAY DI MATERIALI
         for (let i = 0; i < Geometrie[Oggetto.GeomModel].Multi.length; i++) {
            //SE IL MATERIALE È UN NUMERO
            Materials[i] = MaterialArray[Geometrie[Oggetto.GeomModel].Multi[i].Material];

            //RICOLORA I MATERIALI CON COLORE VARIABILE
            if (Materiali[Geometrie[Oggetto.GeomModel].Multi[i].Material].VariableColor == "@Material1")
               Materials[i].color.setHex(Oggetto.Color1);
            if (Materiali[Geometrie[Oggetto.GeomModel].Multi[i].Material].VariableColor == "@Material2")
               Materials[i].color.setHex(Oggetto.Color2);
         };
         //CREAZIONE MESH
         const mesh = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Varianti[Oggetto.Variante].Indice], Materials);
         mesh.name = "MultiUniversalGeom";
         ImportedObject.children.unshift(mesh);
         mesh.parent = ImportedObject;
      };
      //GENERA LA MESH CON LE GEOMETRIE RICICLATE
      if (Geometrie[Oggetto.GeomModel].Recycled)
         for (let i = 0; i < Geometrie[Oggetto.GeomModel].Recycled.length; i++) {      //PER OGNI OGGETTO RICICLATO
            const Materials = [];
            //CREAZIONE ARRAY DI MATERIALI
            for (let a = 0; a < Geometrie[Oggetto.GeomModel].Recycled[i].length - 1; a++) {//PER OGNI SINGOLO MATERIALE E GEOMETRIA
               Materials[a] = MaterialArray[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material];
               if (Materiali[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material].VariableColor == "@Material1")
                  Materials[a].color.setHex(Oggetto.Color1);
               if (Materiali[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material].VariableColor == "@Material2")
                  Materials[a].color.setHex(Oggetto.Color2);
            };
            //CREAZIONE MESH
            console.log(Materials);
            const mesh = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Recycled[i][0].Indice], Materials);
            mesh.name = "RecycledUniversalGeom";
            ImportedObject.children.unshift(mesh);
            mesh.parent = ImportedObject;
         };

      //CAMBIO COLORE STAZIONI SPAZIALI
      //#region
      //CERCA I MODELLI 3D DI COLORE NELLA STAZIONE SPAZIALE E METTILI NELL'ARRAY
      const ColorArray = [];
      ImportedObject.getObjectsByProperty('name', `@Material1`, ColorArray);

      //SE LA STAZIONE SPAZIALE NON È DEL COLORE GIUSTO RICOLORALA
      if (ColorArray.length > 0)
         if (ColorArray[0].material.color.getHexString() != Oggetto.Color1) {
            for (let i = 0; i < ColorArray.length; i++) {
               ColorArray[i].material.color.setHex(Oggetto.Color1);
            };
         };

      //CERCA I MODELLI 3D DI COLORE NELLA STAZIONE SPAZIALE E METTILI NELL'ARRAY
      const ColorArray2 = [];
      ImportedObject.getObjectsByProperty('name', `@Material2`, ColorArray2);

      //SE LA STAZIONE SPAZIALE NON È DEL COLORE GIUSTO RICOLORALA
      if (ColorArray2.length > 0)
         if (ColorArray2[0].material.color.getHexString() != Oggetto.Color2) {
            for (let i = 0; i < ColorArray2.length; i++) {
               ColorArray2[i].material.color.setHex(Oggetto.Color2);
            };
         };
      //#endregion
   };

   //CORREZIONE CAMERA
   Camera.position.x = Oggetti.PlanetarySystem.EditorCamera.x;
   Camera.position.y = Oggetti.PlanetarySystem.EditorCamera.y;
   Camera.position.z = Oggetti.PlanetarySystem.EditorCamera.z;

   Scene.add(ImportedObject);
};
async function E2_GenerateSubSub(Val0, Val1, Val2) {
   //RIFERIMENTI OGGETTI ANNIDATI
   const Oggetto = Oggetti.PlanetarySystem.Modular[Val0].Modular[Val1].Modular[Val2];

   //RESETTA L'ARRAY
   EditorRotated.splice(0, EditorRotated.length);

   ImportedObject.clear();
   ImportedObject.copy(Oggetti3D.PlanetarySystem.Model[Oggetto.Model]);
   //SCALA E SCHIACCIAMENTO AI POLI (MESH)
   let MoonScaleXZ = (Oggetto.ScaleXZ / Oggetto.ScaleXZ) * Par.Editor.PlanetarySystem.Scale;
   let MoonScaleY = (Oggetto.ScaleY / Oggetto.ScaleXZ) * Par.Editor.PlanetarySystem.Scale;
   ImportedObject.scale.set(MoonScaleXZ, MoonScaleY, MoonScaleXZ);

   //GENERA LA MESH CON LA GEOMETRIA INDICIZZATA
   if (Oggetto.UniversalGeom == true) {//ARRAYGEOM
      const Materials = [];
      //CREAZIONE ARRAY DI MATERIALI
      for (let i = 0; i < Geometrie[Oggetto.GeomModel].Multi.length; i++) {
         //Materials.push(MaterialArray[Geometrie[Oggetto.GeomModel].Multi[i].Material]);
         Materials[i] = MaterialArray[Geometrie[Oggetto.GeomModel].Multi[i].Material];
         if (Materiali[Geometrie[Oggetto.GeomModel].Multi[i].Material].VariableColor == "@Material1")
            Materials[i].color.setHex(Oggetto.Color1);
         if (Materiali[Geometrie[Oggetto.GeomModel].Multi[i].Material].VariableColor == "@Material2")
            Materials[i].color.setHex(Oggetto.Color2);
      };
      //CREAZIONE MESH
      const mesh = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Varianti[Oggetto.Variante].Indice], Materials);
      mesh.name = "MultiUniversalGeom";
      ImportedObject.children.unshift(mesh);
      mesh.parent = ImportedObject;
   };
   //GENERA LA MESH CON LE GEOMETRIE RICICLATE
   if (Geometrie[Oggetto.GeomModel].Recycled)
      for (let i = 0; i < Geometrie[Oggetto.GeomModel].Recycled.length; i++) {      //PER OGNI OGGETTO RICICLATO
         const Materials = [];
         //CREAZIONE ARRAY DI MATERIALI
         for (let a = 0; a < Geometrie[Oggetto.GeomModel].Recycled[i].length - 1; a++) {//PER OGNI SINGOLO MATERIALE E GEOMETRIA
            Materials[a] = MaterialArray[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material];
            if (Materiali[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material].VariableColor == "@Material1")
               Materials[a].color.setHex(Oggetto.Color1);
            if (Materiali[Geometrie[Oggetto.GeomModel].Recycled[i][a + 1].Material].VariableColor == "@Material2")
               Materials[a].color.setHex(Oggetto.Color2);
         };
         //CREAZIONE MESH
         console.log(Materials);
         const mesh = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Recycled[i][0].Indice], Materials);
         mesh.name = "RecycledUniversalGeom";
         ImportedObject.children.unshift(mesh);
         mesh.parent = ImportedObject;
      };

   //CAMBIO COLORE STAZIONI SPAZIALI
   //#region
   //CERCA I MODELLI 3D DI COLORE NELLA STAZIONE SPAZIALE E METTILI NELL'ARRAY
   const ColorArray = [];
   ImportedObject.getObjectsByProperty('name', `@Material1`, ColorArray);

   //SE LA STAZIONE SPAZIALE NON È DEL COLORE GIUSTO RICOLORALA
   if (ColorArray.length > 0)
      if (ColorArray[0].material.color.getHexString() != Oggetto.Color1) {
         for (let i = 0; i < ColorArray.length; i++) {
            ColorArray[i].material.color.setHex(Oggetto.Color1);
         };
      };

   //CERCA I MODELLI 3D DI COLORE NELLA STAZIONE SPAZIALE E METTILI NELL'ARRAY
   const ColorArray2 = [];
   ImportedObject.getObjectsByProperty('name', `@Material2`, ColorArray2);

   //SE LA STAZIONE SPAZIALE NON È DEL COLORE GIUSTO RICOLORALA
   if (ColorArray2.length > 0)
      if (ColorArray2[0].material.color.getHexString() != Oggetto.Color2) {
         for (let i = 0; i < ColorArray2.length; i++) {
            ColorArray2[i].material.color.setHex(Oggetto.Color2);
         };
      };
   //#endregion

   //CORREZIONE CAMERA
   Camera.position.x = Oggetti.PlanetarySystem.EditorCamera.x;
   Camera.position.y = Oggetti.PlanetarySystem.EditorCamera.y;
   Camera.position.z = Oggetti.PlanetarySystem.EditorCamera.z;

   Scene.add(ImportedObject);
};
//MODULAR SPACESHIP
function E2_GenerateModule(Num) {
   let Oggetto = Oggetti.Spaceship.Modular[Num];
   //RESETTA L'ARRAY
   Scene.remove(ImportedObject);
   EditorRotated.splice(0, EditorRotated.length);
   ImportedObject.clear();

   if (!Oggetto.UniversalGeom || Oggetto.UniversalGeom == false) {
      ImportedObject = new THREE.Group();
      ImportedObject.copy(Oggetti3D.Spaceship.Model[Num]);
   };
   if (Oggetto.UniversalGeom == true) {
      const Materials = [];
      //CREAZIONE ARRAY DI MATERIALI
      for (let i = 0; i < Geometrie[Oggetto.GeomModel].Multi.length; i++) {
         Materials[i] = MaterialArray[Geometrie[Oggetto.GeomModel].Multi[i].Material];
      };
      //CREAZIONE MESH
      ImportedObject = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Varianti[Oggetto.Variante].Indice], Materials);
      ImportedObject.name = "MultiUniversalGeom";
   };

   ImportedObject.position.set(0, 0, 0);
   ImportedObject.scale.set(Par.Editor.ModularShip.Scale, Par.Editor.ModularShip.Scale, Par.Editor.ModularShip.Scale);
   Scene.add(ImportedObject);

   //CORREZIONE CAMERA
   Camera.position.x = Oggetti.Spaceship.EditorCameraModule.x;
   Camera.position.y = Oggetti.Spaceship.EditorCameraModule.y;
   Camera.position.z = Oggetti.Spaceship.EditorCameraModule.z;
};
function E2_GenerateNewSpaceship(Moduli, Array) {
   let PositionZ = -(Moduli / 2) * Oggetti.Spaceship.ModuleZ * 0.5 * Par.Editor.ModularShip.Scale;
   //RESETTA L'ARRAY
   EditorRotated = [];
   //RESETTA L'OGGETTO IMPORTATO
   Scene.remove(ImportedObject);
   ImportedObject.clear();
   ImportedObject = new THREE.Group();

   for (let i = 0; i < Moduli; i++) {
      let Oggetto = Oggetti.Spaceship.Modular[Array[i]];
      let Object;

      if (Oggetto.UniversalGeom == null || Oggetto.UniversalGeom == false) {
         Object = new THREE.Group();
         Object.copy(Oggetti3D.Spaceship.Model[Array[i]]);
      };
      if (Oggetto.UniversalGeom == true) {
         const Materials = [];
         //CREAZIONE ARRAY DI MATERIALI
         for (let a = 0; a < Geometrie[Oggetto.GeomModel].Multi.length; a++) {
            Materials[a] = MaterialArray[Geometrie[Oggetto.GeomModel].Multi[a].Material];
         };
         //CREAZIONE MESH
         Object = new THREE.Mesh(UniversalGeom[Geometrie[Oggetto.GeomModel].Varianti[Oggetto.Variante].Indice], Materials);
         Object.name = "MultiUniversalGeom";
      };

      Object.position.set(0, 0, PositionZ + i * Oggetti.Spaceship.ModuleZ);

      //OGGETTO ROTANTE
      if (Oggetti.Spaceship.Modular[Array[i]].Rot == true) {
         //MEMORIZZA NELL'ARRAY IL NUMERO DEL MODULO DA RUOTARE E COME RUOTARLO
         const Oggetto = {
            Modulo: i,
            RotX: Oggetti.Spaceship.Modular[Array[i]].RotX,
            RotY: Oggetti.Spaceship.Modular[Array[i]].RotY,
            RotZ: Oggetti.Spaceship.Modular[Array[i]].RotZ
         };
         EditorRotated.push(Oggetto);
      };
      ImportedObject.add(Object);
      ImportedObject.scale.set(Par.Editor.ModularShip.Scale, Par.Editor.ModularShip.Scale, Par.Editor.ModularShip.Scale);
   };
   Scene.add(ImportedObject);

   //CORREZIONE CAMERA
   Camera.position.x = Oggetti.Spaceship.EditorCamera.x;
   Camera.position.y = Oggetti.Spaceship.EditorCamera.y;
   Camera.position.z = Oggetti.Spaceship.EditorCamera.z;
};
//OGGETTI GENERICI
function E2_GenerateGeneric(Num) {
   //RESETTA L'ARRAY
   EditorRotated.splice(0, EditorRotated.length);
   ImportedObject.clear();
   Scene.remove(ImportedObject);

   ImportedObject = E3_GenObjectFromGeneric({
      Num: Num,
      PosX: 0,
      PosY: 0,
      PosZ: 0,
      Scale: Oggetti.Generic.Modular[Num].EditorScale
   });

   //PER OGNI FIGLIO DELL'OGGETTO CARICATO
   for (let i = 0; i < Oggetti3D.Generic.Model[Num].children.length; i++) {
      if (Oggetti3D.Generic.Model[Num].children[i].isPoints == true)
         Oggetti3D.Generic.Model[Num].children[i].material.size *= Oggetti.Generic.Modular[Num].EditorScale;
   };
   Scene.add(ImportedObject);

   //CORREZIONE CAMERA
   Camera.position.x = Oggetti.Generic.Modular[Num].EditorCamera.x;
   Camera.position.y = Oggetti.Generic.Modular[Num].EditorCamera.y;
   Camera.position.z = Oggetti.Generic.Modular[Num].EditorCamera.z;
};
//FUNZIONE EDITOR
async function E0_Editor() {
   /*-----------------------------------BACKGROUND-----------------------------------------*/
   if (Par.Moduli.Skybox == false) Scene.background = new THREE.Color(Par.Editor.BackgroundColor);

   /*------------------------------------CAMERA--------------------------------------------*/
   Camera.updateProjectionMatrix();

   /*-------------------------------------UMANO--------------------------------------------*/
   if (Par.Editor.Human.Enable == true) {
      var GltfLoader = new GLTFLoader();
      GltfLoader.load('../Engine/Models/human.glb', function (gltf) {
         for (let i = 0; i < 1; i++) {
            const model = new THREE.Object3D();
            model.copy(gltf.scene);
            model.children[0].children[0].children[0].children[0].children[0].material.color = new THREE.Color(0xff0000);
            model.rotation.set(0, Math.PI, 0);
            model.scale.set(0.01, 0.01, 0.01);
            model.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);

            //Scene.add(model);
         };
         const model = new THREE.Object3D();
         model.copy(gltf.scene);
         model.rotation.set(0, Math.PI, 0);
         model.scale.set(0.01, 0.01, 0.01);
         model.position.set(Par.Editor.Human.PosX, Par.Editor.Human.PosY, Par.Editor.Human.PosZ);

         Scene.add(model);
      });
   };

   /*--------------------------------------------------------------GUI-----------------------------------------------------------*/
   const gui = new GUI({ width: 300 });
   //CARTELLA PRINCIPALE - TITOLO
   gui.title('Oggetti');
   //SETTINGS
   const settings = {
   };
   gui.close();

   //--------------------------------------------------------CARTELLA ENGINE------------------------------------------------------//
   const EngineFolder = gui.addFolder("Engine");
   EngineFolder.close();

   //---------------------------CARTELLA GEOMETRIE--------------------------------//
   const GeometryFolder = EngineFolder.addFolder("Engine - Geometry");
   GeometryFolder.close();

   //E3_GenerateFilamentCloud
   //#region
   settings[`E3_GenerateFilamentCloud_Param`] = {
      shape: "cube",
      count: 5000,               //Numero totale di punti
      spaceSize: 10,             //Dimensione complessiva dello spazio
      numFilaments: 10,          //Numero di filamenti principali
      filamentLength: 30,        //Lunghezza media dei filamenti
      filamentSegments: 10,      //Numero di segmenti per ogni filamento
      filamentRadius: 10,        //Raggio attorno al filamento dove i punti si distribuiscono
      filamentDensity: 0.9       //Percentuale di punti che finiscono sui filamenti (0-1)
   };

   settings[`E3_GenerateFilamentCloud`] = function () {
      const geometry = E3_GenerateFilamentCloud({
         shape: settings.E3_GenerateFilamentCloud_Param.shape,
         count: settings.E3_GenerateFilamentCloud_Param.count,
         spaceSize: settings.E3_GenerateFilamentCloud_Param.spaceSize,
         numFilaments: settings.E3_GenerateFilamentCloud_Param.numFilaments,
         filamentLength: settings.E3_GenerateFilamentCloud_Param.filamentLength,
         filamentSegments: settings.E3_GenerateFilamentCloud_Param.filamentSegments,
         filamentRadius: settings.E3_GenerateFilamentCloud_Param.filamentRadius,
         filamentDensity: settings.E3_GenerateFilamentCloud_Param.filamentDensity
      });
      const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
      const points = new THREE.Points(geometry, material);
      ImportedObject.clear();
      ImportedObject.add(points);
      ImportedObject.position.set(0, 0, 0);
      ImportedObject.scale.set(1, 1, 1);
      Scene.add(ImportedObject);
      //CORREZIONE CAMERA
      Camera.position.x = 0;
      Camera.position.y = 0;
      Camera.position.z = 20;
   };

   GeometryFolder.add(settings, `E3_GenerateFilamentCloud`);
   GeometryFolder.add(settings.E3_GenerateFilamentCloud_Param, "shape", ["cube", "sphere"]).name("shape");
   GeometryFolder.add(settings.E3_GenerateFilamentCloud_Param, "count", 1000, 20000).step(100).name("count");
   GeometryFolder.add(settings.E3_GenerateFilamentCloud_Param, "spaceSize", 10, 100).step(10).name("spaceSize");
   GeometryFolder.add(settings.E3_GenerateFilamentCloud_Param, "numFilaments", 1, 100).step(1).name("numFilaments");
   GeometryFolder.add(settings.E3_GenerateFilamentCloud_Param, "filamentLength", 1, 50).step(1).name("filamentLength");
   GeometryFolder.add(settings.E3_GenerateFilamentCloud_Param, "filamentSegments", 1, 100).step(1).name("filamentSegments");
   GeometryFolder.add(settings.E3_GenerateFilamentCloud_Param, "filamentRadius", 1, 20).step(1).name("filamentRadius");
   GeometryFolder.add(settings.E3_GenerateFilamentCloud_Param, "filamentDensity", 0, 1).step(0.1).name("filamentDensity");
   //#endregion

   //---------------------------CARTELLA MATERIALI---------------------------------//
   const MaterialFolder = EngineFolder.addFolder("Engine - Material");
   MaterialFolder.close();

   //----------------------------------GENERAZIONE CARTELLE IN BASE ALL'OGGETTO "OGGETTI"-----------------------------------------//
   //#region
   for (let i = 0; i < Object.keys(Oggetti).length; i++) {
      //CARTELLA PRINCIPALE
      const Folder0 = gui.addFolder(Object.keys(Oggetti)[i]);
      Folder0.close();

      //SPACESHIP COMPLETA CUSTOM
      if (Object.keys(Oggetti)[i] == "Spaceship") {
         const Folder1 = Folder0.addFolder("Complete Spaceship");
         settings[`Generate Complete Spaceship`] = function () {
            E2_GenerateNewSpaceship(Par.Editor.ModularShip.Moduli, Par.Editor.ModularShip.ModuleArray);
         };
         Folder1.add(settings, `Generate Complete Spaceship`);
         Folder1.close();
      };

      for (let a = 0; a < Object.values(Oggetti)[i].Modular.length; a++) {
         //DYNAMIC PLANETARY SYSTEM
         if (Object.keys(Oggetti)[i] == "PlanetarySystem") {
            //FUNZIONE GENERAZIONE PIANETA
            settings[`Generate ${Object.values(Oggetti)[i].Modular[a].Name[Language]}`] = async function () {
               await E2_Generate(a, Par.Editor.GraphicDetail);
            };
            //GENERAZIONE CARTELLE IN BASE ALL'OGGETTO "OGGETTI"
            const Folder1 = Folder0.addFolder(Object.values(Oggetti)[i].Modular[a].Name[Language]);
            Folder1.add(settings, `Generate ${Object.values(Oggetti)[i].Modular[a].Name[Language]}`);
            Folder1.close();

            //GENERAZIONE CARTELLE LUNE
            for (let b = 0; b < Object.values(Oggetti)[i].Modular[a].Modular.length; b++) {
               const Folder2 = Folder1.addFolder(Object.values(Oggetti)[i].Modular[a].Modular[b].Name[Language]);
               //GENERAZIONE FUNZIONE PIANETI
               if (Object.values(Oggetti)[i].Modular[a].Modular[b].Type == 0) {
                  settings[`Generate ${Object.values(Oggetti)[i].Modular[a].Modular[b].Name[Language]}`] = async function () {
                     await E2_GenerateSub(a, b, Par.Editor.GraphicDetail);
                  };
                  //GENERAZIONE SOTTOCARTELLE IN BASE ALL'OGGETTO "OGGETTI"
                  Folder2.add(settings, `Generate ${Object.values(Oggetti)[i].Modular[a].Modular[b].Name[Language]}`);
                  Folder2.close();
               };
               //GENERAZIONE FUNZIONE STAZIONI SPAZIALI
               if (Object.values(Oggetti)[i].Modular[a].Modular[b].Type > 0) {
                  settings[`Generate ${Object.values(Oggetti)[i].Modular[a].Modular[b].Name[Language]}`] = async function () {
                     await E2_GenerateSub(a, b, Par.Editor.GraphicDetail);
                  };
                  //GENERAZIONE SOTTOCARTELLE IN BASE ALL'OGGETTO "OGGETTI"
                  Folder2.add(settings, `Generate ${Object.values(Oggetti)[i].Modular[a].Modular[b].Name[Language]}`);
                  Folder2.close();
               };

               //GENERAZIONE CARTELLE SUB-LUNE
               for (let c = 0; c < Object.values(Oggetti)[i].Modular[a].Modular[b].Modular.length; c++) {
                  //GENERAZIONE FUNZIONE STAZIONI SPAZIALI
                  if (Object.values(Oggetti)[i].Modular[a].Modular[b].Modular[c].Type > 0) {
                     settings[`Generate ${Object.values(Oggetti)[i].Modular[a].Modular[b].Modular[c].Name[Language]}`] = async function () {
                        await E2_GenerateSubSub(a, b, c);
                     };
                     //GENERAZIONE SOTTOCARTELLE IN BASE ALL'OGGETTO "OGGETTI"
                     const Folder3 = Folder2.addFolder(Object.values(Oggetti)[i].Modular[a].Modular[b].Modular[c].Name[Language]);
                     Folder3.add(settings, `Generate ${Object.values(Oggetti)[i].Modular[a].Modular[b].Modular[c].Name[Language]}`);
                     Folder3.close();
                  };
               };
            };
         };

         //MODULAR SPACESHIP
         if (Object.keys(Oggetti)[i] == "Spaceship") {
            const Folder1 = Folder0.addFolder(Object.values(Oggetti)[i].Modular[a].Name[Language]);
            settings[`Generate ${Object.values(Oggetti)[i].Modular[a].Name[Language]}`] = function () {
               E2_GenerateModule(a);
            };
            Folder1.add(settings, `Generate ${Object.values(Oggetti)[i].Modular[a].Name[Language]}`);
            Folder1.close();
         };

         //GENERICI
         if (Object.keys(Oggetti)[i] == "Generic") {
            const Folder1 = Folder0.addFolder(Object.values(Oggetti)[i].Modular[a].Name[Language]);
            settings[`Generate ${Object.values(Oggetti)[i].Modular[a].Name[Language]}`] = function () {
               E2_GenerateGeneric(a);
            };
            Folder1.add(settings, `Generate ${Object.values(Oggetti)[i].Modular[a].Name[Language]}`);
            Folder1.close();
         };
      };
   };

   /*------------------------GENERAZIONE O IMPORTAZIONE OGGETTO DI DEFAULT----------------------------*/
   if (Par.Editor.Default.Type == "PlanetarySystem") {
      if (Par.Editor.Default.SubType == 0) await E2_Generate(Par.Editor.Default.Num, Par.Editor.PlanetarySystem.Detail);
      if (Par.Editor.Default.SubType == 1) await E2_GenerateSub(Par.Editor.Default.Num, Par.Editor.Default.SubNum, Par.Editor.PlanetarySystem.Detail);
      if (Par.Editor.Default.SubType == 2) await E2_GenerateSubSub(Par.Editor.Default.Num, Par.Editor.Default.SubNum, Par.Editor.Default.SubSubNum);
   };
   if (Par.Editor.Default.Type == "ModularShip") {
      if (Par.Editor.Default.SubType == 0) E2_GenerateNewSpaceship(Par.Editor.ModularShip.Moduli, Par.Editor.ModularShip.ModuleArray);
      if (Par.Editor.Default.SubType == 1) E2_GenerateModule(Par.Editor.Default.Num);
   };
   if (Par.Editor.Default.Type == "Generic") {
      E2_GenerateGeneric(Par.Editor.Default.Num);
   };
   //#endregion

   return {
      ImportedObject,
      EditorRotated
   };
};
//#endregion

/*--------------------LENS FLARE-----------------------------------*/
//#region
function E0_LensFlare() {
   const textureFlare0 = Loader.load('./Engine/Texture/lensflare0.png');
   const textureFlare3 = Loader.load('./Engine/Texture/lensflareMic3.png');
   const lensflare = new Lensflare();
   lensflare.addElement(new LensflareElement(textureFlare0, Par.LensFlare.Size0, 0, LuceDirezionale.color));
   lensflare.addElement(new LensflareElement(textureFlare3, Par.LensFlare.Size * 6, Par.LensFlare.Distance * 6));
   lensflare.addElement(new LensflareElement(textureFlare3, Par.LensFlare.Size * 7, Par.LensFlare.Distance * 7));
   lensflare.addElement(new LensflareElement(textureFlare3, Par.LensFlare.Size * 12, Par.LensFlare.Distance * 9));
   lensflare.addElement(new LensflareElement(textureFlare3, Par.LensFlare.Size * 7, Par.LensFlare.Distance * 10));

   //lensflare.material.opacity=1;

   LuceDirezionale.add(lensflare);
};
//#endregion

/*--------------------AUDIO-----------------------------------*/
//#region
const Sound = [];

export function S0_Audio(Obj) {
   const listener = new THREE.AudioListener();
   Camera.add(listener);
   const audioLoader = new THREE.AudioLoader();

   for (let i = 0; i < Obj.Track.length; i++) {
      Sound[i] = new THREE.Audio(listener);
      Sound[i].isReady = false;

      audioLoader.load(Obj.Track[i], function (buffer) {
         Sound[i].setBuffer(buffer);
         Sound[i].setLoop(false);
         Sound[i].setVolume(1.0);
         Sound[i].isReady = true;
      });
   };

   //RIPRODUCE IL SUONO UNA VOLTA, DA ASSOCIARE ALL'OGGETTO "OnceFunction" O A UN EVENTO
   function PlayOnceSound(Track, Volume) {
      if (Sound[Track]?.isReady && !Sound[Track].isPlaying) {
         Sound[Track].setVolume(Volume);
         Sound[Track].play();
      };
   };

   function PlayLoopSound(Track) {
      let modulationValue = 1;

      function Play(Volume) {
         if (Sound[Track]?.isReady && !Sound[Track].isPlaying) {
            Sound[Track].setVolume(Volume);
            Sound[Track].setLoop(true);
            Sound[Track].play();
            if (Sound[Track].source?.playbackRate) {
               Sound[Track].source.playbackRate.value = modulationValue;
            }
         }
      }

      function Stop() {
         if (Sound[Track]?.isPlaying) {
            Sound[Track].stop();
         }
      }

      function SetModulation(value) {
         modulationValue = Math.max(0.1, value);
         if (Sound[Track]?.source?.playbackRate) {
            Sound[Track].source.playbackRate.value = modulationValue;
         }
      }

      return { Play, Stop, SetModulation };
   };

   return { Sound, PlayOnceSound, PlayLoopSound };
};
//#endregion

/*--------------------KEYBOARD-----------------------------------*/
//#region
function E0_Keyboard() {
   const Keys = {};
   document.addEventListener('keydown', (e) => {
      e.preventDefault();
      Keys[e.code] = true;
   });
   document.addEventListener('keyup', (e) => {
      e.preventDefault();
      Keys[e.code] = false;
   });
   return { get Keys() { return Keys; } };
};
//#endregion

/*--------------------CONTROLLER-----------------------------------*/
//#region
export function S0_EditController(Obj) {
   //FUNZIONAMENTO
   /*
   Questa funzione è da usare solo nel menu dei controller, essa crea nel local storage i parametri da importare con le informazioni su quale controller utilizzare, se virtuale o fisico e come è configurato
   const EditContr = S0_EditController(5, 4);
   
   GLI ASSI NECESSARI POSSONO ESSERE SIA ASSI CHE PULSANTI E VALE ANCHE PER I PULSANTI NECESSARI
   */

   //SALVA NEL LOCAL STORAGE
   /*
   ASSI NECESSARI MEMORIZZATI
   Axe0Type, "Axe" O "Button"
   Axe0Index, INDICE DELL'ARRAY "axes" o "buttons" DELL'API GAMEPAD
   PULSANTI NECESSARI MEMORIZZATI
   Button0Type, "Axe" O "Button"
   Button0Index, INDICE DELL'ARRAY "axes" o "buttons" DELL'API GAMEPAD
   */

   let Connected = false;  //GAMEPAD FISICO CONNESSO
   let Index = 0;          //INDICE GAMEPAD FISICO CONNESSO

   const EnableAxes = [];
   const Axes = [];
   const ValAxes = [];
   for (let i = 0; i < Obj.NumAxes; i++) {
      EnableAxes.push(false);
      Axes.push(["Axe", i]);
      //CARICAMENTO PARAMETRI DAL LOCAL STORAGE
      if (SaveSystem.getItem(`Axe${i}Type`) == "Axe") {
         Axes[i] = ["Axe", Number(SaveSystem.getItem(`Axe${i}Index`))];
      };
      if (SaveSystem.getItem(`Axe${i}Type`) == "Button") {
         Axes[i] = ["Button", Number(SaveSystem.getItem(`Axe${i}Index`))];
      };
   };

   const EnablePuls = [];
   const Puls = [];
   const ValPuls = [];
   for (let i = 0; i < Obj.NumPuls; i++) {
      EnablePuls.push(false);
      Puls.push("Button", i);
      //CARICAMENTO PARAMETRI DAL LOCAL STORAGE
      if (SaveSystem.getItem(`Button${i}Type`) == "Axe") {
         Puls[i] = ["Axe", Number(SaveSystem.getItem(`Button${i}Index`))];
      };
      if (SaveSystem.getItem(`Button${i}Type`) == "Button") {
         Puls[i] = ["Button", Number(SaveSystem.getItem(`Button${i}Index`))];
      };
   };

   //RILEVAMENTO GAMEPAD
   window.addEventListener("gamepadconnected", (e) => {
      const Gp = navigator.getGamepads()[e.gamepad.index];
      //MOSTRA I DATI DEL CONTROLLER
      if (Obj.Hud) Obj.Hud.setButtonText(Obj.TextIndex, `${Obj.PreText}
         ${Gp.id}`);
      Connected = true;
      Index = e.gamepad.index;
   });

   //SETTAGGIO ARRAY ASSI E PULSANTI IN BASE ALL'ABILITAZIONE DELL'ASSE O DEL PULSANTE NELL'ARRAY, VISUALIZZAZIONE ASSI/PULSANTI
   setInterval(() => {
      if (Connected == true) {
         const Gp = navigator.getGamepads()[Index];
         if (Gp) {
            for (let a = 0; a < Obj.NumAxes; a++) {
               //SETTAGGIO ARRAY ASSI IN BASE ALL'ABILITAZIONE DELL'ASSE O DEL PULSANTE NELL'ARRAY
               if (EnableAxes[a] == true) {                                //SE L'ASSE È ABILITATO AL SETTAGGIO
                  for (let i = 0; i < Gp.axes.length; i++) {
                     if (Gp.axes[i] > 0.5 || Gp.axes[i] < -0.5) {
                        Axes[a] = ["Axe", i];
                        SaveSystem.setItem(`Axe${a}Type`, "Axe");
                        SaveSystem.setItem(`Axe${a}Index`, i);
                        EnableAxes[a] = false;                             //DISABILITA L'ASSE AL SETTAGGIO
                     };
                  };
                  for (let i = 0; i < Gp.buttons.length; i++) {
                     if (Gp.buttons[i].pressed == true) {
                        Axes[a] = ["Button", i];
                        SaveSystem.setItem(`Axe${a}Type`, "Button");
                        SaveSystem.setItem(`Axe${a}Index`, i);
                        EnableAxes[a] = false;                             //DISABILITA L'ASSE AL SETTAGGIO
                     };
                  };
               };
               //VISUALIZZAZIONE ASSI
               //if (a < 3) {
               if (Axes[a][0] == "Axe") ValAxes[a] = -Gp.axes[Axes[a][1]];
               if (Axes[a][0] == "Button") ValAxes[a] = Gp.buttons[Axes[a][1]].value;
               //};
            };

            for (let a = 0; a < Obj.NumPuls; a++) {
               //SETTAGGIO ARRAY PULSANTI IN BASE ALL'ABILITAZIONE DELL'ASSE O DEL PULSANTE NELL'ARRAY
               if (EnablePuls[a] == true) {                                //SE IL PULSANTE È ABILITATO AL SETTAGGIO
                  for (let i = 0; i < Gp.axes.length; i++) {
                     if (Gp.axes[i] > 0.5 || Gp.axes[i] < -0.5) {
                        Puls[a] = ["Axe", i];
                        SaveSystem.setItem(`Button${a}Type`, "Axe");
                        SaveSystem.setItem(`Button${a}Index`, i);
                        EnablePuls[a] = false;
                     };
                  };
                  for (let i = 0; i < Gp.buttons.length; i++) {
                     if (Gp.buttons[i].pressed == true) {
                        Puls[a] = ["Button", i];
                        SaveSystem.setItem(`Button${a}Type`, "Button");
                        SaveSystem.setItem(`Button${a}Index`, i);
                        EnablePuls[a] = false;                             //DISABILITA IL PULSANTE AL SETTAGGIO
                     };
                  };
               };
               //VISUALIZZAZIONE PULSANTI
               if (Puls[a][0] == "Axe") ValPuls[a] = -Gp.axes[Puls[a][1]];
               if (Puls[a][0] == "Button") ValPuls[a] = Gp.buttons[Puls[a][1]].value;
            };

         };
      };
   }, 50);

   return { EnableAxes, EnablePuls, Axes, Puls, ValAxes, ValPuls, get Connected() { return Connected; }, get Index() { return Index; } };
};

export function S0_Controller(Obj) {
   //FUNZIONAMENTO
   /*
   Genera un array degli assi in base se è virtuale o fisico, inversione e regolazione, il valore va da -100 a +100 con riposo a 0
   Genera un array dei pulsanti in base se è virtuale o fisico, il valore va da 0 a 1
   */
   /*
   Controller = S0_Controller({
      Control: GlobalVar.Control,            //Variabile - 0 VIRTUALE - 1 FISICO
      //PARAMETRI ASSI
      VirtualAxe: VirtualAxe,                //Array di variabili - 0 NIPPLE0X - 1 NIPPLE0Y - 2 NIPPLE1X - 3 NIPPLE1Y
      InvAxe: InvAxe,                        //Array di variabili - 0 NORMALE - 1 INVERTITO
      RegAxe: RegAxe,                        //Array di variabili - COEFFICIENTE DI MOLTIPLICAZIONE PER L'ASSE
      PadAxe: PadAxe,                        //Array di array di variabili - TIPO (AXE, BUTTON) - INDICE
      //PARAMETRI PULSANTI
      PadButton: PadButton,                  //Array di array di variabili - TIPO (AXE, BUTTON) - INDICE
   });
   */
   const InvAxeSign = [];        //SEGNO DI INVERSIONE - 0 POSITIVO - 1 NEGATIVO
   //GENERAZIONE DELL'ARRAY DEI VALORI ASSI IN BASE ALLA LUNGHEZZA DELL'ARRAY DEI PARAMETRI DI TIPO E INDICE
   const Axe = [];
   if (Obj.PadAxe) for (let i = 0; i < Obj.PadAxe.length; i++) {
      Axe.push(0);
   };
   //GENERAZIONE DELL'ARRAY DEI VALORI PULSANTI IN BASE ALLA LUNGHEZZA DELL'ARRAY DEI PARAMETRI DI TIPO E INDICE
   const Button = [];
   if (Obj.PadButton) for (let i = 0; i < Obj.PadButton.length; i++) {
      Button.push(0);
   };
   let Gamepad;
   let GamepadIndex;

   window.addEventListener("gamepadconnected", (e) => {
      GamepadIndex = e.gamepad.index;
      Gamepad = navigator.getGamepads()[GamepadIndex];
      //console.log(Gamepad);
   });

   function Update() {
      //PAD VIRTUALE
      if (Obj.Control == 0) {
         //PER OGNI ASSE VIRTUALE
         for (let i = 0; i < Obj.VirtualAxe.length; i++) {
            if (Obj.InvAxe[Obj.VirtualAxe[i]] == 0) InvAxeSign[i] = 1;
            if (Obj.InvAxe[Obj.VirtualAxe[i]] == 1) InvAxeSign[i] = -1;
         };

         //0 NIPPLE0X
         Axe[Obj.VirtualAxe[0]] = MicEnginereturn.VarPad[0].ValX * ((Obj.RegAxe[Obj.VirtualAxe[0]] + 5) / 100) * InvAxeSign[0];
         //1 NIPPLE0Y
         Axe[Obj.VirtualAxe[1]] = -MicEnginereturn.VarPad[0].ValY * ((Obj.RegAxe[Obj.VirtualAxe[1]] + 5) / 100) * InvAxeSign[1];
         //2 NIPPLE1X
         Axe[Obj.VirtualAxe[2]] = MicEnginereturn.VarPad[1].ValX * ((Obj.RegAxe[Obj.VirtualAxe[2]] + 5) / 100) * InvAxeSign[2];
         //3 NIPPLE1Y
         Axe[Obj.VirtualAxe[3]] = -MicEnginereturn.VarPad[1].ValY * ((Obj.RegAxe[Obj.VirtualAxe[3]] + 5) / 100) * InvAxeSign[3];
      };
      //GAMEPAD FISICO
      if (Obj.Control == 1) {
         if (Gamepad != null) {
            Gamepad = navigator.getGamepads()[GamepadIndex];
            //VALORI ASSI FISICI
            for (let i = 0; i < Obj.PadAxe.length; i++) {
               //APPLICAZIONE INVERSIONE ASSE
               if (Obj.InvAxe[i] == 0) InvAxeSign[i] = 1;
               if (Obj.InvAxe[i] == 1) InvAxeSign[i] = -1;
               //VALORI ASSI IN BASE A SE È UN PULSANTE O UN ASSE, REGOLAZIONE E INVERSIONE
               if (Obj.PadAxe[i][0] == "Axe") {
                  Axe[i] = Gamepad.axes[Obj.PadAxe[i][1]] * 100 * ((Obj.RegAxe[i] + 5) / 100) * InvAxeSign[i];
               };
               if (Obj.PadAxe[i][0] == "Button") {
                  Axe[i] = Gamepad.buttons[Obj.PadAxe[i][1]].value * 100 * ((Obj.RegAxe[i] + 5) / 100) * InvAxeSign[i];
               };
            };
            //VALORI PULSANTI FISICI
            for (let i = 0; i < Obj.PadButton.length; i++) {
               //VALORI PULSANTI
               if (Obj.PadButton[i][0] == "Axe") {
                  Button[i] = Gamepad.axes[Obj.PadButton[i][1]];
               };
               if (Obj.PadButton[i][0] == "Button") {
                  Button[i] = Gamepad.buttons[Obj.PadButton[i][1]].value;
               };
            };
         };
      };
   };


   return { Update, Axe, Button };
};
//#endregion

/*--------------------ORBIT CONTROL-----------------------------------*/
//#region
function E0_OrbitControl(Camera, Elem) {
   const Control = new OrbitControls(Camera, Elem);

   //configurazioni dal tuo Par
   Control.enableDamping = Par.OrbitControl.Damping;
   Control.maxPolarAngle = Par.OrbitControl.MaxPolarAngle;
   Control.minPolarAngle = Par.OrbitControl.MinPolarAngle;
   Control.maxAzimuthAngle = Par.OrbitControl.MaxAzimuthAngle;
   Control.minAzimuthAngle = Par.OrbitControl.MinAzimuthAngle;
   Control.minDistance = Par.OrbitControl.MinDistance;  //DISTANZA MIN
   Control.maxDistance = Par.OrbitControl.MaxDistance;  //DISTANZA MAX
   Control.enablePan = Par.OrbitControl.Pan;

   //variabili interne riutilizzate per zero garbage
   const _dollyDir = new THREE.Vector3();
   let _targetDistance = Control.getDistance(); //inizializza subito
   let _dollySpeed = 6;

   let _isUserInteracting = false;

   //DISTANZA DOLLY INIZIALE
   let _initialDistance = Par.OrbitControl.InitialDistance;
   if (_initialDistance === undefined || _initialDistance === null) {
      _initialDistance = Control.getDistance();
   };

   function _applyInitialDolly() {
      _targetDistance = THREE.MathUtils.clamp(
         _initialDistance,
         Control.minDistance,
         Control.maxDistance
      );

      _dollyDir.subVectors(Camera.position, Control.target).normalize();

      Camera.position
         .copy(Control.target)
         .addScaledVector(_dollyDir, _targetDistance);

      Control.update();
   };

   Control.addEventListener("start", () => {
      _isUserInteracting = true;
   });

   Control.addEventListener("end", () => {
      _isUserInteracting = false;

      //sincronizza il dolly target con lo stato reale
      _targetDistance = Control.getDistance();
   });

   /*Funzione integrata per impostare il target dello zoom*/
   Control.setDollyTarget = function (distance) {
      _targetDistance = THREE.MathUtils.clamp(
         distance,
         this.minDistance,
         this.maxDistance
      );
   };

   /*Funzione integrata da chiamare nel loop per lerp*/
   Control.updateDolly = function (delta) {

      if (_isUserInteracting) {
         this.update();
         return;
      }

      const currentDistance = this.getDistance();

      const newDistance = THREE.MathUtils.lerp(
         currentDistance,
         _targetDistance,
         delta * _dollySpeed
      );

      _dollyDir.subVectors(Camera.position, this.target).normalize();

      Camera.position
         .copy(this.target)
         .addScaledVector(_dollyDir, newDistance);

      this.update();
   };

   _applyInitialDolly();

   return Control;
};

//#endregion
/*----------------------------------------------ALGORITMO GENERATIVO------------------------------------------------------*/
//PROVARE A FARE UN PO DI REFACTORING
async function E0_CreationEngine(Obj, Oggetti, Geometrie, Materiali, Par, manager) {
   //GENERA LA GEOMETRIA NEL LIVELLO DEFINITO DA "GeomModel"
   function GenerateGeometry(GeomModel) {
      let Geom;
      //GEOMETRIA PIANO
      if (GeomModel.Type == "Plane") {
         let Geom2 = new THREE.PlaneGeometry(
            GeomModel.Plane.Width,
            GeomModel.Plane.Height,
            GeomModel.Plane.WidthSeg,
            GeomModel.Plane.HeightSeg,
         );
         Geom = Geom2.toNonIndexed();
      };
      //GEOMETRIA CUBO
      if (GeomModel.Type == "Box") {
         let Geom2 = new THREE.BoxGeometry(
            GeomModel.Box.Width,
            GeomModel.Box.Height,
            GeomModel.Box.Depth,
            GeomModel.Box.WidthSeg,
            GeomModel.Box.HeightSeg,
            GeomModel.Box.DepthSeg,
         );
         Geom = Geom2.toNonIndexed();
      };
      //GEOMETRIA CILINDRO
      if (GeomModel.Type == "Cylinder") {
         let Geom2 = new THREE.CylinderGeometry(
            GeomModel.Cylinder.Rad1,
            GeomModel.Cylinder.Rad2,
            GeomModel.Cylinder.Height,
            GeomModel.Cylinder.RadSeg,
            GeomModel.Cylinder.HeightSeg,
            GeomModel.Cylinder.Open,
            GeomModel.Cylinder.Start,
            GeomModel.Cylinder.Lenght,
         );
         Geom = Geom2.toNonIndexed();
      };
      //GEOMETRIA SFERA
      if (GeomModel.Type == "Sphere") {
         let Geom2 = E3_GeoSphere(
            GeomModel.Sphere.Rad,
            GeomModel.Sphere.WidthSeg,
            GeomModel.Sphere.HeightSeg,
            GeomModel.Sphere.CircStart,
            GeomModel.Sphere.CircLenght,
            GeomModel.Sphere.VertStart,
            GeomModel.Sphere.VertLenght,
         );
         Geom = Geom2.toNonIndexed();
      };
      //GEOMETRIA TORO
      if (GeomModel.Type == "Torus") {
         let Geom2 = new THREE.TorusGeometry(
            GeomModel.Torus.Rad,
            GeomModel.Torus.Tube,
            GeomModel.Torus.RadSeg,
            GeomModel.Torus.TubeSeg,
            GeomModel.Torus.Arc,
         );
         Geom = Geom2.toNonIndexed();
      };
      //GEOMETRIA CAPSULA
      if (GeomModel.Type == "Capsule") {
         let Geom2 = new THREE.CapsuleGeometry(
            GeomModel.Capsule.Rad,
            GeomModel.Capsule.Lenght,
            GeomModel.Capsule.CapSeg,
            GeomModel.Capsule.RadSeg,
         );
         Geom = Geom2.toNonIndexed();
      };
      //GEOMETRIA ESTRUSA
      if (GeomModel.Type == "Extrude") Geom = ExtrudeGeom(GeomModel.Extrude);
      //GEOMETRIA LATHE
      if (GeomModel.Type == "Lathe") {
         const Points = [];
         for (let i = 0; i < GeomModel.Lathe.Array.length / 2; i++) {
            Points.push(new THREE.Vector2(GeomModel.Lathe.Array[i * 2], GeomModel.Lathe.Array[i * 2 + 1]));
         };
         let Geom2 = new THREE.LatheGeometry(
            Points,
            GeomModel.Lathe.Seg,
            GeomModel.Lathe.Start,
            GeomModel.Lathe.Lenght,
         );
         Geom = Geom2.toNonIndexed();
      };
      //GEOMETRIA ANELLO
      if (GeomModel.Type == "Ring") {
         let Geom2 = E3_GeoRing(
            GeomModel.Ring.InRad,        //RAGGIO INTERNO
            GeomModel.Ring.OutRad,       //RAGGIO ESTERNO
            GeomModel.Ring.CircSeg,      //SEGMENTI CIRCONFERENZA
            GeomModel.Ring.ConcSeg,      //SEGMENTI CONCENTRICI
            GeomModel.Ring.Start,        //ANGOLO INIZIO
            GeomModel.Ring.Length        //LUNGHEZZA
         );
         Geom = Geom2.toNonIndexed();
      };
      //GEOMETRIA CERCHIO
      if (GeomModel.Type == "Circle") {
         let Geom2 = E3_GeoCircle(
            GeomModel.Circle.Rad,        //RAGGIO
            GeomModel.Circle.CircSeg,      //SEGMENTI CIRCONFERENZA
            GeomModel.Circle.Start,        //ANGOLO INIZIO
            GeomModel.Circle.Length        //LUNGHEZZA
         );
         Geom = Geom2.toNonIndexed();
      };
      /*----------GEOMETRIE PERSONALIZZATE----------*/
      //NUVOLA DI PUNTI PARAMETRIZZATA (DA ASSEGNARE SOLO A MATERIALE POINT)
      if (GeomModel.Type == "FilamentCloud") {
         Geom = E3_GenerateFilamentCloud({
            shape: GeomModel.FilamentCloud.shape,
            count: GeomModel.FilamentCloud.count,
            spaceSize: GeomModel.FilamentCloud.spaceSize,
            numFilaments: GeomModel.FilamentCloud.numFilaments,
            filamentLength: GeomModel.FilamentCloud.filamentLength,
            filamentSegments: GeomModel.FilamentCloud.filamentSegments,
            filamentRadius: GeomModel.FilamentCloud.filamentRadius,
            filamentDensity: GeomModel.FilamentCloud.filamentDensity
         });
      };

      //SCALA
      if (GeomModel.Scale && GeomModel.Scale.Enable == true) {
         Geom.scale(
            GeomModel.Scale.x,
            GeomModel.Scale.y,
            GeomModel.Scale.z,
         );
      };

      //TRASLAZIONE
      if (GeomModel.Translate && GeomModel.Translate.Enable == true) {
         Geom.translate(
            GeomModel.Translate.x,
            GeomModel.Translate.y,
            GeomModel.Translate.z,
         );
      };
      //ROTAZIONE
      if (GeomModel.Rotate && GeomModel.Rotate.Enable == true) {
         Geom.rotateX(GeomModel.Rotate.x);
         Geom.rotateY(GeomModel.Rotate.y);
         Geom.rotateZ(GeomModel.Rotate.z);
      };

      return Geom;
   };

   //CREAZIONE ARRAY DI MATERIALI
   Materiali.forEach(mat => {
      if (mat.Map) TotalTextures++;
      if (mat.NormalMap) TotalTextures++;
      if (mat.DisplacementMap) TotalTextures++;
      if (mat.EmissiveMap) TotalTextures++;
      if (mat.Type == "ShaderLens") {
         if (mat.Texture1) TotalTextures++;
         if (mat.Texture2) TotalTextures++;
      };
   });

   const promises = Materiali.map(async (mat, h) => {
      let m;

      //Passa il manager alle funzioni di creazione dei materiali
      if (mat.Type == "Base") m = await E3_MaterialeBase(mat, manager);
      if (mat.Type == "Lucido") m = await E3_MaterialeLucido(mat, manager);
      if (mat.Type == "Opaco") m = await E3_MaterialeOpaco(mat, manager);
      if (mat.Type == "Standard") m = await E3_MaterialeStandard(mat, manager);
      if (mat.Type == "Punti") m = E3_MaterialePunti(mat);
      if (mat.Type == "ShaderLens") m = await E3_ShaderLens2(mat);

      //MATERIALI ESPORTATI
      if (typeof mat.ExportIndex === "number" && !Number.isNaN(mat.ExportIndex)) MaterialExportArray[mat.ExportIndex] = m;

      //Gestione lampeggio
      if (mat.Blink > 0) {
         let BitColor = true;
         setInterval(() => {
            BitColor = !BitColor;
            if (BitColor) m.color.setHex(0x000000);
            else m.color.setHex(mat.Color);
         }, mat.Blink);
      };

      return m;
   });

   MaterialArray = await Promise.all(promises);

   /*--------------------------------ALGORITMO GERATIVO------------------------------------*/
   /*REFERENCE*/
   function ReferenceFunc(Liv, Obj) {
      if (Liv == 0) return Geometrie[Obj.GeomModel].Multi[Obj.Multi];
      if (Liv == 1) return Geometrie[Obj.GeomModel].Multi[Obj.Multi].Geometry[Obj.Geometry];
      if (Liv == 2) return Geometrie[Obj.GeomModel].Multi[Obj.Multi].Geometry[Obj.Geometry].GeomArray[Obj.GeomArrayA];
      if (Liv == 3) return Geometrie[Obj.GeomModel].Multi[Obj.Multi].Geometry[Obj.Geometry].GeomArray[Obj.GeomArrayA].GeomArray[Obj.GeomArrayB];
   };

   /*FUNZIONANTE ORIGINALE*/
   async function Generic2(Dir, Num, Name, GeomModel, VariabiliObj, Tractor, UniversalGeom) {
      const SubMeshGroup = new THREE.Group();
      SubMeshGroup.name = `${Name} Generic`;

      Obj[Dir].Model[Num] = SubMeshGroup;

      //APPLICAZIONE DELLE VARIABILI
      Geometrie[GeomModel].Variante(VariabiliObj);

      /*------------------------LIVELLO A - PER OGNI GRUPPO DI GEOMETRIE GENERICHE MULTIMATERIALE-------------------------*/
      if (UniversalGeom == null || UniversalGeom == false) {
         const Geometries = [];
         const Materials = [];
         if (Array.isArray(Geometrie[GeomModel].Multi) && Geometrie[GeomModel].Multi.length > 0) {
            MultiObjects++;
            for (let a = 0; a < Geometrie[GeomModel].Multi.length; a++) {

               //CREA UN ARRAY DI GEOMETRIE PER OGNI MATERIALE
               const GeomArray = [];

               /*---------------------------------LIVELLO B - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
               for (let b = 0; b < Geometrie[GeomModel].Multi[a].Geometry.length; b++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].Group == false) {
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].Option == true) {
                        GeomArray.push(GenerateGeometry(Geometrie[GeomModel].Multi[a].Geometry[b]));
                     };
                  };

                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].Group == true) {
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].Option == true) {
                        //GENERA IL GRUPPO DI LIVELLO B E LE GEOMETRIE DI LIVELLO C
                        GeomArray.push(GenerateMultiGroupLevelB(a, b));
                     };
                  };

               };

               //UNISCI LE GEOMETRIE PER OGNI MATERIALE
               const GeomMaterial = BufferGeometryUtils.mergeGeometries(GeomArray);

               //UNIFORMA GLI ATTRIBUTI UV
               resetUVs(GeomMaterial);

               //AGGIUNGI LE GEOMETRIE PER MATERIALE ALL'ARRAY GENERALE
               Geometries.push(GeomMaterial);
               //AGGIUNGI I MATERIALI ALL'ARRAY GENERALE
               Materials.push(MaterialArray[Geometrie[GeomModel].Multi[a].Material]);
            };
            //UNISCI LE GEOMETRIE PER MATERIALE
            const mergedGeometry = BufferGeometryUtils.mergeGeometries(Geometries, false);
            //CALCOLA I GRUPPI A MANO
            let offset = 0;
            for (let i = 0; i < Geometries.length; i++) {
               const index = Geometries[i].getIndex();
               const count = index ? index.count : Geometries[i].getAttribute('position').count;
               mergedGeometry.addGroup(offset, count, i);
               offset += count;
            };

            if (mergedGeometry.attributes.position) mergedGeometry.attributes.position.usage = THREE.StaticDrawUsage;
            if (mergedGeometry.attributes.normal) mergedGeometry.attributes.normal.usage = THREE.StaticDrawUsage;
            if (mergedGeometry.attributes.uv) mergedGeometry.attributes.uv.usage = THREE.StaticDrawUsage;

            E3_GenMesh(SubMeshGroup, mergedGeometry, Materials, [0, 0, 0], [0, 0, 0], [1, 1, 1], "Multi", true, false);
         };

         //GENERA UN GRUPPO DI LIVELLO B E GEOMETRIE DI LIVELLO C
         function GenerateMultiGroupLevelB(a, b) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArrayGroup = [];

            //DATI DI MOLTIPLICAZIONE
            let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
            let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
            let InitialRot = 0;     //ROTAZIONE INIZIALE
            let InitialPos = 0;     //POSIZIONE INIZIALE
            let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
            let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

            /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
            if (Geometrie[GeomModel].Multi[a].Geometry[b].Moltiplication == "Coaxial") {
               Number = Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[0];
               Axes = Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[1];
               InitialRot = Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[2];
               //SEGMENTI CIRCOLARI VISIBILI
               if (Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[3]) NumVisible = Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[3];
               else NumVisible = Number;
            };

            if (Geometrie[GeomModel].Multi[a].Geometry[b].Moltiplication == "Linear") {
               Number = Geometrie[GeomModel].Multi[a].Geometry[b].Linear[0];
               Axes = Geometrie[GeomModel].Multi[a].Geometry[b].Linear[1];
               InitialPos = Geometrie[GeomModel].Multi[a].Geometry[b].Linear[2];
               OffsetPos = Geometrie[GeomModel].Multi[a].Geometry[b].Linear[3];
               NumVisible = Number;
            };

            /*------------------------LIVELLO C - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
            //PER OGNI GEOMETRIE MOLTIPLICATA
            for (let x = 0; x < Number; x++) {
               //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
               const GeomArraySubGroup = [];
               if (x < NumVisible) {
                  for (let c = 0; c < Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray.length; c++) {
                     //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Group == false) {
                        if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Option == true) {
                           GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c]));
                        };
                     };
                     //SE È UN GRUPPO
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Group == true) {
                        if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Option == true) {
                           //GENERA IL GRUPPO DI LIVELLO C E LE GEOMETRIE DI LIVELLO D
                           const GeomGroupC = GenerateMultiGroupLevelC(a, b, c, x);
                           GeomArraySubGroup.push(GeomGroupC);
                        };
                     };
                  };

                  //UNISCI LE GEOMETRIE
                  const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

                  //RUOTA LA GEOMETRIA RISULTANTE
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].Moltiplication == "Coaxial") {
                     let Rotate = (Math.PI * 2) / Number * (x + 1) + InitialRot;
                     if (Axes == "X") Geometry.rotateX(Rotate);
                     if (Axes == "Y") Geometry.rotateY(Rotate);
                     if (Axes == "Z") Geometry.rotateZ(Rotate);
                  };

                  //TRASLA LA GEOMETRIA RISULTANTE
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].Moltiplication == "Linear") {
                     let Translate = OffsetPos * x + InitialPos;
                     if (Axes == "X") Geometry.translate(Translate, 0, 0);
                     if (Axes == "Y") Geometry.translate(0, Translate, 0);
                     if (Axes == "Z") Geometry.translate(0, 0, Translate);
                  };

                  GeomArrayGroup.push(Geometry);
               };
            };
            //UNISCI LE GEOMETRIE
            const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

            //TRASLA LA GEOMETRIA RISULTANTE  (ABILITATA)
            if (Geometrie[GeomModel].Multi[a].Geometry[b].Translate.Enable == true) {
               GeomGroup.translate(
                  Geometrie[GeomModel].Multi[a].Geometry[b].Translate.x,
                  Geometrie[GeomModel].Multi[a].Geometry[b].Translate.y,
                  Geometrie[GeomModel].Multi[a].Geometry[b].Translate.z,
               );
            };

            return GeomGroup;
         };

         //GENERA UN GRUPPO DI LIVELLO C E GEOMETRIE DI LIVELLO D
         function GenerateMultiGroupLevelC(a, b, c, x) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArrayGroup = [];

            //DATI DI MOLTIPLICAZIONE
            let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
            let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
            let InitialRot = 0;     //ROTAZIONE INIZIALE
            let InitialPos = 0;     //POSIZIONE INIZIALE
            let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
            let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

            /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
            if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Moltiplication == "Coaxial") {
               Number = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[0];
               Axes = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[1];
               InitialRot = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[2];
               //SEGMENTI CIRCOLARI VISIBILI
               if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[3]) NumVisible = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[3];
               else NumVisible = Number;
            };

            if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Moltiplication == "Linear") {
               Number = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Linear[0];
               Axes = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Linear[1];
               InitialPos = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Linear[2];
               OffsetPos = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Linear[3];
               NumVisible = Number;
            };

            /*------------------------LIVELLO D - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
            //PER OGNI GEOMETRIE MOLTIPLICATA
            for (let y = 0; y < Number; y++) {
               //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
               const GeomArraySubGroup = [];
               if (y < NumVisible) {
                  for (let d = 0; d < Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray.length; d++) {
                     //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Group == false) {
                        if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Option == true) {
                           GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d]));
                        };
                     };
                     //SE È UN GRUPPO
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Group == true) {
                        if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Option == true) {
                           //GENERA IL GRUPPO DI LIVELLO D E LE GEOMETRIE DI LIVELLO E
                           const GeomGroupD = GenerateMultiGroupLevelD(a, b, c, d, x, y);
                           GeomArraySubGroup.push(GeomGroupD);
                        };
                     };
                  };

                  //UNISCI LE GEOMETRIE
                  const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

                  //RUOTA LA GEOMETRIA RISULTANTE
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Moltiplication == "Coaxial") {
                     let Rotate = (Math.PI * 2) / Number * (y + 1) + InitialRot;
                     if (Axes == "X") Geometry.rotateX(Rotate);
                     if (Axes == "Y") Geometry.rotateY(Rotate);
                     if (Axes == "Z") Geometry.rotateZ(Rotate);
                  };

                  //TRASLA LA GEOMETRIA RISULTANTE
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Moltiplication == "Linear") {
                     let Translate = OffsetPos * y + InitialPos;
                     if (Axes == "X") Geometry.translate(Translate, 0, 0);
                     if (Axes == "Y") Geometry.translate(0, Translate, 0);
                     if (Axes == "Z") Geometry.translate(0, 0, Translate);
                  };
                  GeomArrayGroup.push(Geometry);
               };
            };

            //UNISCI LE GEOMETRIE
            const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

            //TRASLA LA GEOMETRIA RISULTANTE (ABILITATA)
            if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Translate.Enable == true) {
               GeomGroup.translate(
                  Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Translate.x,
                  Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Translate.y,
                  Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Translate.z,
               );
            };

            return GeomGroup;
         };

         //GENERA UN GRUPPO DI LIVELLO D E GEOMETRIE DI LIVELLO E
         function GenerateMultiGroupLevelD(a, b, c, d, x, y) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArrayGroup = [];

            //DATI DI MOLTIPLICAZIONE
            let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
            let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
            let InitialRot = 0;     //ROTAZIONE INIZIALE
            let InitialPos = 0;     //POSIZIONE INIZIALE
            let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
            let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

            /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
            if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Coaxial") {
               Number = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[0];
               Axes = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[1];
               InitialRot = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[2];
               //SEGMENTI CIRCOLARI VISIBILI
               if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[3]) NumVisible = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[3];
               else NumVisible = Number;
            };

            if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Linear") {
               Number = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[0];
               Axes = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[1];
               InitialPos = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[2];
               OffsetPos = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[3];
               NumVisible = Number;
            };

            /*------------------------LIVELLO E - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
            //PER OGNI GEOMETRIE MOLTIPLICATA
            for (let z = 0; z < Number; z++) {
               //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
               const GeomArraySubGroup = [];
               if (z < NumVisible) {
                  for (let e = 0; e < Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray.length; e++) {
                     //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Group == false) {
                        if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == true) {
                           GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e]));
                        };
                     };
                     //SE È UN GRUPPO
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Group == true) {
                        //SE NON È OPZIONABILE
                        if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == false) {
                           //GENERA IL GRUPPO DI LIVELLO E E LE GEOMETRIE DI LIVELLO F
                           //const GeomGroupC = GenerateMultiGroupLevelC(a, b, c);
                           //GeomArraySubGroup.push(GeomGroupC);
                        };
                        //SE È OPZIONABILE
                        if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == true) {
                           //CERCA NELLA VARIABILI SE L'OPZIONE È TRUE
                           for (let i = 0; i < Geometrie[GeomModel].Variabili.Option.length; i++) {
                              if (Geometrie[GeomModel].Variabili.Option[i].length == 6 && Geometrie[GeomModel].Variabili.Option[i][0] == a &&
                                 Geometrie[GeomModel].Variabili.Option[i][1] == b && Geometrie[GeomModel].Variabili.Option[i][2] == c &&
                                 Geometrie[GeomModel].Variabili.Option[i][3] == d && Geometrie[GeomModel].Variabili.Option[i][4] == d &&
                                 Geometrie[GeomModel].Variabili.Option[i][5] == true) {
                                 //GENERA IL GRUPPO DI LIVELLO E E LE GEOMETRIE DI LIVELLO F
                                 //const GeomGroupC = GenerateMultiGroupLevelC(a, b, c);
                                 //GeomArraySubGroup.push(GeomGroupC);
                              };
                           };
                        };
                     };
                  };

                  //UNISCI LE GEOMETRIE
                  const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

                  //RUOTA LA GEOMETRIA RISULTANTE
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Coaxial") {
                     let Rotate = (Math.PI * 2) / Number * (z + 1) + InitialRot;
                     if (Axes == "X") Geometry.rotateX(Rotate);
                     if (Axes == "Y") Geometry.rotateY(Rotate);
                     if (Axes == "Z") Geometry.rotateZ(Rotate);
                  };

                  //TRASLA LA GEOMETRIA RISULTANTE
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Linear") {
                     let Translate = OffsetPos * z + InitialPos;
                     if (Axes == "X") Geometry.translate(Translate, 0, 0);
                     if (Axes == "Y") Geometry.translate(0, Translate, 0);
                     if (Axes == "Z") Geometry.translate(0, 0, Translate);
                  };

                  GeomArrayGroup.push(Geometry);
               };
            };

            //UNISCI LE GEOMETRIE
            const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

            //TRASLA LA GEOMETRIA RISULTANTE
            if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.Enable == true) {
               GeomGroup.translate(
                  Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.x,
                  Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.y,
                  Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.z,
               );
            };

            return GeomGroup;
         };
      };

      /*------------------------LIVELLO A - PER OGNI GRUPPO DI GEOMETRIE GENERICHE DELLO STESSO MATERIALE-------------------------*/
      if (Array.isArray(Geometrie[GeomModel].Generic) && Geometrie[GeomModel].Generic.length > 0) {
         GenericObjects++;
         for (let a = 0; a < Geometrie[GeomModel].Generic.length; a++) {

            //CREA UN ARRAY DI GEOMETRIE PER OGNI MATERIALE
            const GeomArray = [];

            /*---------------------------------LIVELLO B - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
            for (let b = 0; b < Geometrie[GeomModel].Generic[a].Geometry.length; b++) {
               //SE NON È UN GRUPPO GENERA LA GEOMETRIA
               if (Geometrie[GeomModel].Generic[a].Geometry[b].Group == false) {
                  if (Geometrie[GeomModel].Generic[a].Geometry[b].Option == true) {
                     GeomArray.push(GenerateGeometry(Geometrie[GeomModel].Generic[a].Geometry[b]));
                  };
               };

               //SE È UN GRUPPO
               if (Geometrie[GeomModel].Generic[a].Geometry[b].Group == true) {
                  if (Geometrie[GeomModel].Generic[a].Geometry[b].Option == true) {
                     //GENERA IL GRUPPO DI LIVELLO B E LE GEOMETRIE DI LIVELLO C
                     GeomArray.push(GenerateGroupLevelB(a, b));
                  };
               };

            };

            //UNISCI LE GEOMETRIE PER OGNI MATERIALE
            const GeomMaterial = BufferGeometryUtils.mergeGeometries(GeomArray);

            //UNIFORMA GLI ATTRIBUTI UV
            resetUVs(GeomMaterial);

            //CREA UNA MESH PER OGNI MATERIALE
            E3_GenMesh(SubMeshGroup, GeomMaterial, MaterialArray[Geometrie[GeomModel].Generic[a].Material], [0, 0, 0], [0, 0, 0], [1, 1, 1],
               Materiali[Geometrie[GeomModel].Generic[a].Material].VariableColor, true, false);
         };
      };

      //GENERA UN GRUPPO DI LIVELLO B E GEOMETRIE DI LIVELLO C
      function GenerateGroupLevelB(a, b) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Generic[a].Geometry[b].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Generic[a].Geometry[b].Coaxial[0];
            Axes = Geometrie[GeomModel].Generic[a].Geometry[b].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Generic[a].Geometry[b].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Generic[a].Geometry[b].Coaxial[3]) NumVisible = Geometrie[GeomModel].Generic[a].Geometry[b].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Generic[a].Geometry[b].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Generic[a].Geometry[b].Linear[0];
            Axes = Geometrie[GeomModel].Generic[a].Geometry[b].Linear[1];
            InitialPos = Geometrie[GeomModel].Generic[a].Geometry[b].Linear[2];
            OffsetPos = Geometrie[GeomModel].Generic[a].Geometry[b].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO C - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let x = 0; x < Number; x++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (x < NumVisible) {
               for (let c = 0; c < Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray.length; c++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Group == false) {
                     if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c]));

                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Group == true) {
                     if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Option == true) {
                        //GENERA IL GRUPPO DI LIVELLO C E LE GEOMETRIE DI LIVELLO D
                        const GeomGroupC = GenerateGroupLevelC(a, b, c, x);
                        GeomArraySubGroup.push(GeomGroupC);
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Generic[a].Geometry[b].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (x + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Generic[a].Geometry[b].Moltiplication == "Linear") {
                  let Translate = OffsetPos * x + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };
         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE  (ABILITATA)
         if (Geometrie[GeomModel].Generic[a].Geometry[b].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Generic[a].Geometry[b].Translate.x,
               Geometrie[GeomModel].Generic[a].Geometry[b].Translate.y,
               Geometrie[GeomModel].Generic[a].Geometry[b].Translate.z,
            );
         };

         return GeomGroup;
      };

      //GENERA UN GRUPPO DI LIVELLO C E GEOMETRIE DI LIVELLO D
      function GenerateGroupLevelC(a, b, c, x) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Coaxial[0];
            Axes = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Coaxial[3]) NumVisible = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Linear[0];
            Axes = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Linear[1];
            InitialPos = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Linear[2];
            OffsetPos = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO D - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let y = 0; y < Number; y++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (y < NumVisible) {
               for (let d = 0; d < Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray.length; d++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Group == false) {
                     if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d]));
                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Group == true) {
                     if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Option == true) {
                        //GENERA IL GRUPPO DI LIVELLO D E LE GEOMETRIE DI LIVELLO E
                        const GeomGroupD = GenerateGroupLevelD(a, b, c, d, x, y);
                        GeomArraySubGroup.push(GeomGroupD);
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (y + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Moltiplication == "Linear") {
                  let Translate = OffsetPos * y + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };

         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE (ABILITATA)
         if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Translate.x,
               Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Translate.y,
               Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].Translate.z,
            );
         };

         return GeomGroup;
      };

      //GENERA UN GRUPPO DI LIVELLO D E GEOMETRIE DI LIVELLO E
      function GenerateGroupLevelD(a, b, c, d, x, y) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[0];
            Axes = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[3]) NumVisible = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[0];
            Axes = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[1];
            InitialPos = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[2];
            OffsetPos = Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO E - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let z = 0; z < Number; z++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (z < NumVisible) {
               for (let e = 0; e < Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray.length; e++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Group == false) {
                     if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e]));
                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Group == true) {
                     //SE NON È OPZIONABILE
                     if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == false) {
                        //GENERA IL GRUPPO DI LIVELLO E E LE GEOMETRIE DI LIVELLO F
                        //const GeomGroupC = GenerateGroupLevelC(a, b, c);
                        //GeomArraySubGroup.push(GeomGroupC);
                     };
                     //SE È OPZIONABILE
                     if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == true) {
                        //CERCA NELLA VARIABILI SE L'OPZIONE È TRUE
                        for (let i = 0; i < Geometrie[GeomModel].Variabili.Option.length; i++) {
                           if (Geometrie[GeomModel].Variabili.Option[i].length == 6 && Geometrie[GeomModel].Variabili.Option[i][0] == a &&
                              Geometrie[GeomModel].Variabili.Option[i][1] == b && Geometrie[GeomModel].Variabili.Option[i][2] == c &&
                              Geometrie[GeomModel].Variabili.Option[i][3] == d && Geometrie[GeomModel].Variabili.Option[i][4] == d &&
                              Geometrie[GeomModel].Variabili.Option[i][5] == true) {
                              //GENERA IL GRUPPO DI LIVELLO E E LE GEOMETRIE DI LIVELLO F
                              //const GeomGroupC = GenerateGroupLevelC(a, b, c);
                              //GeomArraySubGroup.push(GeomGroupC);
                           };
                        };
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (z + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Linear") {
                  let Translate = OffsetPos * z + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };

         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE
         if (Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.x,
               Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.y,
               Geometrie[GeomModel].Generic[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.z,
            );
         };

         return GeomGroup;
      };

      /*------------------------------------------LIVELLO A - PER OGNI MESH MULTIMATERIALE --------------------------------------------*/
      const MultiMeshGroup = new THREE.Group();

      if (Array.isArray(Geometrie[GeomModel].MeshMulti) && Geometrie[GeomModel].MeshMulti.length > 0) {
         MeshMultiObjects++;
         for (let a = 0; a < Geometrie[GeomModel].MeshMulti.length; a++) {
            //SE NON È UN GRUPPO GENERA LA MESH
            if (Geometrie[GeomModel].MeshMulti[a].Group == false) {
               if (Geometrie[GeomModel].MeshMulti[a].Option == true) {
                  const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshMulti[a]);

                  //MATERIALE NUMERICO (SITUAZIONE NORMALE)
                  if (typeof Geometrie[GeomModel].MeshMulti[a].Material === 'number') {
                     E3_UniversalMesh({
                        //PARAMETRI OBBLIGATORI:
                        Geom: MeshGeometry,
                        Material: MaterialArray[Geometrie[GeomModel].MeshMulti[a].Material],
                        //PARAMETRI OPZIONALI
                        Type: Geometrie[GeomModel].MeshMulti[a].MeshType,
                        Name: Geometrie[GeomModel].MeshMulti[a].Name,
                        Position: Geometrie[GeomModel].MeshMulti[a].Position,
                        Rotation: Geometrie[GeomModel].MeshMulti[a].Rotation,
                        Scale: Geometrie[GeomModel].MeshMulti[a].Scale,
                        Visible: true,
                        Shadows: Geometrie[GeomModel].MeshMulti[a].Shadows,
                        Group: MultiMeshGroup
                     });
                  }
                  //MATERIALE STAMPDOCK
                  else if (Geometrie[GeomModel].MeshMulti[a].Material == "StampDock") {
                     const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshMulti[a].StampDock, "", 1);
                     E3_UniversalMesh({
                        //PARAMETRI OBBLIGATORI:
                        Geom: MeshGeometry,
                        Material: Stamp,
                        //PARAMETRI OPZIONALI
                        Type: Geometrie[GeomModel].MeshMulti[a].MeshType,
                        Name: Geometrie[GeomModel].MeshMulti[a].Name,
                        Position: Geometrie[GeomModel].MeshMulti[a].Position,
                        Rotation: Geometrie[GeomModel].MeshMulti[a].Rotation,
                        Scale: Geometrie[GeomModel].MeshMulti[a].Scale,
                        Visible: true,
                        Shadows: Geometrie[GeomModel].MeshMulti[a].Shadows,
                        Group: MultiMeshGroup
                     });
                  };

               };
            };

            //SE È UN GRUPPO GENERA UN GRUPPO
            if (Geometrie[GeomModel].MeshMulti[a].Group == true) {
               if (Geometrie[GeomModel].MeshMulti[a].Option == true) {
                  MultiMeshGroup.add(GenerateMeshMultiLevelA(a));
               };
            };
         };

         //UNIONE DELLE GEOMETRIE E DEI MATERIALI DAL GRUPPO GENERATO
         const MultiMeshGeometries = [];
         const MultiMeshMaterials = [];
         MultiMeshGroup.updateMatrixWorld(true);
         MultiMeshGroup.traverse((child) => {
            if (child.isMesh) {
               const material = child.material;
               let materialIndex = MultiMeshMaterials.indexOf(material);

               //Se il materiale non è già nella lista, aggiungilo
               if (materialIndex === -1) {
                  materialIndex = MultiMeshMaterials.length;
                  MultiMeshMaterials.push(material);
               }

               //Clona la geometria e applica la trasformazione globale
               const geom = child.geometry.clone();
               geom.applyMatrix4(child.matrixWorld);

               //Imposta il gruppo per il materiale
               geom.clearGroups();
               const count = geom.index ? geom.index.count : geom.attributes.position.count;
               geom.addGroup(0, count, materialIndex);

               MultiMeshGeometries.push(geom);
            }
         });
         if (MultiMeshGeometries.length > 0) {
            const mergedGeometry = BufferGeometryUtils.mergeGeometries(MultiMeshGeometries, true);
            if (mergedGeometry.attributes.position) mergedGeometry.attributes.position.usage = THREE.StaticDrawUsage;
            if (mergedGeometry.attributes.normal) mergedGeometry.attributes.normal.usage = THREE.StaticDrawUsage;
            if (mergedGeometry.attributes.uv) mergedGeometry.attributes.uv.usage = THREE.StaticDrawUsage;

            const combinedMesh = new THREE.Mesh(mergedGeometry, MultiMeshMaterials);
            combinedMesh.name = "MultiMeshGroup";

            //Ora puoi aggiungere la mesh combinata dove vuoi
            SubMeshGroup.add(combinedMesh);
         }
         //SubMeshGroup.add(MultiMeshGroup);
      };

      //GENERA UN GRUPPO DI LIVELLO A E GEOMETRIE DI LIVELLO B
      function GenerateMeshMultiLevelA(a) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const MeshGroup = new THREE.Group();

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].MeshMulti[a].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].MeshMulti[a].Coaxial[0];
            Axes = Geometrie[GeomModel].MeshMulti[a].Coaxial[1];
            InitialRot = Geometrie[GeomModel].MeshMulti[a].Coaxial[2];
         };

         if (Geometrie[GeomModel].MeshMulti[a].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].MeshMulti[a].Linear[0];
            Axes = Geometrie[GeomModel].MeshMulti[a].Linear[1];
            InitialPos = Geometrie[GeomModel].MeshMulti[a].Linear[2];
            OffsetPos = Geometrie[GeomModel].MeshMulti[a].Linear[3];
         };

         /*------------------------LIVELLO B - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let x = 0; x < Number; x++) {
            const MeshSubGroup = new THREE.Group();
            for (let b = 0; b < Geometrie[GeomModel].MeshMulti[a].MeshArray.length; b++) {
               //SE NON È UN GRUPPO GENERA LA MESH
               if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Group == false) {
                  if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Option == true) {
                     const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshMulti[a].MeshArray[b]);

                     if (typeof Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Material === 'number') {
                        E3_UniversalMesh({
                           //PARAMETRI OBBLIGATORI:
                           Geom: MeshGeometry,
                           Material: MaterialArray[Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Material],
                           //PARAMETRI OPZIONALI
                           Type: Geometrie[GeomModel].MeshMulti[a].MeshType,
                           Name: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Name,
                           Position: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Position,
                           Rotation: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Rotation,
                           Scale: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Scale,
                           Visible: true,
                           Shadows: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Shadows,
                           Group: MeshSubGroup
                        });
                     }
                     else if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Material == "StampDock") {
                        const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshMulti[a].MeshArray[b].StampDock, 1, x + 1);
                        E3_UniversalMesh({
                           //PARAMETRI OBBLIGATORI:
                           Geom: MeshGeometry,
                           Material: Stamp,
                           //PARAMETRI OPZIONALI
                           Type: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshType,
                           Name: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Name,
                           Position: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Position,
                           Rotation: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Rotation,
                           Scale: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Scale,
                           Visible: true,
                           Shadows: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Shadows,
                           Group: MeshSubGroup
                        });
                     };

                  };
                  //SE È OPZIONABILE COME NUMERO
                  if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Option == "Number") {
                     if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Number[0] == x) {
                        const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshMulti[a].MeshArray[b]);

                        if (typeof Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Material === 'number') {
                           E3_UniversalMesh({
                              //PARAMETRI OBBLIGATORI:
                              Geom: MeshGeometry,
                              Material: MaterialArray[Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Material],
                              //PARAMETRI OPZIONALI
                              Type: Geometrie[GeomModel].MeshMulti[a].MeshType,
                              Name: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Name,
                              Position: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Position,
                              Rotation: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Rotation,
                              Scale: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Scale,
                              Visible: true,
                              Shadows: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Shadows,
                              Group: MeshSubGroup
                           });
                        }
                        else if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Material == "StampDock") {
                           const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshMulti[a].MeshArray[b].StampDock, 1, x + 1);
                           E3_UniversalMesh({
                              //PARAMETRI OBBLIGATORI:
                              Geom: MeshGeometry,
                              Material: Stamp,
                              //PARAMETRI OPZIONALI
                              Type: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshType,
                              Name: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Name,
                              Position: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Position,
                              Rotation: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Rotation,
                              Scale: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Scale,
                              Visible: true,
                              Shadows: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Shadows,
                              Group: MeshSubGroup
                           });
                        };
                     };
                  };
               };

               //SE È UN GRUPPO GENERA UN GRUPPO
               if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Group == true) {
                  if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Option == true) {
                     MeshSubGroup.add(GenerateMeshMultiLevelB(a, b, x));
                  };
                  //SE È OPZIONABILE COME NUMERO
                  if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Option == "Number") {
                     if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Number[0] == x) {
                        MeshSubGroup.add(GenerateMeshMultiLevelB(a, b, x));
                     };
                  };
               };
            };

            //RUOTA LA GEOMETRIA RISULTANTE
            if (Geometrie[GeomModel].MeshMulti[a].Moltiplication == "Coaxial") {
               let Rotate = (Math.PI * 2) / Number * (x + 1) + InitialRot;
               if (Axes == "X") MeshSubGroup.rotation.set(Rotate, 0, 0);
               if (Axes == "Y") MeshSubGroup.rotation.set(0, Rotate, 0);
               if (Axes == "Z") MeshSubGroup.rotation.set(0, 0, Rotate);
            };

            if (Geometrie[GeomModel].MeshMulti[a].Moltiplication == "Linear") {
               let Translate = OffsetPos * x + InitialPos;
               if (Axes == "X") MeshSubGroup.position.set(Translate, 0, 0);
               if (Axes == "Y") MeshSubGroup.position.set(0, Translate, 0);
               if (Axes == "Z") MeshSubGroup.position.set(0, 0, Translate);
            };

            MeshGroup.add(MeshSubGroup);
         };

         //TRASLA LA GEOMETRIA RISULTANTE
         MeshGroup.position.set(
            Geometrie[GeomModel].MeshMulti[a].Position[0],
            Geometrie[GeomModel].MeshMulti[a].Position[1],
            Geometrie[GeomModel].MeshMulti[a].Position[2]);

         return MeshGroup;
      };

      //GENERA UN GRUPPO DI LIVELLO B E GEOMETRIE DI LIVELLO C
      function GenerateMeshMultiLevelB(a, b, x) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const MeshGroup = new THREE.Group();

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Coaxial[0];
            Axes = Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Coaxial[1];
            InitialRot = Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Coaxial[2];
         };

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO LINEARE---------------------------------------*/
         if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Linear[0];
            Axes = Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Linear[1];
            InitialPos = Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Linear[2];
            OffsetPos = Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Linear[3];
         };

         /*------------------------LIVELLO C - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let y = 0; y < Number; y++) {
            const MeshSubGroup = new THREE.Group();
            for (let c = 0; c < Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray.length; c++) {
               //SE NON È UN GRUPPO GENERA LA MESH
               if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Group == false) {
                  if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Option == true) {
                     const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c]);

                     if (typeof Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Material === 'number') {
                        E3_UniversalMesh({
                           //PARAMETRI OBBLIGATORI:
                           Geom: MeshGeometry,
                           Material: MaterialArray[Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Material],
                           //PARAMETRI OPZIONALI
                           Type: Geometrie[GeomModel].MeshMulti[a].MeshType,
                           Name: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Name,
                           Position: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Position,
                           Rotation: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Rotation,
                           Scale: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Scale,
                           Visible: true,
                           Shadows: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Shadows,
                           Group: MeshSubGroup
                        });
                     }
                     else if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Material == "StampDock") {
                        const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].StampDock, x + 1, y + 1);
                        E3_UniversalMesh({
                           //PARAMETRI OBBLIGATORI:
                           Geom: MeshGeometry,
                           Material: Stamp,
                           //PARAMETRI OPZIONALI
                           Type: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].MeshType,
                           Name: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Name,
                           Position: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Position,
                           Rotation: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Rotation,
                           Scale: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Scale,
                           Visible: true,
                           Shadows: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Shadows,
                           Group: MeshSubGroup
                        });
                     };

                  };
                  //SE È OPZIONABILE COME NUMERO
                  if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Option == "Number") {
                     if ((Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number.length == 2 &&
                        Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number[0] == x &&
                        Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number[1] == y) ||
                        (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number.length == 1 &&
                           Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number[0] == y)) {
                        const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c]);

                        if (typeof Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Material === 'number') {
                           E3_UniversalMesh({
                              //PARAMETRI OBBLIGATORI:
                              Geom: MeshGeometry,
                              Material: MaterialArray[Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Material],
                              //PARAMETRI OPZIONALI
                              Type: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].MeshType,
                              Name: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Name,
                              Position: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Position,
                              Rotation: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Rotation,
                              Scale: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Scale,
                              Visible: true,
                              Shadows: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Shadows,
                              Group: MeshSubGroup
                           });
                        }
                        else if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Material == "StampDock") {
                           const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].StampDock, x + 1, y + 1);
                           E3_UniversalMesh({
                              //PARAMETRI OBBLIGATORI:
                              Geom: MeshGeometry,
                              Material: Stamp,
                              //PARAMETRI OPZIONALI
                              Type: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].MeshType,
                              Name: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Name,
                              Position: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Position,
                              Rotation: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Rotation,
                              Scale: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Scale,
                              Visible: true,
                              Shadows: Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Shadows,
                              Group: MeshSubGroup
                           });
                        };
                     };
                  };
               };

               //SE È UN GRUPPO GENERA UN GRUPPO
               if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Group == true) {
                  if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Option == true) {
                     //MeshSubGroup.add(GenerateMeshGroupLevelC(a, b, c));
                  };
                  //SE È OPZIONABILE COME NUMERO
                  if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Option == "Number") {
                     if ((Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number.length == 2 &&
                        Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number[0] == x &&
                        Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number[1] == y) ||
                        (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number.length == 1 &&
                           Geometrie[GeomModel].MeshMulti[a].MeshArray[b].MeshArray[c].Number[0] == y)) {
                        //MeshSubGroup.add(GenerateMeshGroupLevelC(a, b, c));
                     };

                  };
               };
            };

            //RUOTA LA GEOMETRIA RISULTANTE
            if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Moltiplication == "Coaxial") {
               let Rotate = (Math.PI * 2) / Number * (y + 1) + InitialRot;
               if (Axes == "X") MeshSubGroup.rotation.set(Rotate, 0, 0);
               if (Axes == "Y") MeshSubGroup.rotation.set(0, Rotate, 0);
               if (Axes == "Z") MeshSubGroup.rotation.set(0, 0, Rotate);
            };

            if (Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Moltiplication == "Linear") {
               let Translate = OffsetPos * y + InitialPos;
               if (Axes == "X") MeshSubGroup.position.set(Translate, 0, 0);
               if (Axes == "Y") MeshSubGroup.position.set(0, Translate, 0);
               if (Axes == "Z") MeshSubGroup.position.set(0, 0, Translate);
            };

            MeshGroup.add(MeshSubGroup);
         };

         //TRASLA LA GEOMETRIA RISULTANTE
         MeshGroup.position.set(
            Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Position[0],
            Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Position[1],
            Geometrie[GeomModel].MeshMulti[a].MeshArray[b].Position[2]);

         return MeshGroup;
      };

      /*------------------------------------------LIVELLO A - PER OGNI GRUPPO DI MESH --------------------------------------------*/
      if (Array.isArray(Geometrie[GeomModel].MeshGroup) && Geometrie[GeomModel].MeshGroup.length > 0) {
         MeshGroupObjects++;
         for (let a = 0; a < Geometrie[GeomModel].MeshGroup.length; a++) {
            //SE NON È UN GRUPPO GENERA LA MESH
            if (Geometrie[GeomModel].MeshGroup[a].Group == false) {
               if (Geometrie[GeomModel].MeshGroup[a].Option == true) {
                  const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshGroup[a]);
                  if (MeshGeometry.attributes.position) MeshGeometry.attributes.position.usage = THREE.StaticDrawUsage;
                  if (MeshGeometry.attributes.normal) MeshGeometry.attributes.normal.usage = THREE.StaticDrawUsage;
                  if (MeshGeometry.attributes.uv) MeshGeometry.attributes.uv.usage = THREE.StaticDrawUsage;

                  if (typeof Geometrie[GeomModel].MeshGroup[a].Material === 'number') {
                     E3_UniversalMesh({
                        //PARAMETRI OBBLIGATORI:
                        Geom: MeshGeometry,
                        Material: MaterialArray[Geometrie[GeomModel].MeshGroup[a].Material],
                        //PARAMETRI OPZIONALI
                        Type: Geometrie[GeomModel].MeshGroup[a].MeshType,
                        Name: Geometrie[GeomModel].MeshGroup[a].Name,
                        Position: Geometrie[GeomModel].MeshGroup[a].Position,
                        Rotation: Geometrie[GeomModel].MeshGroup[a].Rotation,
                        Scale: Geometrie[GeomModel].MeshGroup[a].Scale,
                        Visible: Geometrie[GeomModel].MeshGroup[a].Visible,
                        Shadows: Geometrie[GeomModel].MeshGroup[a].Shadows,
                        Group: SubMeshGroup
                     });
                  }

                  else if (Geometrie[GeomModel].MeshGroup[a].Material == "StampDock") {
                     const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshGroup[a].StampDock, "", 1);
                     E3_UniversalMesh({
                        //PARAMETRI OBBLIGATORI:
                        Geom: MeshGeometry,
                        Material: Stamp,
                        //PARAMETRI OPZIONALI
                        Type: Geometrie[GeomModel].MeshGroup[a].MeshType,
                        Name: Geometrie[GeomModel].MeshGroup[a].Name,
                        Position: Geometrie[GeomModel].MeshGroup[a].Position,
                        Rotation: Geometrie[GeomModel].MeshGroup[a].Rotation,
                        Scale: Geometrie[GeomModel].MeshGroup[a].Scale,
                        Visible: Geometrie[GeomModel].MeshGroup[a].Visible,
                        Shadows: Geometrie[GeomModel].MeshGroup[a].Shadows,
                        Group: SubMeshGroup
                     });
                  };
               };
            };

            //SE È UN GRUPPO GENERA UN GRUPPO
            if (Geometrie[GeomModel].MeshGroup[a].Group == true) {
               if (Geometrie[GeomModel].MeshGroup[a].Option == true) {
                  SubMeshGroup.add(GenerateMeshGroupLevelA(a));
               };
            };
         };
      };

      //GENERA UN GRUPPO DI LIVELLO A E GEOMETRIE DI LIVELLO B
      function GenerateMeshGroupLevelA(a) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const MeshGroup = new THREE.Group();
         MeshGroup.name = Geometrie[GeomModel].MeshGroup[a].Name;

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].MeshGroup[a].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].MeshGroup[a].Coaxial[0];
            Axes = Geometrie[GeomModel].MeshGroup[a].Coaxial[1];
            InitialRot = Geometrie[GeomModel].MeshGroup[a].Coaxial[2];
         };

         if (Geometrie[GeomModel].MeshGroup[a].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].MeshGroup[a].Linear[0];
            Axes = Geometrie[GeomModel].MeshGroup[a].Linear[1];
            InitialPos = Geometrie[GeomModel].MeshGroup[a].Linear[2];
            OffsetPos = Geometrie[GeomModel].MeshGroup[a].Linear[3];
         };

         /*------------------------LIVELLO B - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let x = 0; x < Number; x++) {
            const MeshSubGroup = new THREE.Group();
            MeshSubGroup.name = `${Geometrie[GeomModel].MeshGroup[a].Name} ${x}`;

            for (let b = 0; b < Geometrie[GeomModel].MeshGroup[a].MeshArray.length; b++) {
               //SE NON È UN GRUPPO GENERA LA MESH
               if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Group == false) {
                  if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Option == true) {
                     const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshGroup[a].MeshArray[b]);
                     if (MeshGeometry.attributes.position) MeshGeometry.attributes.position.usage = THREE.StaticDrawUsage;
                     if (MeshGeometry.attributes.normal) MeshGeometry.attributes.normal.usage = THREE.StaticDrawUsage;
                     if (MeshGeometry.attributes.uv) MeshGeometry.attributes.uv.usage = THREE.StaticDrawUsage;


                     if (typeof Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Material === 'number') {
                        E3_UniversalMesh({
                           //PARAMETRI OBBLIGATORI:
                           Geom: MeshGeometry,
                           Material: MaterialArray[Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Material],
                           //PARAMETRI OPZIONALI
                           Type: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshType,
                           Name: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Name,
                           Position: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Position,
                           Rotation: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Rotation,
                           Scale: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Scale,
                           Visible: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Visible,
                           Shadows: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Shadows,
                           Group: MeshSubGroup
                        });
                     }
                     else if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Material == "StampDock") {
                        const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshGroup[a].MeshArray[b].StampDock, "", x + 1);
                        E3_UniversalMesh({
                           //PARAMETRI OBBLIGATORI:
                           Geom: MeshGeometry,
                           Material: Stamp,
                           //PARAMETRI OPZIONALI
                           Type: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshType,
                           Name: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Name,
                           Position: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Position,
                           Rotation: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Rotation,
                           Scale: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Scale,
                           Visible: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Visible,
                           Shadows: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Shadows,
                           Group: MeshSubGroup
                        });
                     };

                  };
                  //SE È OPZIONABILE COME NUMERO
                  if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Option == "Number") {
                     if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Number[0] == x) {
                        const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshGroup[a].MeshArray[b]);
                        if (MeshGeometry.attributes.position) MeshGeometry.attributes.position.usage = THREE.StaticDrawUsage;
                        if (MeshGeometry.attributes.normal) MeshGeometry.attributes.normal.usage = THREE.StaticDrawUsage;
                        if (MeshGeometry.attributes.uv) MeshGeometry.attributes.uv.usage = THREE.StaticDrawUsage;

                        if (typeof Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Material === 'number') {
                           E3_UniversalMesh({
                              //PARAMETRI OBBLIGATORI:
                              Geom: MeshGeometry,
                              Material: MaterialArray[Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Material],
                              //PARAMETRI OPZIONALI
                              Type: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshType,
                              Name: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Name,
                              Position: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Position,
                              Rotation: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Rotation,
                              Scale: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Scale,
                              Visible: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Visible,
                              Shadows: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Shadows,
                              Group: MeshSubGroup
                           });
                        }
                        else if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Material == "StampDock") {
                           const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshGroup[a].MeshArray[b].StampDock, "", x + 1);
                           E3_UniversalMesh({
                              //PARAMETRI OBBLIGATORI:
                              Geom: MeshGeometry,
                              Material: Stamp,
                              //PARAMETRI OPZIONALI
                              Type: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshType,
                              Name: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Name,
                              Position: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Position,
                              Rotation: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Rotation,
                              Scale: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Scale,
                              Visible: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Visible,
                              Shadows: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Shadows,
                              Group: MeshSubGroup
                           });
                        };
                     };
                  };
               };

               //SE È UN GRUPPO GENERA UN GRUPPO
               if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Group == true) {
                  if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Option == true) {
                     MeshSubGroup.add(GenerateMeshGroupLevelB(a, b, x));
                  };
                  //SE È OPZIONABILE COME NUMERO
                  if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Option == "Number") {
                     if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Number[0] == x) {
                        MeshSubGroup.add(GenerateMeshGroupLevelB(a, b, x));
                     };
                  };
               };
            };

            //RUOTA LA GEOMETRIA RISULTANTE
            if (Geometrie[GeomModel].MeshGroup[a].Moltiplication == "Coaxial") {
               let Rotate = (Math.PI * 2) / Number * (x + 1) + InitialRot;
               if (Axes == "X") MeshSubGroup.rotation.set(Rotate, 0, 0);
               if (Axes == "Y") MeshSubGroup.rotation.set(0, Rotate, 0);
               if (Axes == "Z") MeshSubGroup.rotation.set(0, 0, Rotate);
            };

            if (Geometrie[GeomModel].MeshGroup[a].Moltiplication == "Linear") {
               let Translate = OffsetPos * x + InitialPos;
               if (Axes == "X") MeshSubGroup.position.set(Translate, 0, 0);
               if (Axes == "Y") MeshSubGroup.position.set(0, Translate, 0);
               if (Axes == "Z") MeshSubGroup.position.set(0, 0, Translate);
            };

            MeshGroup.add(MeshSubGroup);
         };

         //TRASLA LA GEOMETRIA RISULTANTE
         MeshGroup.position.set(
            Geometrie[GeomModel].MeshGroup[a].Position[0],
            Geometrie[GeomModel].MeshGroup[a].Position[1],
            Geometrie[GeomModel].MeshGroup[a].Position[2]);

         return MeshGroup;
      };

      //GENERA UN GRUPPO DI LIVELLO B E GEOMETRIE DI LIVELLO C
      function GenerateMeshGroupLevelB(a, b, x) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const MeshGroup = new THREE.Group();

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Coaxial[0];
            Axes = Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Coaxial[1];
            InitialRot = Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Coaxial[2];
         };

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO LINEARE---------------------------------------*/
         if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Linear[0];
            Axes = Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Linear[1];
            InitialPos = Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Linear[2];
            OffsetPos = Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Linear[3];
         };

         /*------------------------LIVELLO C - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let y = 0; y < Number; y++) {
            const MeshSubGroup = new THREE.Group();
            for (let c = 0; c < Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray.length; c++) {
               //SE NON È UN GRUPPO GENERA LA MESH
               if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Group == false) {
                  if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Option == true) {
                     const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c]);
                     if (MeshGeometry.attributes.position) MeshGeometry.attributes.position.usage = THREE.StaticDrawUsage;
                     if (MeshGeometry.attributes.normal) MeshGeometry.attributes.normal.usage = THREE.StaticDrawUsage;
                     if (MeshGeometry.attributes.uv) MeshGeometry.attributes.uv.usage = THREE.StaticDrawUsage;

                     if (typeof Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Material === 'number') {
                        E3_UniversalMesh({
                           //PARAMETRI OBBLIGATORI:
                           Geom: MeshGeometry,
                           Material: MaterialArray[Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Material],
                           //PARAMETRI OPZIONALI
                           Type: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].MeshType,
                           Name: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Name,
                           Position: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Position,
                           Rotation: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Rotation,
                           Scale: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Scale,
                           Visible: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Visible,
                           Shadows: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Shadows,
                           Group: MeshSubGroup
                        });
                     }
                     else if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Material == "StampDock") {
                        const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].StampDock, x + 1, y + 1);
                        E3_UniversalMesh({
                           //PARAMETRI OBBLIGATORI:
                           Geom: MeshGeometry,
                           Material: Stamp,
                           //PARAMETRI OPZIONALI
                           Type: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].MeshType,
                           Name: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Name,
                           Position: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Position,
                           Rotation: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Rotation,
                           Scale: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Scale,
                           Visible: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Visible,
                           Shadows: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Shadows,
                           Group: MeshSubGroup
                        });
                     };

                  };
                  //SE È OPZIONABILE COME NUMERO
                  if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Option == "Number") {
                     if ((Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number.length == 2 &&
                        Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number[0] == x &&
                        Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number[1] == y) ||
                        (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number.length == 1 &&
                           Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number[0] == y)) {
                        const MeshGeometry = GenerateGeometry(Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c]);
                        if (MeshGeometry.attributes.position) MeshGeometry.attributes.position.usage = THREE.StaticDrawUsage;
                        if (MeshGeometry.attributes.normal) MeshGeometry.attributes.normal.usage = THREE.StaticDrawUsage;
                        if (MeshGeometry.attributes.uv) MeshGeometry.attributes.uv.usage = THREE.StaticDrawUsage;

                        if (typeof Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Material === 'number') {
                           E3_UniversalMesh({
                              //PARAMETRI OBBLIGATORI:
                              Geom: MeshGeometry,
                              Material: MaterialArray[Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Material],
                              //PARAMETRI OPZIONALI
                              Type: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].MeshType,
                              Name: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Name,
                              Position: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Position,
                              Rotation: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Rotation,
                              Scale: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Scale,
                              Visible: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Visible,
                              Shadows: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Shadows,
                              Group: MeshSubGroup
                           });
                        }
                        else if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Material == "StampDock") {
                           const Stamp = E3_StampCanvas(Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].StampDock, x + 1, y + 1);
                           E3_UniversalMesh({
                              //PARAMETRI OBBLIGATORI:
                              Geom: MeshGeometry,
                              Material: Stamp,
                              //PARAMETRI OPZIONALI
                              Type: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].MeshType,
                              Name: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Name,
                              Position: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Position,
                              Rotation: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Rotation,
                              Scale: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Scale,
                              Visible: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Visible,
                              Shadows: Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Shadows,
                              Group: MeshSubGroup
                           });
                        };
                     };
                  };
               };

               //SE È UN GRUPPO GENERA UN GRUPPO
               if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Group == true) {
                  if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Option == true) {
                     //MeshSubGroup.add(GenerateMeshGroupLevelC(a, b, c));
                  };
                  //SE È OPZIONABILE COME NUMERO
                  if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Option == "Number") {
                     if ((Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number.length == 2 &&
                        Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number[0] == x &&
                        Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number[1] == y) ||
                        (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number.length == 1 &&
                           Geometrie[GeomModel].MeshGroup[a].MeshArray[b].MeshArray[c].Number[0] == y)) {
                        //MeshSubGroup.add(GenerateMeshGroupLevelC(a, b, c));
                     };

                  };
               };
            };

            //RUOTA LA GEOMETRIA RISULTANTE
            if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Moltiplication == "Coaxial") {
               let Rotate = (Math.PI * 2) / Number * (y + 1) + InitialRot;
               if (Axes == "X") MeshSubGroup.rotation.set(Rotate, 0, 0);
               if (Axes == "Y") MeshSubGroup.rotation.set(0, Rotate, 0);
               if (Axes == "Z") MeshSubGroup.rotation.set(0, 0, Rotate);
            };

            if (Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Moltiplication == "Linear") {
               let Translate = OffsetPos * y + InitialPos;
               if (Axes == "X") MeshSubGroup.position.set(Translate, 0, 0);
               if (Axes == "Y") MeshSubGroup.position.set(0, Translate, 0);
               if (Axes == "Z") MeshSubGroup.position.set(0, 0, Translate);
            };

            MeshGroup.add(MeshSubGroup);
         };

         //TRASLA LA GEOMETRIA RISULTANTE
         MeshGroup.position.set(
            Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Position[0],
            Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Position[1],
            Geometrie[GeomModel].MeshGroup[a].MeshArray[b].Position[2]);

         return MeshGroup;
      };

      //TROVA LA MESH DEL RAGGIO TRAENTE E SPOSTALA ALL'INTERNO DEL GRUPPO PRINCIPALE
      function RepositionTractor() {
         const TractorObject = SubMeshGroup.getObjectByName("Tractor");
         SubMeshGroup.attach(TractorObject);    //PER FARE AVERE AL RAGGIO TRAENTE LE COORDINATE GLOBALI DELL'OGGETTO
      };
      if (Tractor == true) RepositionTractor();

      //TROVA E RIMUOVI TUTTI I GRUPPI VUOTI
      function RemoveEmptyGroups(parent) {
         //Filtra i figli che sono gruppi vuoti
         const emptyGroups = parent.children.filter(child =>
            child.type === 'Group' && child.children.length === 0
         );

         //Rimuovi i gruppi vuoti
         for (const group of emptyGroups) {
            parent.remove(group);
         };

         //Ricorri sui figli rimanenti
         for (const child of parent.children) {
            if (child.isGroup || child.isObject3D) {
               RemoveEmptyGroups(child);
            };
         };
      };
      RemoveEmptyGroups(SubMeshGroup);

   };
   /*GENERA UN ARRAY DI GEOMETRIE INDICIZZATE*/
   async function GenericGeometry(GeomModel, Variante) {
      //APPLICAZIONE DELLE VARIABILI      
      Geometrie[GeomModel].Variante(Geometrie[GeomModel].Varianti[Variante]);

      /*------------------------LIVELLO A - PER OGNI GRUPPO DI GEOMETRIE GENERICHE MULTIMATERIALE-------------------------*/
      const Geometries = [];
      if (Geometrie[GeomModel].Multi.length > 0) {
         MultiGeom++;
         for (let a = 0; a < Geometrie[GeomModel].Multi.length; a++) {
            //CREA UN ARRAY DI GEOMETRIE PER OGNI MATERIALE
            const GeomArray = [];

            /*---------------------------------LIVELLO B - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
            for (let b = 0; b < Geometrie[GeomModel].Multi[a].Geometry.length; b++) {
               //SE NON È UN GRUPPO GENERA LA GEOMETRIA
               if (Geometrie[GeomModel].Multi[a].Geometry[b].Group == false) {
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].Option == true) {
                     GeomArray.push(GenerateGeometry(Geometrie[GeomModel].Multi[a].Geometry[b]));
                  };
               };

               //SE È UN GRUPPO
               if (Geometrie[GeomModel].Multi[a].Geometry[b].Group == true) {
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].Option == true) {
                     //GENERA IL GRUPPO DI LIVELLO B E LE GEOMETRIE DI LIVELLO C
                     GeomArray.push(GenerateMultiGroupLevelB(a, b));
                  };
               };
            };

            //UNISCI LE GEOMETRIE PER OGNI MATERIALE
            const GeomMaterial = BufferGeometryUtils.mergeGeometries(GeomArray);

            //UNIFORMA GLI ATTRIBUTI UV
            resetUVs(GeomMaterial);

            //AGGIUNGI LE GEOMETRIE PER MATERIALE ALL'ARRAY GENERALE
            Geometries.push(GeomMaterial);
         };
         //UNISCI LE GEOMETRIE PER MATERIALE
         const mergedGeometry = BufferGeometryUtils.mergeGeometries(Geometries, false);
         //CALCOLA I GRUPPI A MANO
         let offset = 0;
         for (let i = 0; i < Geometries.length; i++) {
            const index = Geometries[i].getIndex();
            const count = index ? index.count : Geometries[i].getAttribute('position').count;
            mergedGeometry.addGroup(offset, count, i);
            offset += count;
         };
         mergedGeometry.attributes.position.usage = THREE.StaticDrawUsage;
         mergedGeometry.attributes.normal.usage = THREE.StaticDrawUsage;
         mergedGeometry.attributes.uv.usage = THREE.StaticDrawUsage;

         UniversalGeom[Geometrie[GeomModel].Varianti[Variante].Indice] = mergedGeometry;
      };

      //GENERA UN GRUPPO DI LIVELLO B E GEOMETRIE DI LIVELLO C
      function GenerateMultiGroupLevelB(a, b) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Multi[a].Geometry[b].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[0];
            Axes = Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[3]) NumVisible = Geometrie[GeomModel].Multi[a].Geometry[b].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Multi[a].Geometry[b].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Multi[a].Geometry[b].Linear[0];
            Axes = Geometrie[GeomModel].Multi[a].Geometry[b].Linear[1];
            InitialPos = Geometrie[GeomModel].Multi[a].Geometry[b].Linear[2];
            OffsetPos = Geometrie[GeomModel].Multi[a].Geometry[b].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO C - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let x = 0; x < Number; x++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (x < NumVisible) {
               for (let c = 0; c < Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray.length; c++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Group == false) {
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c]));

                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Group == true) {
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Option == true) {
                        //GENERA IL GRUPPO DI LIVELLO C E LE GEOMETRIE DI LIVELLO D
                        const GeomGroupC = GenerateMultiGroupLevelC(a, b, c, x);
                        GeomArraySubGroup.push(GeomGroupC);
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Multi[a].Geometry[b].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (x + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Multi[a].Geometry[b].Moltiplication == "Linear") {
                  let Translate = OffsetPos * x + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };
         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE  (ABILITATA)
         if (Geometrie[GeomModel].Multi[a].Geometry[b].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Multi[a].Geometry[b].Translate.x,
               Geometrie[GeomModel].Multi[a].Geometry[b].Translate.y,
               Geometrie[GeomModel].Multi[a].Geometry[b].Translate.z,
            );
         };

         return GeomGroup;
      };

      //GENERA UN GRUPPO DI LIVELLO C E GEOMETRIE DI LIVELLO D
      function GenerateMultiGroupLevelC(a, b, c, x) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[0];
            Axes = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[3]) NumVisible = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Linear[0];
            Axes = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Linear[1];
            InitialPos = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Linear[2];
            OffsetPos = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO D - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let y = 0; y < Number; y++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (y < NumVisible) {
               for (let d = 0; d < Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray.length; d++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Group == false) {
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d]));
                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Group == true) {
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Option == true) {
                        //GENERA IL GRUPPO DI LIVELLO D E LE GEOMETRIE DI LIVELLO E
                        const GeomGroupD = GenerateMultiGroupLevelD(a, b, c, d, x, y);
                        GeomArraySubGroup.push(GeomGroupD);
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (y + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Moltiplication == "Linear") {
                  let Translate = OffsetPos * y + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };

         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE (ABILITATA)
         if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Translate.x,
               Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Translate.y,
               Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].Translate.z,
            );
         };

         return GeomGroup;
      };
      function GenerateMultiGroupC(a, b, c, x) {      //UTILIZZO DI REFERENCE
         //REFERENCE
         const Reference = ReferenceFunc(2, {
            GeomModel: GeomModel,
            Multi: a,
            Geometry: b,
            GeomArrayA: c
         });
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Reference.Moltiplication == "Coaxial") {
            Number = Reference.Coaxial[0];
            Axes = Reference.Coaxial[1];
            InitialRot = Reference.Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Reference.Coaxial[3]) NumVisible = Reference.Coaxial[3];
            else NumVisible = Number;
         };

         if (Reference.Moltiplication == "Linear") {
            Number = Reference.Linear[0];
            Axes = Reference.Linear[1];
            InitialPos = Reference.Linear[2];
            OffsetPos = Reference.Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO D - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let y = 0; y < Number; y++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (y < NumVisible) {
               for (let d = 0; d < Reference.GeomArray.length; d++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Reference.GeomArray[d].Group == false) {
                     if (Reference.GeomArray[d].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Reference.GeomArray[d]));
                     };
                  };
                  //SE È UN GRUPPO
                  if (Reference.GeomArray[d].Group == true) {
                     if (Reference.GeomArray[d].Option == true) {
                        //GENERA IL GRUPPO DI LIVELLO D E LE GEOMETRIE DI LIVELLO E
                        const GeomGroupD = GenerateMultiGroupLevelD(a, b, c, d, x, y);
                        GeomArraySubGroup.push(GeomGroupD);
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Reference.Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (y + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Reference.Moltiplication == "Linear") {
                  let Translate = OffsetPos * y + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };

         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE (ABILITATA)
         if (Reference.Translate.Enable == true) {
            GeomGroup.translate(
               Reference.Translate.x,
               Reference.Translate.y,
               Reference.Translate.z,
            );
         };

         return GeomGroup;
      };

      //GENERA UN GRUPPO DI LIVELLO D E GEOMETRIE DI LIVELLO E
      function GenerateMultiGroupLevelD(a, b, c, d, x, y) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[0];
            Axes = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[3]) NumVisible = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[0];
            Axes = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[1];
            InitialPos = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[2];
            OffsetPos = Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO E - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let z = 0; z < Number; z++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (z < NumVisible) {
               for (let e = 0; e < Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray.length; e++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Group == false) {
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e]));
                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Group == true) {
                     //SE NON È OPZIONABILE
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == false) {
                        //GENERA IL GRUPPO DI LIVELLO E E LE GEOMETRIE DI LIVELLO F
                        //const GeomGroupC = GenerateMultiGroupLevelC(a, b, c);
                        //GeomArraySubGroup.push(GeomGroupC);
                     };
                     //SE È OPZIONABILE
                     if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == true) {
                        //CERCA NELLA VARIABILI SE L'OPZIONE È TRUE
                        for (let i = 0; i < Geometrie[GeomModel].Variabili.Option.length; i++) {
                           if (Geometrie[GeomModel].Variabili.Option[i].length == 6 && Geometrie[GeomModel].Variabili.Option[i][0] == a &&
                              Geometrie[GeomModel].Variabili.Option[i][1] == b && Geometrie[GeomModel].Variabili.Option[i][2] == c &&
                              Geometrie[GeomModel].Variabili.Option[i][3] == d && Geometrie[GeomModel].Variabili.Option[i][4] == d &&
                              Geometrie[GeomModel].Variabili.Option[i][5] == true) {
                              //GENERA IL GRUPPO DI LIVELLO E E LE GEOMETRIE DI LIVELLO F
                              //const GeomGroupC = GenerateMultiGroupLevelC(a, b, c);
                              //GeomArraySubGroup.push(GeomGroupC);
                           };
                        };
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (z + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Linear") {
                  let Translate = OffsetPos * z + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };

         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE
         if (Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.x,
               Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.y,
               Geometrie[GeomModel].Multi[a].Geometry[b].GeomArray[c].GeomArray[d].Translate.z,
            );
         };

         return GeomGroup;
      };


   };
   /*GENERA UN ARRAY DI GEOMETRIE INDICIZZATE*/
   async function GenericRecycledGeometry(GeomModel, Model) {
      /*------------------------LIVELLO A - PER OGNI GRUPPO DI GEOMETRIE GENERICHE MULTIMATERIALE-------------------------*/
      const Geometries = [];

      for (let a = 0; a < Geometrie[GeomModel].Recycled[Model].length - 1; a++) {
         RecycledGeom++;
         //CREA UN ARRAY DI GEOMETRIE PER OGNI MATERIALE
         const GeomArray = [];

         /*---------------------------------LIVELLO B - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         for (let b = 0; b < Geometrie[GeomModel].Recycled[Model][a + 1].Geometry.length; b++) {
            //SE NON È UN GRUPPO GENERA LA GEOMETRIA
            if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Group == false) {
               if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Option == true) {
                  GeomArray.push(GenerateGeometry(Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b]));
               };
            };

            //SE È UN GRUPPO
            if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Group == true) {
               if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Option == true) {
                  //GENERA IL GRUPPO DI LIVELLO B E LE GEOMETRIE DI LIVELLO C
                  GeomArray.push(GenerateMultiGroupLevelB(a, b));
               };
            };

         };
         //UNISCI LE GEOMETRIE PER OGNI MATERIALE
         const GeomMaterial = BufferGeometryUtils.mergeGeometries(GeomArray);

         //UNIFORMA GLI ATTRIBUTI UV
         resetUVs(GeomMaterial);

         //AGGIUNGI LE GEOMETRIE PER MATERIALE ALL'ARRAY GENERALE
         Geometries.push(GeomMaterial);
      };

      //UNISCI LE GEOMETRIE PER MATERIALE
      const mergedGeometry = BufferGeometryUtils.mergeGeometries(Geometries, false);
      //CALCOLA I GRUPPI A MANO
      let offset = 0;
      for (let i = 0; i < Geometries.length; i++) {
         const index = Geometries[i].getIndex();
         const count = index ? index.count : Geometries[i].getAttribute('position').count;
         mergedGeometry.addGroup(offset, count, i);
         offset += count;
      };

      UniversalGeom[Geometrie[GeomModel].Recycled[Model][0].Indice] = mergedGeometry;


      //GENERA UN GRUPPO DI LIVELLO B E GEOMETRIE DI LIVELLO C
      function GenerateMultiGroupLevelB(a, b) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Coaxial[0];
            Axes = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Coaxial[3]) NumVisible = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Linear[0];
            Axes = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Linear[1];
            InitialPos = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Linear[2];
            OffsetPos = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO C - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let x = 0; x < Number; x++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (x < NumVisible) {
               for (let c = 0; c < Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray.length; c++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Group == false) {
                     if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c]));

                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Group == true) {
                     if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Option == true) {
                        //GENERA IL GRUPPO DI LIVELLO C E LE GEOMETRIE DI LIVELLO D
                        const GeomGroupC = GenerateMultiGroupLevelC(a, b, c, x);
                        GeomArraySubGroup.push(GeomGroupC);
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (x + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Moltiplication == "Linear") {
                  let Translate = OffsetPos * x + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };
         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE  (ABILITATA)
         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Translate.x,
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Translate.y,
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].Translate.z,
            );
         };

         return GeomGroup;
      };

      //GENERA UN GRUPPO DI LIVELLO C E GEOMETRIE DI LIVELLO D
      function GenerateMultiGroupLevelC(a, b, c, x) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Coaxial[0];
            Axes = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Coaxial[3]) NumVisible = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Linear[0];
            Axes = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Linear[1];
            InitialPos = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Linear[2];
            OffsetPos = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO D - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let y = 0; y < Number; y++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (y < NumVisible) {
               for (let d = 0; d < Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray.length; d++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Group == false) {
                     if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d]));
                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Group == true) {
                     if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Option == true) {
                        //GENERA IL GRUPPO DI LIVELLO D E LE GEOMETRIE DI LIVELLO E
                        const GeomGroupD = GenerateMultiGroupLevelD(a, b, c, d, x, y);
                        GeomArraySubGroup.push(GeomGroupD);
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (y + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Moltiplication == "Linear") {
                  let Translate = OffsetPos * y + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };

         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE (ABILITATA)
         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Translate.x,
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Translate.y,
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].Translate.z,
            );
         };

         return GeomGroup;
      };

      //GENERA UN GRUPPO DI LIVELLO D E GEOMETRIE DI LIVELLO E
      function GenerateMultiGroupLevelD(a, b, c, d, x, y) {
         //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
         const GeomArrayGroup = [];

         //DATI DI MOLTIPLICAZIONE
         let Number = 1;         //NUMERO DI MOLTIPLICAZIONI
         let Axes;               //ASSE DI ROTAZIONE/TRASLAZIONE
         let InitialRot = 0;     //ROTAZIONE INIZIALE
         let InitialPos = 0;     //POSIZIONE INIZIALE
         let OffsetPos = 0;      //OFFSET DI POSIZIONE PER OGNI MOLTIPLICAZIONE
         let NumVisible = 0;      //NUMERO DI OGGETTI VISIBILI NELLA MOLTIPLICAZIONE COASSIALE

         /*-----------------------------SE IL GRUPPO È MOLTIPLICATO IN MODO COASSIALE---------------------------------------*/
         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Coaxial") {
            Number = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[0];
            Axes = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[1];
            InitialRot = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[2];
            //SEGMENTI CIRCOLARI VISIBILI
            if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[3]) NumVisible = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Coaxial[3];
            else NumVisible = Number;
         };

         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Linear") {
            Number = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Linear[0];
            Axes = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Linear[1];
            InitialPos = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Linear[2];
            OffsetPos = Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Linear[3];
            NumVisible = Number;
         };

         /*------------------------LIVELLO E - PER OGNI GEOMETRIA O GRUPPO DI GEOMETRIE------------------------------------*/
         //PER OGNI GEOMETRIE MOLTIPLICATA
         for (let z = 0; z < Number; z++) {
            //CREA UN ARRAY DI GEOMETRIE PER IL GRUPPO
            const GeomArraySubGroup = [];
            if (z < NumVisible) {
               for (let e = 0; e < Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].GeomArray.length; e++) {
                  //SE NON È UN GRUPPO GENERA LA GEOMETRIA
                  if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Group == false) {
                     if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == true) {
                        GeomArraySubGroup.push(GenerateGeometry(Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e]));
                     };
                  };
                  //SE È UN GRUPPO
                  if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Group == true) {
                     //SE NON È OPZIONABILE
                     if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == false) {
                        //GENERA IL GRUPPO DI LIVELLO E E LE GEOMETRIE DI LIVELLO F
                        //const GeomGroupC = GenerateMultiGroupLevelC(a, b, c);
                        //GeomArraySubGroup.push(GeomGroupC);
                     };
                     //SE È OPZIONABILE
                     if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].GeomArray[e].Option == true) {
                        //CERCA NELLA VARIABILI SE L'OPZIONE È TRUE
                        for (let i = 0; i < Geometrie[GeomModel].Variabili.Option.length; i++) {
                           if (Geometrie[GeomModel].Variabili.Option[i].length == 6 && Geometrie[GeomModel].Variabili.Option[i][0] == a &&
                              Geometrie[GeomModel].Variabili.Option[i][1] == b && Geometrie[GeomModel].Variabili.Option[i][2] == c &&
                              Geometrie[GeomModel].Variabili.Option[i][3] == d && Geometrie[GeomModel].Variabili.Option[i][4] == d &&
                              Geometrie[GeomModel].Variabili.Option[i][5] == true) {
                              //GENERA IL GRUPPO DI LIVELLO E E LE GEOMETRIE DI LIVELLO F
                              //const GeomGroupC = GenerateMultiGroupLevelC(a, b, c);
                              //GeomArraySubGroup.push(GeomGroupC);
                           };
                        };
                     };
                  };
               };

               //UNISCI LE GEOMETRIE
               const Geometry = BufferGeometryUtils.mergeGeometries(GeomArraySubGroup);

               //RUOTA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Coaxial") {
                  let Rotate = (Math.PI * 2) / Number * (z + 1) + InitialRot;
                  if (Axes == "X") Geometry.rotateX(Rotate);
                  if (Axes == "Y") Geometry.rotateY(Rotate);
                  if (Axes == "Z") Geometry.rotateZ(Rotate);
               };

               //TRASLA LA GEOMETRIA RISULTANTE
               if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Moltiplication == "Linear") {
                  let Translate = OffsetPos * z + InitialPos;
                  if (Axes == "X") Geometry.translate(Translate, 0, 0);
                  if (Axes == "Y") Geometry.translate(0, Translate, 0);
                  if (Axes == "Z") Geometry.translate(0, 0, Translate);
               };

               GeomArrayGroup.push(Geometry);
            };
         };

         //UNISCI LE GEOMETRIE
         const GeomGroup = BufferGeometryUtils.mergeGeometries(GeomArrayGroup);

         //TRASLA LA GEOMETRIA RISULTANTE
         if (Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Translate.Enable == true) {
            GeomGroup.translate(
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Translate.x,
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Translate.y,
               Geometrie[GeomModel].Recycled[Model][a + 1].Geometry[b].GeomArray[c].GeomArray[d].Translate.z,
            );
         };

         return GeomGroup;
      };
   };

   /*--------------------------------ALGORITMO GERATIVO------------------------------------*/

   //FUNZIONE DI CREAZIONE GRUPPO PER FARLO FUNZIONARE IN ATTESA DEL CARICAMENTO DEL MODELLO
   function PreLoadGLB(Dir, Num, Name) {
      const SubMeshGroup = new THREE.Group();
      SubMeshGroup.name = `${Name} Generic`;
      Obj[Dir].Model[Num] = SubMeshGroup;
   };

   async function LoadGLB(Dir, Num, Url, Scale) {
      //MODELLO GLB
      const GlbLoader = new GLTFLoader();
      const DracoLoader = new DRACOLoader();
      DracoLoader.setDecoderPath('draco/');
      GlbLoader.setDRACOLoader(DracoLoader);
      const Data = await GlbLoader.loadAsync(Url);

      Data.scene.children[0].scale.setScalar(Scale);        //SCALA
      Data.scene.children[0].rotation.x = -Math.PI / 2;      //ROTAZIONE

      Obj[Dir].Model[Num].add(Data.scene.children[0]);
   };

   let PromiseCount = 0;

   /*------------------------------------PROMISES PLANETARY SYSTEM (STAZIONI SPAZIALI)---------------------------------------------*/
   if (Par.CreateObj.PlanetarySystem == true) {
      //PER OGNI PIANETA E PIANETA NANO
      for (let i = 0; i < Oggetti.PlanetarySystem.Modular.length; i++) {
         //PER OGNI SUA LUNA
         for (let a = 0; a < Oggetti.PlanetarySystem.Modular[i].Modular.length; a++) {
            //GENERAZIONE OGGETTO GENERICO
            if (Oggetti.PlanetarySystem.Modular[i].Modular[a].GenericModel == true) {
               Promises[PromiseCount] = () => Generic2(
                  'PlanetarySystem',
                  Oggetti.PlanetarySystem.Modular[i].Modular[a].Model,          //Numero
                  Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[0],        //Name
                  Oggetti.PlanetarySystem.Modular[i].Modular[a].GeomModel,           //NUMERO MODELLO NELL'ARRAY "GEOMETRIE"
                  Oggetti.PlanetarySystem.Modular[i].Modular[a].Variabili,      //OGGETTO VARIABILI
                  Oggetti.PlanetarySystem.Modular[i].Modular[a].Tractor.Enable,
                  Oggetti.PlanetarySystem.Modular[i].Modular[a].UniversalGeom,        //ARRAYGEOM
               );
               Promises[PromiseCount]._name = Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[0];
               Promises[PromiseCount]._module = "PlanetarySystem";
               Promises[PromiseCount]._modular = i;      //NUMERO MODULAR DEL PIANETA (ES MERCURIO=0)
               PromiseCount++;
               //INCREMENTA IL NUMERO DI PROMISE TOTALI SE IL MODELLO È DA CARICARE PER RENDERE COERENTE LA BARRA DI AVANZAMENTO
               if (Par.CreateObj.PlanetarySystemNum && i == Par.CreateObj.PlanetarySystemNum) TotalGeomPromises++;
            };

            //PER OGNI SUA SUB-LUNA
            for (let b = 0; b < Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular.length; b++) {
               //GENERAZIONE OGGETTO GENERICO
               if (Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].GenericModel == true) {
                  Promises[PromiseCount] = () => Generic2(
                     'PlanetarySystem',
                     Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Model,          //Numero
                     Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Name[0],        //Name
                     Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].GeomModel,           //NUMERO MODELLO NELL'ARRAY "GEOMETRIE"
                     Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Variabili,      //OGGETTO VARIABILI
                     Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Tractor.Enable,
                     Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].UniversalGeom,        //ARRAYGEOM
                  );
                  Promises[PromiseCount]._name = Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Name[0];
                  Promises[PromiseCount]._module = "PlanetarySystem";
                  Promises[PromiseCount]._modular = i;      //NUMERO MODULAR DEL PIANETA (ES MERCURIO=0)
                  PromiseCount++;
                  //INCREMENTA IL NUMERO DI PROMISE TOTALI SE IL MODELLO È DA CARICARE PER RENDERE COERENTE LA BARRA DI AVANZAMENTO
                  if (Par.CreateObj.PlanetarySystemNum && i == Par.CreateObj.PlanetarySystemNum) TotalGeomPromises++;
               };
            };
         };
      };
   };

   /*-----------------------------------------------------PROMISES NAVE--------------------------------------------------------------*/
   if (Par.CreateObj.Spaceship == true) {
      //GENERAZIONE OGGETTO GENERICO
      for (let i = 0; i < Oggetti.Spaceship.Modular.length; i++) {
         if (Oggetti.Spaceship.Modular[i].Mesh == true) {
            Promises[PromiseCount] = () => Generic2(
               'Spaceship',
               i,
               Oggetti.Spaceship.Modular[i].Name[Language],      //Name
               Oggetti.Spaceship.Modular[i].GeomModel,             //NUMERO MODELLO NELL'ARRAY "GEOMETRIE"
               {},            //OGGETTO VARIABILI
               false,         //RIPOSIZIONE RAGGIO TRAENTE
               true,
            );
            Promises[PromiseCount]._name = Oggetti.Spaceship.Modular[i].Name[Language];
            PromiseCount++;
            TotalGeomPromises++;
         };
      };
   };

   /*----------------------------------------PROMISES GENERICI (SE ABILITATE DALL'ARRAY)-------------------------------------------*/
   for (let i = 0; i < Oggetti.Generic.Modular.length; i++) {
      //ABILITARE GLI OGGETTI GENERICI NEI PARAMETRI DELL'ENGINE
      if (Par.CreateObj.GenericObject[i] == 1) {
         if (Oggetti.Generic.Modular[i].GenericModel == true) {
            Promises[PromiseCount] = () => Generic2(
               Oggetti.Generic.Modular[i].Dir,             //DIRECTORY NELL'ARRAY "Oggetti3D", SE NON EDITATA SI AGGIUNGERÀ ALLA SCENA DIRETTAMENTE
               i,
               Oggetti.Generic.Modular[i].Name,            //NOME
               Oggetti.Generic.Modular[i].GeomModel,       //NUMERO MODELLO NELL'ARRAY "GEOMETRIE"
               Oggetti.Generic.Modular[i].Variabili,       //OGGETTO VARIABILI
               false,                                       //RIPOSIZIONE RAGGIO TRAENTE
               Oggetti.Generic.Modular[i].UniversalGeom
            );
            Promises[PromiseCount]._name = Oggetti.Generic.Modular[i].Name;
            PromiseCount++;
            TotalGeomPromises++;
         };
         if (Oggetti.Generic.Modular[i].Glb == true) {
            Promises[PromiseCount] = new Promise((resolve, reject) => {
               resolve(PreLoadGLB(
                  Oggetti.Generic.Modular[i].Dir,             //DIRECTORY NELL'ARRAY "Oggetti3D", SE NON EDITATA SI AGGIUNGERÀ ALLA SCENA DIRETTAMENTE
                  i,
                  Oggetti.Generic.Modular[i].Name,            //NOME
               ));
               resolve(LoadGLB(
                  Oggetti.Generic.Modular[i].Dir,             //DIRECTORY NELL'ARRAY "Oggetti3D", SE NON EDITATA SI AGGIUNGERÀ ALLA SCENA DIRETTAMENTE
                  i,
                  Oggetti.Generic.Modular[i].Url,             //DIRECTORY DEL FILE IMPORTATO
                  Oggetti.Generic.Modular[i].Scale,           //SCALA DEL FILE IMPORTATO
               ));
            });
            PromiseCount++;
            TotalGeomPromises++;
         };
         //ABILITAZIONE GEOMETRIA INDICIZZATA

         if (Oggetti.Generic.Modular[i].UniversalGeom == true) {
            let Index = Oggetti.Generic.Modular[i].GeomModel;    //NUMERO MODELLO NELL'ARRAY "GEOMETRIE"
            Geometrie[Index].Parametri.Modulo = "Generic";
         };

      };
   };

   /*---------------------------------------------------PROMISES GEOMETRIE-----------------------------------------------------------*/
   for (let i = 0; i < Geometrie.length; i++) {
      //GEOMETRIA GENERICA
      if ('Parametri' in Geometrie[i] && 'Varianti' in Geometrie[i]) {
         //PLANETARY SYSTEM
         if (Par.CreateObj.PlanetarySystem == true && Geometrie[i].Parametri.Modulo == "PlanetarySystem")
            //PER OGNI VARIANTE
            for (let a = 0; a < Geometrie[i].Varianti.length; a++) {
               Promises[PromiseCount] = () => GenericGeometry(i, a);
               if (Geometrie[i].Varianti[a].Name) Promises[PromiseCount]._name = Geometrie[i].Varianti[a].Name;
               else Promises[PromiseCount]._name = "Geometria indicizzata Planetary System";
               Promises[PromiseCount]._module = "PlanetarySystem";
               Promises[PromiseCount]._modular = Geometrie[i].Varianti[a].Modular;      //NUMERO MODULAR DEL PIANETA (ES MERCURIO=0)
               PromiseCount++;
               if (Par.CreateObj.PlanetarySystemNum && i == Par.CreateObj.PlanetarySystemNum) TotalGeomPromises++;
            };
         //NAVE
         if (Par.CreateObj.Spaceship == true && Geometrie[i].Parametri.Modulo == "Spaceship")
            //PER OGNI VARIANTE
            for (let a = 0; a < Geometrie[i].Varianti.length; a++) {
               Promises[PromiseCount] = () => GenericGeometry(i, a);
               if (Geometrie[i].Varianti[a].Name) Promises[PromiseCount]._name = Geometrie[i].Varianti[a].Name;
               else Promises[PromiseCount]._name = "Geometria indicizzata Nave";
               PromiseCount++;
               TotalGeomPromises++;
            };
         //GENERICHE
         if (Geometrie[i].Parametri.Modulo == "Generic") //LA STRINGA "Generic" È INSERITA DINAMICAMENTE DALL'ARRAY Par.CreateObj.GenericObject
            //PER OGNI VARIANTE
            for (let a = 0; a < Geometrie[i].Varianti.length; a++) {
               Promises[PromiseCount] = () => GenericGeometry(i, a);
               if (Geometrie[i].Varianti[a].Name) Promises[PromiseCount]._name = Geometrie[i].Varianti[a].Name;
               else Promises[PromiseCount]._name = "Geometria indicizzata Generica";
               PromiseCount++;
               TotalGeomPromises++;
            };
      };
      //GEOMETRIA RICICLATA
      if ('Parametri' in Geometrie[i] && 'Recycled' in Geometrie[i]) {
         if (Par.CreateObj.PlanetarySystem == true && Geometrie[i].Parametri.Modulo == "PlanetarySystem")
            //PER OGNI OGGETTO RICICLATO
            for (let a = 0; a < Geometrie[i].Recycled.length; a++) {
               Promises[PromiseCount] = () => GenericRecycledGeometry(i, a);
               if (Geometrie[i].Recycled[a].Name) Promises[PromiseCount]._name = Geometrie[i].Recycled[a].Name;
               else Promises[PromiseCount]._name = "Geometria riciclata Planetary System";
               PromiseCount++;
               TotalGeomPromises++;
            };
      };
   };

   //ESEGUE LA PROMISE SPECIFICA
   async function ExecutePromise(promise) {
      try {
         PromiseName = promise._name;
         await promise();
         ActualGeomPromises++;
         E3_UpdateProgress(false);
         await new Promise(res => setTimeout(res, 0));

      } catch (error) {
         console.log(`Promise Error: ${error.message}`);
      };
   };

   //ESECUZIONE DELLE PROMISE TRANNE QUELLE ESCLUSE DI PLANETARYSYSTEM
   async function PromiseExecution() {
      for (let promise of Promises) {
         //SE NON ESISTE IL PARAMETRO _modular NELLA PROMISE OPPURE IL PARAMETRO CORRISPONDE, ESEGUI LA PROMISE
         if (promise._module == "PlanetarySystem") {
            if (Par.CreateObj.PlanetarySystemNum != null && Par.CreateObj.PlanetarySystemNum != "all") {
               //GEOMETRIE UNICHE ASSOCIATE A UN SOLO PIANETA
               if (promise._modular == Par.CreateObj.PlanetarySystemNum) ExecutePromise(promise);
               //GEOMETRIE GENERICHE CONDIVISE (INDUSTRIAL)
               if (promise._modular == null) ExecutePromise(promise);
            }
            else if (Par.CreateObj.PlanetarySystemNum == "all") ExecutePromise(promise);
         };

         if (!promise._module) ExecutePromise(promise);
      };
   };
   /*VERSIONE CON DELLE MICRO PAUSE*/
   // async function PromiseExecution() {
   //    const batchSize = 5; // quante Promises eseguire per volta
   //    for (let i = 0; i < Promises.length; i += batchSize) {
   //       const batch = Promises.slice(i, i + batchSize);

   //       // Esegui tutte le Promises del batch in parallelo
   //       await Promise.all(
   //          batch.map(promise => {
   //             // PlanetarySystem con numero specifico
   //             if (promise._module === "PlanetarySystem") {
   //                if (Par.CreateObj.PlanetarySystemNum != null && Par.CreateObj.PlanetarySystemNum !== "all") {
   //                   if (promise._modular === Par.CreateObj.PlanetarySystemNum) return ExecutePromise(promise);
   //                   if (promise._modular == null) return ExecutePromise(promise); // geometrie generiche condivise
   //                   return null; // ignora le altre
   //                } else if (Par.CreateObj.PlanetarySystemNum === "all") {
   //                   return ExecutePromise(promise);
   //                }
   //                return null;
   //             }

   //             // Promises senza _module
   //             if (!promise._module) return ExecutePromise(promise);

   //             return null; // fallback
   //          }).filter(p => p != null) // rimuove eventuali null
   //       );

   //       // Aspetta 1-2 frame per dare tempo al GC di liberare memoria
   //       await new Promise(r => requestAnimationFrame(r));
   //       await new Promise(r => requestAnimationFrame(r));
   //    }
   // };

   async function PlanSysPromiseExecution(Num) {
      for (let promise of Promises) {
         if (promise._module == "PlanetarySystem" && promise._modular == Num) ExecutePromise(promise);
      };
   };

   return { PromiseExecution, PlanSysPromiseExecution };
};

//------------------------------------------------LIVELLO 0 - ENGINE-------------------------------------------------------//
export async function MicEngine(Parameters, OggettiObj, GeometrieObj, MaterialiObj) {
   const startTime = performance.now();
   Par = Parameters;
   Oggetti = OggettiObj;
   Materiali = MaterialiObj;

   /*------------------------------------------------RENDERER--------------------------------------------------------------*/
   //#region
   const RendererObj = {};
   if (Number.isFinite(Antialiasing)) {
      if (Antialiasing == 0) RendererObj.antialias = false;
      if (Antialiasing == 1) RendererObj.antialias = true;
   }
   else RendererObj.antialias = false;
   RendererObj.preserveDrawingBuffer = false;             //true
   RendererObj.precision = "highp";            //'highp' | 'mediump' | 'lowp'  NON TOCCARE, mettendo su medium non si vedono più i pianeti su android
   RendererObj.alpha = false;                //DEFAULT false
   RendererObj.powerPreference = "high-performance";             //"high-performance", "low-power", "default"
   RendererObj.logarithmicDepthBuffer = Par.Renderer.LogarithmicDepthBuffer;

   renderer = new THREE.WebGLRenderer(RendererObj);
   renderer.setSize(window.innerWidth * Par.Renderer.Width, window.innerHeight * Par.Renderer.Height);
   if (Number.isFinite(Resolution)) {
      if (Resolution == 0) renderer.setPixelRatio(window.devicePixelRatio / 2);
      if (Resolution == 1) renderer.setPixelRatio(window.devicePixelRatio);
   }
   else renderer.setPixelRatio(window.devicePixelRatio);

   renderer.shadowMap.enabled = Par.Renderer.Shadows;
   renderer.shadowMap.type = THREE.BasicShadowMap;       //default
   renderer.outputColorSpace = THREE.SRGBColorSpace;
   //renderer.toneMapping = THREE.NoToneMapping;        //NON TOCCARE O SU ANDROID SPARISCONO I PIANETI

   //POSIZIONA LA SCENA
   renderer.domElement.style.position = "absolute";
   renderer.domElement.style.top = Par.Renderer.PosY;
   renderer.domElement.style.left = Par.Renderer.PosX;

   //DIAGNOSTICA RENDERER
   InitRuntimeAlertsDetailed(renderer);

   //RENDERIZZA LA SCENA
   document.body.appendChild(renderer.domElement);

   //RESIZE RENDERER
   window.addEventListener("resize", windowResizeHandler);
   function windowResizeHandler() {
      const width = window.innerWidth * Par.Renderer.Width;
      const height = window.innerHeight * Par.Renderer.Height;
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);    //NUOVO PROVARE A TENERE
      Camera.aspect = width / height;
      Camera.updateProjectionMatrix();
   };
   //windowResizeHandler();

   //MAPPA AMBIENTALE
   if (Par.Renderer.AmbientMap.Enable == true) {
      if (Par.Renderer.AmbientMap.Type == "png") {
         const CubeMapArray = [
            [
               'right.png',   //+X
               'left.png',    //-X
               'top.png',     //+Y
               'bottom.png',  //-Y
               'front.png',   //+Z
               'back.png'     //-Z
            ],
            //Rotazione di 90° verso destra attorno all’asse Y
            [
               'front.png',   //+X diventa front
               'back.png',    //-X diventa back
               'top.png',
               'bottom.png',
               'left.png',    //+Z diventa left
               'right.png'    //-Z diventa right
            ],
            //Rotazione di 180° attorno all’asse Y
            [
               'left.png',    //+X diventa left
               'right.png',   //-X diventa right
               'top.png',
               'bottom.png',
               'back.png',    //+Z diventa back
               'front.png'    //-Z diventa front
            ],
            //Rotazione di 270° verso destra attorno all’asse Y
            [
               'back.png',    //+X diventa back
               'front.png',   //-X diventa front
               'top.png',
               'bottom.png',
               'right.png',   //+Z diventa right
               'left.png'     //-Z diventa left
            ],
            //Rotazione di 90° verso l’alto attorno all’asse X
            [
               'right.png',
               'left.png',
               'front.png',   //+Y diventa front
               'back.png',    //-Y diventa back
               'bottom.png',  //+Z diventa bottom
               'top.png'      //-Z diventa top
            ],
            //Rotazione di 270° verso l’alto attorno all’asse X
            [
               'right.png',
               'left.png',
               'back.png',    //+Y diventa back
               'front.png',   //-Y diventa front
               'top.png',     //+Z diventa top
               'bottom.png'   //-Z diventa bottom
            ]
         ];
         const CubeLoader = new THREE.CubeTextureLoader(Manager);
         CubeLoader.setPath(Par.Renderer.AmbientMap.PngDirectory);
         const textureCube = CubeLoader.load(CubeMapArray[Par.Renderer.AmbientMap.PngRot]);
         Scene.environment = textureCube;
      };
      if (Par.Renderer.AmbientMap.Type == "hdr") {
         const pmrem = new THREE.PMREMGenerator(renderer);

         new HDRLoader().load(Par.Renderer.AmbientMap.HdrDirectory, (tex) => {
            const envMap = pmrem.fromEquirectangular(tex).texture;
            Scene.environment = envMap;
            tex.dispose();
            pmrem.dispose();
         });
      };
   };
   //#endregion

   /*-----------------------------------------------LOAD MANAGER-----------------------------------------------------------*/
   //#region
   LoaderScreen = S0_LoaderScreen(Par.LoaderScreen);
   Manager = new THREE.LoadingManager();

   let onLoadTimeout = null;

   //EVENTO START CARICAMENTO
   Manager.onStart = () => {
      LoaderScreen.LoaderDiv.style.display = 'block';

      //Se stava per sparire, annulla la chiusura
      if (onLoadTimeout) {
         clearTimeout(onLoadTimeout);
         onLoadTimeout = null;
      }
   };

   //EVENTO CARICAMENTO IN CORSO
   Manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      if (TotalTextures > 0) {
         LoadedTextures = itemsLoaded;
         UrlTexture = url;
      };
      E3_UpdateProgress(false);
   };

   /*------------------------------------------LOADER DELLE TEXTURE--------------------------------------------------------*/
   Loader = new THREE.TextureLoader(Manager);       //LOADER DELLE TEXTURE
   LoaderKTX2 = new KTX2Loader(Manager)
      .setTranscoderPath('../Engine/basis/')
      .detectSupport(renderer);

   //#endregion

   /*-------------------------------------------CARICAMENTO OGGETTI 3D-----------------------------------------------------*/
   //#region
   if (Par.Moduli.E0_CreationEngine == true) {
      CreationEngine = await E0_CreationEngine(Oggetti3D, Oggetti, GeometrieObj, MaterialiObj, Par, Manager);
      await CreationEngine.PromiseExecution();

      ActualModules++;
      //console.table({ RecycledGeom, MultiGeom, MultiObjects, GenericObjects, MeshMultiObjects, MeshGroupObjects });
   };



   //SE GLI OGGETTI GENERICI SONO ABILITATI
   if (Par.Moduli.E0_CreationEngine == true)
      for (let i = 0; i < Oggetti.Generic.Modular.length; i++) {
         if (Par.CreateObj.GenericObject[i] == 1) {
            let Object = E3_GenObjectFromGeneric({
               Num: i,
               PosX: 0,
               PosY: 0,
               PosZ: 0,
               Scale: 1
            });
            GenericGroup.add(Object);
         };
      };


   //#endregion

   /*--------------------------------------------------CAMERA--------------------------------------------------------------*/
   //#region
   Camera.fov = Par.Camera.CameraFov;
   Camera.aspect = (window.innerWidth * Par.Renderer.Width) / (window.innerHeight * Par.Renderer.Height);
   Camera.near = Par.Camera.CameraNear;
   Camera.far = Par.Camera.CameraFar;
   Camera.updateProjectionMatrix();

   CameraGroup.add(CameraGimbal);      //GRUPPO INERME
   CameraGimbal.add(CameraControl);    //ROTAZIONE MANUALE VISUALE E POSIZIONE VELOCITÀ
   CameraControl.add(Camera);          //GRUPPO TREMOLIO

   //ESPORTAZIONE

   //#endregion

   //---------------------------------------------------LUCI---------------------------------------------------------------*/
   //#region
   //LUCE AMBIENTALE
   if (Par.Luci.Ambient == true) {
      LuceAmbientale = new THREE.AmbientLight(Par.Luci.AmbientLight.Color);
      LuceAmbientale.name = "AmbientLight";
      LuceAmbientale.intensity = Par.Luci.AmbientLight.Int;
      Scene.add(LuceAmbientale);
      MicEnginereturn.Lights.AmbientLight = LuceAmbientale;
   };

   //LUCE DIREZIONALE
   if (Par.Luci.Directional == true) {
      LuceDirezionale = new THREE.DirectionalLight(Par.Luci.DirectionalLight.Color, Par.Luci.DirectionalLight.Int);
      LuceDirezionale.name = "DirectionalLight";
      LuceDirezionale.position.set(Par.Luci.DirectionalLight.PosX, Par.Luci.DirectionalLight.PosY, Par.Luci.DirectionalLight.PosZ);
      //OMBRE
      if (Par.Luci.DirectionalLight.Shadow == true) {
         LuceDirezionale.castShadow = true;
         LuceDirezionale.shadow.mapSize.width = Par.Luci.DirectionalLight.ShadowSize;
         LuceDirezionale.shadow.mapSize.height = Par.Luci.DirectionalLight.ShadowSize;
         LuceDirezionale.shadow.camera.near = Par.Luci.DirectionalLight.ShadowNear;
         LuceDirezionale.shadow.camera.far = Par.Luci.DirectionalLight.ShadowFar;
         LuceDirezionale.shadow.camera.left = -Par.Luci.DirectionalLight.ShadowWidth;
         LuceDirezionale.shadow.camera.right = Par.Luci.DirectionalLight.ShadowWidth;
         LuceDirezionale.shadow.camera.top = Par.Luci.DirectionalLight.ShadowHeight;
         LuceDirezionale.shadow.camera.bottom = -Par.Luci.DirectionalLight.ShadowHeight;
         LuceDirezionale.shadow.autoUpdate = Par.Luci.DirectionalLight.ShadowAutoUpdate;
         LuceDirezionale.shadow.camera.updateProjectionMatrix();
         //HELPER DELLE OMBRE
         if (Par.Luci.DirectionalLight.ShadowHelper == true) {
            const shadowHelper = new THREE.CameraHelper(LuceDirezionale.shadow.camera);
            shadowHelper.update();
            Scene.add(shadowHelper);
         };
      };
      Scene.add(LuceDirezionale);
      MicEnginereturn.Lights.DirLight = LuceDirezionale;

      //HELPER LUCE DIREZIONALE
      if (Par.Luci.DirectionalLight.Helper == true) {
         const DirHelper = new THREE.DirectionalLightHelper(LuceDirezionale, 5);
         DirHelper.name = "DirectionalLightHelper";
         Scene.add(DirHelper);
      };

      //TARGET LUCE DIREZIONALE
      LuceDirezionale.target = DirLightTarget;
      LuceDirezionale.target.name = "DirectionalLightTarget";
      Scene.add(LuceDirezionale.target);
      MicEnginereturn.Lights.DirLightTarget = DirLightTarget;
   };

   //LUCE EMISFERICA
   if (Par.Luci.Hemisphere == true) {
      LuceEmisferica = new THREE.HemisphereLight(Par.Luci.HemisphereSkyColor, Par.Luci.HemisphereGroundColor, Par.Luci.HemisphereInt);
      LuceEmisferica.name = "HemisphereLight";
      Scene.add(LuceEmisferica);
      MicEnginereturn.Lights.HemisphereLight = LuceEmisferica;

      //HELPER LUCE EMISFERICA
      if (Par.Luci.HemisphereHelper == true) {
         const HemisphereHelper = new THREE.HemisphereLightHelper(LuceEmisferica, 5);
         HemisphereHelper.name = "HemisphereLightHelper";
         Scene.add(HemisphereHelper);
      };
   };

   //LUCE PUNTIFORME
   if (Par.Luci.Point == true) {
      LucePuntiforme = new THREE.PointLight(Par.Luci.PointColor, Par.Luci.PointInt, Par.Luci.PointDistance, Par.Luci.PointDispersion);
      LucePuntiforme.name = "PointLight";
      LucePuntiforme.position.set(Par.Luci.PointPosX, Par.Luci.PointPosY, Par.Luci.PointPosZ);
      //OMBRE
      if (Par.Luci.PointShadow == true) {
         LucePuntiforme.castShadow = true;
         LucePuntiforme.shadow.mapSize.width = Par.Luci.PointShadowSize;
         LucePuntiforme.shadow.mapSize.height = Par.Luci.PointShadowSize;
         LucePuntiforme.shadow.camera.near = Par.Luci.PointShadowNear;
         LucePuntiforme.shadow.camera.far = Par.Luci.PointShadowFar;
         LucePuntiforme.shadow.camera.left = -Par.Luci.PointShadowWidth;
         LucePuntiforme.shadow.camera.right = Par.Luci.PointShadowWidth;
         LucePuntiforme.shadow.camera.top = Par.Luci.PointShadowHeight;
         LucePuntiforme.shadow.camera.bottom = -Par.Luci.PointShadowHeight;
         LucePuntiforme.shadow.autoUpdate = Par.Luci.PointShadowAutoUpdate;
         LucePuntiforme.shadow.camera.updateProjectionMatrix();
         //HELPER DELLE OMBRE
         if (Par.Luci.PointShadowHelper == true) {
            const shadowHelper = new THREE.CameraHelper(LucePuntiforme.shadow.camera);
            shadowHelper.update();
            Scene.add(shadowHelper);
         };
      };
      Scene.add(LucePuntiforme);
      MicEnginereturn.Lights.PointLight = LucePuntiforme;
   };
   //#endregion

   /*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
   /*--------------------------------------------VARIABILE DI ESPORTAZIONE------------------------------------------------------*/
   //#region
   const VarObjectExport = {
      PaceDone: false,
      Gamepad: {
         Connected: false,
         Index: null,
         Id: null,
         ButtonLenght: null,
         AxesLenght: null,
      },
   };
   /*----------------------------------------------------OGGETTI--------------------------------------------------------------*/
   VarObjectExport.PosZero = PosZero;                          //VETTORE DI POSIZIONE FISSA 0,0,0
   //VETTORE DI ROTAZIONE GREZZA DELLA CAMERA (DA CORREGGERE CON LA FUNZIONE AngleZero)
   VarObjectExport.GimbalAng = new THREE.Vector3(0, 0, 0);
   VarObjectExport.GimbalAngOffset = new THREE.Vector3();
   VarObjectExport.Version = Version;
   VarObjectExport.VersionText = `Neptune Engine V${Version}`;

   //VETTORI GENERICI
   MicEnginereturn.User.VetAsseX = VetAsseX;        //VETTORE GENERICO ASSE X
   MicEnginereturn.User.VetAsseY = VetAsseY;        //VETTORE GENERICO ASSE Y
   MicEnginereturn.User.VetAsseZ = VetAsseZ;        //VETTORE GENERICO ASSE Z

   //RAYCASTER
   MicEnginereturn.Raycaster.Ray = new THREE.Raycaster();
   MicEnginereturn.Raycaster.Vector = new THREE.Vector2();

   //GRUPPO DI OGGETTI 3D GENERATI O IMPORTATI CHE NON FANNO PARTE DI NESSUNA DIRECTORY
   MicEnginereturn.GenericGroup = GenericGroup;
   Scene.add(GenericGroup);

   VarObjectExport.E3_UpdateProgress = E3_UpdateProgress;

   /*--------------------FUNZIONI UNIVERSALI------------------*/
   MicEnginereturn.E3_Benchmark = E3_Benchmark;
   MicEnginereturn.E3_BenchmarkCanvas = E3_BenchmarkCanvas;
   VarObjectExport.E3_UserPosRot = E3_UserPosRot;

   /*-----------------------------------------------MATERIALI THREE.JS---------------------------------------------------------*/
   MicEnginereturn.Materials = {
      //MATERIALI BASE
      E3_MaterialeBase: E3_MaterialeBase,
      E3_MaterialeBaseColor: E3_MaterialeBaseColor,
      E3_MaterialeStandard: E3_MaterialeStandard,
      E3_MaterialeLucido: E3_MaterialeLucido,
      E3_MaterialeOpaco: E3_MaterialeOpaco,
      E3_MaterialeSprite: E3_MaterialeSprite,
      E3_MaterialePunti: E3_MaterialePunti,
      E3_LoadEditTexture: E3_LoadEditTexture,

      //MATERIALI PERSONALIZZATI
      E3_ShaderGlow: E3_ShaderGlow,
      E3_ShaderLens: E3_ShaderLens2,
      E3_ShaderOverlay: E3_ShaderOverlay,
      E3_ShaderOverlay: E3_ShaderOverlay,
      E3_StampCanvas: E3_StampCanvas,

      Export: MaterialExportArray,        //MATERIALI ESPORTATI
   };

   /*-----------------------------------------------GEOMETRIE THREE.JS---------------------------------------------------------*/
   MicEnginereturn.Geometries = {
      E3_GeoBox: E3_GeoBox,
      E3_GeoCylinder: E3_GeoCylinder,
      E3_GeoSphere: E3_GeoSphere,
      E3_GeoRing: E3_GeoRing,
      E3_GeoPlane: E3_GeoPlane,
      E3_GeoCircle: E3_GeoCircle,
      E3_GenerateFilamentCloud: E3_GenerateFilamentCloud,
   };

   /*-----------------------------------------------OGGETTI THREE.JS---------------------------------------------------------*/
   MicEnginereturn.Objects = {
      E3_GenMesh: E3_GenMesh,
      E3_UniversalMesh: E3_UniversalMesh,
      E3_GroupCanvasSprite: E3_GroupCanvasSprite,
      E3_Vector3: E3_Vector3,
      E3_Group: E3_Group,
      E3_Object3D: E3_Object3D,
      E3_Quaternion: E3_Quaternion,
      E3_Matrix4: E3_Matrix4,
      E3_Euler: E3_Euler,
      E3_CircularGradient: E3_CircularGradient,
   };

   /*----------------------------------------------FUNZIONI MATEMATICHE--------------------------------------------------------*/
   MicEnginereturn.Math = {
      E3_AngleZero: E3_AngleZero,
      CompareIncrement: CompareIncrement,
      E3_EulerQuaternionInterpolation: E3_EulerQuaternionInterpolation,
      E3_DisplayDistance: E3_DisplayDistance,
      DisplaySpeed: DisplaySpeed,
      CoeffMap: CoeffMap,
      E3_SortedArray: E3_SortedArray,
      E3_ModifyArray: E3_ModifyArray,
      E3_GenerateAttributes: E3_GenerateAttributes,
      E3_RandomPointInRing: E3_RandomPointInRing,
      E3_DisplayTime: E3_DisplayTime,
   };

   /*---------------------------------------------------FUNZIONI DOM----------------------------------------------------------*/
   MicEnginereturn.Dom = {};
   VarObjectExport.StandardCSS = StandardCSS;
   VarObjectExport.StandardCSSText = StandardCSSText;
   VarObjectExport.LampeggioSpia = LampeggioSpia;
   VarObjectExport.E3_DisplayNPC = E3_DisplayNPC;
   VarObjectExport.E3_DisplayNPCDoubleButton = E3_DisplayNPCDoubleButton;
   VarObjectExport.E3_DisplayNPCSingleButton = E3_DisplayNPCSingleButton;
   VarObjectExport.E3_PointerButton = E3_PointerButton;
   VarObjectExport.E3_CreateLines = E3_CreateLines;
   VarObjectExport.E3_UpdateText = E3_UpdateText;

   /*---------------------------------------------------FUNZIONI CANVAS----------------------------------------------------------*/
   MicEnginereturn.Canvas = {};
   MicEnginereturn.Canvas.E3_FillValueBarCanvas = E3_FillValueBarCanvas;

   /*-------------------------------------------------CLASSI GENERICHE--------------------------------------------------------*/
   VarObjectExport.OnceFunction = OnceFunction;
   VarObjectExport.OnceFunctionBool = OnceFunctionBool;

   /*-------------------------------------------------FUNZIONI THREE.JS-------------------------------------------------------*/
   VarObjectExport.CreateSpotLight = CreateSpotLight;
   VarObjectExport.WorldPos = WorldPos;
   VarObjectExport.LaserShots = LaserShots;
   VarObjectExport.SpaceEnemy = SpaceEnemy;
   VarObjectExport.E3_GenericLine = E3_GenericLine;
   VarObjectExport.E3_ConsoleLogSimpleObject = E3_ConsoleLogSimpleObject;
   VarObjectExport.E3_Explosion = E3_Explosion;
   VarObjectExport.E3_SferaColpibile = E3_SferaColpibile;
   VarObjectExport.E3_Braccio2Assi = E3_Braccio2Assi;
   VarObjectExport.E3_MovimentoInerzia = E3_MovimentoInerzia;
   VarObjectExport.E3_RadarCanvas = E3_RadarCanvas;
   VarObjectExport.E3_GenObjectFromGeneric = E3_GenObjectFromGeneric;

   /*---------------------------------------------------ESPORTAZIONE----------------------------------------------------------*/
   MicEnginereturn.VarObject = VarObjectExport;
   MicEnginereturn.User.Object = GroupUser;
   MicEnginereturn.User.UserDummy = UserDummy;
   MicEnginereturn.CameraGroup = CameraGroup;
   if (Par.Renderer.ReturnScene == true) MicEnginereturn.Scene = Scene; //ABILITA LA RESTITUZIONE DELL'INTERA SCENA IN "RETURN"

   //MONITORAGGIO DELLE RISORSE
   if (Par.Moduli.SimpleMonitor == true) {
      const clock3 = new THREE.Clock();
      VarObjectExport.Clock = clock3;
   };
   //#endregion

   /*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
   /*---------------------------------------------CARICAMENTO MODULI-------------------------------------------------------*/
   //#region
   /*--------------------CONTEGGIO TOTALE MODULI------------------------*/
   TotalModules = Object.values(Par.Moduli).filter(v => v === true).length;

   /*--------------------MOTORE FISICO--------------------------*/
   if (Par.Moduli.PhysicsEngine == true) {
      UrlModule = "PhysicsEngine";
      PhysicsEngine = E0_PhysicsEngine(Par.PhysicsEngine);        //CARICAMENTO MODULO

      //ESPORTAZIONE
      MicEnginereturn.PhysicsEngine = PhysicsEngine;
   };

   /*--------------------MODULAR SHIP-----------------------------*/
   //CONTIENE OGGETTO VARIABILI VarModularShip
   if (Par.Moduli.ModularShip == true) {
      UrlModule = "ModularShip";
      VarModularShip = {
         /*---------------------------------------------VARIABILI INTERNE AL MODULO---------------------------------------------------*/
         FrictionColor: [0, 0, 0],           //COLORE RGB EMISSIVE DELLA NAVE
         /*----------------------------------------VARIABILI FORNITE DAL MODULO (LETTURA)---------------------------------------------*/
         ColorStep: 0,           //PROGRESSIONE DEL SURRISCALDAMENTO DELLA NAVE QUANDO È IN ATTRITO CON L'ATMOSFERA (1/10 SEC)
         NumModules: [],      //ARRAY CON IL NUMERO DI MODULI ORDINATI PER NUMERO, INDICE=NUMERO DEL MODULO, VALORE=QUANTITÀ
         /*----------------------------------VARIABILI DA FORNIRE AL MODULO (LETTURA E SCRITTURA)-------------------------------------*/
         Moduli: 0,
         ModuleArray: [],
         AtmFriction: false,     //ATTRITO CON L'ATMOSFERA
      };

      const UserWorldQuat = new THREE.Quaternion();    //ROTAZIONE WORLD SPACESHIP
      MicEnginereturn.User.UserWorldQuat = UserWorldQuat;
      MicEnginereturn.User.RotatedObjects = RotatedObjects;
      MicEnginereturn.User.MotorLights = MotorLights;

      //NUOVA PARTITA
      if (Number(SaveSystem.getItem(`NewGame`)) == 0) {
         E2_ModularShipNewGame();
      }
      //PARTITA INIZIATA
      else {
         E1_ModularShipLoadGame();
         E3_UserPosRot();
      };

      //CARICAMENTO MODULO
      VarObjectExport.E0_ModularShip = E0_ModularShip;
      VarObjectExport.E1_UpdateRotatedObjects = E1_UpdateRotatedObjects;
      VarObjectExport.E1_UpdateLightObjects = E1_UpdateLightObjects;
      VarObjectExport.E1_ModularShipLoadGame = E1_ModularShipLoadGame;
      VarObjectExport.E1_UpdateNumModules = E1_UpdateNumModules;
      VarObjectExport.E1_ModularShipUpdate = E1_ModularShipUpdate;
      E0_ModularShip();
      MicEnginereturn.VarModularShip = VarModularShip;

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------DYNAMIC PLANETARY SYSTEM-----------------------*/
   //CONTIENE OGGETTO VARIABILI VarPlanetSystem
   if (Par.Moduli.DynamicPlanetarySystem == true) {
      UrlModule = "DynamicPlanetarySystem";
      VarPlanetSystem = {
         /*---------------------------------------------VARIABILI INTERNE AL MODULO---------------------------------------------------*/
         References: [],                //RIFERIMENTI DELLE POSIZIONI DELLE MESH PER RUOTARLE
         /*
         //REFERENCE PIANETI
         References[i] = {
            DayRot: Planetary.children[i + 1].children[0].children[0],
            SeasonRot: Planetary.children[i + 1].children[0],
            YearRot: Planetary.children[i + 1]
         };

         //REFERENCE LUNE
         References[i][a] = {
            //a+1 PERCHÈ IL CHILDREN[0] È IL PIANETA STESSO
            DayRot: Planetary.children[i + 1].children[0].children[a + 1].children[0],
            YearRot: Planetary.children[i + 1].children[0].children[a + 1]
         };

         REFERENCE SUB-LUNE
         References[i][a][b] = {
            //a+1 PERCHÈ IL CHILDREN[0] È IL PIANETA STESSO
            DayRot: Planetary.children[i + 1].children[0].children[a + 1].children[0].children[b + 1].children[0],
            YearRot: Planetary.children[i + 1].children[0].children[a + 1].children[0].children[b + 1]
         };
         */
         ArrayMoonsNum: [],            //ARRAY CON IL NUMERO DI TUTTE LE LUNE PER OGNI PIANETA
         ArraySubMoonsNum: [],         //ARRAY CON IL NUMERO DI TUTTE LE SUB-LUNE PER OGNI LUNA
         TractorTime: 0,
         CoeffRot: 1,                  //COEFFICIENTE ALLA ROTAZIONE DEI PIANETI DIPENDENTE DALLA CONTRAZIONE TEMPORALE
         RandomRotPlanet: [],          //ROTAZIONI INIZIALI CASUALI DEI PIANETI ALLA NUOVA PARTITA
         OrbitOnceLoaded: false,       //FUNZIONE ASINCRONA E1_InsertOrbitOnce CARICATA
         PlanetMaterial: null,         //MATERIALE DEI PIANETI SALVATO PER CARICARLO SE DOVESSE ESSERE SOSTITUITO

         /*----------------------------------------VARIABILI FORNITE DAL MODULO (LETTURA)---------------------------------------------*/
         PlanetsNum: Oggetti.PlanetarySystem.Modular.length,  //NUMERO DI PIANETI ESCLUSA LA STELLA MADRE
         OrbitPosition: 0,    //ROTAZIONE GLOBALE SOLAR SYSTEM
         //ARRAY POSIZIONI WORLD
         WorldPosPlanets: [],     //ARRAY CON LE POSIZIONI WORLD DEI PIANETI (ESCLUSO IL SOLE)
         WorldPosMoons: [],       //ARRAY CON LE POSIZIONI WORLD DELLE LUNE DEL PIANETA DENTRO CUI SIAMO
         WorldPosSubMoons: [],    //ARRAY CON LE POSIZIONI WORLD DELLE SUB-LUNE DELLA LUNA DENTRO CUI SIAMO
         //ARRAY DISTANZE
         IndDist: [],             //VALORI DISTANZE PIANETI DALLA NAVE SPAZIALE (km NEL GIOCO) (COMPRESO IL SOLE)
         IndMoonDist: [],         //VALORI DISTANZE LUNE DALLA NAVE SPAZIALE (km NEL GIOCO)
         IndSubMoonDist: [],      //VALORI DISTANZE SUB-LUNE DALLA NAVE SPAZIALE (km NEL GIOCO)
         //CALCOLO NUMERO DI LUNE E SUB-LUNE
         NumMajorMoons: 0,          //NUMERO DI LUNE PIÙ NUMEROSE ATTORNO AD UN PIANETA
         NumMajorSubMoons: 0,          //NUMERO DI SUB-LUNE PIÙ NUMEROSE ATTORNO AD UNA LUNA
         //VALORI PIANETA PIÙ VICINO                  
         NearPlanetDist: 0,            //DISTANZA PER IL PIANETA PIÙ VICINO
         NearPlanetIndex: 0,         //INDICE DEL PIANETA PIÙ VICINO (INCLUSO IL SOLE)
         NearPlanetDiameter: 0,        //DIAMETRO DEL PIANETA PIÙ VICINO (m)
         LastIndexTrigger: 0,
         NearPlanetUpdate: false,      //ABILITAZIONE ALL'AGGIORNAMENTO DEL SISTEMA PLANETARIO PIÙ VICINO
         //VALORI LUNA PIÙ VICINA
         NearMoonDist: 0,              //DISTANZA PER LA LUNA PIÙ VICINA
         NearMoonIndex: 0,              //INDICE DELLA LUNA PIÙ VICINA
         NearMoonDiameter: 0,        //DIAMETRO DELLA LUNA PIÙ VICINA
         NearMoonType: 0,           //TIPO LUNA PIÙ VICINA
         //VALORI SUB-LUNA PIÙ VICINA
         NearSubMoonDist: 0,           //DISTANZA PER LA SUB-LUNA PIÙ VICINA
         NearSubMoonIndex: 0,              //INDICE DELLA SUB-LUNA PIÙ VICINA
         NearSubMoonType: 0,              //TIPO SUB-LUNA PIÙ VICINA
         //ORBITE DINAMICHE
         PlanetOrbit: 0,            //ORBITA DI UN PIANETA RAGGIUNTA (INCLUSO IL SOLE) ES. TERRA=3
         MoonOrbit: 0,              //ORBITA DI UNA LUNA RAGGIUNTA (NUMERO DELLA LUNA +1, 0=NESSUNA ORBITA)
         SubMoonOrbit: 0,           //ORBITA DI UNA SUB-LUNA RAGGIUNTA (NUMERO DELLA LUNA +1, 0=NESSUNA ORBITA)
         NumMoons: 0,               //NUMERO DI LUNE ATTUALI
         NumSubMoons: 0,               //NUMERO DI SUB-LUNE ATTUALI
         StationOrbit: false,                //ORBITA STAZIONE SPAZIALE RAGGIUNTA (LUNA)
         SubStationOrbit: false,                //ORBITA STAZIONE SPAZIALE RAGGIUNTA (SUB-LUNA)
         PlanetOrbitPosition: 0,
         MoonOrbitPosition: 0,
         SubMoonOrbitPosition: 0,
         //RAGGIO TRAENTE
         NearTractor: Number(SaveSystem.getItem(`NearTractor`)),           //ENTRATA NEL RAGGIO TRAENTE
         NearTractorDist: 0,           //DISTANZA PER IL RAGGIO TAENTE PIÙ VICINO (SE ESISTE)
         TractorPosXShip: 0,           //DESTINAZIONE POSIZIONE X
         TractorPosYShip: 0,           //DESTINAZIONE POSIZIONE Y
         TractorPosZShip: 0,           //DESTINAZIONE POSIZIONE Z
         TractorRotXShip: 0,           //DESTINAZIONE ROTAZIONE X
         TractorRotYShip: 0,           //DESTINAZIONE ROTAZIONE Y
         TractorRotZShip: 0,           //DESTINAZIONE ROTAZIONE Z
         TractorPosXShipRelease: 0,
         TractorPosYShipRelease: 0,
         TractorPosZShipRelease: 0,
         //STAZIONE SPAZIALE
         StationType: 0,         //TIPO STAZIONE DEL RAGGIO TRAENTE PIÙ VICINO
         //CALCOLO TEMPI DI ARRIVO
         TimeDist: [],
         TimeMoonDist: [],
         TimeSubMoonDist: [],
         MinTimePlanet: 0,       //MINIMO TEMPO DI ARRIVO PIANETA (PIÙ VICINO)
         MinTimeMoon: 0,         //MINIMO TEMPO DI ARRIVO LUNA (PIÙ VICINA)
         MinTimeSubMoon: 0,      //MINIMO TEMPO DI ARRIVO SUB-LUNA (PIÙ VICINA)
         //COLLISIONE E ATTRITO
         LimitCollision: 0,      //VALORE DI DISTANZA CON IL PIANETA 1=LimitDist, 0=COLLISIONE
         NearCollision: false,   //ATTRITO CON ATMOSFERA
         Collision: false,       //COLLISIONE
         //DESTINAZIONE
         DestinationPlanet: false,
         DestinationMoon: false,
         DestinationSubMoon: false,
         //LIMITE DI VELOCITÀ
         VelLimit: 0,               //LIMITE DI VELOCITÀ IN BASE ALLA POSIZIONE DEL GIOCATORE NEL MONDO         

         /*----------------------------------VARIABILI DA FORNIRE AL MODULO (LETTURA E SCRITTURA)-------------------------------------*/
         MeshPlanet: [],
         MeshMoon: [],
         //RAGGIO TRAENTE
         TractorActive: Number(SaveSystem.getItem(`TractorActive`)),
         Released: false,
         //CALCOLO TEMPI DI ARRIVO
         VelEffettiva: 0,              //VALORE DI VELOCITÀ DELLA NAVE SPAZIALE (m/s NEL GIOCO) CALCOLATA NEL CICLO DI RENDER
         //DESTINAZIONE
         DestPlanet: 0,
         DestMoon: 0,
         DestSubMoon: 0,
         //LIMITE DI VELOCITÀ
         MaxVel: 0,                    //MASSIMA VELOCITÀ DELLA NAVE SENZA LIMITI
      };

      VarPlanetSystem.UserPos = new THREE.Vector3();        //VETTORE POSIZIONE UTENTE

      //CARICAMENTO MODULO
      PlanetarySystem = await E0_DynamicPlanetarySystem();

      //NUOVA PARTITA
      if (Number(SaveSystem.getItem(`NewGame`)) == 0) {
         //POSIZIONE
         GroupUser.position.set(Par.PlanetarySystem.Parametri.XInit * 1000,
            Par.PlanetarySystem.Parametri.YInit * 1000, Par.PlanetarySystem.Parametri.ZInit * 1000);

         //ROTAZIONE
         UserDummy.rotation.set(Par.PlanetarySystem.Parametri.RotXInit, Par.PlanetarySystem.Parametri.RotYInit, Par.PlanetarySystem.Parametri.RotZInit);

         //CREAZIONE E SALVATAGGIO DELLE POSIZIONI INIZIALI CASUALI DEI PIANETI
         for (let i = 0; i < Oggetti.PlanetarySystem.Modular.length; i++) {
            VarPlanetSystem.RandomRotPlanet[i] = Math.random() * Math.PI * 2;
            SaveSystem.setItem(`RandomRotPlanet${i}`, VarPlanetSystem.RandomRotPlanet[i]);
            SaveSystem.update();
         };
         VarPlanetSystem.OrbitPosition = Par.PlanetarySystem.Parametri.OrbitPosition;
         VarPlanetSystem.NearPlanetIndex = 0;

         //INSERIMENTO NELL'ORBITA
         VarPlanetSystem.PlanetOrbit = Par.PlanetarySystem.Parametri.PlanetOrbit;      //ORBITA DI UN PIANETA RAGGIUNTA
         VarPlanetSystem.MoonOrbit = Par.PlanetarySystem.Parametri.MoonOrbit;          //ORBITA DI UNA LUNA RAGGIUNTA
         VarPlanetSystem.SubMoonOrbit = Par.PlanetarySystem.Parametri.SubMoonOrbit;    //ORBITA DI UNA SUB-LUNA RAGGIUNTA
         await E2_InsertOrbitOnce();
         VarPlanetSystem.OrbitOnceLoaded = true;
      }
      //PARTITA INIZIATA
      else {
         //CARICAMENTO DELLE POSIZIONI INIZIALI CASUALI DEI PIANETI
         for (let i = 0; i < Oggetti.PlanetarySystem.Modular.length; i++) {
            VarPlanetSystem.RandomRotPlanet[i] = Number(SaveSystem.getItem(`RandomRotPlanet${i}`));
         };
         VarPlanetSystem.OrbitPosition = Number(SaveSystem.getItem(`OrbitPosition`));
         //AD OGNI SESSIONE DI GIOCO AGGIUNGE UNA ROTAZIONE A QUELLA ESISTENTE
         VarPlanetSystem.OrbitPosition += Par.PlanetarySystem.Parametri.OrbitPositionAdd;

         //INSERIMENTO NELL'ORBITA
         VarPlanetSystem.PlanetOrbit = Number(SaveSystem.getItem(`PlanetOrbit`));      //ORBITA DI UN PIANETA RAGGIUNTA
         VarPlanetSystem.MoonOrbit = Number(SaveSystem.getItem(`MoonOrbit`));          //ORBITA DI UNA LUNA RAGGIUNTA
         VarPlanetSystem.SubMoonOrbit = Number(SaveSystem.getItem(`SubMoonOrbit`));    //ORBITA DI UNA SUB-LUNA RAGGIUNTA
         await E2_InsertOrbitOnce();
         VarPlanetSystem.OrbitOnceLoaded = true;

      };
      //ESPORTAZIONE
      MicEnginereturn.VarPlanetSystem = VarPlanetSystem;
      MicEnginereturn.PlanetarySystem = PlanetarySystem;
      MicEnginereturn.E1_FrustumNearPlanet = E1_FrustumNearPlanet;
      MicEnginereturn.E1_ShowSystemTextCanvas = E1_ShowSystemTextCanvas;
      MicEnginereturn.E1_RapidTranslate = E1_RapidTranslate;

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------DYNAMIC PLANET MAP------------------------*/
   //CONTIENE OGGETTO VARIABILI VarPlanetMap
   if (Par.Moduli.DynamicPlanetMap == true) {
      UrlModule = "DynamicPlanetMap";
      VarPlanetMap = {
         LevelZoom: 0,
         OrbitPosition: Number(SaveSystem.getItem(`OrbitPosition`)),
         RandomRotPlanet: [],          //ROTAZIONI INIZIALI CASUALI DEI PIANETI ALLA NUOVA PARTITA
      };

      //CARICAMENTO MODULO
      //CARICAMENTO DELLE POSIZIONI INIZIALI CASUALI DEI PIANETI
      for (let i = 0; i < Oggetti.PlanetarySystem.Modular.length; i++) {
         VarPlanetMap.RandomRotPlanet[i] = Number(SaveSystem.getItem(`RandomRotPlanet${i}`));
      };
      PlanetMap = await E0_DynamicPlanetMap();
      Scene.add(PlanetMap);

      //ESPORTAZIONE
      MicEnginereturn.VarPlanetMap = VarPlanetMap;
      MicEnginereturn.DynamicPlanetMap = PlanetMap;
      MicEnginereturn.MapUserQuat = new THREE.Quaternion();
      MicEnginereturn.E1_DestinationsLines = E1_DestinationsLines;
      MicEnginereturn.E1_ConeWireframed = E1_ConeWireframed;
      MicEnginereturn.E1_CreateOrbit = E1_CreateOrbit;

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------SKYBOX------------------------*/
   if (Par.Moduli.Skybox == true) {
      UrlModule = "Skybox";
      E0_Skybox2(Par.Skybox.Directory, Par.Log.Moduli);

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------DYNAMIC COCKPIT--------------------------*/
   //CONTIENE OGGETTO VARIABILI DynamCockpitVar
   if (Par.Moduli.DynamicCockpit == true) {
      UrlModule = "DynamicCockpit";
      DynamCockpitVar = {
         /*---------------------------------------------VARIABILI INTERNE AL MODULO---------------------------------------------------*/
         References: [],
         PlanetVisible: [],            //ARRAY CON LA VISIBILITÀ DI TUTTI GLI INDICATORI COCKPIT DEI PIANETI
         MoonVisible: [],              //ARRAY CON LA VISIBILITÀ DI TUTTI GLI INDICATORI COCKPIT DELLE LUNE
         SubMoonVisible: [],           //ARRAY CON LA VISIBILITÀ DI TUTTI GLI INDICATORI COCKPIT DELLE SUB-LUNE
         DestinationVisible: [],       //ARRAY CON LA VISIBILITÀ DI TUTTI GLI INDICATORI COCKPIT DESTINAZIONE
         PlanetTextVisible: [],        //ARRAY CON LA VISIBILITÀ DELLA DISTANZA E DEL TEMPO (NOME SEMPRE VISIBILE) DEI PIANETI
         MoonTextVisible: [],          //ARRAY CON LA VISIBILITÀ DELLA DISTANZA E DEL TEMPO (NOME SEMPRE VISIBILE) DELLE LUNE (PIANETI)
         UpdateSymbolsControl: 0,      //VARIABILE DI CONTROLLO PER FUNZIONE ONCEFUNCTION PER I SIMBOLI DI LUNE E SUB-LUNE
         IndVisualPlanet: [],
         IndVisualMoon: [],
         IndVisualSubMoon: [],
         IndVisualDest: [],
         PositionDomDir: [],     //POSIZIONE IN PERCENTUALE DELLO SCHERMO DEGLI INDICATORI DOM DIREZIONE + DIREZIONE Z + CAMERA IN DIREZIONE
         DomDirVisible: [],      //VISIBILITÀ INDICATORI DOM DIREZIONE
         DomVisible: [],          //VISIBILITÀ INDICATORI DOM CORNICE
         DomText: [],            //ARRAY TESTI INDICATORI
         DomEnabled: [],

         /*----------------------------------------VARIABILI FORNITE DAL MODULO (LETTURA)---------------------------------------------*/
         /*----------------------------------VARIABILI DA FORNIRE AL MODULO (LETTURA E SCRITTURA)-------------------------------------*/
         DistPlanets: 0,        //DISTANZA MASSIMA PIANETI VISUALIZZABILI
         //ARRAY DISTANZE
         IndDistEnemy: [],             //VALORI DISTANZE NEMICI DALLA NAVE SPAZIALE (km NEL GIOCO)
      };
      DynamCockpit = E0_DynamicCockpit(DynamCockpitVar);

      //ESPORTAZIONE
      MicEnginereturn.Cockpit = Cockpit;
      MicEnginereturn.ImageArray = ImageArray;
      MicEnginereturn.DynamCockpitVar = DynamCockpitVar;

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------VIRTUALPAD-------------------------------*/
   if (Par.Moduli.VirtualPad == true) {
      UrlModule = "VirtualPad";
      MicEnginereturn.VarPad = [];
      for (let i = 0; i < Par.VirtualPad.length; i++) {
         MicEnginereturn.VarPad[i] = NipplePad2(Par.VirtualPad[i], Par.Log.Moduli);
      };

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*---------------------------HYPERLOOP--------------------------*/
   if (Par.Moduli.Hyperloop == true) {
      MicEnginereturn.Hyperloop = [];
      UrlModule = "Hyperloop";
      for (let i = 0; i < Par.Hyperloop.length; i++) {
         MicEnginereturn.Hyperloop[i] = Hyperloop(Par.Hyperloop[i]);
      }
      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------ORBIT CONTROL-------------------------------*/
   if (Par.Moduli.OrbitControl == true) {
      UrlModule = "OrbitControl";
      //ESPORTAZIONE
      MicEnginereturn.OrbitControl = E0_OrbitControl(Camera, renderer.domElement);

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------SIMPLEMONITOR-------------------------------*/
   if (Par.Moduli.SimpleMonitor == true) {
      UrlModule = "SimpleMonitor";
      MicEnginereturn.Monitor = E4_CreateFPSCounter();

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------EDITOR-------------------------------*/
   let EditorObj;
   if (Par.Moduli.Editor == true) {
      UrlModule = "Editor";
      EditorObj = await E0_Editor();

      //ESPORTAZIONE
      MicEnginereturn.EditorObj = EditorObj;

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------LENS FLARE-----------------------------------*/
   if (Par.Moduli.LensFlare == true) {
      UrlModule = "LensFlare";
      E0_LensFlare();

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------AUDIO-----------------------------------*/
   if (Par.Moduli.Audio == true) {
      UrlModule = "Audio";
      MicEnginereturn.Audio = S0_Audio(Par.Audio);

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------KEYBOARD-----------------------------------*/
   if (Par.Moduli.Keyboard == true) {
      UrlModule = "Keyboard";
      MicEnginereturn.E0_Keyboard = E0_Keyboard();

      ActualModules++;
      E3_UpdateProgress(false);
   };
   //#endregion

   Update();

   /*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
   /*---------------------------------------------LOOP RENDER-------------------------------------------------------*/
   //#region
   let clock = new THREE.Clock();      //CLOCK DEL CICLO DI RENDER

   function animate(time) {
      if (isPaused) return;

      requestAnimationFrame(animate);
      delta = clock.getDelta();
      const tStart = performance.now();

      /*DYNAMICPLANETARY SYSTEM*/
      if (Par.Moduli.DynamicPlanetarySystem == true) E2_UpdateDynamicPlanetarySystem(delta);

      //EDITOR
      if (Par.Moduli.Editor == true) {
         if (EditorObj.EditorRotated.length > 0) {                          //SE L'OGGETTO HA PARTI ROTANTI
            for (let i = 0; i < Object.keys(EditorObj.EditorRotated).length; i++) {     //PER OGNI PARTE ROTANTE
               let RotX = EditorObj.EditorRotated[i].RotX;
               let RotY = EditorObj.EditorRotated[i].RotY;
               let RotZ = EditorObj.EditorRotated[i].RotZ;

               if (RotX != 0) {    //ROTAZIONE ASSE X
                  EditorObj.ImportedObject.children[EditorObj.EditorRotated[i].Modulo].rotation.x += RotX * delta;
               };
               if (RotY != 0) {    //ROTAZIONE ASSE Y
                  EditorObj.ImportedObject.children[EditorObj.EditorRotated[i].Modulo].rotation.y += RotY * delta;
               };
               if (RotZ != 0) {    //ROTAZIONE ASSE Z
                  EditorObj.ImportedObject.children[EditorObj.EditorRotated[i].Modulo].rotation.z += RotZ * delta;
               };
            };
         };
      };

      //MOTORE FISICO
      if (Par.Moduli.PhysicsEngine == true) PhysicsEngine.Update(delta);

      //ORBIT CONTROL
      if (Par.Moduli.OrbitControl == true) MicEnginereturn.OrbitControl.updateDolly(delta);

      Update(delta);

      /*--------------------------------------DYNAMIC COCKPIT------------------------------------------*/
      if (Par.Moduli.DynamicCockpit == true) E2_UpdateDynamicCockpit(delta);

      if (Par.Renderer.Enable == true) renderer.render(Scene, Camera);

      const tEnd = performance.now();

      if (Par.Moduli.SimpleMonitor == true) {
         MicEnginereturn.Monitor.Update();
      };
   };

   animate();
   //#endregion

   /* ------------------------------------------------------DEBUG-------------------------------------------------------- */
   MicEnginereturn.User.Done = true;
   PaceDone = true;
   VarObjectExport.PaceDone = true;


   const endTime = performance.now();


   //console.log(`Tempo di caricamento scena: ${(endTime - startTime).toFixed(0)} ms`);

   setTimeout(() => {
      //pauseGame();
      //console.log(Gamecharge);
      if (Par.Moduli.Debug == true) {
         if (Par.Debug.MaterialArray == true) {
            console.log("MaterialArray");
            console.log(E3_ConsoleLogSimpleObject(MaterialArray));
         };
         if (Par.Debug.Oggetti3D == true) {
            console.log("Oggetti3D");
            console.log(Oggetti3D);
            let SpaceshipModel = 0;
            let PlanetarySystemModel = 0;
            let GenericModel = 0;

            for (let i = 0; i < Oggetti3D.Spaceship.Model.length; i++) {
               if (Oggetti3D.Spaceship.Model[i] && Oggetti3D.Spaceship.Model[i].isObject3D == true) SpaceshipModel++;
            };
            for (let i = 0; i < Oggetti3D.PlanetarySystem.Model.length; i++) {
               if (Oggetti3D.PlanetarySystem.Model[i] && Oggetti3D.PlanetarySystem.Model[i].isObject3D == true) PlanetarySystemModel++;
            };
            for (let i = 0; i < Oggetti3D.Generic.Model.length; i++) {
               if (Oggetti3D.Generic.Model[i] && Oggetti3D.Generic.Model[i].isObject3D == true) GenericModel++;
            };
         };
         if (Par.Debug.UniversalGeom == true) {
            let UniversalGeomModel = 0;
            for (let i = 0; i < UniversalGeom.length; i++) {
               if (UniversalGeom[i]) UniversalGeomModel++;
            };
            console.log("UniversalGeom");
            console.dir(E3_ConsoleLogSimpleObject(UniversalGeom));
         };
         if (Par.Debug.Scene == true) {
            console.log("Oggetto Scena");
            console.log(E3_ConsoleLogSimpleObject(Scene));
         };
         if (Par.Debug.Renderer == true) {
            console.log("Renderer Info");
            console.log(renderer.info);
         };
         if (Par.Debug.MaxLimits == true) {
            /*VARIABILI*/
            let maxUsedTextureSize = 0;         //TEXTURE
            let maxUsedAttribs = 0;             //VERTEX
            let maxShadowMapSize = 0;           //BUFFER

            let totalTextureBytes = 0;

            /*TRAVERSATA DELLA SCENA*/
            Scene.traverse(obj => {
               /*TEXTURE*/
               if (obj.material) {
                  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                  mats.forEach(mat => {
                     // if (mat.map?.image) {
                     //    maxUsedTextureSize = Math.max(
                     //       maxUsedTextureSize,
                     //       mat.map.image.width,
                     //       mat.map.image.height
                     //    );
                     //    // const w = mat.map.image.width;
                     //    // const h = mat.map.image.height;
                     //    // totalTextureBytes += w * h * 4; // RGBA 4 byte
                     // }
                     const maps = ['map', 'aoMap', 'emissiveMap', 'metalnessMap', 'roughnessMap', 'normalMap', 'displacementMap'];
                     maps.forEach(key => {
                        const tex = mat[key];
                        if (tex?.image?.width && tex?.image?.height) {
                           maxUsedTextureSize = Math.max(
                              maxUsedTextureSize,
                              tex.image.width,
                              tex.image.height
                           );

                           totalTextureBytes += tex.image.width * tex.image.height * 4; // RGBA 4 byte
                        }
                     });
                  });
               };
               /*VERTEX*/
               if (obj.isMesh) {
                  const attribCount = Object.keys(obj.geometry.attributes).length;
                  maxUsedAttribs = Math.max(maxUsedAttribs, attribCount);
               };
               /*BUFFER*/
               if (obj.isLight && obj.shadow && obj.shadow.mapSize) {
                  maxShadowMapSize = Math.max(
                     maxShadowMapSize,
                     obj.shadow.mapSize.width,
                     obj.shadow.mapSize.height
                  );
               };
            });

            /*TEXTURE*/
            console.log(`Texture: ${maxUsedTextureSize}`);

            /*BUFFER*/
            console.log(`Buffer: ${maxShadowMapSize}`);

            /*VERTEX*/
            console.log(`Vertex: ${maxUsedAttribs}`);

            /*PESO DELLA SCENA*/
            const sceneWeight = (totalTextureBytes / (1024 * 1024)) +        // MB texture
               (maxShadowMapSize ** 2 * 4 / (1024 * 1024)) +   // MB shadow map
               maxUsedAttribs * 0.1;                        // peso shader attribs
            console.log(`Scene Weight: ${sceneWeight}`);
         };


         ActualModules++;
      };
   }, 3000);

   Gamecharge = 1;
   E3_UpdateProgress(false);

   //console.log(renderer.info.render);

   return MicEnginereturn;
};

/*----------------------------------------------------SNIPPET-------------------------------------------------------------*/
function SnippetUtilites(scene, camera, renderer) {
   /*
   UTILITÀ DA INSERIRE NE CODICE SNIPPET
   COMPRENDE: ORBITCONTROLS, PIANO CON GRIGLIA
   //const Utilities = SnippetUtilites(scene, camera, renderer);        //DA INSERIRE PRIMA DI ANIMATE
   //Utilities.Update();                                                //DA INSERIRE DENTRO ANIMATE
   */


   const Control = new OrbitControls(camera, renderer.domElement);
   //Creazione del piano grigio
   let PosY = -2;
   const planeGeometry = new THREE.PlaneGeometry(10, 10);
   const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });
   const plane = new THREE.Mesh(planeGeometry, planeMaterial);
   plane.rotation.x = -Math.PI / 2; //Ruota il piano in orizzontale
   plane.position.y = PosY;
   scene.add(plane);

   //Creazione della griglia
   const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0x444444);
   gridHelper.position.y = PosY;
   scene.add(gridHelper);

   function Update() {
      Control.update();
   };

   return { Update };
};

export async function SnippetEngine() {
   let scene, camera, renderer;

   scene = new THREE.Scene();

   let Time = 0;

   //Camera
   camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
   camera.position.set(0, 0, 0);

   renderer = new THREE.WebGLRenderer({ antialias: true });
   renderer.setSize(window.innerWidth, window.innerHeight);
   document.body.appendChild(renderer.domElement);

   //Sfondo iniziale (bianco, ma puoi cambiarlo)
   scene.background = new THREE.Color(0xffffff);

   const overlayMaterial = E3_ShaderOverlay({
      Color: 0x000000,
      Softness: 0.2,
   });

   const overlay = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMaterial);
   scene.add(overlay);

   //Animazione
   function animate() {
      requestAnimationFrame(animate);

      //aumenta uTime da 0 → 1 (chiusura completa)
      if (Time < 1) {
         Time += 0.005;
         //overlayMaterial.uniforms.uTime.value += 0.005;
         overlayMaterial.SetTime(Time);
         //console.log(overlayMaterial.uniforms.uTime.value);
      }

      renderer.render(scene, camera);
   };
   animate();

   //Resize adattivo
   window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
   });
};

//MicEnginereturn.VarObject.E3_UpdateText(DynamHud.children[1].children[i].children[1], Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Name[Language]);

//attributes.position.usage
//const HeightImg = parseInt(Object.HeightImg, 10);     //ESTRAZIONE DEL VALORE NUMERICO DELLA GRANDEZZA DELL'IMMAGINE
//ELIMINARE E3_UpdateText

/*
verifica function E2_MeshStation(Type, PlanetIndex, MoonIndex, SubMoonIndex) { se è il caso di evocarla con gli indici
*/

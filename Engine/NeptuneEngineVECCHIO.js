//----------------------------------------------IMPORTAZIONE LIBRERIE LIVE-------------------------------------------------------//
//Three.js core
import * as THREE from 'three';

//Controls
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
//import { MapControls } from 'three/addons/controls/MapControls.js';

//Utils
import * as BufferGeometryUtils from '../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
//import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
//import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
//import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
//import { OBB } from '../node_modules/three/examples/jsm/math/OBB.js';

//Loaders
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../node_modules/three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from '../node_modules/three/examples/jsm/loaders/KTX2Loader.js';
import { HDRLoader } from '../node_modules/three/examples/jsm/loaders/HDRLoader.js';

//GUI
import { GUI } from '../node_modules/three/examples/jsm/libs/lil-gui.module.min.js';

//Objects
import { Lensflare, LensflareElement } from '../node_modules/three/examples/jsm/objects/Lensflare.js';

//Eventuali librerie del progetto
import { Update } from '../Game.js';
import { Geometrie } from '../EngineParameters.js';

//Three-mesh-bvh (se locale)
//import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVHVisualizer } from './three-mesh-bvh/index.module.0.6.0.js';

let MultiObjects = 0;         //CONTO DELLE MESH GENERATE CON GLI ARRAY "Multi"
let GenericObjects = 0;         //CONTO DELLE MESH GENERATE CON GLI ARRAY "Generic"
let MeshMultiObjects = 0;
let MeshGroupObjects = 0;
let MultiGeom = 0;
let RecycledGeom = 0;
/*-------------------------------------------------PLUGIN CAPACITOR-------------------------------------------------------*/
//#region
//ABILITAZIONE SALVATAGGIO OGGETTO ECONOMY DA ANDROID
export async function S0_CapacitorEconomy(EconomyObj, Page, LogAlert) {
   const { Filesystem, Directory } = await import('@capacitor/filesystem');
   let Economy;
   let Text;
   const DataPath = 'config/economy.json'; //Percorso dati
   const textarea = document.createElement('textarea');
   const saveButton = document.createElement('button');

   async function loadEconomy() {
      let jsonData = null;

      try {
         //Carica il file dalla directory dati (asincrono)
         const result = await Filesystem.readFile({
            path: DataPath,
            directory: Directory.Data,
            encoding: 'utf8'
         });
         jsonData = JSON.parse(result.data);
         if (LogAlert == true) alert("Economy caricato dalla directory dati: " + JSON.stringify(jsonData));
      } catch (error) {
         if (LogAlert == true) alert("File nella directory dati non trovato, uso l'oggetto statico. " + error);
         jsonData = EconomyObj;
      }

      //Se i dati sono stati trovati, aggiorna l'oggetto Economy
      if (jsonData) {
         Economy = jsonData;
         createEditableJsonBox();
      } else {
         if (LogAlert == true) alert("Errore: impossibile caricare i parametri economici.");
      };
   };

   function createEditableJsonBox() {
      const jsonString = JSON.stringify(Economy, null, 2);
      textarea.value = jsonString;
      textarea.className = 'w-full p-2 rounded-md border mb-4';
      textarea.rows = 20;
      textarea.cols = 50;
      textarea.style.position = "absolute";
      textarea.style.right = "0px";
      textarea.style.bottom = "0px";
      textarea.style.width = "300px";
      textarea.style.height = "calc(100vh - 50px)";
      textarea.style.overflowY = 'auto';

      document.body.appendChild(textarea);

      textarea.addEventListener('input', () => {
         Text = textarea.value;
      });

      saveButton.type = 'button';
      saveButton.textContent = 'Salva Modifiche';
      saveButton.className = 'bg-blue-500 text-white p-2 rounded-md';
      saveButton.style.position = "absolute";
      saveButton.style.right = "320px";
      saveButton.style.bottom = "0px";
      saveButton.addEventListener('click', saveModifiedJson);

      document.body.appendChild(saveButton);

      if (Page != null && Page != "Home") {
         textarea.style.display = "none";
         saveButton.style.display = "none";
         if (LogAlert == true) alert("Textarea cancellato");
      };
   };

   async function saveModifiedJson() {
      const modifiedJson = Text;  //Prendi il valore corrente della textarea
      if (LogAlert == true) alert('Valore attuale della textarea: ' + modifiedJson);

      try {
         const modifiedData = JSON.parse(modifiedJson);  //Converti il testo in JSON
         if (LogAlert == true) alert('Dati modificati: ' + JSON.stringify(modifiedData));

         //Verifica se la directory esiste, altrimenti creala
         try {
            await Filesystem.stat({
               path: 'config',
               directory: Directory.Data
            });
         } catch (error) {
            await Filesystem.mkdir({
               path: 'config',
               directory: Directory.Data,
               recursive: true
            });
         }

         //Scrivi il file modificato
         await Filesystem.writeFile({
            path: DataPath,
            data: JSON.stringify(modifiedData, null, 2),
            directory: Directory.Data,
            encoding: 'utf8'
         });

         //Leggi il file appena salvato
         const savedFile = await Filesystem.readFile({
            path: DataPath,
            directory: Directory.Data,
            encoding: 'utf8'
         });

         if (LogAlert == true) alert('Contenuto del file appena salvato: ' + savedFile.data);
         alert('Salvataggio completato con successo!');
      } catch (error) {
         if (LogAlert == true) alert('Errore durante il salvataggio del JSON modificato: ' + error);
      }
   };

   await loadEconomy();
   return Economy;
};

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

export async function S0_CapacitorAdmob(BannerId, VideoId, LogAlert) {
   const { AdMob, BannerAdSize, BannerAdPosition, RewardAdPluginEvents } = await import('@capacitor-community/admob');

   /*------------------------------------------------ADMOB--------------------------------------------*/
   //Inizializza AdMob
   AdMob.initialize({
      requestTrackingAuthorization: true,          //Per iOS, chiede il consenso per il tracking
      testingDevices: [],                          //Aggiungi qui gli ID dei dispositivi di test
      initializeForTesting: true,                  //Attiva la modalità test
   }).then(() => {
      //alert("AdMob inizializzato!");

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
         adSize: BannerAdSize.BANNER,
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
let Par;             //PARAMETRI IMPORTATI
let Oggetti;         //PARAMETRI DEGLI OGGETTI DA CREARE IMPORTATI
let Materiali;       //PARAMETRI DEI MATERIALI DA CREARE IMPORTATI
let PaceDone;
let isPaused = false;

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

let perfMonitor;

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

let MicEnginereturn = {
   User: {},
   Lights: {},
   Raycaster: {},
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

async function E2_LoadEditTexture(Obj, TextureMap, rgb) {
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
   const Materiale = new THREE.MeshBasicMaterial({
      color: Object.Color,
      transparent: Object.Transparent,
      opacity: Object.Opacity
   });
   Materiale.name = Object.Name;

   if (Object.Side == "Front") Materiale.side = THREE.FrontSide;
   if (Object.Side == "Double") Materiale.side = THREE.DoubleSide;
   if (Object.Side == "Back") Materiale.side = THREE.BackSide;

   //Array di promesse per caricare le texture in parallelo
   const texturePromises = [];

   //MAPPA BASE
   if (Object.Map) {
      texturePromises.push(
         E2_LoadEditTexture(Object, Object.MapTexture, true)
            .then(tex => {
               Materiale.map = tex;
            })
      );
   };
   //MAPPA ALPHA
   if (Object.AlphaMap === true) {
      texturePromises.push(
         E2_LoadEditTexture(Object, Object.AlphaMapTexture, false)
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

   if (Object.DepthWrite) Materiale.depthWrite = false;

   //Array di promesse per caricare le texture in parallelo
   const texturePromises = [];

   if (Object.Map) texturePromises.push(E2_LoadEditTexture(Object, Object.MapTexture, true).then(tex => { Materiale.map = tex; }));
   if (Object.NormalMap) texturePromises.push(E2_LoadEditTexture(Object, Object.NormalMapTexture, false).then(tex => { Materiale.normalMap = tex; }));
   if (Object.MetalMap) texturePromises.push(E2_LoadEditTexture(Object, Object.MetalMapTexture, false).then(tex => { Materiale.metalnessMap = tex; }));
   if (Object.RoughMap) texturePromises.push(E2_LoadEditTexture(Object, Object.RoughMapTexture, false).then(tex => { Materiale.roughnessMap = tex; }));
   if (Object.DisplacementMap) texturePromises.push(E2_LoadEditTexture(Object, Object.DisplacementMapTexture, false).then(tex => { Materiale.displacementMap = tex; Materiale.displacementScale = Object.Displacement; }));
   if (Object.EmissiveMap) texturePromises.push(E2_LoadEditTexture(Object, Object.EmissiveMapTexture, true).then(tex => { Materiale.emissiveMap = tex; }));

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

   if (Object.DepthWrite) Materiale.depthWrite = false;

   //Array di promesse per caricare le texture in parallelo
   const texturePromises = [];

   //MAPPA BASE
   if (Object.Map) {
      texturePromises.push(
         E2_LoadEditTexture(Object, Object.MapTexture, true)
            .then(tex => { Materiale.map = tex; })
      );
   };

   //MAPPA NORMALE
   if (Object.NormalMap) {
      texturePromises.push(
         E2_LoadEditTexture(Object, Object.NormalMapTexture, false)
            .then(tex => { Materiale.normalMap = tex; })
      );
   };

   //MAPPA SPESSORE
   if (Object.DisplacementMap) {
      texturePromises.push(
         E2_LoadEditTexture(Object, Object.DisplacementMapTexture, false)
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

   if (Object.DepthWrite) Materiale.depthWrite = false;

   //Array di promesse per caricare le texture in parallelo
   const texturePromises = [];

   //MAPPA BASE
   if (Object.Map) {
      texturePromises.push(
         E2_LoadEditTexture(Object, Object.MapTexture, true)
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
         E2_LoadEditTexture(Object, Object.NormalMapTexture, false)
            .then(tex => { Materiale.normalMap = tex; })
      );
   };
   //MAPPA SPESSORE
   if (Object.DisplacementMap) {
      texturePromises.push(
         E2_LoadEditTexture(Object, Object.DisplacementMapTexture, false)
            .then(tex => {
               Materiale.displacementMap = tex;
               Materiale.displacementScale = Object.Displacement;
            })
      );
   };
   //MAPPA EMISSIVA
   if (Object.EmissiveMap) {
      texturePromises.push(
         E2_LoadEditTexture(Object, Object.EmissiveMapTexture, true)
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
   const Esempio = VarObjectExport.E3_MaterialePunti({
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
   const Esempio = VarObjectExport.E3_MaterialeSprite({
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
         glowIntensity: { value: Obj.Intensity },
         time: { value: 0.0 }                //VALORE IN SECONDI PER LA PULSAZIONE
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
    uniform float time;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      float angle = dot(vNormal, normalize(vViewPosition));
      float intensity = pow(0.6 - angle, 3.0) * glowIntensity;

      //Opzionale: pulsazione animata
      intensity *= 1.0 + 0.2 * sin(time * 2.0);

      gl_FragColor = vec4(glowColor * intensity, intensity);
    }
  `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
   });
   return glowMaterial;
};
function E3_EditShaderGlow(Mat) {         //FUNZIONE CHE MODIFICA IL MATERIALE CREATO
   /*
   Mat: Materiale creato con la funzione ShaderGlow
 
   ESEMPIO DI UTILIZZO:
   E3_EditShaderGlow(Obj.Mesh.children[0].material).SetColor(Obj.GlowColor);
   E3_EditShaderGlow(Obj.Mesh.children[0].material).SetIntensity(2);
 
   let t = 0.1; //mai 0
   setInterval(() => {
      t += 0.2;
      E3_EditShaderGlow(Obj.Mesh.children[0].material).SetTime(t);
   }, 100);
   */
   function SetColor(Color) {          //IMPOSTA UN NUOVO COLORE
      Mat.uniforms.glowColor.value.setHex(Color);
   };
   function SetIntensity(Intensity) {  //IMPOSTA UNA NUOVA INTENSITÀ
      Mat.uniforms.glowIntensity.value = Intensity;
   };
   function SetTime(Time) {            //IMPOSTA UN TEMPO IN SECONDI CRESCENTE
      Mat.uniforms.time.value = Time;
   };

   return { SetColor, SetIntensity, SetTime };
};

//MATERIALE SHADER PERSONALIZZATO LENTE CAMBIO DI TEXTURE
function E3_ShaderLens(Obj, ambientLight, directionalLight) {
   const VectorPosition = E3_Vector3(
      Obj.lensPosition[0],
      Obj.lensPosition[1],
      Obj.lensPosition[2]
   );
   const VectorNormal = E3_Vector3(
      Obj.lensNormal[0],
      Obj.lensNormal[1],
      Obj.lensNormal[2]
   );

   const material = new THREE.ShaderMaterial({
      //serve per usare fwidth/dFdx/dFdy
      extensions: { derivatives: true },

      uniforms: {
         //texture 
         map1: { value: E2_LoadEditTexture(null, Obj.Texture1, true) },
         map2: { value: E2_LoadEditTexture(null, Obj.Texture2, true) },

         //lente
         lensPosition: { value: VectorPosition },
         lensNormal: { value: VectorNormal.clone().normalize() },
         lensRadius: {
            value: Obj.lensType === 'circular'
               ? Obj.lensRadius
               : Obj.lensSize * Math.SQRT1_2
         },

         //luci
         ambientColor: { value: ambientLight.color.clone() },
         ambientIntensity: { value: ambientLight.intensity },
         directionalColor: { value: directionalLight.color.clone() },
         directionalIntensity: { value: directionalLight.intensity },
         lightDirection: { value: directionalLight.position.clone().normalize() },

         //gamma
         gamma: { value: Obj.gamma }
      },

      vertexShader: `
         varying vec3 vWorldPos;
         varying vec3 vNormal;
         varying vec2 vUv;

         void main() {
             vUv = uv;
             vec4 worldPos = modelMatrix * vec4(position, 1.0);
             vWorldPos = worldPos.xyz;
             vNormal = normalize(mat3(modelMatrix) * normal);
             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
         }
      `,

      fragmentShader: `
         precision highp float;

         uniform sampler2D map1;
         uniform sampler2D map2;
         uniform vec3 lensPosition;
         uniform vec3 lensNormal;
         uniform float lensRadius;

         uniform vec3 ambientColor;
         uniform float ambientIntensity;
         uniform vec3 directionalColor;
         uniform float directionalIntensity;
         uniform vec3 lightDirection;

         uniform float gamma;

         varying vec3 vWorldPos;
         varying vec3 vNormal;
         varying vec2 vUv;

         void main() {
             vec3 rayDir = normalize(vWorldPos - cameraPosition);
             float denom = dot(lensNormal, rayDir);

             vec4 texColor = texture2D(map1, vUv);

             if (denom > 0.0001) {
                 float t = dot(lensPosition - cameraPosition, lensNormal) / denom;
                 if (t > 0.0) {
                     vec3 intersect = cameraPosition + rayDir * t;
                     vec3 offset = intersect - lensPosition;
                     float dist;

                     //----------------------
                     //lente con soft edge
                     //----------------------
                     ${Obj.lensType === 'circular' ? `
                        dist = length(offset);
                        vec4 lensColor = texture2D(map2, vUv);

                        //larghezza bordo in pixel screen-space
                        float w = max(1e-6, fwidth(dist));
                        float a = 1.0 - smoothstep(lensRadius - w, lensRadius + w, dist);

                        texColor = mix(texColor, lensColor, a);
                     ` : `
                        float dx = abs(offset.x);
                        float dy = abs(offset.y);
                        vec4 lensColor = texture2D(map2, vUv);

                        float wx = max(1e-6, fwidth(dx));
                        float wy = max(1e-6, fwidth(dy));
                        float ax = 1.0 - smoothstep(lensRadius - wx, lensRadius + wx, dx);
                        float ay = 1.0 - smoothstep(lensRadius - wy, lensRadius + wy, dy);
                        float a = ax * ay;

                        texColor = mix(texColor, lensColor, a);
                     `}
                 }
             }

             //---- illuminazione Lambert semplice ----
             vec3 N = normalize(vNormal);
             vec3 L = normalize(lightDirection);
             float diff = max(dot(N, L), 0.0);

             //colore base in linear space
             vec3 linearTex = pow(texColor.rgb, vec3(2.2));

             //calcolo luce separata
             vec3 litColor = linearTex * (ambientColor * ambientIntensity + directionalColor * directionalIntensity * diff);

             //applica correzione gamma
             vec3 finalColor = pow(litColor, vec3(gamma));

             gl_FragColor = vec4(finalColor, texColor.a);
         }
      `
   });

   return material;
};

async function E3_EditShaderLens(Obj, Mat) {
   //VARIABILI/OGGETTI
   let LensHelperMesh;                                //MESH HELPER LENTE
   const lensWorldPos = E3_Vector3();          //POSIZIONE WORLD DELL'OGGETTO LENTE
   const lensWorldQuat = E3_Quaternion();      //ROTAZIONE WORLD DELLA LENTE
   const localNormal = E3_Vector3(0, 0, -1);   //NORMALE DELLA LENTE, DIREZIONE VERSO L'ASSE Z
   const lightWorldPos = E3_Vector3();         //POSIZIONE WORLD LUCE DIREZIONALE
   const objWorldPos = E3_Vector3();           //POSIZIONE WORLD OGGETTO DA ILLUMINARE

   //HELPER DELLA LENTE
   if (Obj.LensHelper == true) {
      if (Obj.lensType == 'circular') {
         const CircleGeom = E3_GeoCircle(Obj.lensRadius, 64, 0, Math.PI * 2);
         const CircleMat = await E3_MaterialeBase({
            RepeatX: 1,
            RepeatY: 1,
            Side: "Double",          //"Front", "Double", "Back"
            Color: 0x00ff00,
            Transparent: true,
            Opacity: 0.5,
            DepthWrite: false,             //Impostare su true se è usato per aloni, glow o atmosfera (depthWrite)
            //MAPPA COLORE
            Map: false,
            MapTexture: ``,
            AlphaMap: false,
            AlphaMapTexture: ``,
            AlphaMapRotation: 0
         });
         LensHelperMesh = E3_GenMesh(Scene, CircleGeom, CircleMat, [0, 0, 0], [0, 0, 0], [1, 1, 1], "", true, false);
      };
   };

   //PSIZIONE DELLA LENTE
   function UpdateLensPosition(lensObj) {
      lensObj.getWorldPosition(lensWorldPos);
      Mat.uniforms.lensPosition.value.copy(lensWorldPos);
      if (Obj.LensHelper == true) LensHelperMesh.position.copy(lensWorldPos);
   };

   //ROTAZIONE DELLA LENTE
   function UpdateLensRotation(lensObj) {
      lensObj.getWorldQuaternion(lensWorldQuat);

      const worldNormal = localNormal.clone().applyQuaternion(lensWorldQuat);
      Mat.uniforms.lensNormal.value.copy(worldNormal);
      if (Obj.LensHelper == true) LensHelperMesh.lookAt(lensWorldPos.clone().add(worldNormal));
   }

   //DIREZIONE DELLA LUCE
   function UpdatedirectionalLight(DirectionalLight, ObjectTarget) {
      DirectionalLight.getWorldPosition(lightWorldPos);
      ObjectTarget.getWorldPosition(objWorldPos);
      Mat.uniforms.lightDirection.value.copy(lightWorldPos.clone().sub(objWorldPos).normalize());
   };

   //TEXTURE MAP2
   function UpdateMap2(Texture2) {
      Mat.uniforms.map2.value = Loader.load(Texture2);
   };

   return { UpdateLensPosition, UpdateLensRotation, UpdatedirectionalLight, UpdateMap2 };
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

//#endregion

/*---------------------------------------------------FUNZIONI CANVAS------------------------------------------------------*/
//#region
/*GENERAZIONE MENU HUD*/
export function S0_GenerateHUDCanvas(config, Options) {
   /* ISTRUZIONI
      CREAZIONE
      const CommonStaticStationHUD = S0_GenerateHUDCanvas(CommonStaticStationHUDObj, {
            DispatchEvent: "Render",
            Width: 1,                   //LARGHEZZA
            Height: 1,                  //ALTEZZA
            Top: 0,                     //POSIZIONE VERTICALE DALL'ALTO
         });
   
      RIDISEGNA L'INTERO CANVAS
      HUD.render();
   
      -------------------------------PULSANTI-------------------------------------
      MOSTRA O NASCONDI UN PULSANTE
      HUD.showButton(0, true);

      CAMBIA IL COLORE DEL PULSANTE
      HUD.setButtonColor(0, "#ff0000");

      IMPOSTA IL TESTO DEL PULSANTE
      HUD.setButtonText(0, "Ciao");

      IMPOSTA LA POSIZIONE DEL PULSANTE (COMPLETA)
      HUD.setButtonPos(0, "Left", "100px", "Top", "100px");

      IMPOSTA LA POSIZIONE X DEL PULSANTE MANTENENDO I FLAG E LA POSIZIONE Y INVARIATA
      HUD.setButtonPosX(0, "100px");

      IMPOSTA LA POSIZIONE Y DEL PULSANTE MANTENENDO I FLAG E LA POSIZIONE X INVARIATA
      HUD.setButtonPosY(0, "100px");

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

      IMPOSTA LA POSIZIONE DEL PULSANTE (COMPLETA)
      HUD.setImagePos(0, "Left", "100px", "Top", "100px");

      IMPOSTA LA POSIZIONE X DEL PULSANTE MANTENENDO I FLAG E LA POSIZIONE Y INVARIATA
      HUD.setImagePosX(0, "100px");

      IMPOSTA LA POSIZIONE Y DEL PULSANTE MANTENENDO I FLAG E LA POSIZIONE X INVARIATA
      HUD.setImagePosY(0, "100px");

      IMPOSTA LA TEXTURE DELL'IMMAGINE
      HUD.setImageUrl(0, "SpaceGame/texture/Clip/DestinazioneGiallo50.png")
      */

   /*----------------------------GENERAZIONE CANVAS---------------------------------------*/
   const canvas = document.createElement('canvas');
   const ratio = window.devicePixelRatio;
   canvas.width = window.innerWidth * Options.Width * ratio;
   canvas.height = window.innerHeight * Options.Height * ratio;
   canvas.style.width = `${window.innerWidth * Options.Width}px`;
   canvas.style.height = `${window.innerHeight * Options.Height}px`;
   canvas.style.position = 'absolute';
   canvas.style.top = `${Options.Top * 100}%`;
   canvas.style.left = `${(window.innerWidth - window.innerWidth * Options.Width) * 0.5}px`;
   canvas.style.pointerEvents = 'auto';
   canvas.style.touchAction = "none";
   canvas.style.zIndex = '10';

   document.body.appendChild(canvas);

   const ctx = canvas.getContext('2d');

   const HUDObj = {
      canvas,
      ctx,
      Pulsanti: [],
      Barre: [],
      Immagini: [],
      //Slider: [],
      callbacks: {},
      callbacksUp: {},
      callbacksBar: {},
      callbacksUpBar: {},
   };

   //--- Utility per convertire "px" e "%" ---
   function parseSize(value, reference) {
      if (typeof value === "string") {
         if (value.includes("%")) return (parseFloat(value) / 100) * reference;
         if (value.includes("px")) return parseFloat(value) * ratio;
      }
      return parseFloat(value);
   };

   function parsePos2(flag, PosX, topFlag, PosY, Rotate) {
      let x, y;

      if (flag === "Left") x = parseSize(PosX, canvas.width);
      else x = canvas.width - parseSize(PosX, canvas.width);

      if (topFlag === "Top") y = parseSize(PosY, canvas.height);
      else y = canvas.height - parseSize(PosY, canvas.height);

      return { x, y };
   };

   function GenerateObjects() {
      //-----PULSANTI-----
      for (let i = 0; i < config.Pulsanti; i++) {
         const pos = parsePos2(
            config.PulsPos[i].RightFlag || "Left",
            config.PulsPos[i].PosX,
            config.PulsPos[i].TopFlag || "Top",
            config.PulsPos[i].PosY,
            null
         );

         const width = parseSize(config.PulsSize[i].Width, canvas.width);
         const height = parseSize(config.PulsSize[i].Height, canvas.height);

         HUDObj.Pulsanti.push({
            x: pos.x,
            y: pos.y,
            width,
            height,
            color: config.PulsColor[i],
            text: config.PulsName[i],
            fontSize: ratio * parseInt(config.PulsFontSize) || 20,
            fontFamily: config.FontFamily,
            visible: true
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

         const width = parseSize(config.BarSize[i].Width, canvas.width);
         const height = parseSize(config.BarSize[i].Height, canvas.height);

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
            visible: true
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

         const width = parseSize(config.ImgSize[i].Width, canvas.width);
         const height = parseSize(config.ImgSize[i].Height, canvas.height);

         const img = new Image();
         img.src = config.ImgUrl[i];

         HUDObj.Immagini.push({
            img,
            x: pos.x,
            y: pos.y,
            width,
            height,
            visible: true
         });
      };
   };
   GenerateObjects();

   //--- Render ---
   HUDObj.render = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      //--- Pulsanti ---
      HUDObj.Pulsanti.forEach(p => {
         if (!p.visible) return;
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

         const lines = p.text.split("\n");
         const lineHeight = p.fontSize * 1.2;
         const totalHeight = lineHeight * lines.length;
         const startY = -totalHeight / 2 + lineHeight / 2;

         lines.forEach((line, i) => {
            ctx.fillText(line.trim(), 0, startY + i * lineHeight);
         });
         ctx.restore();
      });

      //--- Barre ---
      HUDObj.Barre.forEach(b => {
         if (!b.visible) return;
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
      });

      //--- IMMAGINI ---
      HUDObj.Immagini.forEach(i => {
         if (!i.visible) return;
         ctx.save();
         ctx.translate(i.x, i.y);

         ctx.drawImage(
            i.img,
            -i.width / 2,
            -i.height / 2,
            i.width,
            i.height
         );

         ctx.restore();
         //RICHIAMA IL RENDER APPENA L'IMMAGINE È CARICATA
         i.img.onload = () => {
            HUDObj.render();
         };
      });
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

   //-------------------------- COLLISIONE CLICK --------------------------------//
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

         //Poiché x, y ora rappresentano il centro
         const left = b.x - b.width / 2;
         const right = b.x + b.width / 2;
         const top = b.y - b.height / 2;
         const bottom = b.y + b.height / 2;

         if (x >= left && x <= right && y >= top && y <= bottom) {
            if (HUDObj.callbacksBar[i]) HUDObj.callbacksBar[i]();
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
      if (!Options.DispatchEvent) return;

      let UnderCanvas;
      if (Options.DispatchEvent === "Render") UnderCanvas = renderer.domElement;
      else UnderCanvas = Options.DispatchEvent;

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

         if (!handled && Options.DispatchEvent) {
            dispatchToUnderCanvas(e);
         } else {
            e.preventDefault();
         };
      }, { passive: false });

      //POINTERMOVE
      canvas.addEventListener('pointermove', e => {
         const handled = activePointers.get(e.pointerId);

         if (handled === false) {
            if (Options.DispatchEvent) dispatchToUnderCanvas(e);
         } else if (handled === true) {
            e.preventDefault();
         };
      }, { passive: false });

      //POINTERUP
      canvas.addEventListener('pointerup', e => {
         const handled = activePointers.get(e.pointerId);

         if (handled === false) {
            if (Options.DispatchEvent) dispatchToUnderCanvas(e);
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
            if (Options.DispatchEvent) dispatchToUnderCanvas(e, "pointerup");
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
   HUDObj.setButtonColor = function (index, color) {
      if (HUDObj.Pulsanti[index]) {
         HUDObj.Pulsanti[index].color = color;
      }
   };
   HUDObj.setButtonText = function (index, text) {
      if (HUDObj.Pulsanti[index]) {
         HUDObj.Pulsanti[index].text = text;
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

   //BARRE
   HUDObj.showBar = function (index, show = true) {
      if (HUDObj.Barre[index]) HUDObj.Barre[index].visible = show;
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

   //IMMAGINI
   HUDObj.showImage = function (index, show = true) {
      if (HUDObj.Immagini[index]) HUDObj.Immagini[index].visible = show;
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

   return HUDObj;
};

function E3_FillValueBarCanvas(Obj) {
   /*
   const Result = MicEnginereturn.VarObject.E3_FillValueBarCanvas({
      //VARIABILE
      Fill: 1,                                                    //QUANTITÀ DA RIEMPIRE
      Money: GlobalVar.Money,                                     //VARIABILE DEL DENARO POSSEDUTO
      MaxValue: Economy.FuelUpgrade[VarObjectsHub.UpgradeTank],   //MASSIMO VALORE RAGGIUNGIBILE DALLA VARIABILE
      Value: GlobalVar.Fuel,                                      //VARIABILE
      PriceUnit: Economy.PriceFuel,                               //PREZZO UNITARIO VARIABILE
      //CANVAS
      MoneySymbol: Economy.MoneySymbol,                           //SIMBOLO DENARO
      Hud: DynamicHubHUD,                                         //CANVAS DI RIFERIMENTO
      BarIndex: 0,                                                //INDIRIZZO DELLA BARRA
      Pulsindex: 0,                                               //INDIRIZZO DEL PULSANTE
   });
   */
   //SE IL VALORE È MAGGIORE DELLA FRAZIONE DEL PIENO IMPOSTATA
   if (Obj.Value >= Obj.MaxValue * (1 - Obj.Fill)) {
      //SE IL PREZZO PER UN PIENO È MINORE DEL DENARO POSSEDUTO
      if (Math.floor((Obj.MaxValue - Obj.Value) * Obj.PriceUnit) <= Obj.Money) {
         //FAI IL PIENO
         Obj.Money -= Math.floor((Obj.MaxValue - Obj.Value) * Obj.PriceUnit);
         //AGGIORNA IL VALORE DI CARBURANTE
         Obj.Value = Obj.MaxValue;
      }
      //SE IL PREZZO PER UN PIENO È MAGGIORE DEL DENARO POSSEDUTO
      else {
         //AGGIORNA IL VALORE DI CARBURANTE
         Obj.Value += Math.floor(Obj.Money / Obj.PriceUnit);
         //SPENDI TUTTI I SOLDI E COMPRA QUELLO CHE RIESCI
         Obj.Money = 0;
      };
      //AGGIORNA IL TESTO DEL PULSANTE DI RIEMPIMENTO
      Obj.Hud.setButtonText(Obj.Pulsindex, `FILL \n${((Obj.MaxValue - Obj.Value) * Obj.PriceUnit).toFixed(0)}${Obj.MoneySymbol}`);
   }
   //ALTRIMENTI RIEMPI DELLA FRAZIONE DEL PIENO IMPOSTATA
   else {
      //SE IL PREZZO PER 1/4 DEL PIENO È MINORE DEL DENARO POSSEDUTO
      if (Math.floor((Obj.MaxValue * Obj.Fill) * Obj.PriceUnit) <= Obj.Money) {
         //FAI IL PIENO
         Obj.Money -= Math.floor((Obj.MaxValue * Obj.Fill) * Obj.PriceUnit);
         //AGGIORNA IL VALORE DI CARBURANTE
         Obj.Value += Obj.MaxValue * Obj.Fill;
      }
      //SE IL PREZZO PER UN PIENO È MAGGIORE DEL DENARO POSSEDUTO
      else {
         //AGGIORNA IL VALORE DI CARBURANTE
         Obj.Value += Math.floor(Obj.Money / Obj.PriceUnit);
         //SPENDI TUTTI I SOLDI E COMPRA QUELLO CHE RIESCI
         Obj.Money = 0;
      };
      //AGGIORNA IL TESTO DEL PULSANTE DI RIEMPIMENTO
      Obj.Hud.setButtonText(Obj.Pulsindex, `FILL \n${((Obj.MaxValue * Obj.Fill) * Obj.PriceUnit).toFixed(0)}${Obj.MoneySymbol}`);
   };

   //AGGIORNA L´ALTEZZA DELLA BARRA
   Obj.Hud.setBarValue(Obj.BarIndex, Obj.Value / Obj.MaxValue);
   //AGGIORNA IL TESTO DELLA BARRA
   Obj.Hud.setBarText(Obj.BarIndex, `${(Obj.Value).toFixed(0)}/${Obj.MaxValue}`);

   return { Money: Obj.Money, Value: Obj.Value };
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

/*GENERAZIONE MENU HUD*/
export function S0_GenerateHUD(Object) {
   /*
   NOTA: LE BARRE HANNO Z-INDEX = 10
   IL TESTO DENTRO LE BARRE (CHILDREN[1]) HA Z-INDEX = 20
   */
   const ElemObj = {
      Pulsanti: [],
      Barre: [],
      Slider: []
   };

   /*GENERAZIONE PULSANTI BASE*/
   for (let i = 0; i < Object.Pulsanti; i++) {
      const Elem = document.createElement('div');
      Elem.style.display = "block";
      Elem.style.position = "absolute";
      Elem.style.boxSizing = "border-box";
      Elem.style.width = Object.PulsSize[i].Width;
      Elem.style.height = Object.PulsSize[i].Height;
      Elem.style.opacity = Object.Opacity;
      Elem.style.borderRadius = `${Object.BorderRadHoriz} / ${Object.BorderRadVert}`;
      Elem.style.backgroundColor = Object.PulsColor[i];
      Elem.style.zIndex = "10";
      if (Object.PulsPos[i].TopFlag == "Top") Elem.style.top = Object.PulsPos[i].Top;
      if (Object.PulsPos[i].TopFlag == "Bottom") Elem.style.bottom = Object.PulsPos[i].Bottom;
      if (Object.PulsPos[i].RightFlag == "Right") Elem.style.right = Object.PulsPos[i].Right;
      if (Object.PulsPos[i].RightFlag == "Left") Elem.style.left = Object.PulsPos[i].Left;

      if (Object.Style == "Neon") {
         Elem.style.border = "1.5px solid rgba(0, 255, 255, 0.4)";
         Elem.style.boxShadow = "0 0 10px rgba(0,255,255,0.2)";
         Elem.style.backdropFilter = "blur(5px)";
         Elem.style.borderRadius = "12px";
         Elem.style.color = "#00ffff";
         Elem.style.letterSpacing = "1px";
         Elem.style.transition = "all 0.2s ease-in-out";
      };

      //TESTO
      Elem.style.fontFamily = Object.FontFamily;
      Elem.style.textAlign = "center";
      Elem.style.fontSize = Object.PulsFontSize;
      Elem.style.color = Object.PulsFontColor;

      const TextElement = document.createElement('p');
      TextElement.style.paddingTop = Object.PulsPaddingTop;
      TextElement.innerText = Object.PulsName[i];
      Elem.appendChild(TextElement);

      document.body.appendChild(Elem);
      ElemObj.Pulsanti.push(Elem);
   };

   //GENERAZIONE BARRE
   for (let i = 0; i < Object.Barre; i++) {
      const ElemBar = document.createElement('div');
      ElemBar.style.display = "block";
      ElemBar.style.position = "absolute";
      ElemBar.style.boxSizing = "border-box";
      ElemBar.style.width = Object.BarSize[i].Width;
      ElemBar.style.height = Object.BarSize[i].Height;
      ElemBar.style.opacity = Object.Opacity;
      ElemBar.style.borderRadius = `${Object.BorderRadHoriz} / ${Object.BorderRadVert}`;
      ElemBar.style.backgroundColor = Object.BarColor[i];
      ElemBar.style.zIndex = "10";
      if (Object.BarPos[i].TopFlag == "Top") ElemBar.style.top = Object.BarPos[i].Top;
      if (Object.BarPos[i].TopFlag == "Bottom") ElemBar.style.bottom = Object.BarPos[i].Bottom;
      if (Object.BarPos[i].RightFlag == "Right") ElemBar.style.right = Object.BarPos[i].Right;
      if (Object.BarPos[i].RightFlag == "Left") ElemBar.style.left = Object.BarPos[i].Left;
      ElemBar.style.transform = `rotate(${Object.BarRotate[i]}deg)`;

      if (Object.Style == "Neon") {
         ElemBar.style.border = "1.5px solid rgba(0, 255, 255, 0.4)";
         ElemBar.style.boxShadow = "0 0 10px rgba(0,255,255,0.2)";
         ElemBar.style.backdropFilter = "blur(5px)";
      };

      //BARRA VALORE
      const ElemBarValue = document.createElement('div');
      ElemBarValue.style.position = "absolute";
      ElemBarValue.style.bottom = "0px";
      ElemBarValue.style.left = "0px";
      ElemBarValue.style.width = "100%";
      ElemBarValue.style.backgroundColor = Object.BarColorValue[i];
      ElemBarValue.style.borderRadius = `${Object.BorderRadHoriz} / ${Object.BorderRadVert}`;
      ElemBar.appendChild(ElemBarValue);

      //TESTO
      ElemBar.style.fontFamily = Object.FontFamily;
      ElemBar.style.textAlign = "center";
      ElemBar.style.fontSize = Object.BarFontSize;
      ElemBar.style.color = Object.BarFontColor;

      const TextBarElement = document.createElement('p');
      TextBarElement.style.position = "absolute";
      TextBarElement.style.transform = `translate(${Object.BarTextTranslateX}, ${Object.BarTextTranslateY}) rotate(${-Object.BarRotate[i]}deg)`;

      TextBarElement.style.bottom = "50%";
      TextBarElement.style.left = "0px";
      TextBarElement.style.width = "100%";
      TextBarElement.style.zIndex = "20";
      ElemBar.appendChild(TextBarElement);
      document.body.appendChild(ElemBar);
      ElemObj.Barre.push(ElemBar);
   };

   //GENERAZIONE SLIDER
   const style = document.createElement('style');
   style.textContent = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #FF4444;
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(0,0,0,0.5);
    margin-top: -7px;
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent; /* disabilita lo sfondo di default */
  }

  input[type="range"]::-webkit-slider-runnable-track {
    height: 6px;
    background: #CCC;
    border-radius: 3px;
  }

  input[type="range"]::-moz-range-track {
    height: 6px;
    background: #CCC;
    border-radius: 3px;
  }
`;

   document.head.appendChild(style);

   for (let i = 0; i < Object.Slider; i++) {
      const SliderElem = document.createElement('input');
      SliderElem.type = "range";
      SliderElem.style.position = "absolute";
      SliderElem.style.width = Object.SliderSize[i].Width;
      SliderElem.style.height = Object.SliderSize[i].Height;
      SliderElem.style.opacity = Object.Opacity;
      SliderElem.style.borderRadius = `${Object.BorderRadHoriz} / ${Object.BorderRadVert}`;
      SliderElem.style.background = Object.SliderColor[i];
      SliderElem.style.zIndex = "10";
      SliderElem.min = 0;
      SliderElem.max = 100;
      SliderElem.value = 50;

      document.head.appendChild(style);

      //Posizionamento
      if (Object.SliderPos[i].TopFlag == "Top") SliderElem.style.top = Object.SliderPos[i].Top;
      if (Object.SliderPos[i].TopFlag == "Bottom") SliderElem.style.bottom = Object.SliderPos[i].Bottom;
      if (Object.SliderPos[i].RightFlag == "Right") SliderElem.style.right = Object.SliderPos[i].Right;
      if (Object.SliderPos[i].RightFlag == "Left") SliderElem.style.left = Object.SliderPos[i].Left;

      document.body.appendChild(SliderElem);
      ElemObj.Slider.push(SliderElem);
   };

   return ElemObj;
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
function S0_LoaderScreen() {
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

   return { LoaderDiv, LoadingFill, Texture, LoaderFile };
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
   container.style.zIndex = "10";
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
   let PositionX;
   if (Obj.PosX >= 0) {
      FlagX = "left";
      PositionX = Obj.PosX;
   };
   if (Obj.PosX < 0) {
      FlagX = "right";
      PositionX = -Obj.PosX;
   };

   if (Obj.PositionText == "Down") StandardCSS(Elem, "top", `${Obj.PosY + Obj.AtImage}px`, FlagX, `${PositionX}px`, `${Obj.AltText}px`, `${Obj.LargText}px`);
   if (Obj.PositionText == "Side") StandardCSS(Elem, "top", `${Obj.PosY}px`, FlagX, `${PositionX + Obj.LargImage}px`, `${Obj.AltText}px`, `${Obj.LargText}px`);
};
/*FUNZIONE CHE VISUALIZZA UN RIQUADRO CON L'IMMAGINE E IL TESTO DI UN NPC, TIMER E PRESSIONE PER ELIMINARE*/
function E3_DisplayNPC(Obj, Func) {
   /*
   MicEnginereturn.VarObject.E3_DisplayNPC({
         //GENERICI
         Font: 15,                                             //FONT IN PIXEL
         PosX: -200,                                            //POSIZIONE X (POSITIVA=SINISTRA, NEGATIVA=DESTRA)
         PosY: 0,                                              //POSIZIONE Y (SOLO TOP)
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
   StandardCSS(DivImage, "top", `${Obj.PosY}px`, FlagX, `${PositionX}px`, `${Obj.AtImage}px`, `${Obj.LargImage}px`, "11");

   //TESTO PERSONAGGIO
   const DivText = document.createElement("div");
   E4_PositionNPCText(DivText, Obj);
   DivText.style.backgroundColor = Obj.ColorText;
   DivText.style.color = Obj.ColorFontText;
   DivText.style.fontSize = Obj.Font + "px";
   DivText.innerText = Obj.Text;

   //TESTO CONTINUA
   const DivText1 = document.createElement("div");
   if (Obj.PositionText == "Down") StandardCSS(DivText1, "top", `${Obj.PosY + Obj.AtImage + Obj.AltText}px`, FlagX, `${PositionX}px`, "20px", `${Obj.LargText}px`, "11");
   if (Obj.PositionText == "Side") StandardCSS(DivText1, "top", `${Obj.PosY + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargImage}px`, "20px", `${Obj.LargText}px`, "11");
   DivText1.style.backgroundColor = Obj.ColorText;
   DivText1.style.color = Obj.ColorFontText;
   DivText1.style.fontSize = Obj.Font + "px";
   DivText1.innerText = Obj.Text1;

   //BARRA TEMPO
   const DivBar = document.createElement("div");
   StandardCSS(DivBar, "top", `${Obj.PosY}px`, FlagX, `${PositionX}px`, "10px", `${Obj.LargImage}px`, "11");

   const DivBar1 = document.createElement("div");
   DivBar1.style.backgroundColor = "#808080";
   StandardCSS(DivBar1, "top", `${Obj.PosY}px`, FlagX, `${PositionX}px`, "10px", `${Obj.LargImage}px`, "11");

   //RIDUZIONE BARRA A TEMPO
   let LarghBarra = Obj.LargImage;
   const myInterval = setInterval(RiduzioneBarra, 100);
   function RiduzioneBarra() {
      LarghBarra -= (Obj.LargImage * 1.1) / (Obj.Time / 100);
      DivBar1.style.width = `${LarghBarra}px`;
   };

   let Erased = false;

   //ELIMINAZIONE
   function Erase() {
      document.body.removeChild(DivImage);
      document.body.removeChild(DivText);
      document.body.removeChild(DivText1);
      document.body.removeChild(DivBar);
      document.body.removeChild(DivBar1);
      clearInterval(myInterval);
      setTimeout(() => {
         Func();
      }, 500);
      Erased = true;
   };


   DivImage.addEventListener('click', function () { if (Erased == false) Erase(); });
   DivText.addEventListener('click', function () { if (Erased == false) Erase(); });
   setTimeout(() => { if (Erased == false) Erase(); }, Obj.Time);
};

/*FUNZIONE CHE VISUALIZZA UN RIQUADRO CON L'IMMAGINE E IL TESTO DI UN NPC, SINGOLO TASTO E SINGOLA FUNZIONE, NO TIMER*/
function E3_DisplayNPCSingleButton(Obj, Func1) {
   /*
   MicEnginereturn.VarObject.E3_DisplayNPCSingleButton({
         //GENERICI
         Font: 15,                                             //FONT IN PIXEL
         PosX: -200,                                            //POSIZIONE X (POSITIVA=SINISTRA, NEGATIVA=DESTRA)
         PosY: 0,                                              //POSIZIONE Y (SOLO TOP)
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
   StandardCSS(DivImage, "top", `${Obj.PosY}px`, FlagX, `${PositionX}px`, `${Obj.AtImage}px`, `${Obj.LargImage}px`, "11");

   //TESTO PERSONAGGIO
   const DivText = document.createElement("div");
   E4_PositionNPCText(DivText, Obj);
   //StandardCSS(DivText, "top", `${Obj.PosY + Obj.AtImage}px`, FlagX, `${PositionX}px`, `${Obj.AltText}px`, `${Obj.LargText}px`);
   DivText.style.backgroundColor = Obj.ColorText;
   DivText.style.color = Obj.ColorFontText;
   DivText.style.fontSize = Obj.Font + "px";
   DivText.innerText = Obj.Text;

   //PULSANTE
   const Puls1 = document.createElement("div");
   if (Obj.PositionText == "Down") StandardCSS(Puls1, "top", `${Obj.PosY + Obj.AtImage + Obj.AltText}px`, FlagX, `${PositionX}px`, `${Obj.AltPuls}px`, `${Obj.LargText}px`, "11");
   if (Obj.PositionText == "Side") StandardCSS(Puls1, "top", `${Obj.PosY + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargImage}px`, `${Obj.AltPuls}px`, `${Obj.LargText}px`, "11");
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
   StandardCSS(DivImage, "top", `${Obj.PosY}px`, FlagX, `${PositionX}px`, `${Obj.AtImage}px`, `${Obj.LargImage}px`, "11");

   //TESTO PERSONAGGIO
   const DivText = document.createElement("div");
   E4_PositionNPCText(DivText, Obj);
   DivText.style.backgroundColor = Obj.ColorText;
   DivText.style.color = Obj.ColorFontText;
   DivText.style.fontSize = Obj.Font + "px";
   DivText.innerText = Obj.Text;

   //PULSANTE SX
   const Puls1 = document.createElement("div");
   if (Obj.PositionText == "Down") StandardCSS(Puls1, "top", `${Obj.PosY + Obj.AtImage + Obj.AltText}px`, FlagX, `${PositionX}px`, `${Obj.AltPuls}px`, `${Obj.LargText / 2}px`, "11");
   if (Obj.PositionText == "Side") StandardCSS(Puls1, "top", `${Obj.PosY + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargImage}px`, `${Obj.AltPuls}px`, `${Obj.LargText / 2}px`, "11");
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
   if (Obj.PositionText == "Down") StandardCSS(Puls2, "top", `${Obj.PosY + Obj.AtImage + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargText / 2}px`, `${Obj.AltPuls}px`, `${Obj.LargText / 2}px`, "11");
   if (Obj.PositionText == "Side") StandardCSS(Puls2, "top", `${Obj.PosY + Obj.AltText}px`, FlagX, `${PositionX + Obj.LargImage + Obj.LargText / 2}px`, `${Obj.AltPuls}px`, `${Obj.LargText / 2}px`, "11");
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

/*FA IL PIENO A UNA VARIABILE O AGGIUNGI UNA FRAZIONE DEL TOTALE, CALCOLA LA SPESA E SE NON SI HANNO SOLDI SIFFICIENTI COMPRA QUELLO CHE SI PUÒ*/
function E3_FillValueBar(Obj) {
   //SE IL VALORE È MAGGIORE DELLA FRAZIONE DEL PIENO IMPOSTATA
   if (Obj.Value >= Obj.MaxValue * (1 - Obj.Fill)) {
      //SE IL PREZZO PER UN PIENO È MINORE DEL DENARO POSSEDUTO
      if (Math.floor((Obj.MaxValue - Obj.Value) * Obj.PriceUnit) <= Obj.Money) {
         //FAI IL PIENO
         Obj.Money -= Math.floor((Obj.MaxValue - Obj.Value) * Obj.PriceUnit);
         //AGGIORNA IL VALORE DI CARBURANTE
         Obj.Value = Obj.MaxValue;
      }
      //SE IL PREZZO PER UN PIENO È MAGGIORE DEL DENARO POSSEDUTO
      else {
         //AGGIORNA IL VALORE DI CARBURANTE
         Obj.Value += Math.floor(Obj.Money / Obj.PriceUnit);
         //SPENDI TUTTI I SOLDI E COMPRA QUELLO CHE RIESCI
         Obj.Money = 0;
      };
      //AGGIORNA IL TESTO DEL PULSANTE DI RIEMPIMENTO
      Obj.Puls.innerText = `FILL \n${((Obj.MaxValue - Obj.Value) * Obj.PriceUnit).toFixed(0)}${Obj.MoneySymbol}`;
   }
   //ALTRIMENTI RIEMPI DELLA FRAZIONE DEL PIENO IMPOSTATA
   else {
      //SE IL PREZZO PER 1/4 DEL PIENO È MINORE DEL DENARO POSSEDUTO
      if (Math.floor((Obj.MaxValue * Obj.Fill) * Obj.PriceUnit) <= Obj.Money) {
         //FAI IL PIENO
         Obj.Money -= Math.floor((Obj.MaxValue * Obj.Fill) * Obj.PriceUnit);
         //AGGIORNA IL VALORE DI CARBURANTE
         Obj.Value += Obj.MaxValue * Obj.Fill;
      }
      //SE IL PREZZO PER UN PIENO È MAGGIORE DEL DENARO POSSEDUTO
      else {
         //AGGIORNA IL VALORE DI CARBURANTE
         Obj.Value += Math.floor(Obj.Money / Obj.PriceUnit);
         //SPENDI TUTTI I SOLDI E COMPRA QUELLO CHE RIESCI
         Obj.Money = 0;
      };
      //AGGIORNA IL TESTO DEL PULSANTE DI RIEMPIMENTO
      Obj.Puls.innerText = `FILL \n${((Obj.MaxValue * Obj.Fill) * Obj.PriceUnit).toFixed(0)}${Obj.MoneySymbol}`;
   };

   //AGGIORNA L´ALTEZZA DELLA BARRA
   Obj.Bar.children[0].style.height = `${(Obj.Value / Obj.MaxValue) * 100}%`;
   //AGGIORNA IL TESTO DELLA BARRA
   Obj.Bar.children[1].innerText = `${(Obj.Value).toFixed(0)}/${Obj.MaxValue}`;

   return { Money: Obj.Money, Value: Obj.Value };
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
function DisplayTime(Num) {      //NUM=SECONDI
   let Value;

   if (Num < 60) Value = `${Num.toFixed(1)} sec`;
   if (Num > 60 && Num < 3600) Value = `${(Num / 60).toFixed(1)} min`;
   if (Num > 3600) Value = `${(Num / 3600).toFixed(1)} Hours`;

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

/*CALCOLA LA DISTANZA TRA DUE PUNTI IN PIANO*/
function E3_DistanzaXZ(x1, z1, x2, z2) {
   let dx = x2 - x1;
   let dz = z2 - z1;
   return Math.sqrt(dx * dx + dz * dz);
}

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
      setTimeout(() => {
         Loaded = true;
      }, 1000);

      ActualModules = 0;
   };
   //console.log(ActualModules);
};

function E4_CreatePerfMonitor(Obj, renderer, scene) {
   const perfPanel = document.createElement('div');
   perfPanel.id = 'perfPanel';
   perfPanel.style.pointerEvents = 'none';
   perfPanel.style.position = 'fixed';
   if (Obj.TopFlag == "Top") perfPanel.style.top = Obj.PosY;
   if (Obj.TopFlag == "Bottom") perfPanel.style.bottom = Obj.PosY;
   if (Obj.LeftFlag == "Left") perfPanel.style.left = Obj.PosX;
   if (Obj.LeftFlag == "Right") perfPanel.style.right = Obj.PosX;
   perfPanel.style.background = `rgba(0,0,0,${Obj.opacity})`;
   perfPanel.style.color = '#0f0';
   perfPanel.style.fontFamily = 'monospace';
   perfPanel.style.fontSize = Obj.fontSize;
   perfPanel.style.padding = '6px';
   perfPanel.style.zIndex = '1000';
   perfPanel.style.lineHeight = '1.2em';
   document.body.appendChild(perfPanel);

   //Creiamo i div interni per ogni metrica (una sola volta)
   const metricDivs = [];
   for (let i = 0; i < 11; i++) { //11 righe
      const d = document.createElement('div');
      perfPanel.appendChild(d);
      metricDivs.push(d);
   };

   //Variabili interne isolate
   let _lastTime = performance.now();
   let _frameCount = 0;
   let _fps = 0;
   const _deltaSamples = [];
   const frameBudget = 1000 / Obj.targetFPS;
   let _lastUpdate = performance.now();

   //Funzione per aggiornare il pannello basandosi sul tempo effettivo del frame
   function UpdateFrameTime(tStart, tEnd) {
      const frameWorkTime = tEnd - tStart;
      const now = performance.now();

      //Aggiorna FPS ogni secondo
      _frameCount++;
      const deltaTime = now - _lastTime;
      if (deltaTime >= 1000) {
         _fps = (_frameCount * 1000) / deltaTime;
         _frameCount = 0;
         _lastTime = now;
      }

      //Delta medio ultimi 60 frame
      _deltaSamples.push(frameWorkTime);
      if (_deltaSamples.length > 60) _deltaSamples.shift();
      const avgDelta = _deltaSamples.reduce((a, b) => a + b, 0) / _deltaSamples.length;

      //Carico reale rispetto al frame budget
      const loadPercent = Math.min((frameWorkTime / frameBudget) * 100, 999);

      //Aggiorna pannello solo se è passato abbastanza tempo
      if (now - _lastUpdate >= Obj.updateInterval) {
         _lastUpdate = now;

         //Dati Three.js
         const meshes = scene.children.filter(c => c.isMesh).length;
         const drawCalls = renderer.info.render.calls;
         const geometries = renderer.info.memory.geometries;
         const materials = renderer.info.memory.programs;
         const textures = renderer.info.memory.textures;
         const lights = scene.children.filter(c => c.isLight).length;
         const jsHeap = performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0;

         //Array dei testi da aggiornare, in ordine coerente con metricDivs
         const texts = [
            `FPS: ${_fps.toFixed(1)}`,
            `Frame work ms: ${frameWorkTime.toFixed(2)}`,
            `Delta medio: ${avgDelta.toFixed(2)}`,
            `Carico frame: ${loadPercent.toFixed(1)}%`,
            `Meshes: ${meshes}`,
            `Draw Calls: ${drawCalls}`,
            `Geometries: ${geometries}`,
            `Materials: ${materials}`,
            `Textures: ${textures}`,
            `Lights: ${lights}`,
            `JS Heap: ${jsHeap.toFixed(2)} MB`
         ];

         //Aggiorna ciascun div con SetTextFast
         for (let i = 0; i < metricDivs.length; i++) {
            E3_UpdateText(metricDivs[i], texts[i]);
         }
      }
   };

   return {
      UpdateFrameTime,
      dom: perfPanel
   };
};

function E4_CreatePerfSimpleMonitor(Obj) {
   const perfPanel = document.createElement('div');
   perfPanel.id = 'perfPanel';
   perfPanel.style.pointerEvents = 'none';
   perfPanel.style.position = 'fixed';
   if (Obj.TopFlag == "Top") perfPanel.style.top = Obj.PosY;
   if (Obj.TopFlag == "Bottom") perfPanel.style.bottom = Obj.PosY;
   if (Obj.LeftFlag == "Left") perfPanel.style.left = Obj.PosX;
   if (Obj.LeftFlag == "Right") perfPanel.style.right = Obj.PosX;
   perfPanel.style.background = `rgba(0,0,0,${Obj.opacity})`;
   perfPanel.style.color = '#0f0';
   perfPanel.style.fontFamily = 'monospace';
   perfPanel.style.fontSize = Obj.fontSize;
   perfPanel.style.padding = '6px';
   perfPanel.style.zIndex = '1000';
   perfPanel.style.lineHeight = '1.2em';
   document.body.appendChild(perfPanel);

   //Creiamo i div interni per ogni metrica (una sola volta)
   const metricDivs = [];
   for (let i = 0; i < 1; i++) { //11 righe
      const d = document.createElement('div');
      perfPanel.appendChild(d);
      metricDivs.push(d);
   };

   //Variabili interne isolate
   let _lastTime = performance.now();
   let _frameCount = 0;
   let _fps = 0;
   const _deltaSamples = [];
   let _lastUpdate = performance.now();

   //Funzione per aggiornare il pannello basandosi sul tempo effettivo del frame
   function UpdateFrameTime(tStart, tEnd) {
      const now = performance.now();

      //Aggiorna FPS ogni secondo
      _frameCount++;
      const deltaTime = now - _lastTime;
      if (deltaTime >= 1000) {
         _fps = (_frameCount * 1000) / deltaTime;
         _frameCount = 0;
         _lastTime = now;
      };

      if (_deltaSamples.length > 60) _deltaSamples.shift();

      if (now - _lastUpdate >= Obj.updateInterval) {
         _lastUpdate = now;

         //Array dei testi da aggiornare, in ordine coerente con metricDivs
         const texts = [
            `FPS: ${_fps.toFixed(1)}`,
         ];

         //Aggiorna ciascun div con SetTextFast
         for (let i = 0; i < metricDivs.length; i++) {
            E3_UpdateText(metricDivs[i], texts[i]);
         }
      };
   };

   return {
      UpdateFrameTime,
      dom: perfPanel
   };
};

function E4_CheckDevicePerformance(Obj, renderer) {
   const info = {};

   //Browser e device info
   info.userAgent = navigator.userAgent;
   info.devicePixelRatio = window.devicePixelRatio;
   info.screenResolution = `${window.screen.width}x${window.screen.height}`;

   //GPU info base
   const gl = renderer.getContext();
   const dbgInfo = gl.getExtension('WEBGL_debug_renderer_info');
   info.gpuVendor = dbgInfo ? gl.getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
   info.gpuRenderer = dbgInfo ? gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';

   //Limiti WebGL importanti
   info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
   info.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
   info.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
   info.maxUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
   info.maxRenderBuffer = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
   info.maxCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);

   //Memoria JS (solo Chrome / Android moderno)
   if (performance.memory) {
      info.jsHeapUsedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      info.jsHeapTotalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      info.jsHeapLimitMB = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
   } else {
      info.jsHeapUsedMB = 'N/A';
      info.jsHeapTotalMB = 'N/A';
      info.jsHeapLimitMB = 'N/A';
   }

   //Calcolo potenza GPU empirica
   function estimateGpuPowerPure(device) {
      let score = 0;

      const tex = device.maxTextureSize || 0;
      if (tex >= 16384) score += 4;
      else if (tex >= 8192) score += 3;
      else if (tex >= 4096) score += 2;
      else if (tex >= 2048) score += 1;

      const unif = device.maxUniforms || 0;
      if (unif >= 2048) score += 4;
      else if (unif >= 1024) score += 3;
      else if (unif >= 512) score += 2;
      else if (unif >= 256) score += 1;

      const attribs = device.maxVertexAttribs || 0;
      if (attribs >= 32) score += 2;
      else if (attribs >= 16) score += 1;

      const rbuf = device.maxRenderBuffer || 0;
      if (rbuf >= 16384) score += 2;
      else if (rbuf >= 8192) score += 1;

      const cube = device.maxCubeMapSize || 0;
      if (cube >= 8192) score += 1;

      return Math.min(10, Math.round(score));
   }

   info.gpuPower = estimateGpuPowerPure(info); //salva la potenza GPU empirica

   //Calcolo pixel ratio consigliato
   function getPixelRatioFromPower(device) {
      const base = window.devicePixelRatio || 1;
      const power = device.gpuPower || 5; //default medio
      let ratio = 1;

      if (power >= 9) ratio = Math.min(base, 2.0);
      else if (power >= 7) ratio = Math.min(base, 1.5);
      else if (power >= 5) ratio = 1.0;
      else ratio = 0.75;

      return ratio;
   }

   info.recommendedPixelRatio = getPixelRatioFromPower(info);

   //-------------------------
   //Stampa a schermo (diagnostica)
   const diagPanel = document.createElement('div');
   diagPanel.style.position = 'fixed';
   diagPanel.style.top = Obj.top;
   diagPanel.style.background = `rgba(0,0,0,${Obj.opacity})`;
   diagPanel.style.color = '#0f0';
   diagPanel.style.fontFamily = 'monospace';
   diagPanel.style.fontSize = Obj.fontSize;
   diagPanel.style.padding = '8px';
   diagPanel.style.zIndex = '1000';
   diagPanel.style.maxWidth = '70vw';
   diagPanel.style.whiteSpace = 'pre-wrap';
   diagPanel.style.pointerEvents = 'none';
   if (Obj.LeftTag == "Left") {
      diagPanel.style.left = Obj.PosX;
      diagPanel.style.transformOrigin = 'top left';
   };
   if (Obj.LeftTag == "Right") {
      diagPanel.style.right = Obj.PosX;
      diagPanel.style.transformOrigin = 'top right';
   };
   diagPanel.style.transform = 'scale(0.8)';
   document.body.appendChild(diagPanel);

   const text =
      `Device Info:\n` +
      `UA: ${info.userAgent}\n` +
      `Resolution: ${info.screenResolution}\n` +
      `Pixel Ratio (device): ${info.devicePixelRatio}\n` +
      `Pixel Ratio (recommended): ${info.recommendedPixelRatio}\n\n` +
      `GPU Vendor: ${info.gpuVendor}\n` +
      `GPU Renderer: ${info.gpuRenderer}\n` +
      `GPU Power (0-10): ${info.gpuPower}\n\n` +
      `WebGL Limits:\n` +
      `Max Texture Size: ${info.maxTextureSize}\n` +
      `Max Textures: ${info.maxTextures}\n` +
      `Max Vertex Attribs: ${info.maxVertexAttribs}\n` +
      `Max Uniforms: ${info.maxUniforms}\n` +
      `Max Renderbuffer: ${info.maxRenderBuffer}\n` +
      `Max CubeMap: ${info.maxCubeMapSize}\n\n` +
      `JS Heap Used: ${info.jsHeapUsedMB} MB\n` +
      `JS Heap Total: ${info.jsHeapTotalMB} MB\n` +
      `JS Heap Limit: ${info.jsHeapLimitMB} MB`;

   diagPanel.textContent = text;
   //console.table(info);

   return info; //puoi usarlo per logica, pixelRatio, ecc.
};

/*--------------------MOTORE FISICO--------------------------*/
function E0_PhysicsEngine(Obj) {
   //CREAZIONE OGGETTI
   const UserPosWorld = E3_Vector3();       //POSIZIONE WORLD

   //FUNZIONE AGGIORNAMENTO
   function Update(delta) {
      GroupUser.getWorldPosition(UserPosWorld);
   };

   return {
      Update,
      UserPosWorld
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

   //POSIZIONE
   GroupUser.position.set(Par.ModularShip.XInit * 1000,
      Par.ModularShip.YInit * 1000, Par.ModularShip.ZInit * 1000);

   //ROTAZIONE
   UserDummy.rotation.set(Par.ModularShip.RotXInit, Par.ModularShip.RotYInit, Par.ModularShip.RotZInit);

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

/*--------------MOVIMENTO E ROTAZIONE NAVE SPAZIALE--------------*/
//#region
function E0_RotMovSpaceship(UserObj) {
   /*
   UserObj = Gruppo 3D da muovere o ruotare
   */
   let Speed = 0;             //VELOCITÀ EFFETTIVA (M/S NEL GIOCO)
   let VelImpostata = 0;      //VALORE DA 0 A 100
   let PercLimit = 0;         //VALORE DI VelImpostata DEL LIMITE

   //MOVIMENTO AVANTI SU ASSE Z -100 +100
   function UpdateMov(Obj, delta) {
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
      if (Obj.Axe > 0 && Speed <= Obj.Limit) {
         //ACCELERAZIONE
         if (VelImpostata < 100) VelImpostata += delta * Obj.Axe * Par.RotMovSpaceship.Acc * Obj.CoeffAcc;
         if (VelImpostata > 100) VelImpostata = 100;
      };
      //DIMINUISCI VELOCITÀ
      if (Obj.Axe < 0) {
         //DECELERAZIONE
         if (VelImpostata > 0) VelImpostata += delta * Obj.Axe * Par.RotMovSpaceship.Dec * Obj.CoeffAcc;
         if (VelImpostata < 0) VelImpostata = 0;
      };
      //DIMINUISCI VELOCITÀ PER IL LIMITE
      if (Obj.Limit > 0 && Speed > Obj.Limit) {
         VelImpostata -= delta * Par.RotMovSpaceship.LimitDec;
      };
      if (Obj.Limit == 0) VelImpostata = 0;

      if (VelImpostata > 10) Speed = Math.pow(VelImpostata / 10, Math.log10(Obj.MaxVel));
      else Speed = 0;
      if (Speed > 0) UserObj.translateOnAxis(VetAsseZ, -Speed * delta);

      //VALORE DI VelImpostata DEL LIMITE
      PercLimit = 10 * Math.pow(Obj.Limit, 1 / (Math.log10(Obj.MaxVel)));
   };

   return { UpdateMov, get Speed() { return Speed; }, get Perc() { return VelImpostata; }, get PercLimit() { return PercLimit; } };
};
//#endregion

/*--------------------DYNAMIC COCKPIT--------------------------*/
//#region
let Cockpit;
let DynamCockpit;
let DynamCockpitVar;

const AreaCanvas = [];           //ARRAY DELLE AREE CANVAS
const AreaCanvasObj = [];        //OGGETTI DI CONFIGURAZIONE S0_GenerateHUDCanvas

const ImageArray = [];                          //ARRAY CONTENENTE LE IMMAGINI CONTENENTI I CANVAS
const PosZero = new THREE.Vector3(0, 0, 0);     //VETTORE DI POSIZIONE FISSA DEL SOLE

function E2_CreateVisorCanvas(Color, Sprite, Group, Num1, Num2, Name, CanvArray, ImgArray) {
   const GroupVisore = new THREE.Group();
   GroupVisore.name = Name;

   //---------------------------CANVAS-------------------------//
   const CanvasInd = document.createElement('canvas');
   CanvArray.push(CanvasInd);
   CanvArray[Num2].width = Par.DynamicCockpit.CanvasWidth;
   CanvArray[Num2].height = Par.DynamicCockpit.CanvasWidth;

   const ImageInd = CanvasInd.getContext('2d');
   ImgArray[Num1].push(ImageInd);
   ImgArray[Num1][Num2].font = Par.DynamicCockpit.Font;
   const TextureInd = new THREE.Texture(CanvArray[Num2]);
   //COLORE
   ImgArray[Num1][Num2].fillStyle = Color;

   //-----------------------SPRITE VISORE----------------------//
   const SpriteVisore = new THREE.Sprite(new THREE.SpriteMaterial({ depthWrite: false }));
   SpriteVisore.material.map = Loader.load(Sprite);
   SpriteVisore.name = Num2;
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
   MeshInd.name = Num2;

   MeshInd.scale.setScalar(Par.DynamicCockpit.MeshScale);
   MeshInd.position.set(0, 0, Par.DynamicCockpit.IndPosZ);
   GroupVisore.add(MeshInd);

   Group.add(GroupVisore);

};

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
   DynamCockpit.children[Child0].children[Child1].children[0].scale.setScalar(SpriteScale * DynamicScale(
      Dist, Par.DynamicCockpit.SpriteMinDist, Par.DynamicCockpit.SpriteMaxDist,
      Par.DynamicCockpit.SpriteMinScale, Par.DynamicCockpit.SpriteMaxScale));
   DynamCockpit.children[Child0].children[Child1].children[1].scale.setScalar(MeshScale * DynamicScale(
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
   if (VarPlanetSystem.NumMoons > 0) {
      for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
         //SIMBOLO GENERICO PER LUNE PIANETI
         if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i])
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type == 0) {
               DynamCockpit.children[1].children[i].children[0].material.map = Loader.load(Par.DynamicCockpit.Area[1].Sprite);
               //INDICATORI CANVAS
               AreaCanvas[1].setImageUrl(i, Par.DynamicCockpit.Area[1].Sprite);
            }
            //PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
            else {
               DynamCockpit.children[1].children[i].children[0].material.map = Loader.load(Par.DynamicCockpit.TypeSprite[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type - 1]);
               //INDICATORI CANVAS
               AreaCanvas[1].setImageUrl(i, Par.DynamicCockpit.TypeSprite[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Type - 1]);
            };
         DynamCockpit.children[1].children[i].children[0].material.needsUpdate = true;
      };
      AreaCanvas[1].render();
   }

};
function E2_UpdateSimbolsSubMoons() {
   //AGGIORNAMENTO SUB-LUNE
   if (VarPlanetSystem.NumSubMoons > 0) {
      for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
         if (VarPlanetSystem.MoonOrbit > 0) {
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type == 0) {
               DynamCockpit.children[2].children[i].children[0].material.map = Loader.load(Par.DynamicCockpit.Area[2].Sprite);
               //INDICATORI CANVAS
               AreaCanvas[2].setImageUrl(i, Par.DynamicCockpit.Area[2].Sprite);
            }
            //PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
            else {
               DynamCockpit.children[2].children[i].children[0].material.map = Loader.load(Par.DynamicCockpit.TypeSprite[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1]);
               //INDICATORI CANVAS
               AreaCanvas[2].setImageUrl(i, Par.DynamicCockpit.TypeSprite[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1]);
            };
            DynamCockpit.children[2].children[i].children[0].material.needsUpdate = true;
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

/*-----------------------------------FUNZIONI DA ESEGUIRE NEL LOOP RENDER-------------------------------------*/
//FUNZIONE AGGIORNAMENTO DISPLAY COCKPIT
function E2_UpdateLookCockpit() {
   Cockpit.children[0].children[0].lookAt(PosZero);     //SUNLIGHT
   Cockpit.children[0].children[1].lookAt(PosZero);     //INDICATORE STELLA MADRE

   //INDICATORI RIVOLTI VERSO I PIANETI
   for (let i = 0; i < Object.keys(Cockpit.children[0].children).length - 2; i++) {
      Cockpit.children[0].children[i + 2].lookAt(VarPlanetSystem.WorldPosPlanets[i]);
   };
   //INDICATORI RIVOLTI VERSO LE LUNE
   for (let i = 0; i < Object.keys(Cockpit.children[1].children).length; i++) {
      Cockpit.children[1].children[i].lookAt(VarPlanetSystem.WorldPosMoons[i]);
   };
   //INDICATORI RIVOLTI VERSO LE SUB-LUNE
   for (let i = 0; i < Object.keys(Cockpit.children[2].children).length; i++) {
      Cockpit.children[2].children[i].lookAt(VarPlanetSystem.WorldPosSubMoons[i]);
   };

   //DESTINAZIONE VERSO UN PIANETA
   if (VarPlanetSystem.DestinationPlanet == true && VarPlanetSystem.DestPlanet > 0)
      Cockpit.children[3].children[0].lookAt(VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1]);

   //DESTINAZIONE VERSO UNA LUNA
   if (VarPlanetSystem.DestinationMoon == true && VarPlanetSystem.DestMoon > 0)
      Cockpit.children[3].children[0].lookAt(VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1]);

   //DESTINAZIONE VERSO UNA SUB-LUNA
   if (VarPlanetSystem.DestinationSubMoon == true && VarPlanetSystem.DestSubMoon > 0)
      Cockpit.children[3].children[0].lookAt(VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1]);

   //NEMICI
   if (DynamCockpitVar.EnemyNum > 0) Cockpit.children[4].children[0].lookAt(MicEnginereturn.GenericGroup.children[0].position);
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

      //CREAZIONE OGGETTO DI CONFIGURAZIONE
      const HUDObj = {
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
         /////////////////////////////////////////////////////////SOLE/////////////////////////////////////////////////////////
         if (i == 0 && a == 0) {
            const GroupSole = new THREE.Group();   //GRUPPO POSIZIONE APPARENTE DEL SOLE SEMPRE NELLA STESSA POSIZIONE DELLA NAVE SPAZIALE
            GroupSole.name = "GroupSunlight";
            const SpriteSole = new THREE.Sprite(new THREE.SpriteMaterial({
               map: Loader.load(Par.DynamicCockpit.SunSprite),
               depthWrite: false,
               depthTest: true,
               opacity: 0.8,
            }));
            SpriteSole.name = "SpriteSole";
            SpriteSole.position.set(0, 0, Par.Camera.CameraFar / 100);

            GroupSole.add(SpriteSole);
            //NOTA: QUESTO GRUPPO DIVENTA IL CHILDREN[0] QUINDI GLI INDICATORI PARTONO DAL CHILDREN[1]
            Group.add(GroupSole);
         };
         ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

         E2_CreateVisorCanvas(Par.DynamicCockpit.Area[i].Color, Par.DynamicCockpit.Area[i].Sprite, Group, i, a,
            "GroupVisore", CanvasArray, ImageArray);

         //CREAZIONE PARAMETRI INDICATORI CANVAS
         HUDObj.ImgSize[a] = { Width: Par.DynamicCockpit.Area[i].HeightImg, Height: Par.DynamicCockpit.Area[i].HeightImg };
         HUDObj.ImgPos[a] = { RightFlag: "Left", PosX: "0%", TopFlag: "Top", PosY: "0%" };
         HUDObj.ImgUrl[a] = Par.DynamicCockpit.Area[i].Sprite;
      };
      Cockpit.add(Group);

      //CREAZIONE LIVELLI HUD
      const IndArea = document.createElement('div');
      IndArea.style.display = "block";
      IndArea.style.position = "absolute";
      IndArea.style.width = "100%";
      IndArea.style.height = "100%";
      IndArea.style.top = "0%";
      IndArea.style.left = "0%";

      //CREAZIONE SINGOLI HUD
      for (let a = 0; a < Par.DynamicCockpit.Area[i].Num; a++) {
         const newContainer = document.createElement("div");
         newContainer.style.display = "none";
         newContainer.style.position = "absolute";
         newContainer.style.width = "40px";
         newContainer.style.height = "40px";

         const newDiv = document.createElement("div");
         newDiv.style.display = "block";
         newDiv.style.position = "absolute";
         newDiv.style.top = "0%";
         newDiv.style.left = "50%";
         newDiv.style.width = "0px";
         newDiv.style.height = "0px";
         newDiv.style.border = "solid";
         newDiv.style.borderWidth = "0 6px 15px 6px";
         newDiv.style.borderColor = `transparent transparent ${Par.DynamicCockpit.Area[i].Color} transparent`;
         newDiv.style.transform = "translate(-50%) rotate(0deg)";

         const newP = document.createElement("div");
         newP.style.display = "block";
         newP.style.position = "absolute";
         newP.style.top = "0%";
         newP.style.width = "100%";
         newP.style.height = "50%";
         newP.style.color = Par.DynamicCockpit.Area[i].Color;
         newP.style.textAlign = "center";
         newP.style.fontSize = "Small";

         const newImg = document.createElement("img");
         newImg.style.display = "block";
         newImg.style.position = "absolute";
         newImg.style.height = Par.DynamicCockpit.Area[i].HeightImg;

         newContainer.appendChild(newDiv);
         newContainer.appendChild(newP);
         newContainer.appendChild(newImg);

         IndArea.appendChild(newContainer);
      };

      //Elem.appendChild(IndArea);

      AreaCanvasObj[i] = HUDObj;
   };

   /*------------------------GENERAZIONE AREE CANVAS-----------------------*/
   for (let i = 0; i < AreaCanvasObj.length; i++) {
      const CanvasHUD = S0_GenerateHUDCanvas(AreaCanvasObj[i], {
         DispatchEvent: "Render",
         Width: Par.DynamicCockpit.AreaWidth,                   //LARGHEZZA
         Height: Par.DynamicCockpit.AreaHeight,                 //ALTEZZA
         Top: Par.DynamicCockpit.AreaTop,                       //POSIZIONE VERTICALE DALL'ALTO
      });
      AreaCanvas[i] = CanvasHUD;
   };

   //NOMI FISSI PIANETI
   for (let i = 0; i < Par.DynamicCockpit.Area[0].Num; i++) {
      ImageArray[0][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth,
         Par.DynamicCockpit.CanvasWidth);
      //NOME STELLA MADRE
      if (i == 0) {
         //INDICATORI COCKPIT
         ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Sun.Name[Language], 20, 50);
      };
      //NOME PIANETA
      if (i > 0) {
         //INDICATORI COCKPIT
         ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Modular[i - 1].Name[Language], 20, 50);
      };
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
         else if (i == VarPlanetSystem.NearPlanetIndex) DynamCockpitVar.PlanetVisible[i] = true;
         else DynamCockpitVar.PlanetVisible[i] = false;

         //VISIBILITÀ INDICATORE DYNAMIC COCKPIT
         if (DynamCockpitVar.PlanetVisible[i] == true) {
            /*SPRITE VISORE*/
            //SE IL PIANETA È LA DESTINAZIONE
            if (VarPlanetSystem.DestPlanet == i) {
               DynamCockpit.children[0].children[i + 1].children[0].visible = false;       //SPRITE VISORE
               DynamCockpit.children[0].children[i + 1].children[1].visible = false;       //TESTO INDICATORE
            }
            //SE IL PIANETA NON È LA DESTINAZIONE
            else {
               DynamCockpit.children[0].children[i + 1].children[0].visible = true;        //SPRITE VISORE
               //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
               if ((Cockpit.children[0].children[i + 1].rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || Cockpit.children[0].children[i + 1].rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && Cockpit.children[0].children[i + 1].rotation.y < Par.DynamicCockpit.VisDiff && Cockpit.children[0].children[i + 1].rotation.y > -Par.DynamicCockpit.VisDiff) DynamCockpit.children[0].children[i + 1].children[1].visible = true;
               else DynamCockpit.children[0].children[i + 1].children[1].visible = false;
            };
         }
         else {
            DynamCockpit.children[0].children[i + 1].children[0].visible = false;
            DynamCockpit.children[0].children[i + 1].children[1].visible = false;
         };
         /*-----------------------------DYNAMIC COCKPIT--------------------------------------*/
         //NOTA: IL clearRect PARTE A CANCELLARE DA Y50 COSÌ MANTIENE IL NOME FISSO DEI PIANETI
         ImageArray[0][i].clearRect(0, 50, Par.DynamicCockpit.CanvasWidth,
            Par.DynamicCockpit.CanvasWidth);

         //DISTANZA E TEMPO DI ARRIVO DAL PIANETA PIÙ VICINO COMPRESA DI DIAMETRO
         if (i == VarPlanetSystem.NearPlanetIndex) {
            //DISTANZA, VALORE IN MILIONI DI KM
            ImageArray[0][i].fillText(E3_DisplayDistance((VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000)
               - (VarPlanetSystem.NearPlanetDiameter * Par.DynamicCockpit.ScalaPos), true), 20, 100);
         }
         //DISTANZA ALTRI PIANETI (DIAMETRO TRASCURABILE)
         else {
            //DISTANZA, VALORE IN MILIONI DI KM
            ImageArray[0][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
         };
         //TEMPO DI ARRIVO
         ImageArray[0][i].fillText(DisplayTime(VarPlanetSystem.TimeDist[i]), 20, 150);

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
                  if ((Cockpit.children[1].children[i].rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || Cockpit.children[1].children[i].rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && Cockpit.children[1].children[i].rotation.y < Par.DynamicCockpit.VisDiff && Cockpit.children[1].children[i].rotation.y > -Par.DynamicCockpit.VisDiff) {
                     //SE DA IMPOSTAZIONI È ABILITATO IL TESTO DIETRO UN PIANETA
                     if (Par.DynamicCockpit.Area[1].TextBehindPlanet == true) DynamCockpit.children[1].children[i].children[1].visible = true;
                     else if (MoonsBehind[i] == false) DynamCockpit.children[1].children[i].children[1].visible = true;
                     else if (MoonsBehind[i] == true) DynamCockpit.children[1].children[i].children[1].visible = false;
                  }
                  else {
                     DynamCockpit.children[1].children[i].children[1].visible = false;
                  };
               };
            }
            else {
               DynamCockpit.children[1].children[i].children[0].visible = false;     //SPRITE VISORE
               DynamCockpit.children[1].children[i].children[1].visible = false;     //TESTO INDICATORE
            };
            //-----------------------------DYNAMIC COCKPIT--------------------------------------//
            ImageArray[1][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
            //NOME LUNA
            let Text;
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i]) {
               Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[i].Name[Language];
               ImageArray[1][i].fillText(Text, 20, 50);		                                                      //NOME DESTINAZIONE
            };

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
            ImageArray[1][i].fillText(DisplayTime(VarPlanetSystem.TimeMoonDist[i]), 20, 150);  //TEMPO DI ARRIVO
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
                  if ((Cockpit.children[2].children[i].rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || Cockpit.children[2].children[i].rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && Cockpit.children[2].children[i].rotation.y < Par.DynamicCockpit.VisDiff && Cockpit.children[2].children[i].rotation.y > -Par.DynamicCockpit.VisDiff) {
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
            //-----------------------------DYNAMIC COCKPIT--------------------------------------//
            ImageArray[2][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
            //NOME LUNA
            let Text;
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular.length > 0 && VarPlanetSystem.MoonOrbit > 0)
               Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
                  .Modular[i].Name[Language];
            ImageArray[2][i].fillText(Text, 20, 50);		                                                            //NOME DESTINAZIONE

            //DISTANZA SUB-LUNE (DIAMETRO TRASCURABILE)
            ImageArray[2][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
            ImageArray[2][i].fillText(DisplayTime(VarPlanetSystem.TimeSubMoonDist[i]), 20, 150);  //TEMPO DI ARRIVO
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
         ImageArray[3][0].fillText(DisplayTime((VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * 1000) / VarPlanetSystem.VelEffettiva),
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
         ImageArray[3][0].fillText(DisplayTime((VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * 1000) / VarPlanetSystem.VelEffettiva),
            20, 150);  //TEMPO DI ARRIVO
         DynamCockpit.children[3].children[0].children[1].material.map.needsUpdate = true;

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         E2_ResizeDist(3, 0, VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1], Par.DynamicCockpit.SpriteDestScale,
            Par.DynamicCockpit.MeshScale);
      };
      //DESTINAZIONE VERSO UNA SUB-LUNA
      if (VarPlanetSystem.DestinationSubMoon == true) {
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
         //NOME LUNA
         let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1]
            .Modular[VarPlanetSystem.DestSubMoon - 1].Name[Language];
         ImageArray[3][0].fillText(Text, 20, 50);		                                      //NOME DESTINAZIONE
         //VALORE IN KM x1000
         ImageArray[3][0].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1]
            * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
         ImageArray[3][0].fillText(DisplayTime((VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1]
            * 1000) / VarPlanetSystem.VelEffettiva), 20, 150);  //TEMPO DI ARRIVO
         DynamCockpit.children[3].children[0].children[1].material.map.needsUpdate = true;

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         E2_ResizeDist(3, 0, VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1], Par.DynamicCockpit.SpriteDestScale,
            Par.DynamicCockpit.MeshScale);
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
      //if (Par.DynamicCockpit.DynamicPlanetarySystem == true) {
      //PER TUTTI GLI INDICATORI DELLE LUNE NON UTILIZZATI
      for (let i = 0; i < VarPlanetSystem.NumMajorMoons - VarPlanetSystem.NumMoons; i++) {
         /*-------------------------------INDICATORI CANVAS-------------------------------*/
         DynamCockpitVar.MoonVisible[i + VarPlanetSystem.NumMoons] = false;
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         DynamCockpit.children[1].children[i + VarPlanetSystem.NumMoons].children[0].visible = false;     //SPRITE VISORE
         DynamCockpit.children[1].children[i + VarPlanetSystem.NumMoons].children[1].visible = false;     //MESH INDICATORE
      };

      //PER TUTTI GLI INDICATORI DELLE SUB-LUNE NON UTILIZZATI
      for (let i = 0; i < VarPlanetSystem.NumMajorSubMoons - VarPlanetSystem.NumSubMoons; i++) {
         /*-------------------------------INDICATORI CANVAS------------------------------*/
         DynamCockpitVar.SubMoonVisible[i + VarPlanetSystem.NumMoons] = false;
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         DynamCockpit.children[2].children[i + VarPlanetSystem.NumSubMoons].children[0].visible = false;     //SPRITE VISORE
         DynamCockpit.children[2].children[i + VarPlanetSystem.NumSubMoons].children[1].visible = false;     //MESH INDICATORE
      };

      //VISIBLITÀ COCKPIT E HUD DESTINAZIONE
      if (VarPlanetSystem.DestinationPlanet == false && VarPlanetSystem.DestinationMoon == false && VarPlanetSystem.DestinationSubMoon == false) {
         DynamCockpitVar.DestinationVisible[0] = false;
         Cockpit.children[3].children[0].children[0].visible = false;
         Cockpit.children[3].children[0].children[1].visible = false;
      }
      else {
         DynamCockpitVar.DestinationVisible[0] = true;
         Cockpit.children[3].children[0].children[0].visible = true;
         Cockpit.children[3].children[0].children[1].visible = true;
      };
      //};
   }, 1000);

   UserObjects.add(Cockpit);
   return Cockpit;
};
//#endregion

/*--------------------DYNAMIC PLANETARY SYSTEM------------------------*/
//#region
//FUNZIONE DI SPOSTAMENTO RAPIDO
async function E1_RapidTranslate(Obj) {
   VarPlanetSystem.PlanetOrbit = Obj.PlanetOrbit;
   VarPlanetSystem.MoonOrbit = Obj.MoonOrbit;
   VarPlanetSystem.SubMoonOrbit = Obj.SubMoonOrbit;
   //POSIZIONE
   GroupUser.position.x = Obj.PosX;
   GroupUser.position.y = Obj.PosY;
   GroupUser.position.z = Obj.PosZ;

   //ROTAZIONE
   UserDummy.rotation.set(Obj.RotX, Obj.RotY, Obj.RotZ);

   await E1_InsertOrbitOnce();
};

function E1_PlanetsGroups(Name) {
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
      DepthWrite: false,             //Impostare su true se è usato per aloni, glow o atmosfera (depthWrite)
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

   //GENERO IL PLANETMESH PER POTER INSERIRE AL SUO INTERNO LA NOTTE E LE NUVOLE
   const PlanetMesh = new THREE.Mesh(PlanetGeom, PlanetMaterial);
   PlanetMesh.name = `${Name}Mesh`;

   //EFFETTO BAGLIORE
   if (Oggetti.PlanetarySystem.Glow == true) {
      const glowMaterial = E3_ShaderGlow({
         Color: 0xffffff,        //COLORE DELLO SHADER
         Intensity: 1.0,         //INTENSITÀ DELLO SHADER
      });
      const GlowMesh = E3_GenMesh(PlanetMesh, PlanetGeom, glowMaterial, [0, 0, 0], [0, 0, 0], [1.01, 1.01, 1.01], `${Name} Glow`, true, false);
   }
   else {
      const GlowMesh = E3_GenMesh(PlanetMesh, PlanetGeom, new THREE.MeshBasicMaterial(), [0, 0, 0], [0, 0, 0], [1.01, 1.01, 1.01], `${Name} Glow`, true, false);
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
   //CAMBIO TEXTURE BASE
   Obj.Mesh.material.map = await E2_LoadEditTexture(null, `${Obj.Directory}${Obj.Texture}${Obj.TypeImage}`, true);
   Obj.Mesh.material.needsUpdate = true;

   //EFFETTO GLOW
   if (Oggetti.PlanetarySystem.Glow == true) E3_EditShaderGlow(Obj.Mesh.children[0].material).SetColor(Obj.GlowColor);
   if (Oggetti.PlanetarySystem.Glow == true) E3_EditShaderGlow(Obj.Mesh.children[0].material).SetIntensity(Obj.GlowInt);

   //TEXTURE NOTTE
   if (Obj.NightTexture == "") {
      Obj.Mesh.material.emissiveMap = null;
      Obj.Mesh.material.emissiveIntensity = 0;
   }
   else {
      Obj.Mesh.material.emissiveMap = await E2_LoadEditTexture(null, `${Obj.Directory}${Obj.NightTexture}${Obj.TypeImage}`, true);
      Obj.Mesh.material.needsUpdate = true;
      Obj.Mesh.material.emissiveIntensity = 0.2;
   };

   //MESH NUVOLE
   if (Obj.CloudTexture == "") Obj.Mesh.children[1].visible = false;
   else {
      Obj.Mesh.children[1].visible = true;
      Obj.Mesh.children[1].material.map = await E2_LoadEditTexture(null, `${Obj.Directory}${Obj.CloudTexture}${Obj.TypeImage}`, true);
      Obj.Mesh.children[1].material.needsUpdate = true;
   };
   //MESH ANELLI
   if (Obj.RingTexture == "") Obj.Mesh.children[2].visible = false;
   else {
      Obj.Mesh.children[2].visible = true;
      Obj.Mesh.children[2].material.map = await E2_LoadEditTexture(null, `${Obj.Directory}${Obj.RingTexture}${Obj.TypeRingImage}`, true);
      Obj.Mesh.children[2].material.needsUpdate = true;
      Obj.Mesh.children[2].scale.setScalar(Obj.RingScale);
   };
};

//AGGIORNAMENTO DELLA MESH DEL PIANETA E DELLE TRE MESH PER NOTTE, NUVOLE E ANELLI
async function E2_UpdatePlanetMesh(Num) {
   //INSERIMENTO MESH PIANETA
   PlanetarySystem.children[Num].children[0].children[0].add(VarPlanetSystem.MeshPlanet[0]);
   //SCALA SFERA GLOW
   VarPlanetSystem.MeshPlanet[0].children[0].scale.setScalar(Oggetti.PlanetarySystem.Modular[Num - 1].GlowScale * Par.PlanetarySystem.Parametri.GlowScale);
   //CAMBIO TEXTURE
   await E2_ChangeTexturePlanet({
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
   for (let x = 0; x < Oggetti.PlanetarySystem.Modular[Num - 1].Modular.length; x++) {
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
async function E1_InsertOrbitOnce() {
   if (VarPlanetSystem.PlanetOrbit > 0) {                //SE SI È DENTRO L'ORBITA DI UN PIANETA
      //AGGIORNAMENTO  DELLE MATRICI LOCALI E WORLD
      //E1_PlanetaryUpdateMatrix(VarPlanetSystem.PlanetOrbit);
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

function E1_HUDPositionOrbit(Obj) {
   /*
   const PositionOrbitObj = {
      //DATI IMMAGINI
      Sun: { Alt: "50px", Larg: "50px", y: "35px", x: "10px", src: 'SpaceGame/media/Sun50.png' },
      Planet: { Alt: "40px", Larg: "70px", y: "35px", x: "50px", src: 'SpaceGame/media/Planet40.png' },
      Moon: { Alt: "30px", Larg: "30px", y: "35px", x: "110px", src: 'SpaceGame/media/Moon30.png' },
      Station: { Alt: "27px", Larg: "30px", y: "70px", x: "117px", src: 'SpaceGame/media/Station30.png' },
      SubStation: { Alt: "27px", Larg: "30px", y: "35px", x: "145px", src: 'SpaceGame/media/Station30.png' },
      Ship: { Alt: "17px", Larg: "50px", y: "50px", x: "27px", src: 'SpaceGame/media/PosShip50.png' },
      //POSIZIONE NAVE PER LE ORBITE
      SunOrbit: { Right: "27px", Top: "55px" },
      PlanetOrbit: { Right: "77px", Top: "50px" },
      MoonOrbit: { Right: "117px", Top: "45px" },
      StationOrbit: { Right: "117px", Top: "72px" },
      SubStationOrbit: { Right: "145px", Top: "45px" },
      Time: 1000,
   };
   */
   const Elements = {};
   Elements.SunElem = document.createElement('img');
   StandardCSS(Elements.SunElem, "top", Obj.Sun.y, "right", Obj.Sun.x, Obj.Sun.Alt, Obj.Sun.Larg);
   Elements.SunElem.src = Obj.Sun.src;

   Elements.PlanetElem = document.createElement('img');
   StandardCSS(Elements.PlanetElem, "top", Obj.Planet.y, "right", Obj.Planet.x, Obj.Planet.Alt, Obj.Planet.Larg);
   Elements.PlanetElem.src = Obj.Planet.src;

   Elements.MoonElem = document.createElement('img');
   StandardCSS(Elements.MoonElem, "top", Obj.Moon.y, "right", Obj.Moon.x, Obj.Moon.Alt, Obj.Moon.Larg);
   Elements.MoonElem.src = Obj.Moon.src;

   //SUB-LUNA
   Elements.StationElem1 = document.createElement('img');
   StandardCSS(Elements.StationElem1, "top", Obj.SubStation.y, "right", Obj.SubStation.x, Obj.SubStation.Alt, Obj.SubStation.Larg);
   Elements.StationElem1.src = Obj.SubStation.src;

   //STAZIONE LUNA
   Elements.StationElem2 = document.createElement('img');
   StandardCSS(Elements.StationElem2, "top", Obj.Station.y, "right", Obj.Station.x, Obj.Station.Alt, Obj.Station.Larg);
   Elements.StationElem2.src = Obj.Station.src;

   //NAVE
   Elements.ShipElem = document.createElement('img');
   StandardCSS(Elements.ShipElem, "top", Obj.Ship.y, "right", Obj.Ship.x, Obj.Ship.Alt, Obj.Ship.Larg);
   Elements.ShipElem.src = Obj.Ship.src;

   const Symbols = new OnceFunction(function () {
      //FUORI DA OGNI ORBITA
      if (VarPlanetSystem.PlanetOrbit == 0) {
         Elements.ShipElem.style.right = Obj.SunOrbit.Right;
         Elements.ShipElem.style.top = Obj.SunOrbit.Top;
      }
      //DENTRO L'ORBITA DI UN PIANETA
      else {
         //DENTRO L'ORBITA DI UN PIANETA
         if (VarPlanetSystem.MoonOrbit == 0) {
            Elements.ShipElem.style.right = Obj.PlanetOrbit.Right;
            Elements.ShipElem.style.top = Obj.PlanetOrbit.Top;
         }
         //DENTRO L'ORBITA DI UNA LUNA
         else {
            if (VarPlanetSystem.SubMoonOrbit == 0) {
               //DENTRO L'ORBITA DI UNA LUNA PIANETA
               if (VarPlanetSystem.StationOrbit == false) {
                  Elements.ShipElem.style.right = Obj.MoonOrbit.Right;
                  Elements.ShipElem.style.top = Obj.MoonOrbit.Top;
               }
               //DENTRO L'ORBITA DI UNA LUNA STAZIONE SPAZIALE
               else {
                  Elements.ShipElem.style.right = Obj.StationOrbit.Right;
                  Elements.ShipElem.style.top = Obj.StationOrbit.Top;
               };
            }
            //DENTRO L'ORBITA DI UNA SUB-LUNA
            else {
               Elements.ShipElem.style.right = Obj.SubStationOrbit.Right;
               Elements.ShipElem.style.top = Obj.SubStationOrbit.Top;
            };
         };
      };
   });     //VALORE INIZIALE DI INPUT (OPZIONALE)

   setInterval(() => {
      Symbols.Update(VarPlanetSystem.PlanetOrbit * 100 + VarPlanetSystem.MoonOrbit * 10 + VarPlanetSystem.SubMoonOrbit);
   }, 1000);

   return Elements;
};

//ELIMINA LA STAZIONE SPAZIALE DENTRO UN'ORBITA
function disposeMaterialTextures(material) {
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

function ClearStation(targetGroup) {
   while (targetGroup.children.length > 0) {
      const child = targetGroup.children[0];

      //Ricorsione per gruppi figli
      if (child.children && child.children.length > 0) {
         ClearStation(child, null);
      }

      //Dispose geometria
      if (child.geometry && typeof child.geometry.dispose === 'function') {
         child.geometry.dispose();
      }

      //Dispose materiali e texture
      if (child.material) {
         if (Array.isArray(child.material)) {
            child.material.forEach(m => {
               disposeMaterialTextures(m);
               if (typeof m.dispose === 'function') m.dispose();
            });
         } else {
            disposeMaterialTextures(child.material);
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

function E1_ShowSystemText(Elem) {
   //ALL'INTERNO DI UN'ORBITA DI UN PIANETA
   if (VarPlanetSystem.PlanetOrbit > 0) {
      Elem.style.visibility = "visible";
      //IN ORBITA ATTORNO A UN PIANETA
      if (VarPlanetSystem.MoonOrbit == 0 && VarPlanetSystem.SubMoonOrbit == 0) {
         //CONTROLLO DI SICUREZZA SE LA VARIABILE IN OGGETTI ESISTE
         if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Text0 && Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Text1)
            //ASSEGNA IL TESTO A SYSTEMTEXT
            Elem.children[0].innerText = `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Name[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Text0[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Text1[Language]}`;
      };

      //IN ORBITA ATTORNO A UNA LUNA
      if (VarPlanetSystem.MoonOrbit > 0 && VarPlanetSystem.SubMoonOrbit == 0) {
         //CONTROLLO DI SICUREZZA SE LA VARIABILE IN OGGETTI ESISTE
         if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Text0 && Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Text1)
            //ASSEGNA IL TESTO A SYSTEMTEXT
            Elem.children[0].innerText = `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
               .Modular[VarPlanetSystem.MoonOrbit - 1].Name[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Text0[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Text1[Language]}`;
      };

      //IN ORBITA ATTORNO A UNA SUB-LUNA
      if (VarPlanetSystem.SubMoonOrbit > 0) {
         //CONTROLLO DI SICUREZZA SE LA VARIABILE IN OGGETTI ESISTE
         if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Text0 && Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Text1)
            //ASSEGNA IL TESTO A SYSTEMTEXT
            Elem.children[0].innerText = `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
               .Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Name[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Text0[Language]}
            ${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[VarPlanetSystem.SubMoonOrbit - 1].Text1[Language]}`;
      };
      //NASCONDERE SYSTEM TEXT DOPO UN CERTO TEMPO
      setTimeout(() => {
         Elem.style.visibility = "hidden";
      }, Par.PlanetarySystem.Parametri.SystemTextHideTime);
   };
};

function E1_ShowSystemTextCanvas(Elem, Index) {
   //ALL'INTERNO DI UN'ORBITA DI UN PIANETA
   if (VarPlanetSystem.PlanetOrbit > 0) {
      Elem.showButton(Index, true);
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

//DISATTIVAZIONE DELL'AGGIORNAMENTO DELLE MATRICI LOCALI E WORLD
function E1_PlanetaryUpdateMatrix(Planet) {
   /*
   NOTA: Planet COMPRENDE ANCHE IL SOLE E CORRISPONDE AL CHILDREN DI PLANETARY
   */
   //DISATTIVA LE MATRICI DI TUTTO TRANNE IL SOLE E I GRUPPI DEI PIANETI PRINCIPALI
   for (let i = 0; i < Planetary.children.length - 1; i++) {
      E4_DisableMatrixAutoUpdate(Planetary.children[i + 1].children[0], false, true);
   };
   //RIATTIVAZIONE DELL'AGGIORNAMENTO DELLE MATRICI LOCALI E WORLD
   if (Planet != null) E4_EnableMatrixAutoUpdate(Planetary.children[Planet], true, true);
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
   //NOTA: AGGIUNGERE LA ROTAZIONE PER LA LUNA E SUBLUNA
   if (VarPlanetSystem.PlanetOrbit > 0)
      Planetary.children[VarPlanetSystem.PlanetOrbit].children[0].children[0].children[0].children[1].rotation.y += Par.PlanetarySystem.Parametri.CloudRotation * delta * 10;

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
   //DETAIL 0-50, 1-75, 2-100
   let RadSeg = [];
   let HeightSeg = [];
   if (Par.PlanetarySystem.Parametri.GraphicDetail == 0) {
      RadSeg[0] = 50;
      HeightSeg[0] = 25;
   };
   if (Par.PlanetarySystem.Parametri.GraphicDetail == 1) {
      RadSeg[0] = 75;
      HeightSeg[0] = 37;
   };
   if (Par.PlanetarySystem.Parametri.GraphicDetail == 2) {
      RadSeg[0] = 100;
      HeightSeg[0] = 50;
   };
   //PIANETI E ANELLI
   const PlanetGeom1 = E3_GeoSphere(1000, RadSeg[0], HeightSeg[0], 0, Math.PI * 2, 0, Math.PI);
   const RingGeom1 = E3_GeoRing(0, 1000, RadSeg[0], 2, 0, Math.PI * 2);
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
      const Planet = E1_PlanetsGroups(Oggetti.PlanetarySystem.Modular[i].Name[Language]);

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

      //INIZIALIZZAZIONE DELL'ARRAY PRINCIPALE PER I PIANETI
      VarPlanetSystem.References[i] = [];

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

         Moon = E1_PlanetsGroups(Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language]);
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
               SubMoon = E1_PlanetsGroups(Oggetti.PlanetarySystem.Modular[i].Modular[a].Modular[b].Name[Language]);
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
   const UpdatePlanSysPromiseExecution = new OnceFunction(async function () {
      await CreationEngine.PlanSysPromiseExecution(VarPlanetSystem.NearPlanetIndex - 1);
   }, VarPlanetSystem.NearPlanetIndex);

   /*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
   /*----------------------------------------------BLOCCHI RITARDATI 3000MS LOOP 100MS-----------------------------------------------------*/
   async function DynamicOrbit() {           //INSERIMENTO NELL'ORBITA COSTANTE DURANTE LA PARTITA
      //SE SI ENTRA NEL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DEL PIANETA PIÙ VICINO
      if (VarPlanetSystem.NearPlanetIndex > 0) {
         if (VarPlanetSystem.NearPlanetDist < Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].GravOrbit) {
            if (VarPlanetSystem.PlanetOrbit != VarPlanetSystem.NearPlanetIndex) {
               //ATTACCA LA NAVE SPAZIALE
               Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].attach(GroupUser);
               Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].attach(UserDummy);
               VarPlanetSystem.PlanetOrbit = VarPlanetSystem.NearPlanetIndex;
               //AGGIORNAMENTO  DELLE MATRICI LOCALI E WORLD
               //E1_PlanetaryUpdateMatrix(VarPlanetSystem.PlanetOrbit);
               //AGGIUNGI LE MESH PER IL PIANETA
               await E2_UpdatePlanetMesh(VarPlanetSystem.NearPlanetIndex);
               if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Enter Planet ${VarPlanetSystem.NearPlanetIndex - 1}`);
            };

            //SE SI ENTRA NEL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DI UNA SUA LUNA
            let MoonsNum = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular.length;

            if (MoonsNum > 0 && VarPlanetSystem.NearMoonDist > 0) {
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].
                  Modular[VarPlanetSystem.NearMoonIndex])
                  if (VarPlanetSystem.NearMoonDist < Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].
                     Modular[VarPlanetSystem.NearMoonIndex].GravOrbit) {
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
                              ClearStation(Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].children[VarPlanetSystem.NearMoonIndex + 1].children[0].children[VarPlanetSystem.NearSubMoonIndex + 1].children[0].children[0]);
                           };
                           VarPlanetSystem.SubStationOrbit = false;
                        };
                     };
                  };
               //SE SI ESCE DAL RAGGIO DI ATTRAZIONE GRAVITAZIONALE DI UNA SUA LUNA +10%
               //else {
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex])
                  if (VarPlanetSystem.NearMoonDist > Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[VarPlanetSystem.NearMoonIndex].GravOrbit + Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].
                     Modular[VarPlanetSystem.NearMoonIndex].GravOrbit / 10) {
                     if (VarPlanetSystem.MoonOrbit > 0) {
                        Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].attach(GroupUser);
                        Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].attach(UserDummy);

                        if (Par.PlanetarySystem.Parametri.Log == true) console.log(`Leave Moon`);
                        //SE SI STA LASCIANDO UNA LUNA STAZIONE SPAZIALE
                        if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1]
                           .Modular[VarPlanetSystem.NearMoonIndex].Type > 0)
                           ClearStation(Planetary.children[VarPlanetSystem.NearPlanetIndex].children[0].children[VarPlanetSystem.NearMoonIndex + 1].children[0].children[0]);

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
         //updateDynamicMatrices(Planetary);
         E2_UpdateRotation(0.1);

         /*---------------------------------------------CALCOLO DELLE DISTANZE---------------------------------------------*/
         //DISTANZA DAL SOLE
         VarPlanetSystem.IndDist[0] = PhysicsEngine.UserPosWorld.distanceTo(PosZero) / 1000;

         //POSIZIONI WORLD DEI PIANETI ESCLUSA LA STELLA MADRE (SOLO MENTRE CALCOLA LE DISTANZE POI PASSA A 1 SECONDO)
         if (VarPlanetSystem.NearPlanetIndex == 0)
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

         //POSIZIONE WORLD DEL PIANETA PIÙ VICINO
         if (VarPlanetSystem.NearPlanetIndex > 0)
            VarPlanetSystem.References[VarPlanetSystem.NearPlanetIndex - 1].SeasonRot.getWorldPosition(VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.NearPlanetIndex - 1]);

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
               //DIAMETRO DELLA LUNA PIÙ VICINA
               if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                  .Modular[VarPlanetSystem.NearMoonIndex])
                  VarPlanetSystem.NearMoonDiameter = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1]
                     .Modular[VarPlanetSystem.NearMoonIndex].ScaleXZ * 1000;

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
         UpdatePlanSysPromiseExecution.Update(VarPlanetSystem.NearPlanetIndex);

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
            //ATTRITO CON ATMOSFERA
            if ((VarPlanetSystem.IndDist[0] - Oggetti.PlanetarySystem.Sun.ScaleXZ) < Par.PlanetarySystem.Parametri.SunCollisionDist * Oggetti.PlanetarySystem.Sun.ScaleXZ) VarPlanetSystem.NearCollision = true;
            else VarPlanetSystem.NearCollision = false;
            //COLLISIONE
            if ((VarPlanetSystem.IndDist[0] - Oggetti.PlanetarySystem.Sun.ScaleXZ) <= 0)
               VarPlanetSystem.Collision = true;
            else VarPlanetSystem.Collision = false;

            VarPlanetSystem.LimitCollision = 1;
         };
         //ORBITA DI UN PIANETA
         if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit == 0 && VarPlanetSystem.SubMoonOrbit == 0) {
            //LIMITE DI VELOCITÀ
            if ((VarPlanetSystem.NearPlanetDist - VarPlanetSystem.NearPlanetDiameter / 1000) < Par.PlanetarySystem.Parametri.LimitDist * (VarPlanetSystem.NearPlanetDiameter / 1000))
               VarPlanetSystem.LimitCollision = (VarPlanetSystem.NearPlanetDist - VarPlanetSystem.NearPlanetDiameter / 1000) / (Par.PlanetarySystem.Parametri.LimitDist * (VarPlanetSystem.NearPlanetDiameter / 1000));
            else VarPlanetSystem.LimitCollision = 1;
            //ATTRITO CON ATMOSFERA
            if ((VarPlanetSystem.NearPlanetDist - VarPlanetSystem.NearPlanetDiameter / 1000) < Par.PlanetarySystem.Parametri.CollisionDist * (VarPlanetSystem.NearPlanetDiameter / 1000))
               VarPlanetSystem.NearCollision = true;
            else VarPlanetSystem.NearCollision = false;
            //COLLISIONE
            if ((VarPlanetSystem.NearPlanetDist - VarPlanetSystem.NearPlanetDiameter / 1000) <= 0)
               VarPlanetSystem.Collision = true;
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
            if ((VarPlanetSystem.NearMoonDist - VarPlanetSystem.NearMoonDiameter / 1000) < Par.PlanetarySystem.Parametri.CollisionDist * (VarPlanetSystem.NearMoonDiameter / 1000))
               VarPlanetSystem.NearCollision = true;
            else VarPlanetSystem.NearCollision = false;
            //COLLISIONE
            if ((VarPlanetSystem.NearMoonDist - VarPlanetSystem.NearMoonDiameter / 1000) <= 0)
               VarPlanetSystem.Collision = true;
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
      DepthWrite: false,             //Impostare su true se è usato per aloni, glow o atmosfera (depthWrite)
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
         Par.DynamicPlanetMap.Orbite.TextColor                                                        //Color
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
      let NumSubStations = 0;       //NUMERO DI STAZIONI SPAZIALI IN ORBITA ATTORNO ALLA LUNA

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
               NightTexture: Oggetti.PlanetarySystem.Modular[i].Modular[a].NightTexture,     //NightTexture
               CloudTexture: Oggetti.PlanetarySystem.Modular[i].Modular[a].CloudTexture,     //CloudTexture
            }, PlanetGeom1, RingGeom1);
            Moon.add(MoonMesh);

            //POSIZIONAMENTO NELLA SUA ORBITA INTORNO AL PIANETA
            Moon.position.set(0, ScaleXZ * 1000 + Par.DynamicPlanetMap.Zoom[0].MoonsHeight,
               Oggetti.PlanetarySystem.Modular[i].Modular[a].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000 * Par.DynamicPlanetMap.Zoom[0].MoonOrbitScale);

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
            PlanSystem.children[i + 1].children[0].add(MoonOrbitMesh);

            //CREAZIONE SCRITTA
            const ScrittaMoonMesh = Scritte(
               Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language],             //Text
               0,                                                                                  //PosX
               Par.DynamicPlanetMap.Zoom[0].TextHeight + Par.DynamicPlanetMap.Zoom[0].MoonsHeight,                                                           //PosY
               Oggetti.PlanetarySystem.Modular[i].Modular[a].Raggio * Par.DynamicPlanetMap.Parametri.ScalaPos * 1000,   //PosZ
               Par.DynamicPlanetMap.Zoom[0].TextScale,
               Par.DynamicPlanetMap.Orbite.TextColor);                                                                         //Scale
            ScrittaMoonMesh.name = `${Oggetti.PlanetarySystem.Modular[i].Modular[a].Name[Language]} ScrittaMoonMesh`;
            Moon.add(ScrittaMoonMesh);

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
                  SubSprite.position.set(0, MoonDistanza, 0);
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
                     MapGroup.children[0].children[i].children[0].children[a * 2 + 1].children[0].scale.set(ScaleXZ, ScaleY, ScaleXZ);
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
   const dir = new THREE.Vector3();    //DIREZIONE UNICA DELLE LINEE
   const points = [];
   const desiredWorldQuat = new THREE.Quaternion();

   //genera le posizioni iniziali casuali
   for (let i = 0; i < Object.Number; i++) {
      points.push(new THREE.Vector3(
         (Math.random() - 0.5) * Object.Size,
         (Math.random() - 0.5) * Object.Size,
         (Math.random() - 0.5) * Object.Size
      ));
   }

   const positions = new Float32Array(Object.Number * 6); //start + end per linea
   const geometry = new THREE.BufferGeometry();
   geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

   const material = new THREE.LineBasicMaterial({ color: Object.Color });
   const Lines = new THREE.LineSegments(geometry, material);
   Scene.add(Lines);

   function Update(Obj, delta) {

      //calcola la direzione della nave
      dir.set(0, 0, 1);
      dir.applyQuaternion(Obj.Quaternion).normalize();

      const move = (Obj.Speed - Object.MinSpeed) * Object.Speed * delta;
      const LineLenght = Object.Long * (Obj.Speed - Object.MinSpeed) * Object.Speed;

      for (let i = 0; i < Object.Number; i++) {
         const idx = i * 6;
         const start = points[i];

         //sposta il punto iniziale lungo la direzione
         start.addScaledVector(dir, move);

         //se la linea è troppo lontana davanti, riportala dietro, consideriamo "dietro" come -Lato/2 lungo la direzione locale
         const relativeZ = start.dot(dir); //proiezione lungo dir
         if (relativeZ > Object.Size / 2) {
            //ricicla la linea davanti: spostala indietro lungo dir
            start.addScaledVector(dir, -Object.Size);
         }

         //aggiorna start
         positions[idx] = start.x;
         positions[idx + 1] = start.y;
         positions[idx + 2] = start.z;

         //aggiorna end
         positions[idx + 3] = start.x + dir.x * LineLenght;
         positions[idx + 4] = start.y + dir.y * LineLenght;
         positions[idx + 5] = start.z + dir.z * LineLenght;
      };

      geometry.attributes.position.needsUpdate = true;

      //ROTAZIONE DELLA MESH PER MANTENERLA FERMA
      const parentWorldQuatInv = Obj.Parent.getWorldQuaternion(new THREE.Quaternion()).invert();
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

//RIPRODUCE IL SUONO UNA VOLTA, DA ASSOCIARE ALL'OGGETTO "OnceFunction" O A UN EVENTO
function E1_PlayOnceSound(Track, Volume) {
   if (Sound[Track]?.isReady && !Sound[Track].isPlaying) {
      Sound[Track].setVolume(Volume);
      Sound[Track].play();
   }
};

function E1_PlayLoopSound(Track) {
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

function E0_Audio() {
   const listener = new THREE.AudioListener();
   Camera.add(listener);
   const audioLoader = new THREE.AudioLoader();

   for (let i = 0; i < Par.Audio.Track.length; i++) {
      Sound[i] = new THREE.Audio(listener);
      Sound[i].isReady = false;

      audioLoader.load(Par.Audio.Track[i], function (buffer) {
         Sound[i].setBuffer(buffer);
         Sound[i].setLoop(false);
         Sound[i].setVolume(1.0);
         Sound[i].isReady = true;
      });
   }
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
         for (let i = 0; i < Obj.VirtualAxe.length; i++) {
            //APPLICAZIONE INVERSIONE ASSE
            if (i == 0) {                    //BECCHEGGIO
               if (Obj.InvAxe[i] == 0) InvAxeSign[i] = -1;
               if (Obj.InvAxe[i] == 1) InvAxeSign[i] = 1;
            };
            if (i == 1) {                    //IMBARDATA
               if (Obj.InvAxe[i] == 0) InvAxeSign[i] = -1;
               if (Obj.InvAxe[i] == 1) InvAxeSign[i] = 1;
            };
            if (i == 2) {                    //ROLLIO
               if (Obj.InvAxe[i] == 0) InvAxeSign[i] = -1;
               if (Obj.InvAxe[i] == 1) InvAxeSign[i] = 1;
            };
            //VALORI ASSI IN BASE A REGOLAZIONE E INVERSIONE
            if (Obj.VirtualAxe[i] == 0) Axe[i] = MicEnginereturn.VarPad[0].ValX * ((Obj.RegAxe[i] + 5) / 100) * InvAxeSign[i];
            if (Obj.VirtualAxe[i] == 1) Axe[i] = MicEnginereturn.VarPad[0].ValY * ((Obj.RegAxe[i] + 5) / 100) * InvAxeSign[i];
            if (Obj.VirtualAxe[i] == 2) Axe[i] = MicEnginereturn.VarPad[1].ValX * ((Obj.RegAxe[i] + 5) / 100) * InvAxeSign[i];
         };
      };
      //GAMEPAD FISICO
      if (Obj.Control == 1) {
         if (Gamepad != null) {
            Gamepad = navigator.getGamepads()[GamepadIndex];
            //VALORI ASSI FISICI
            for (let i = 0; i < Obj.PadAxe.length; i++) {
               //APPLICAZIONE INVERSIONE ASSE
               if (i == 0) {                 //BECCHEGGIO
                  if (Obj.InvAxe[i] == 0) InvAxeSign[i] = 1;
                  if (Obj.InvAxe[i] == 1) InvAxeSign[i] = -1;
               };
               if (i == 1) {                 //IMBARDATA
                  if (Obj.InvAxe[i] == 0) InvAxeSign[i] = -1;
                  if (Obj.InvAxe[i] == 1) InvAxeSign[i] = 1;
               };
               if (i == 2) {                 //ROLLIO
                  if (Obj.InvAxe[i] == 0) InvAxeSign[i] = -1;
                  if (Obj.InvAxe[i] == 1) InvAxeSign[i] = 1;
               };
               if (i == 3) {                 //RIDUCI ACCELERATORE
                  if (Obj.InvAxe[i] == 0) InvAxeSign[i] = 1;
                  if (Obj.InvAxe[i] == 1) InvAxeSign[i] = -1;
               };
               if (i == 4) {                 //AUMENTA ACCELERATORE
                  if (Obj.InvAxe[i] == 0) InvAxeSign[i] = 1;
                  if (Obj.InvAxe[i] == 1) InvAxeSign[i] = -1;
               };
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
   });

   const promises = Materiali.map(async (mat, h) => {
      let m;

      //Passa il manager alle funzioni di creazione dei materiali
      if (mat.Type == "Base") m = await E3_MaterialeBase(mat, manager);
      if (mat.Type == "Lucido") m = await E3_MaterialeLucido(mat, manager);
      if (mat.Type == "Opaco") m = await E3_MaterialeOpaco(mat, manager);
      if (mat.Type == "Standard") m = await E3_MaterialeStandard(mat, manager);
      if (mat.Type == "Punti") m = E3_MaterialePunti(mat);

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
   RendererObj.antialias = Par.Renderer.Antialias;
   RendererObj.preserveDrawingBuffer = false;             //true
   RendererObj.precision = "highp";            //'highp' | 'mediump' | 'lowp'  NON TOCCARE, mettendo su medium non si vedono più i pianeti su android
   RendererObj.alpha = false;                //DEFAULT false
   RendererObj.powerPreference = "high-performance";             //"high-performance", "low-power", "default"
   RendererObj.logarithmicDepthBuffer = Par.Renderer.LogarithmicDepthBuffer;

   renderer = new THREE.WebGLRenderer(RendererObj);
   renderer.setSize(window.innerWidth * Par.Renderer.Width, window.innerHeight * Par.Renderer.Height);
   renderer.setPixelRatio(window.devicePixelRatio);
   renderer.shadowMap.enabled = Par.Renderer.Shadows;
   renderer.shadowMap.type = THREE.PCFShadowMap;       //default
   renderer.outputColorSpace = THREE.SRGBColorSpace;
   //renderer.toneMapping = THREE.NoToneMapping;        //NON TOCCARE O SU ANDROID SPARISCONO I PIANETI

   //POSIZIONA LA SCENA
   renderer.domElement.style.position = "absolute";
   renderer.domElement.style.top = Par.Renderer.PosY;
   renderer.domElement.style.left = Par.Renderer.PosX;

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
   windowResizeHandler();

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
   LoaderScreen = S0_LoaderScreen();
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
   if (Par.Moduli.CreateObj == true) {
      CreationEngine = await E0_CreationEngine(Oggetti3D, Oggetti, GeometrieObj, MaterialiObj, Par, Manager);
      await CreationEngine.PromiseExecution();

      ActualModules++;
      //console.table({ RecycledGeom, MultiGeom, MultiObjects, GenericObjects, MeshMultiObjects, MeshGroupObjects });
   };

   if (Par.Moduli.Debug == true) {
      console.log("MaterialArray");
      console.log(E3_ConsoleLogSimpleObject(MaterialArray));

      console.log("Oggetti3D");
      console.log(Oggetti3D);
      let SpaceshipModel = 0;
      let PlanetarySystemModel = 0;
      let GenericModel = 0;
      let UniversalGeomModel = 0;
      for (let i = 0; i < Oggetti3D.Spaceship.Model.length; i++) {
         if (Oggetti3D.Spaceship.Model[i] && Oggetti3D.Spaceship.Model[i].isObject3D == true) SpaceshipModel++;
      };
      for (let i = 0; i < Oggetti3D.PlanetarySystem.Model.length; i++) {
         if (Oggetti3D.PlanetarySystem.Model[i] && Oggetti3D.PlanetarySystem.Model[i].isObject3D == true) PlanetarySystemModel++;
      };
      for (let i = 0; i < Oggetti3D.Generic.Model.length; i++) {
         if (Oggetti3D.Generic.Model[i] && Oggetti3D.Generic.Model[i].isObject3D == true) GenericModel++;
      };
      for (let i = 0; i < UniversalGeom.length; i++) {
         if (UniversalGeom[i]) UniversalGeomModel++;
      };
      console.log(`Spaceship Index: ${Oggetti3D.Spaceship.Model.length}, Allocati: ${SpaceshipModel}`);
      console.log(`PlanetarySystem Index: ${Oggetti3D.PlanetarySystem.Model.length}, Allocati: ${PlanetarySystemModel}`);
      console.log(`Generic Index: ${Oggetti3D.Generic.Model.length}, Allocati: ${GenericModel}`);
      console.log(`UniversalGeom Index: ${UniversalGeom.length}, Allocati: ${UniversalGeomModel}`);
      console.dir(E3_ConsoleLogSimpleObject(UniversalGeom));
   };

   //SE GLI OGGETTI GENERICI SONO ABILITATI
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
   VarObjectExport.E3_UserPosRot = E3_UserPosRot;

   /*-----------------------------------------------MATERIALI THREE.JS---------------------------------------------------------*/
   VarObjectExport.E3_MaterialeBase = E3_MaterialeBase;
   VarObjectExport.E3_MaterialeBaseColor = E3_MaterialeBaseColor;
   VarObjectExport.E3_MaterialeStandard = E3_MaterialeStandard;
   VarObjectExport.E3_MaterialeLucido = E3_MaterialeLucido;
   VarObjectExport.E3_MaterialeOpaco = E3_MaterialeOpaco;
   VarObjectExport.E3_MaterialeSprite = E3_MaterialeSprite;
   VarObjectExport.E3_MaterialePunti = E3_MaterialePunti;

   /*--------------------------------------------MATERIALI PERSONALIZZATI THREE.JS----------------------------------------------*/
   VarObjectExport.E3_ShaderGlow = E3_ShaderGlow;
   VarObjectExport.E3_EditShaderGlow = E3_EditShaderGlow;
   VarObjectExport.E3_ShaderLens = E3_ShaderLens;
   VarObjectExport.E3_EditShaderLens = E3_EditShaderLens;
   VarObjectExport.E3_ShaderOverlay = E3_ShaderOverlay;
   VarObjectExport.E3_StampCanvas = E3_StampCanvas;

   /*-----------------------------------------------GEOMETRIE THREE.JS---------------------------------------------------------*/
   VarObjectExport.E3_GeoBox = E3_GeoBox;
   VarObjectExport.E3_GeoCylinder = E3_GeoCylinder;
   VarObjectExport.E3_GeoSphere = E3_GeoSphere;
   VarObjectExport.E3_GeoRing = E3_GeoRing;
   VarObjectExport.E3_GeoPlane = E3_GeoPlane;
   VarObjectExport.E3_GeoCircle = E3_GeoCircle;
   VarObjectExport.E3_GenerateFilamentCloud = E3_GenerateFilamentCloud;

   /*-----------------------------------------------OGGETTI THREE.JS---------------------------------------------------------*/
   VarObjectExport.E3_GenMesh = E3_GenMesh;
   VarObjectExport.E3_UniversalMesh = E3_UniversalMesh;
   VarObjectExport.E3_Group = E3_Group;
   VarObjectExport.E3_Object3D = E3_Object3D;
   VarObjectExport.E3_Vector3 = E3_Vector3;
   VarObjectExport.E3_Quaternion = E3_Quaternion;
   VarObjectExport.E3_Matrix4 = E3_Matrix4;
   VarObjectExport.E3_Euler = E3_Euler;
   VarObjectExport.E3_CircularGradient = E3_CircularGradient;

   /*----------------------------------------------FUNZIONI MATEMATICHE--------------------------------------------------------*/
   VarObjectExport.E3_AngleZero = E3_AngleZero;
   VarObjectExport.CompareIncrement = CompareIncrement;
   VarObjectExport.E3_EulerQuaternionInterpolation = E3_EulerQuaternionInterpolation;
   VarObjectExport.E3_DisplayDistance = E3_DisplayDistance;
   VarObjectExport.DisplaySpeed = DisplaySpeed;
   VarObjectExport.CoeffMap = CoeffMap;
   VarObjectExport.E3_SortedArray = E3_SortedArray;
   VarObjectExport.E3_ModifyArray = E3_ModifyArray;
   VarObjectExport.E3_GenerateAttributes = E3_GenerateAttributes;
   VarObjectExport.E3_RandomPointInRing = E3_RandomPointInRing;
   VarObjectExport.E3_DistanzaXZ = E3_DistanzaXZ;

   /*---------------------------------------------------FUNZIONI DOM----------------------------------------------------------*/
   VarObjectExport.StandardCSS = StandardCSS;
   VarObjectExport.StandardCSSText = StandardCSSText;
   VarObjectExport.LampeggioSpia = LampeggioSpia;
   VarObjectExport.E3_DisplayNPC = E3_DisplayNPC;
   VarObjectExport.E3_DisplayNPCDoubleButton = E3_DisplayNPCDoubleButton;
   VarObjectExport.E3_DisplayNPCSingleButton = E3_DisplayNPCSingleButton;
   VarObjectExport.E3_PointerButton = E3_PointerButton;
   VarObjectExport.E3_CreateLines = E3_CreateLines;
   VarObjectExport.E3_FillValueBar = E3_FillValueBar;          //ELIMINARE
   VarObjectExport.E3_UpdateText = E3_UpdateText;

   /*---------------------------------------------------FUNZIONI CANVAS----------------------------------------------------------*/
   VarObjectExport.E3_FillValueBarCanvas = E3_FillValueBarCanvas;

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
   if (Par.Moduli.Monitor == true || Par.Moduli.SimpleMonitor == true) {
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

   /*--------------MOVIMENTO E ROTAZIONE NAVE SPAZIALE--------------*/
   if (Par.Moduli.RotMovSpaceship == true) {
      UrlModule = "RotMovSpaceship";
      const RotMovSpaceship = E0_RotMovSpaceship(GroupUser);
      //ESPORTAZIONE
      MicEnginereturn.RotMovSpaceship = RotMovSpaceship;

      ActualModules++;
      E3_UpdateProgress(false);
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
         ArrayMoonsNum: [],            //ARRAY CON IL NUMERO DI TUTTE LE LUNE PER OGNI PIANETA
         ArraySubMoonsNum: [],         //ARRAY CON IL NUMERO DI TUTTE LE SUB-LUNE PER OGNI LUNA
         TractorTime: 0,
         CoeffRot: 1,                  //COEFFICIENTE ALLA ROTAZIONE DEI PIANETI DIPENDENTE DALLA CONTRAZIONE TEMPORALE
         RandomRotPlanet: [],          //ROTAZIONI INIZIALI CASUALI DEI PIANETI ALLA NUOVA PARTITA
         OrbitOnceLoaded: false,       //FUNZIONE ASINCRONA E1_InsertOrbitOnce CARICATA

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
         //VALORI LUNA PIÙ VICINA
         NearMoonDist: 0,              //DISTANZA PER LA LUNA PIÙ VICINA
         NearMoonIndex: 0,              //INDICE DELLA LUNA PIÙ VICINA
         NearMoonDiameter: 0,        //DIAMETRO DELLA LUNA PIÙ VICINA
         //VALORI SUB-LUNA PIÙ VICINA
         NearSubMoonDist: 0,           //DISTANZA PER LA LUNA PIÙ VICINA
         NearSubMoonIndex: 0,              //INDICE DELLA LUNA PIÙ VICINA
         //NearSubMoonDiameter: 0,        //DIAMETRO DELLA LUNA PIÙ VICINA
         //ORBITE DINAMICHE
         PlanetOrbit: 0,            //ORBITA DI UN PIANETA RAGGIUNTA (INCLUSO IL SOLE) ES. TERRA=3
         MoonOrbit: 0,              //ORBITA DI UNA LUNA RAGGIUNTA (NUMERO DELLA LUNA +1, 0=NESSUNA ORBITA)
         SubMoonOrbit: 0,           //ORBITA DI UNA SUB-LUNA RAGGIUNTA (NUMERO DELLA LUNA +1, 0=NESSUNA ORBITA)
         NumMoons: 0,               //NUMERO DI LUNE ATTUALI
         NumSubMoons: 0,               //NUMERO DI SUB-LUNE ATTUALI
         StationOrbit: false,                //ORBITA STAZIONE SPAZIALE RAGGIUNTA (LUNA)
         SubStationOrbit: false,                //ORBITA STAZIONE SPAZIALE RAGGIUNTA (SUB-LUNA)
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
      //Scene.add(PlanetarySystem);

      //NUOVA PARTITA
      if (Number(SaveSystem.getItem(`NewGame`)) == 0) {
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
         await E1_InsertOrbitOnce();
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
         await E1_InsertOrbitOnce();
         VarPlanetSystem.OrbitOnceLoaded = true;

      };
      //ESPORTAZIONE
      MicEnginereturn.VarPlanetSystem = VarPlanetSystem;
      MicEnginereturn.PlanetarySystem = PlanetarySystem;
      MicEnginereturn.E1_HUDPositionOrbit = E1_HUDPositionOrbit;
      MicEnginereturn.E1_FrustumNearPlanet = E1_FrustumNearPlanet;
      MicEnginereturn.E1_ShowSystemText = E1_ShowSystemText;               //ELIMINARE
      MicEnginereturn.E1_ShowSystemTextCanvas = E1_ShowSystemTextCanvas;
      MicEnginereturn.E1_InsertOrbitOnce = E1_InsertOrbitOnce;
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
      console.log(PlanetMap);

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
         References: [],                //RIFERIMENTI DELLE POSIZIONI DEGLI INDICATORI DOM
         PlanetVisible: [],            //ARRAY CON LA VISIBILITÀ DI TUTTI GLI INDICATORI COCKPIT DEI PIANETI
         MoonVisible: [],              //ARRAY CON LA VISIBILITÀ DI TUTTI GLI INDICATORI COCKPIT DELLE LUNE
         SubMoonVisible: [],           //ARRAY CON LA VISIBILITÀ DI TUTTI GLI INDICATORI COCKPIT DELLE SUB-LUNE
         DestinationVisible: [],       //ARRAY CON LA VISIBILITÀ DI TUTTI GLI INDICATORI COCKPIT DESTINAZIONE
         UpdateSymbolsControl: 0,      //VARIABILE DI CONTROLLO PER FUNZIONE ONCEFUNCTION PER I SIMBOLI DI LUNE E SUB-LUNE
         IndVisualPlanet: [],
         IndVisualMoon: [],
         IndVisualSubMoon: [],
         IndVisualDest: [],
         PositionDomDir: [],     //POSIZIONE IN PERCENTUALE DELLO SCHERMO DEGLI INDICATORI DOM DIREZIONE + DIREZIONE Z + CAMERA IN DIREZIONE
         /*DynamCockpitVar.PositionDomDir[i][a] = { x: 0, y: 0, z: 0, Dir: false };*/
         DomDirVisible: [],      //VISIBILITÀ INDICATORI DOM DIREZIONE
         DomVisible: [],          //VISIBILITÀ INDICATORI DOM CORNICE
         DomText: [],            //ARRAY TESTI INDICATORI
         DomEnabled: [],

         /*----------------------------------------VARIABILI FORNITE DAL MODULO (LETTURA)---------------------------------------------*/
         /*----------------------------------VARIABILI DA FORNIRE AL MODULO (LETTURA E SCRITTURA)-------------------------------------*/
         DistPlanets: 0,        //DISTANZA MASSIMA PIANETI VISUALIZZABILI
         //ARRAY DISTANZE
         IndDistEnemy: [],             //VALORI DISTANZE NEMICI DALLA NAVE SPAZIALE (km NEL GIOCO)
         EnemyNum: 0,                  //NUMERO DI NEMICI ATTIVI
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
      UrlModule = "Hyperloop";
      MicEnginereturn.Hyperloop = Hyperloop(Par.Hyperloop);
      ActualModules++;
      E3_UpdateProgress(false);
   };


   /*--------------------ORBIT CONTROL-------------------------------*/
   if (Par.Moduli.OrbitControl == true) {
      UrlModule = "OrbitControl";
      //ESPORTAZIONE
      MicEnginereturn.OrbitControl = new OrbitControls(Camera, renderer.domElement);
      MicEnginereturn.OrbitControl.enableDamping = Par.OrbitControl.Damping;
      MicEnginereturn.OrbitControl.maxPolarAngle = Par.OrbitControl.MaxPolarAngle;
      MicEnginereturn.OrbitControl.minPolarAngle = Par.OrbitControl.MinPolarAngle;
      MicEnginereturn.OrbitControl.maxAzimuthAngle = Par.OrbitControl.MaxAzimuthAngle;
      MicEnginereturn.OrbitControl.minAzimuthAngle = Par.OrbitControl.MinAzimuthAngle;
      MicEnginereturn.OrbitControl.minDistance = Par.OrbitControl.MinDistance;            //DISTANZA VERTICALE MASSIMA
      MicEnginereturn.OrbitControl.maxDistance = Par.OrbitControl.MaxDistance;            //DISTANZA VERTICALE MINIMA
      MicEnginereturn.OrbitControl.enablePan = Par.OrbitControl.Pan;
      MicEnginereturn.OrbitControl.distance = Par.OrbitControl.MinDistance;
      MicEnginereturn.OrbitControl.update();

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------MONITOR-------------------------------*/
   if (Par.Moduli.Monitor == true) {
      UrlModule = "Monitor";
      perfMonitor = E4_CreatePerfMonitor({
         targetFPS: 60,
         updateInterval: 200,
         TopFlag: "Top",      //"Top" "Bottom"
         PosY: "50%",
         LeftFlag: "Left",    //"Left" "Right"
         PosX: "0%",
         opacity: 1,
         fontSize: '12px',
      }, renderer, Scene);

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------SIMPLEMONITOR-------------------------------*/
   if (Par.Moduli.SimpleMonitor == true) {
      UrlModule = "SimpleMonitor";
      perfMonitor = E4_CreatePerfSimpleMonitor({
         updateInterval: 200,
         TopFlag: "Bottom",    //"Top" "Bottom"
         PosY: "0%",
         LeftFlag: "Left",    //"Left" "Right"
         PosX: "0%",
         opacity: 1,
         fontSize: '12px',
      });

      ActualModules++;
      E3_UpdateProgress(false);
   };

   /*--------------------PERFORMANCE-------------------------------*/
   if (Par.Moduli.Performance == true) {
      UrlModule = "Performance";
      E4_CheckDevicePerformance({
         top: "15%",
         LeftTag: "Right",          //Left, Right
         PosX: "0%",
         opacity: 1,
         fontSize: "10px",
      }, renderer);

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
      E0_Audio();

      //ESPORTAZIONE
      MicEnginereturn.E1_PlayOnceSound = E1_PlayOnceSound;
      MicEnginereturn.E1_PlayLoopSound = E1_PlayLoopSound;

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

   //const time = new YUKA.Time();

   let lastTime = 0;
   let deltaTime = 0;
   let maxFPS = Par.Renderer.FPS; //Framerate massimo
   let frameDuration;
   if (maxFPS != 0) frameDuration = 800 / maxFPS;

   function animate(time) {
      if (isPaused) return;

      requestAnimationFrame(animate);
      deltaTime = time - lastTime;

      //if (maxFPS == 0 || deltaTime >= frameDuration) {
      lastTime = time;
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
      if (Par.Moduli.OrbitControl == true) MicEnginereturn.OrbitControl.update();

      Update(delta);

      /*--------------------------------------DYNAMIC COCKPIT------------------------------------------*/
      if (Par.Moduli.DynamicCockpit == true) E2_UpdateDynamicCockpit(delta);

      if (Par.Renderer.Enable == true) renderer.render(Scene, Camera);

      const tEnd = performance.now();

      if (Par.Moduli.Monitor == true || Par.Moduli.SimpleMonitor == true) {
         //stats.end();
         perfMonitor.UpdateFrameTime(tStart, tEnd);
      };

      //};
   };

   animate();
   //#endregion

   /* ------------------------------------------------------DEBUG-------------------------------------------------------- */
   MicEnginereturn.User.Done = true;
   PaceDone = true;
   VarObjectExport.PaceDone = true;

   //Array per salvare informazioni sugli oggetti con trasformazioni attive
   function GetActiveObjects() {
      let total = 0;
      let worldActive = 0;
      let worldFrozen = 0;

      const activeObjects = [];

      //Manteniamo un riferimento alla funzione originale
      const originalUpdate = THREE.Object3D.prototype.updateMatrixWorld;

      //Esegui la traversata della scena
      Scene.traverse((obj) => {
         if (!obj.isObject3D) return;

         total++;

         //Se la funzione è quella originale → trasformazioni attive
         const isActive = obj.updateMatrixWorld === originalUpdate;

         if (isActive) {
            worldActive++;

            //Salva informazioni utili sull’oggetto
            activeObjects.push({
               name: obj.name || "(senza nome)",
               type: obj.type,
               uuid: obj.uuid,
               visible: obj.visible,
               position: obj.position ? obj.position.clone() : null,
               matrixAutoUpdate: obj.matrixAutoUpdate,
               parent: obj.parent ? obj.parent.name || obj.parent.type : null,
            });
         } else {
            worldFrozen++;
         }
      });

      console.log(`Totale oggetti: ${total}`);
      console.log(`Trasformazioni world ATTIVE: ${worldActive}`);
      console.log(`Trasformazioni world DISABILITATE: ${worldFrozen}`);

      //Log dettagliato opzionale
      console.log("Oggetti con trasformazioni attive:", activeObjects);
   };
   function analyzeMemory(Flag, renderer, scene) {
      if (Flag) {
         console.log("=== Analisi Memoria Gioco ===");

         //Info base dal renderer
         const memory = renderer.info.memory;
         console.log(`👾 Geometrie: ${memory.geometries}`);
         console.log(`🎨 Materiali: ${memory.programs}`);
         console.log(`🖼️ Texture: ${memory.textures}`);

         //Info dal browser (solo su Chrome)
         if (performance.memory) {
            const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
            const totalMB = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
            const limitMB = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);

            console.log(`🧠 RAM Usata: ${usedMB} MB`);
            console.log(`🧠 RAM Totale Allocata: ${totalMB} MB`);
            console.log(`🧠 RAM Massima Consentita: ${limitMB} MB`);
         } else {
            console.log("⚠️ performance.memory non disponibile su questo browser.");
         }

         //Info WebGL - GPU
         const gl = renderer.getContext();
         const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

         if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const rendererInfo = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log(`🖥️ GPU Vendor: ${vendor}`);
            console.log(`🖥️ GPU Renderer: ${rendererInfo}`);
         } else {
            console.log("⚠️ Estensione WEBGL_debug_renderer_info non disponibile.");
         }

         /*Nota: La VRAM disponibile e usata NON è accessibile direttamente dal browser.
         Possiamo provare a stimare la VRAM usata sommando dimensioni delle texture (approssimativo).*/

         let totalTextureMemory = 0; //in bytes

         scene.traverse(object => {
            if (object.isMesh && object.material) {
               const materials = Array.isArray(object.material) ? object.material : [object.material];
               materials.forEach(mat => {
                  for (const key in mat) {
                     const value = mat[key];
                     if (value && value.isTexture && value.image) {
                        const img = value.image;
                        if (img.width && img.height) {
                           totalTextureMemory += img.width * img.height * 4;
                        }
                     }
                  }
               });
            }
         });

         const totalTextureMB = (totalTextureMemory / (1024 * 1024)).toFixed(2);
         console.log(`🎨 VRAM approssimata usata dalle texture: ${totalTextureMB} MB`);

         //Oggetti nella scena
         let meshes = 0;
         let lights = 0;
         let groups = 0;
         let others = 0;

         scene.traverse(object => {
            if (object.isMesh) meshes++;
            else if (object.isLight) lights++;
            else if (object.isGroup) groups++;
            else others++;
         });

         console.log(`🧩 Mesh totali: ${meshes}`);
         console.log(`💡 Luci totali: ${lights}`);
         console.log(`📦 Gruppi totali: ${groups}`);
         console.log(`📄 Altri oggetti: ${others}`);

         console.log("=== Fine Analisi ===");
      };
   };

   const endTime = performance.now();

   if (Par.Moduli.Debug == true) {
      GetActiveObjects();
      console.log("Oggetto Scena");
      console.log(E3_ConsoleLogSimpleObject(Scene));
      console.log("Renderer Info");
      console.log(renderer.info);
      analyzeMemory(false, renderer, Scene);

      ActualModules++;
   };
   //console.log(`Tempo di caricamento scena: ${(endTime - startTime).toFixed(0)} ms`);

   setTimeout(() => {
      //pauseGame();
      //console.log(Gamecharge);
   }, 1000);

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

/*FUMO*/
// export async function SnippetEngine() {
//    let scene, camera, renderer;
//    let smokeSystem;

//    init();
//    animate();

//    function init() {
//       // Scena
//       scene = new THREE.Scene();

//       // Camera
//       camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
//       camera.position.set(0, 5, 15);

//       // Renderer
//       renderer = new THREE.WebGLRenderer({ antialias: true });
//       renderer.setSize(window.innerWidth, window.innerHeight);
//       document.body.appendChild(renderer.domElement);

//       // Luce
//       const light = new THREE.DirectionalLight(0xffffff, 1);
//       light.position.set(5, 10, 7);
//       scene.add(light);

//       // Piano a terra
//       const planeGeo = new THREE.PlaneGeometry(50, 50);
//       const planeMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
//       const plane = new THREE.Mesh(planeGeo, planeMat);
//       plane.rotation.x = -Math.PI / 2;
//       scene.add(plane);

//       // Sistema di fumo
//       smokeSystem = createSmoke(scene);

//       // Resize
//       window.addEventListener("resize", onWindowResize);
//    }

//    function createSmoke(scene) {
//       const loader = new THREE.TextureLoader();
//       const smokeTexture = loader.load("../../Engine/Texture/Smoke.png"); // immagine PNG con trasparenza

//       const smokeParticles = [];

//       for (let i = 0; i < 100; i++) {
//          const material = new THREE.SpriteMaterial({
//             map: smokeTexture,
//             transparent: true,
//             opacity: 0.5,
//             depthWrite: false,
//             blending: THREE.AdditiveBlending
//          });

//          const sprite = new THREE.Sprite(material);
//          sprite.position.set(
//             (Math.random() - 0.5) * 4, // spostamento X
//             0,                         // base sul terreno
//             (Math.random() - 0.5) * 4  // spostamento Z
//          );
//          sprite.scale.set(2, 2, 1);
//          scene.add(sprite);

//          smokeParticles.push({
//             sprite: sprite,
//             velocity: new THREE.Vector3(
//                (Math.random() - 0.5) * 0.01,
//                0.01 + Math.random() * 0.02,
//                (Math.random() - 0.5) * 0.01
//             )
//          });
//       }

//       return {
//          update() {
//             for (let p of smokeParticles) {
//                p.sprite.position.add(p.velocity);
//                p.sprite.material.opacity -= 0.001; // svanisce piano piano

//                // Reset quando diventa invisibile
//                if (p.sprite.material.opacity <= 0) {
//                   p.sprite.position.set(
//                      (Math.random() - 0.5) * 4,
//                      0,
//                      (Math.random() - 0.5) * 4
//                   );
//                   p.sprite.material.opacity = 0.5;
//                }
//             }
//          }
//       };
//    }

//    function animate() {
//       requestAnimationFrame(animate);
//       smokeSystem.update();
//       renderer.render(scene, camera);
//    }

//    function onWindowResize() {
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//    }
// };

/*ingresso in atmosfera*/
// export async function SnippetEngine() {
//    let scene, camera, renderer;
//    let cloudSystem;

//    init();
//    animate();

//    function init() {
//       scene = new THREE.Scene();

//       // Camera = vista dall'astronave
//       camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
//       camera.position.set(0, 0, 0);

//       renderer = new THREE.WebGLRenderer({ antialias: true });
//       renderer.setSize(window.innerWidth, window.innerHeight);
//       document.body.appendChild(renderer.domElement);

//       // Sistema nuvole
//       cloudSystem = createClouds({
//          NumClouds: 40,
//          MinSpeed: 2,
//          MaxSpeed: 6,
//          MinOpacity: 0.25,
//          MaxOpacity: 0.5,
//          MaxLateralDist: 200,      //DISTANZA MASSIMA LATERALE DI GENERAZIONE DELLE NUVOLE
//          MinDepthDist: 1000,
//          MaxDepthDist: 1500,
//       }, scene);

//       window.addEventListener("resize", onWindowResize);
//    }

//    function createClouds(Obj, scene) {
//       const loader = new THREE.TextureLoader();
//       const cloudTexture = loader.load("../../Engine/Texture/Smoke.png"); // stessa texture sfumata

//       const clouds = [];

//       for (let i = 0; i < Obj.NumClouds; i++) { // poche ma grandi
//          const material = new THREE.SpriteMaterial({
//             map: cloudTexture,
//             transparent: true,
//             opacity: Obj.MinOpacity + Math.random() * (Obj.MaxOpacity - Obj.MinOpacity), // varia opacità
//             depthWrite: false
//          });

//          const sprite = new THREE.Sprite(material);
//          resetCloud(sprite, true);
//          scene.add(sprite);

//          clouds.push({
//             sprite: sprite,
//             speed: Obj.MinSpeed + Math.random() * (Obj.MaxSpeed - Obj.MinSpeed) // velocità variabile
//          });
//       };

//       function resetCloud(sprite, firstTime = false) {
//          const depth = 1500;  // distanza massima di spawn

//          sprite.position.set(
//             (Math.random() - 0.5) * Obj.MaxLateralDist,
//             (Math.random() - 0.5) * Obj.MaxLateralDist,
//             -Math.random() * depth - 100
//          );

//          // Nuvole molto grandi
//          const size = 50 + Math.random() * 150;
//          sprite.scale.set(size, size, 1);

//          if (firstTime) sprite.position.z = Obj.MinDepthDist + Math.random() * (Obj.MaxDepthDist - Obj.MinDepthDist);
//       };

//       return {
//          update() {
//             for (let c of clouds) {
//                c.sprite.position.z += c.speed; // si avvicina alla nave
//                if (c.sprite.position.z > 10) {
//                   resetCloud(c.sprite); // riciclo davanti
//                }
//             }
//          }
//       };
//    };

//    function animate() {
//       requestAnimationFrame(animate);
//       cloudSystem.update();
//       renderer.render(scene, camera);
//    }

//    function onWindowResize() {
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//    }
// };


export async function SnippetEngine() {
   let scene, camera, renderer;

   scene = new THREE.Scene();

   let Time = 0;

   // Camera
   camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
   camera.position.set(0, 0, 0);

   renderer = new THREE.WebGLRenderer({ antialias: true });
   renderer.setSize(window.innerWidth, window.innerHeight);
   document.body.appendChild(renderer.domElement);

   // Sfondo iniziale (bianco, ma puoi cambiarlo)
   scene.background = new THREE.Color(0xffffff);

   const overlayMaterial = E3_ShaderOverlay({
      Color: 0x000000,
      Softness: 0.2,
   });

   const overlay = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMaterial);
   scene.add(overlay);

   // Animazione
   function animate() {
      requestAnimationFrame(animate);

      // aumenta uTime da 0 → 1 (chiusura completa)
      if (Time < 1) {
         Time += 0.005;
         //overlayMaterial.uniforms.uTime.value += 0.005;
         overlayMaterial.SetTime(Time);
         //console.log(overlayMaterial.uniforms.uTime.value);
      }

      renderer.render(scene, camera);
   };
   animate();

   // Resize adattivo
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


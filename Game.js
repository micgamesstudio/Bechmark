/*---------------------------------------------IMPORTAZIONE LIBRERIE NEPTUNE ENGINE-------------------------------------------------------*/
import { MicEngine } from './Engine/NeptuneEngine.js';
import { S0_SaveSystem } from './Engine/NeptuneEngine.js';

/*--------------------------------------IMPORTAZIONE OGGETTI CONFIGURAZIONE NEPTUNE ENGINE------------------------------------------------*/
import { Oggetti } from './EngineParameters.js';
import { Geometrie } from './EngineParameters.js';
import { Materiali } from './EngineParameters.js';

/*------------------------------OGGETTI NEPTUNE ENGINE-----------------------------------*/
import { TitleParam } from './EngineParameters.js';

/*----------------------------------OGGETTI VARIABILI DI GIOCO-------------------------*/
import { GlobalVar } from './EngineParameters.js';

const SaveSystem = S0_SaveSystem();
SaveSystem.init();

let MicEnginereturn;
let MicEngineParam;

let gameReady = false;

/*--------------------------------------------------------VARIABILI-----------------------------------------------------------------*/
let RandomNum = Math.random();
if (RandomNum < 0.5) GlobalVar.GenderNPC = 0;
if (RandomNum >= 0.5) GlobalVar.GenderNPC = 1;
//#endregion

/*///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
/*----------------------------------------------------INIZIALIZZAZIONE GIOCO-------------------------------------------------------------*/
async function initApp() {
   //---------------------------------------------PAGINA DEL TITOLO----------------------------------------------//
   if (GlobalVar.Page == null) {
      /*-----------------------------------------------PARAMETRI ENGINE----------------------------------------------------------*/
      MicEngineParam = TitleParam;

      /*----------------------------------------------CARICAMENTO ENGINE--------------------------------------------------------*/
      async function startGame() {
         MicEnginereturn = await MicEngine(MicEngineParam, Oggetti, Geometrie, Materiali);
         if (MicEngineParam.Moduli.Debug == true) {
            console.log("MicEnginereturn");
            console.log(MicEnginereturn.VarObject.E3_ConsoleLogSimpleObject(MicEnginereturn));
         };

         const TitleHUDCanvas = await MicEnginereturn.E3_BenchmarkCanvas({
            Style: "Neon",
            Logo: './Engine/Media/Nettuno150.png',
            Color1: "rgba(0, 0, 0, 1)",
            Color2: "rgba(28, 61, 60, 1)",
            Color3: "rgb(156, 0, 0)",
            LimitTexture: 3800,
            LimitBuffer: 512,
            LimitVertex: 3,
            LimitWeight: 608,
            LimitPrecision: 10,
            LimitVaryingVectors: 8,
            LimitFragmentUniformVectors: 64,
            LimitVertexUniformVectors: 128,
         });

      };
      startGame().then(() => {
         gameReady = true;
         MicEnginereturn.VarObject.E3_UpdateProgress(true);
      });
   };
};

initApp();

export function Update(delta) { };
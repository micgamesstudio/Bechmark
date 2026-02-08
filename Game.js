/*---------------------------------------------IMPORTAZIONE LIBRERIE NEPTUNE ENGINE-------------------------------------------------------*/
import { MicEngine } from './Engine/NeptuneEngine.js';
import { S0_SaveSystem } from './Engine/NeptuneEngine.js';
import { S0_GenerateHUDCanvas } from './Engine/NeptuneEngine.js';

/*--------------------------------------IMPORTAZIONE OGGETTI CONFIGURAZIONE NEPTUNE ENGINE------------------------------------------------*/
import { Oggetti } from './EngineParameters.js';
import { Geometrie } from './EngineParameters.js';
import { Materiali } from './EngineParameters.js';

/*------------------------------OGGETTI NEPTUNE ENGINE-----------------------------------*/
import { TitleParam } from './EngineParameters.js';
/*--------------------------------------OGGETTI HUD-------------------------------------*/
//HUD PRINCIPALI
import { TitleHUDObj } from './EngineParameters.js';

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

         /*--------------------------------------------GENERAZIONE HUD-----------------------------------------------------*/
         //#region
         const TitleHUDCanvas = S0_GenerateHUDCanvas(TitleHUDObj, {
            DispatchEvent: "Render",
            Width: 1,                   //LARGHEZZA
            Height: 1,                  //ALTEZZA
            Top: 0,                     //POSIZIONE VERTICALE DALL'ALTO
            ZIndex: '10',               //PROFONDITÀ Z
         });

         //PULSANTE START
         TitleHUDCanvas.setButtonText(0, `${MicEnginereturn.VarObject.VersionText}`);

         //CHECK
         const Performance = await MicEnginereturn.E3_Benchmark({});
         TitleHUDCanvas.setButtonText(1, `Device: ${Performance.evaluation.deviceType}
            Core CPU: ${Performance.device.cores}
            RAM: ${Performance.device.deviceMemoryGB}GB
            Limit RAM: ${Performance.memory.limitMB}MB
            GPU: ${Performance.detect.vendor} ${Performance.detect.family} ${Performance.detect.model}
            GPU: ${Performance.detect.key}`);

         TitleHUDCanvas.setButtonText(2, `${Performance.benchmark[0]} ${Performance.detect.Score1}`);
         TitleHUDCanvas.setButtonText(3, `${Performance.benchmark[1]} ${Performance.detect.Score2}`);

         TitleHUDCanvas.setBarValue(0, Performance.detect.Bar1);
         TitleHUDCanvas.setBarValue(1, Performance.detect.Bar2);

         TitleHUDCanvas.render();
         //#endregion
      };
      startGame().then(() => {
         gameReady = true;
         MicEnginereturn.VarObject.E3_UpdateProgress(true);
      });
   };
};

initApp();

export function Update(delta) { };
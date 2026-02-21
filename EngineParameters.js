import { S0_SaveSystem } from './Engine/NeptuneEngine.js';

export const GameVersion = ``;

const SaveSystem = S0_SaveSystem();
SaveSystem.init();

/*----------------------------------OGGETTO MODELLI 3D, GEOMETRIE E MATERIALI--------------------------------*/
export const Oggetti = {};
export const Geometrie = [];
export const Materiali = [];

/*------------------------------OGGETTI NEPTUNE ENGINE-----------------------------------*/
//PARAMETRI DEL RENDERER MODIFICABILI
const CustomParameters = {
    Antialias: false,
};

export const TitleParam = {
    Moduli: {
        PhysicsEngine: false,
        DynamicPlanetarySystem: false,
        DynamicPlanetMap: false,
        Editor: false,
        Skybox: false,
        DynamicCockpit: false,
        ModularShip: false,
        CreateObj: false,        //ABILITA GLI OGGETTI GENERATI
        LensFlare: false,
        Audio: false,
        //PERIFERICHE INPUT
        OrbitControl: false,
        VirtualPad: false,
        Keyboard: false,
        //MONITOR E DEBUG
        SimpleMonitor: false,
        Monitor: false,
        Debug: false,
    },
    Renderer: {
        Enable: false,
        Antialias: CustomParameters.Antialias,
        LogarithmicDepthBuffer: false,
        Shadows: false,
        // FPS: 60,
        Width: 1,               //LARGHEZZA EFFETTIVA DEL GIOCO RISPETTO ALLO SCHERMO
        Height: 1,              //ALTEZZA EFFETTIVA DEL GIOCO RISPETTO ALLO SCHERMO
        PosX: "0px",
        PosY: "0px",
        ReturnScene: false,     //ABILITA LA RESTITUZIONE DELL'INTERA SCENA IN "RETURN"
        AmbientMap: {
            Enable: false,//ABILITA LA MAPPA AMBIENTALE PER IL RIFLESSO DI MESHSTANDARDMATERIAL
            Type: "png",        //TIPO DI MAPPA AMBIENTALE "png", "hdr"
            PngDirectory: 'SpaceGame/texture/space/',//DIRECTORY DELLA MAPPA AMBIENTALE TIPO PNG
            PngRot: 0,//FACCIA DI ROTAZIONE DEL CUBO DELLA MAPPA AMBIENTALE TIPO PNG
            HdrDirectory: '',//DIRECTORY DELLA MAPPA AMBIENTALE TIPO HDR
        }
    },
    Camera: {
        CameraFov: 50,
        CameraNear: 0.1,		//METRI VISUALE VICINA (20)
        CameraFar: 1000,		//METRI VISUALE LONTANA (10000000000)10000000
    },
    Luci: {
        //LUCE AMBIENTALE - NON PROIETTA OMBRE
        Ambient: false,                      //ABILITAZIONE
        AmbientLight: {
            Int: 0.1,		                //INTENSITÀ
            Color: 0xfffbd9                 //COLORE
        },
        //LUCE DIREZIONALE
        Directional: false,                      //ABILITAZIONE
        DirectionalLight: {
            Color: 0xffffff,             //COLORE
            Int: 1,		            //INTENSITÀ
            PosX: 0,                     //POSIZIONE X
            PosY: 100,                    //POSIZIONE Y
            PosZ: 100,                    //POSIZIONE Z
            Helper: false,               //ABILITAZIONE HELPER
            Shadow: false,
            ShadowAutoUpdate: false,     //L'OMBRA SI AUTOAGGIORNA
            ShadowHelper: false,
            ShadowHeight: 15,
            ShadowWidth: 15,
            ShadowNear: 0.5,
            ShadowFar: 100,
            ShadowSize: 512,
        },
        //LUCE EMISFERICA
        Hemisphere: false,                      //ABILITAZIONE
        HemisphereSkyColor: 0xffffff,           //COLORE DEL CIELO
        HemisphereGroundColor: 0x693501,        //COLORE DEL SUOLO
        HemisphereInt: 1,                       //INTENSITÀ
        HemisphereHelper: false,                //ABILITAZIONE HELPER
        //LUCE PUNTIFORME
        Point: false,                           //ABILITAZIONE
        PointColor: 0xffffff,                   //COLORE
        PointInt: 3,                            //INTENSITÀ
        PointDistance: 0,                       //DISTANZA MASSIMA (0 INFINITO)
        PointDispersion: 0,                     //DISPERSIONE PER LA PORTATA (0 NULLA)
        PointPosX: 0,                           //POSIZIONE X
        PointPosY: 0,                           //POSIZIONE Y
        PointPosZ: 0,                           //POSIZIONE Z
    },
    Log: {
        Moduli: false,
        Orbite: false,
        PlanetLod: false
    },
};

/*----------------------------------OGGETTI VARIABILI DI GIOCO E COLORI CASUALI-------------------------*/
export const GlobalVar = {
    RandomColors: 50,
    EgineButtons: false,                                     //MOSTRA I PULSANTI EDITOR E SNIPPET
    //VARIABILI DI CAPACITOR
    HideStatusBar: true,                                     //NASCONDERE LA STATUSBAR DI ANDROID
    HideStatusBarLog: false,                                 //ABILITAZIONI ALERTS PER IL DEBUGGING IN CASO NON FUNZIONI
    EnableAdmob: true,                                       //ABILITARE ADMOB
    EnableAdmobLog: false,                                   //ABILITAZIONI ALERTS PER IL DEBUGGING IN CASO NON FUNZIONI

    //VARIABILI DI ANDROID
    AndroidAlert: true,                                      //MOSTRARE GLI ALERT PER GLI ERRORI PER ANDROID
    EnableHomeEngine: true,                               //ABILITA L'ENGINE NELLA PAGINA HOME
    BannerId: "ca-app-pub-3940256099942544/6300978111",      //ID test di Google
    VideoId: "ca-app-pub-3940256099942544/5224354917",       //ID test di Google

    //VARIABILI DI SISTEMA
    Capitolo: Number(SaveSystem.getItem(`Capitolo`)),
    Missione: Number(SaveSystem.getItem(`Missione`)),
    NumAxes: 7,                                           //NUMERO MASSIMO DI ASSI - PITCH, YAW, ROLL, THR DEC, THR ACC
    NumPuls: 3,                                           //NUMERO MASSIMO DI PULSANTI
    isMobile: navigator.userAgentData.mobile,
    VolumeSounds: Number(SaveSystem.getItem(`VolumeSounds`)),
    VolumeVoice: Number(SaveSystem.getItem(`VolumeVoice`)),
    VolumeMusic: Number(SaveSystem.getItem(`VolumeMusic`)),
    Language: Number(SaveSystem.getItem(`Language`)),        //0 INGLESE - 1 ITALIANO
    Page: sessionStorage.getItem('Page'),                             //NOME PAGINA CARICATA
    StationType: Number(SaveSystem.getItem(`StationType`)),  //TIPO STAZIONE 1=HUB, 3=INDUSTRIAL, 4=HANGAR, 5=RESEARCH, 6=SHIP1, 7=SHIP2
    GraphicPreset: Number(SaveSystem.getItem(`GraphicPreset`)),     //0 CUSTOM
    Graphic: Number(SaveSystem.getItem(`Graphic`)),          //0 BASSO - 1 MEDIO - 2 ALTO
    Texture: Number(SaveSystem.getItem(`Texture`)),          //0 BASSO - 1 MEDIO - 2 ALTO
    Resolution: Number(window.localStorage.getItem(`Resolution`)),      //0 METÀ - 1 NORMALE
    Antialiasing: Number(window.localStorage.getItem(`Antialiasing`)),      //0 OFF - 1 ON
    Glow: Number(window.localStorage.getItem(`Glow`)),      //0 OFF - 1 ON
    Control: Number(SaveSystem.getItem(`Control`)),          //0 VIRTUALE - 1 FISICO
    Space: "\u00A0",                                                  //SPAZIO NON SEPARABILE PER IL TEMPLATE LITERAL

    //PARAMETRI FISSI DI GIOCO
    CoeffRotMot: 0.03,            //COEFFICIENTE DI MOLTIPLICAZIONE VELOCITÀ DI ROTAZIONE A MOTORI ACCESI (0.05)
    Pitch: 0.02,				      //VELOCITÀ DI ROTAZIONE DI PITCH
    Roll: 0.02,				         //VELOCITÀ DI ROTAZIONE DI ROLL
    Yaw: 0.02,					      //VELOCITÀ DI ROTAZIONE DI YAW
    Throttle: 2,
    RotX: 0.003,                  //MOLTIPLICATORE AL VETTORE NIPPLE PER LA ROTAZIONE DEL MODELLO 3D DELLA NAVE
    RotY: 0.003,                  //MOLTIPLICATORE AL VETTORE NIPPLE PER LA ROTAZIONE DEL MODELLO 3D DELLA NAVE
    RestX: 30,                    //VELOCITÀ DI ROTAZIONE DELLA NAVE 3D AL MOVIMENTO DELLO STICK
    RestY: 30,                    //VELOCITÀ DI ROTAZIONE DELLA NAVE 3D AL MOVIMENTO DELLO STICK
    TutorialPosX: 0,            //POSIZIONE X NPC SIA RADIO CHE TUTORIAL
    ValoreRiserva: 30,            //VALORE IN PERCENTUALE PER LA RISERVA DI CARBURANTE, ARIA, ACQUA E CIBO

    //VARIABILI GIOCO
    Money: Number(SaveSystem.getItem(`Money`)),              //MONETA DEL GIOCO
    Coin: Number(SaveSystem.getItem(`Coin`)),                //GETTONI
    Fuel: Number(SaveSystem.getItem(`Fuel`)),                //CARBURANTE
    TutorialFlag: 0,                                                  //AVANZAMENTO DEL TUTORIAL
    UpgradeCockpit: 0,
    UpgradeTank: 0,
    UpgradeMotor: 0,
    Color1: SaveSystem.getItem(`Color1`),
    Color2: SaveSystem.getItem(`Color2`),
    GenderNPC: 0,                                                   //Genere dell'NPC

    //VARIABILI STAZIONI SPAZIALI
    PlanetOrbit: Number(SaveSystem.getItem(`PlanetOrbit`)),                 //ORBITA DI UN PIANETA RAGGIUNTA
    MoonOrbit: Number(SaveSystem.getItem(`MoonOrbit`)),                     //ORBITA DI UNA LUNA RAGGIUNTA
    SubMoonOrbit: Number(SaveSystem.getItem(`SubMoonOrbit`)),               //ORBITA DI UNA LUNA RAGGIUNTA
    MissionPlanet: [],                                                               //INDICE DEL PIANETA GENERATO E SALVATO NEL SESSION STORAGE (ESCLUSO IL SOLE)
    MissionMoon: [],                                                                 //INDICE DELLA LUNA GENERATO E SALVATO NEL SESSION STORAGE
    MissionSubMoon: [],                                                              //INDICE DELLA SUB-LUNA GENERATO E SALVATO NEL SESSION STORAGE
    MissionLoad: [],                                                                 //CARICO DELLA MISSIONE GENERATO E SALVATO NEL SESSION STORAGE
    TotalModules: 0,                                                                 //NUMERO TOTALE DI MODULI DELLA NAVE
    ShipModules: Number(SaveSystem.getItem(`ShipModules`)),                 //QUANTITÀ DI MODULI NAVE
    LivingModules: Number(SaveSystem.getItem(`LivingModules`)),             //QUANTITÀ DI MODULI ABITATIVI
    ContainerModules: Number(SaveSystem.getItem(`ContainerModules`)),       //QUANTITÀ DI MODULI CONTAINER
    ExtractionModules: Number(SaveSystem.getItem(`ExtractionModules`)),     //QUANTITÀ DI MODULI EXTRACTION
    RadarModules: Number(SaveSystem.getItem(`RadarModules`)),               //QUANTITÀ DI MODULI RADAR
    MoneyBuy: 0,                                                                     //SOLDI DA SPENDERE O GUADAGNARE PRIMA DI PREMERE "BUY" O "SELL"
    IndDistNum: Number(SaveSystem.getItem(`IndDistNum`)),                   //NUMERO PIANETI (COMPRESO IL SOLE)
    IndMoonDistNum: Number(SaveSystem.getItem(`IndMoonDistNum`)),           //NUMERO VALORI DISTANZE LUNE DALLA NAVE SPAZIALE (km NEL GIOCO)
    IndSubMoonDistNum: Number(SaveSystem.getItem(`IndSubMoonDistNum`)),     //NUMERO VALORI DISTANZE SUB-LUNE DALLA NAVE SPAZIALE (km NEL GIOCO)

    //PARAMETRI MISSIONE ACCETTATA
    NumMission: 6,
    MissionCurrent: Number(SaveSystem.getItem(`MissionCurrent`)),              //MISSIONE ATTUALE, 0 NESSUNA, 1 ATTIVA
    MissionPlanetCurrent: Number(SaveSystem.getItem(`MissionPlanetCurrent`)),
    MissionMoonCurrent: Number(SaveSystem.getItem(`MissionMoonCurrent`)),
    MissionSubMoonCurrent: Number(SaveSystem.getItem(`MissionSubMoonCurrent`)),
    MissionLoadCurrent: Number(SaveSystem.getItem(`MissionLoadCurrent`)),
    MissionRewardCurrent: Number(SaveSystem.getItem(`MissionRewardCurrent`)),

    //COMANDI MINIGIOCO
    GameEnabled: false,        //MINIGIOCO ABILITATO
    ComX: 0,
    ComY: 0,
    ComZ: 0,
    ComW: 0,
    ComPuls: 0,    //COMANDO PULSANTE GENERICO
    ComPulsUp: false,
    ComPulsDown: false,
    SoundMotor: 0,      //SUONO MOTORE (MINIGIOCO)

    //STORIA
    Deuterio: Number(SaveSystem.getItem(`Deuterio`)),
    Trizio: Number(SaveSystem.getItem(`Trizio`)),
    Sole: Number(SaveSystem.getItem(`Sole`)),
    Scient: Number(SaveSystem.getItem(`Scient`)),
    DeuterioTotal: Number(SaveSystem.getItem(`DeuterioTotal`)),
    TrizioTotal: Number(SaveSystem.getItem(`TrizioTotal`)),
    SoleTotal: Number(SaveSystem.getItem(`SoleTotal`)),
    StepTimeMars: 0,                    //STEP DI VISIONE TEMPORALE DI MARTE 0-3
    ScientTotal: Number(SaveSystem.getItem(`ScientTotal`)),
    Cometa: Number(SaveSystem.getItem(`Cometa`)),
    //NUVOLA E POSIZIONI RADAR
    MinDistNuvola: 130000000000,                                               //MINIMA DISTANZA PER INDIVIDUARE LA NUVOLA
    PosXNuvola: Number(window.localStorage.getItem(`PosXNuvola`)),             //POSIZIONE X DELLA NUVOLA
    PosZNuvola: Number(window.localStorage.getItem(`PosZNuvola`)),             //POSIZIONE Z DELLA NUVOLA
    IndexRadar: Number(window.localStorage.getItem(`IndexRadar`)),             //INDICE DEL RADAR
    Impulsi: [
        {
            x: Number(window.localStorage.getItem(`PosXRadar1`)),                //POSIZIONE X IMPULSO RADAR 1
            z: Number(window.localStorage.getItem(`PosZRadar1`)),                //POSIZIONE Z IMPULSO RADAR 1
            r: Number(window.localStorage.getItem(`RaggioRadar1`))               //RAGGIO IMPULSO RADAR 1
        },
        {
            x: Number(window.localStorage.getItem(`PosXRadar2`)),                //POSIZIONE X IMPULSO RADAR 2
            z: Number(window.localStorage.getItem(`PosZRadar2`)),                //POSIZIONE Z IMPULSO RADAR 2
            r: Number(window.localStorage.getItem(`RaggioRadar2`))               //RAGGIO IMPULSO RADAR 2
        },
        {
            x: Number(window.localStorage.getItem(`PosXRadar3`)),                //POSIZIONE X IMPULSO RADAR 3
            z: Number(window.localStorage.getItem(`PosZRadar3`)),                //POSIZIONE Z IMPULSO RADAR 3
            r: Number(window.localStorage.getItem(`RaggioRadar3`))               //RAGGIO IMPULSO RADAR 3
        },
    ],
};
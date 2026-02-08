/*--------------------DYNAMIC COCKPIT ORIGINALE--------------------------*/
//#region
let Cockpit;
let DynamCockpit;
let DynamHud;
let DynamCockpitVar;
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

/*INDICATORI OGGETTI FUORI DALLA VISUALE*/
// function E2_HUDStyleIndCss(Num, Area, Top1, Left1, TransX1, TransY1, TransX2, Rot, Top2, Top3) {
//    Area.children[Num].style.top = Top1;
//    Area.children[Num].style.left = Left1;
//    Area.children[Num].style.transform = `translate(${TransX1}, ${TransY1})`;
//    Area.children[Num].children[0].style.transform = `translate(${TransX2}) rotate(${Rot})`;
//    Area.children[Num].children[0].style.top = Top2;
//    Area.children[Num].children[1].style.top = Top3;
// };
function E2_HUDStyleIndCss(Num, Area, Top1, Left1, TransX1, TransY1, TransX2, Rot, Top2, Top3) {
    const el = Area.children[Num];
    const child0 = el.children[0];
    const child1 = el.children[1];

    // Aggiornamento principale solo se cambia
    el.style.top = Top1;
    el.style.left = Left1;
    el.style.transform = `translate3d(${TransX1}, ${TransY1}, 0)`; // GPU
    el.style.willChange = 'transform'; // hint

    child0.style.transform = `translate3d(${TransX2}, 0, 0) rotate(${Rot})`;
    child0.style.willChange = 'transform';

    child0.style.top = Top2;
    child1.style.top = Top3;
}

//FUNZIONE AGGIORNAMENTO INDICATORI DOM
function E2_IndVisual(Group, Area, Object) {
    let I;
    for (let i = 0; i < Object.Num; i++) {
        //ADATTAMENTO PER INCLUDERE IL SOLE NEI PIANETI
        if (Object.Sun == true) I = i + 1;
        else I = i;

        //ROTAZIONE Y DENTRO LA VISUALE (QUADRANTI ALTO E BASSO)
        if (Group.children[I].rotation.y > Object.YMin && Group.children[I].rotation.y < Object.YMax) {
            Area.children[i].style.display = "block";
            //ROTAZIONE X FUORI DALLA VISUALE IN ALTO
            if (Group.children[I].rotation.x < 0 && Group.children[I].rotation.x > Object.XMin) {
                //RENDI VISIBILE L'INDICATORE IN ALTO
                let Pos = `${(Group.children[I].rotation.y + Object.YMax) / (Object.YMax * 2) * 90}%`;
                E2_HUDStyleIndCss(i, Area, "0%", Pos, "0%", "0%", "-50%", "0deg", "0%", "50%");
            };
            //ROTAZIONE X FUORI DALLA VISUALE IN BASSO
            if (Group.children[I].rotation.x > 0 && Group.children[I].rotation.x < Object.XMax) {
                //RENDI VISIBILE L'INDICATORE IN BASSO
                let Pos = `${(Group.children[I].rotation.y + Object.YMax) / (Object.YMax * 2) * 90}%`;
                E2_HUDStyleIndCss(i, Area, "100%", Pos, "0%", "-100%", "-50%", "180deg", "50%", "0%");
            };
        };

        //ROTAZIONE X DENTRO LA VISUALE (QUADRANTI SINISTRA E DESTRA)
        if ((Group.children[I].rotation.x < 0 && Group.children[I].rotation.x < Object.XMin) ||
            (Group.children[I].rotation.x > 0 && Group.children[I].rotation.x > Object.XMax)) {
            Area.children[i].style.display = "block";
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
                E2_HUDStyleIndCss(i, Area, Pos, "0%", "0%", "0%", "-50%", "270deg", "0%", "50%");
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
                E2_HUDStyleIndCss(i, Area, Pos, "100%", "-100%", "0%", "-50%", "90deg", "0%", "50%");
            };
        };

        //ROTAZIONE X FUORI DALLA VISUALE IN ALTO (QUADRANTI ALTO SINISTRA E ALTO DESTRA)
        if (Group.children[I].rotation.x < 0 && Group.children[I].rotation.x > Object.XMin) {
            Area.children[i].style.display = "block";
            //ROTAZIONE Y FUORI DALLA VISUALE A SINISTRA
            if (Group.children[I].rotation.y < Object.YMin) {
                //RENDI VISIBILE L'INDICATORE IN DIAGONALE ALTO SINISTRA
                E2_HUDStyleIndCss(i, Area, "0%", "0%", "0%", "0%", "-50%", "315deg", "0%", "50%");
            };
            //ROTAZIONE Y FUORI DALLA VISUALE A DESTRA
            if (Group.children[I].rotation.y > Object.YMax) {
                //RENDI VISIBILE L'INDICATORE IN DIAGONALE ALTO DESTRA
                E2_HUDStyleIndCss(i, Area, "0%", "100%", "-100%", "0%", "-50%", "45deg", "0%", "50%");
            };
        };

        //ROTAZIONE X FUORI DALLA VISUALE IN BASSO (QUADRANTI BASSO SINISTRA E BASSO DESTRA)
        if (Group.children[I].rotation.x > 0 && Group.children[I].rotation.x < Object.XMax) {
            Area.children[i].style.display = "block";
            //ROTAZIONE Y FUORI DALLA VISUALE A SINISTRA
            if (Group.children[I].rotation.y < Object.YMin) {
                //RENDI VISIBILE L'INDICATORE IN DIAGONALE BASSO SINISTRA
                E2_HUDStyleIndCss(i, Area, "100%", "0%", "0%", "-100%", "-50%", "225deg", "50%", "0%");
            };
            //ROTAZIONE Y FUORI DALLA VISUALE A DESTRA
            if (Group.children[I].rotation.y > Object.YMax) {
                //RENDI VISIBILE L'INDICATORE IN DIAGONALE BASSO DESTRA
                E2_HUDStyleIndCss(i, Area, "100%", "100%", "-100%", "-100%", "-50%", "135deg", "50%", "0%");
            };
        };

        //ROTAZIONE X DENTRO LA VISUALE
        if ((Group.children[I].rotation.x < 0 && Group.children[I].rotation.x < Object.XMin) ||
            (Group.children[I].rotation.x > 0 && Group.children[I].rotation.x > Object.XMax)) {
            //ROTAZIONE Y DENTRO LA VISUALE
            if (Group.children[I].rotation.y > Object.YMin && Group.children[I].rotation.y < Object.YMax) {
                //RENDI INVISIBILE L'INDICATORE
                Area.children[i].style.display = "none";
            };
        };
    };
};

//FUNZIONE AGGIORNAMENTO SIMBOLI LUNE E SUBLUNE COCKPIT E HUB, SOLO CON DYNAMIC PLANETARY SYSTEM
function _1000_E2_UpdateSymbolsMoons() {
    //AGGIORNAMENTO LUNE
    for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
        if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Type == 0) {
            DynamCockpit.children[1].children[i].children[0].material.map = Loader.load(Par.DynamicCockpit.MoonSprite);
            DynamHud.children[1].children[i].children[0].style.display = "block";
            DynamHud.children[1].children[i].children[1].style.display = "block";
            DynamHud.children[1].children[i].children[2].src = "";
        }
        //PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
        else {
            DynamCockpit.children[1].children[i].children[0].material.map = Loader.load(Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Type - 1][0]);
            DynamHud.children[1].children[i].children[0].style.display = "none";
            DynamHud.children[1].children[i].children[1].style.display = "none";
            DynamHud.children[1].children[i].children[2].src = Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Type - 1][1];
        };
    };
};
function _1000_E2_UpdateSymbolsSubMoons() {
    //AGGIORNAMENTO SUB-LUNE
    for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
        if (VarPlanetSystem.MoonOrbit > 0) {
            if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type == 0) {
                DynamCockpit.children[2].children[i].children[0].material.map = Loader.load(Par.DynamicCockpit.MoonSprite);
                DynamHud.children[2].children[i].children[0].style.display = "block";
                DynamHud.children[2].children[i].children[1].style.display = "block";
                DynamHud.children[2].children[i].children[2].src = "";
            }
            //PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
            else {
                DynamCockpit.children[2].children[i].children[0].material.map = Loader.load(Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1][0]);
                DynamHud.children[2].children[i].children[0].style.display = "none";
                DynamHud.children[2].children[i].children[1].style.display = "none";
                DynamHud.children[2].children[i].children[2].src = Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1][1];
            };
        };

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
                    Oggetto.Lampeggi[i] += 1;
                    if (Oggetto.Lampeggi[i] <= 5) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 0.3;
                    if (Oggetto.Lampeggi[i] > 5) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
                    if (Oggetto.Lampeggi[i] >= 10) Oggetto.Lampeggi[i] = 0;
                };
                if (Oggetto.Sun == true) Oggetto.CockpitObjects.children[i].children[0].visible = false;
            }
            //SE L'OGGETTO NON È DIETRO IL CORPO CELESTE
            else {
                if (Oggetto.Sun == false) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
                if (Oggetto.Sun == true) Oggetto.CockpitObjects.children[i].children[0].visible = true;
            };
        }
        //SE LA LUNA PIÙ VICINA DEL PIANETA
        else {
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

//All’inizio del gioco, crea un oggetto per memorizzare lo stato precedente di tutti gli indicatori:
const hudState = {
    planets: [],
    moons: [],
    subMoons: [],
    dest: [],
    enemies: []
};
// Funzione principale ottimizzata
function E3_UpdateHUD(group, area, object, prevState) {
    for (let i = 0; i < object.Num; i++) {
        const I = object.Sun ? i + 1 : i;
        const child = group.children[I];
        const prev = prevState[i] || {};

        // Calcolo visibilità e posizione
        let display = "none";
        let top = "0%";
        let left = "0%";
        let transform1 = "translate3d(0,0,0)";
        let transform2 = "translate3d(0,0,0) rotate(0deg)";

        // Condizioni semplificate per esempio
        if (child.rotation.y > object.YMin && child.rotation.y < object.YMax) {
            display = "block";
            const pos = `${(child.rotation.y + object.YMax) / (object.YMax * 2) * 90}%`;

            if (child.rotation.x < 0 && child.rotation.x > object.XMin) {
                top = "0%";
                transform1 = `translate3d(0,0,0)`;
                transform2 = `translate3d(-50%,0,0) rotate(0deg)`;
            } else if (child.rotation.x > 0 && child.rotation.x < object.XMax) {
                top = "100%";
                transform1 = `translate3d(0,-100%,0)`;
                transform2 = `translate3d(-50%,0,0) rotate(180deg)`;
            }
        }

        // Aggiorna solo se cambiato
        if (prev.display !== display) area.children[i].style.display = display;
        if (prev.top !== top) area.children[i].style.top = top;
        if (prev.left !== left) area.children[i].style.left = left;
        if (prev.transform1 !== transform1) area.children[i].style.transform = transform1;
        if (prev.transform2 !== transform2) area.children[i].children[0].style.transform = transform2;

        // Aggiorna stato
        prevState[i] = { display, top, left, transform1, transform2 };
    }

    return prevState;
};
function E3_UpdateDynamicHUD() {
    // Pianeti
    hudState.planets = E3_UpdateHUD(
        Cockpit.children[0],
        DynamHud.children[0],
        {
            Sun: true,
            Num: VarPlanetSystem.PlanetsNum + 1,
            YMin: Par.DynamicCockpit.YMin,
            YMax: Par.DynamicCockpit.YMax,
            XMin: Par.DynamicCockpit.XMin,
            XMax: Par.DynamicCockpit.XMax
        },
        hudState.planets
    );

    // Lune
    hudState.moons = E3_UpdateHUD(
        Cockpit.children[1],
        DynamHud.children[1],
        {
            Sun: false,
            Num: VarPlanetSystem.NumMoons,
            YMin: Par.DynamicCockpit.YMin,
            YMax: Par.DynamicCockpit.YMax,
            XMin: Par.DynamicCockpit.XMin,
            XMax: Par.DynamicCockpit.XMax
        },
        hudState.moons
    );

    // Sub-lune
    hudState.subMoons = E3_UpdateHUD(
        Cockpit.children[2],
        DynamHud.children[2],
        {
            Sun: false,
            Num: VarPlanetSystem.NumSubMoons,
            YMin: Par.DynamicCockpit.YMin,
            YMax: Par.DynamicCockpit.YMax,
            XMin: Par.DynamicCockpit.XMin,
            XMax: Par.DynamicCockpit.XMax
        },
        hudState.subMoons
    );

    // Destinazione
    hudState.dest = E3_UpdateHUD(
        Cockpit.children[3],
        DynamHud.children[3],
        {
            Sun: false,
            Num: 1,
            YMin: Par.DynamicCockpit.YMin,
            YMax: Par.DynamicCockpit.YMax,
            XMin: Par.DynamicCockpit.XMin,
            XMax: Par.DynamicCockpit.XMax
        },
        hudState.dest
    );

    // Nemici
    if (DynamCockpitVar.EnemyNum > 0) {
        hudState.enemies = E3_UpdateHUD(
            Cockpit.children[4],
            DynamHud.children[4],
            {
                Sun: false,
                Num: 1,
                YMin: Par.DynamicCockpit.YMin,
                YMax: Par.DynamicCockpit.YMax,
                XMin: Par.DynamicCockpit.XMin,
                XMax: Par.DynamicCockpit.XMax
            },
            hudState.enemies
        );
    }
};

function E2_UpdateDynamicCockpit(delta) {
    E2_UpdateLookCockpit();
    //E3_UpdateDynamicHUD();
};
/*--------------------------------------------FUNZIONE PRINCIPALE----------------------------------------------*/
function E0_DynamicCockpit(Oggetto, Elem) {
    if (Par.Log.Moduli == true) console.log("DynamicCockpit");
    Cockpit = new THREE.Group();
    Cockpit.name = "CockpitVisore";

    //CREAZIONE LIVELLI
    for (let i = 0; i < Par.DynamicCockpit.Area.length; i++) {
        //CREAZIONE LIVELLI  COCKPIT
        const CanvasArray = [];                //ARRAY CONTENENTE I CANVAS DEGLI INDICATORI
        const Array = [];
        ImageArray.push(Array);

        const Group = new THREE.Group();
        Group.name = `GroupCockpit ${i} ${Par.DynamicCockpit.Area[i].Name}`;
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

        Elem.appendChild(IndArea);
    };

    //NOMI FISSI PIANETI
    for (let i = 0; i < Par.DynamicCockpit.Area[0].Num; i++) {
        ImageArray[0][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth,
            Par.DynamicCockpit.CanvasWidth);
        //NOME STELLA MADRE
        if (i == 0) {
            //INDICATORI COCKPIT
            ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Sun.Name[Language], 20, 50);
            //INDICATORI DOM
            DynamHud.children[0].children[i].children[1].innerText = `${Oggetti.PlanetarySystem.Sun.Name[Language]}`;
        };
        //NOME PIANETA
        if (i > 0) {
            //INDICATORI COCKPIT
            ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Modular[i - 1].Name[Language], 20, 50);
            //INDICATORI DOM
            DynamHud.children[0].children[i].children[1].innerText = `${Oggetti.PlanetarySystem.Modular[i - 1].Name[Language]}`;
        };
    };

    setInterval(() => {
        //DYNAMIC PLANETARY SYSTEM
        if (Par.DynamicCockpit.DynamicPlanetarySystem == true && PaceDone == true) {
            /*--------------------------------------DYNAMIC HUD------------------------------------------*/
            //AREA INDICATORI PIANETI
            E2_IndVisual(Cockpit.children[0], DynamHud.children[0], {
                Sun: true,      //PRESENZA DEL SOLE
                Num: VarPlanetSystem.PlanetsNum + 1,
                YMin: Par.DynamicCockpit.YMin,
                YMax: Par.DynamicCockpit.YMax,
                XMin: Par.DynamicCockpit.XMin,
                XMax: Par.DynamicCockpit.XMax
            });

            //AREA INDICATORI LUNE
            E2_IndVisual(Cockpit.children[1], DynamHud.children[1], {
                Sun: false,      //"Planet" "Moon" "SubMoon" "Dest"
                Num: VarPlanetSystem.NumMoons,
                YMin: Par.DynamicCockpit.YMin,
                YMax: Par.DynamicCockpit.YMax,
                XMin: Par.DynamicCockpit.XMin,
                XMax: Par.DynamicCockpit.XMax
            });

            //AREA INDICATORI SUB-LUNE
            E2_IndVisual(Cockpit.children[2], DynamHud.children[2], {
                Sun: false,      //"Planet" "Moon" "SubMoon" "Dest"
                Num: VarPlanetSystem.NumSubMoons,
                YMin: Par.DynamicCockpit.YMin,
                YMax: Par.DynamicCockpit.YMax,
                XMin: Par.DynamicCockpit.XMin,
                XMax: Par.DynamicCockpit.XMax
            });

            //AREA INDICATORE DESTINAZIONE
            E2_IndVisual(Cockpit.children[3], DynamHud.children[3], {
                Sun: false,      //"Planet" "Moon" "SubMoon" "Dest"
                Num: 1,
                YMin: Par.DynamicCockpit.YMin,
                YMax: Par.DynamicCockpit.YMax,
                XMin: Par.DynamicCockpit.XMin,
                XMax: Par.DynamicCockpit.XMax
            });

            //AREA INDICATORE NEMICI
            if (DynamCockpitVar.EnemyNum > 0) E2_IndVisual(Cockpit.children[4], DynamHud.children[4], {
                Sun: false,      //"Planet" "Moon" "SubMoon" "Dest"
                Num: 1,
                YMin: Par.DynamicCockpit.YMin,
                YMax: Par.DynamicCockpit.YMax,
                XMin: Par.DynamicCockpit.XMin,
                XMax: Par.DynamicCockpit.XMax
            });
        };
    }, 50);

    const LampeggioLune = [];
    for (let i = 0; i < Par.DynamicCockpit.Area[1].Num + 1; i++) {
        LampeggioLune.push(0);
    };
    const LampeggioSubLune = [];
    for (let i = 0; i < Par.DynamicCockpit.Area[2].Num + 1; i++) {
        LampeggioSubLune.push(0);
    };

    /*----------------NOMI DYNAMIC HUD E COCKPIT, DISTANZA E TEMPI ARRIVO, DIMENSIONE SPRITE, SUNLIGHT, OGGETTI DIETRO I PIANETI ------------------*/
    setInterval(() => {
        if (Par.DynamicCockpit.DynamicPlanetarySystem == true) {
            /*----------------------------SUNLIGHT---------------------------*/
            //APPLICA LA SCALA IN BASE ALLA DISTANZA DAL SOLE
            Cockpit.children[0].children[0].scale.set(E2_AutoSunlight(UserPosWorld, PosZero), E2_AutoSunlight(UserPosWorld, PosZero));

            //PER TUTTI I PIANETI COMPRESO IL SOLE
            for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
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
            for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
                //-----------------------------DYNAMIC COCKPIT--------------------------------------//
                ImageArray[1][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
                //NOME LUNA
                let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Name[Language];
                ImageArray[1][i].fillText(Text, 20, 50);		                                                      //NOME DESTINAZIONE

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

                /*-------------------------------DYNAMIC HUD---------------------------------------*/
                //DYNAMIC HUD - NOME INDICATORE
                DynamHud.children[1].children[i].children[1].innerText =
                    `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Name[Language]}`;
            };

            //PER TUTTE LE SUB-LUNE ATTUALI
            for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
                //-----------------------------DYNAMIC COCKPIT--------------------------------------//
                ImageArray[2][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
                //NOME LUNA
                let Text;
                if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular.length > 0 && VarPlanetSystem.MoonOrbit > 0)
                    Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
                        .Modular[i].Name[Language];
                ImageArray[2][i].fillText(Text, 20, 50);		                                                            //NOME DESTINAZIONE

                //DISTANZA DALLA LUNA PIÙ VICINA COMPRESA DI DIAMETRO
                if (i == VarPlanetSystem.NearSubMoonIndex) {
                    ImageArray[2][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000
                        - (VarPlanetSystem.NearSubMoonDiameter * Par.DynamicCockpit.ScalaPos), true), 20, 100);		   //VALORE IN KM x1000
                }
                //DISTANZA ALTRE SUB-LUNE (DIAMETRO TRASCURABILE)
                else {
                    //VALORE IN KM x1000
                    ImageArray[2][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
                };
                ImageArray[2][i].fillText(DisplayTime(VarPlanetSystem.TimeSubMoonDist[i]), 20, 150);  //TEMPO DI ARRIVO
                DynamCockpit.children[2].children[i].children[1].material.map.needsUpdate = true;

                //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
                E2_ResizeDist(2, i, VarPlanetSystem.IndSubMoonDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

                /*-------------------------------DYNAMIC HUD---------------------------------------*/
                //DYNAMIC HUD - NOME INDICATORE
                if (VarPlanetSystem.MoonOrbit > 0)
                    DynamHud.children[2].children[0].children[1].innerText =
                        `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
                            .Modular[i].Name[Language]}`;
            };

            /*CODICE SPOSTATO DAL CICLO 1000MS, SE VA BENE INTEGRARE*/
            //PER TUTTI I PIANETI INCLUSA LA STELLA MADRE
            for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
                /*-------------------------------------DYNAMIC COCKPIT----------------------------------------------*/
                //SE NON SI È IN ORBITA ATTORNO A UN PIANETA
                if (VarPlanetSystem.PlanetOrbit == 0) {
                    //RENDI VISIBILI I PIANETI ENTRO IL RAGGIO IMPOSTATO
                    if (VarPlanetSystem.IndDist[i] < Oggetto.DistPlanets) {
                        DynamCockpitVar.PlanetVisible[i] = true;
                        DynamHud.children[0].children[i].children[0].style.display = "block";
                        DynamHud.children[0].children[i].children[1].style.display = "block";
                    }
                    //RENDI INVISIBILI I PIANETI FUORI DALL RAGGIO IMPOSTATO
                    else {
                        DynamCockpitVar.PlanetVisible[i] = false;
                        DynamHud.children[0].children[i].children[0].style.display = "none";
                        DynamHud.children[0].children[i].children[1].style.display = "none";
                    };
                }
                //RENDI INVISIBILI I PIANETI TRANNE QUELLO PIÙ VICINO
                else if (i == VarPlanetSystem.NearPlanetIndex) {
                    DynamCockpitVar.PlanetVisible[i] = true;
                    DynamHud.children[0].children[i].children[0].style.display = "block";
                    DynamHud.children[0].children[i].children[1].style.display = "block";
                }
                else {
                    DynamCockpitVar.PlanetVisible[i] = false;
                    DynamHud.children[0].children[i].children[0].style.display = "none";
                    DynamHud.children[0].children[i].children[1].style.display = "none";
                };

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
            };

            //PER TUTTE LE LUNE ATTUALI
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
                        // DynamCockpit.children[1].children[i].children[0].visible = false;     //SPRITE VISORE
                        DynamCockpit.children[1].children[i].children[1].visible = false;     //TESTO INDICATORE
                    }
                    //SE LA LUNA NON È LA DESTINAZIONE
                    else {
                        DynamCockpit.children[1].children[i].children[0].visible = true;     //SPRITE VISORE
                        //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
                        if ((Cockpit.children[1].children[i].rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || Cockpit.children[1].children[i].rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && Cockpit.children[1].children[i].rotation.y < Par.DynamicCockpit.VisDiff && Cockpit.children[1].children[i].rotation.y > -Par.DynamicCockpit.VisDiff) DynamCockpit.children[1].children[i].children[1].visible = true;
                        else DynamCockpit.children[1].children[i].children[1].visible = false;
                    };
                }
                else {
                    DynamCockpit.children[1].children[i].children[0].visible = false;     //SPRITE VISORE
                    DynamCockpit.children[1].children[i].children[1].visible = false;     //TESTO INDICATORE
                };
            };

            //PER TUTTE LE SUB-LUNE ATTUALI
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
                        // DynamCockpit.children[2].children[i].children[0].visible = false;     //SPRITE VISORE
                        DynamCockpit.children[2].children[i].children[1].visible = false;     //MESH INDICATORE
                    }
                    //SE LA SUB-LUNA NON È LA DESTINAZIONE
                    else {
                        DynamCockpit.children[2].children[i].children[0].visible = true;     //SPRITE VISORE
                        //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
                        if ((Cockpit.children[2].children[i].rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || Cockpit.children[2].children[i].rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && Cockpit.children[2].children[i].rotation.y < Par.DynamicCockpit.VisDiff && Cockpit.children[2].children[i].rotation.y > -Par.DynamicCockpit.VisDiff) DynamCockpit.children[2].children[i].children[1].visible = true;
                        else DynamCockpit.children[2].children[i].children[1].visible = false;
                    };
                }
                else {
                    DynamCockpit.children[2].children[i].children[0].visible = false;     //SPRITE VISORE
                    DynamCockpit.children[2].children[i].children[1].visible = false;     //MESH INDICATORE
                };
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

                //-----------------------------DYNAMIC HUD--------------------------------------//
                DynamHud.children[3].children[0].children[1].innerText = Text;
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

                //-----------------------------DYNAMIC HUD--------------------------------------//
                DynamHud.children[3].children[0].children[1].innerText = Text;
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

                //-----------------------------DYNAMIC HUD--------------------------------------//
                DynamHud.children[3].children[0].children[1].innerText = Text;
            };
            //NEMICI
            // for (let i = 0; i < 1; i++) {
            //    //-----------------------------DYNAMIC COCKPIT--------------------------------------//
            //    ImageArray[4][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
            //    //NOME NEMICO
            //    let Text;
            //    Text = "Enemy";
            //    ImageArray[4][i].fillText(Text, 20, 50);		                                                            //NOME DESTINAZIONE

            //    //DISTANZA DAL NEMICO
            //    ImageArray[4][i].fillText(E3_DisplayDistance(DynamCockpitVar.IndDistEnemy[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);		   //VALORE IN KM x1000
            //    //ImageArray[4][i].fillText(DisplayTime(VarPlanetSystem.TimeSubMoonDist[i]), 20, 150);  //TEMPO DI ARRIVO
            //    DynamCockpit.children[4].children[i].children[1].material.map.needsUpdate = true;

            //    //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
            //    E2_ResizeDist(4, i, DynamCockpitVar.IndDistEnemy[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

            //    /*-------------------------------DYNAMIC HUD---------------------------------------*/
            //    //DYNAMIC HUD - NOME INDICATORE
            //    DynamHud.children[4].children[i].children[1].innerText = "Enemy";
            // };

            /*-------------------------------CALCOLI PER STABILIRE SE UNA LUNA È DIETRO UN PIANETA------------------------------*/
            //DENTRO L'ORBITA DI UN PIANETA
            if (VarPlanetSystem.PlanetOrbit > 0) E2_ObjectBehindPlanet({
                Sun: false,                                                                            //GLI OGGETTI DA CALCOLARE SONO IL SOLE
                Radius: VarPlanetSystem.NearPlanetDiameter,                                          //DIAMETRO CORPO CELESTE
                Distance: VarPlanetSystem.IndDist[VarPlanetSystem.NearPlanetIndex],                    //DISTANZA CORPO CELESTE
                NumObjects: VarPlanetSystem.NumMoons,                                                  //NUMERO DI OGGETTI DA CALCOLARE
                DistObjects: VarPlanetSystem.IndMoonDist,                                              //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
                CockpitPlanet: Cockpit.children[0].children[1 + VarPlanetSystem.NearPlanetIndex],      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
                CockpitObjects: Cockpit.children[1],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
                Lampeggi: LampeggioLune,                                                               //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
            });
            /*-------------------------------CALCOLI PER STABILIRE SE UNA SUB-LUNA È DIETRO UNA LUNA-------------------------------*/
            //DENTRO L'ORBITA DI UNA LUNA
            if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0) E2_ObjectBehindPlanet({
                Sun: false,                                                                      //GLI OGGETTI DA CALCOLARE SONO IL SOLE
                Radius: VarPlanetSystem.NearMoonDiameter,                                      //DIAMETRO CORPO CELESTE
                Distance: VarPlanetSystem.IndMoonDist[VarPlanetSystem.NearMoonIndex],            //DISTANZA CORPO CELESTE
                NumObjects: VarPlanetSystem.NumSubMoons,                                         //NUMERO DI OGGETTI DA CALCOLARE
                DistObjects: VarPlanetSystem.IndSubMoonDist,                                     //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
                CockpitPlanet: Cockpit.children[1].children[VarPlanetSystem.NearMoonIndex],      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
                CockpitObjects: Cockpit.children[2],                                             //GRUPPO 3D DI OGGETTI COCKPIT
                Lampeggi: LampeggioSubLune,                                                      //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
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
            });
        };
    }, 100);

    /*--------------------------VISIBILITÀ INDICATORE HUD E SIMBOLO STAZIONE SPAZIALE, VISIBILITÀ TESTI DESTINAZIONE-------------------------------*/
    setInterval(() => {
        if (Par.DynamicCockpit.DynamicPlanetarySystem == true) {
            //PER TUTTI GLI INDICATORI DELLE LUNE NON UTILIZZATI
            for (let i = 0; i < VarPlanetSystem.NumMajorMoons - VarPlanetSystem.NumMoons; i++) {
                /*-------------------------------------------DYNAMIC HUD--------------------------------------------*/
                DynamHud.children[1].children[i + VarPlanetSystem.NumMoons].style.display = "none";
                //-----------------------------DYNAMIC COCKPIT--------------------------------------//
                DynamCockpit.children[1].children[i + VarPlanetSystem.NumMoons].children[0].visible = false;     //SPRITE VISORE
                DynamCockpit.children[1].children[i + VarPlanetSystem.NumMoons].children[1].visible = false;     //MESH INDICATORE
            };

            //PER TUTTI GLI INDICATORI DELLE SUB-LUNE NON UTILIZZATI
            for (let i = 0; i < VarPlanetSystem.NumMajorSubMoons - VarPlanetSystem.NumSubMoons; i++) {
                /*-------------------------------------------DYNAMIC HUD--------------------------------------------*/
                DynamHud.children[2].children[i + VarPlanetSystem.NumSubMoons].style.display = "none";

                //-----------------------------DYNAMIC COCKPIT--------------------------------------//
                DynamCockpit.children[2].children[i + VarPlanetSystem.NumSubMoons].children[0].visible = false;     //SPRITE VISORE
                DynamCockpit.children[2].children[i + VarPlanetSystem.NumSubMoons].children[1].visible = false;     //MESH INDICATORE
            };

            //VISIBLITÀ COCKPIT E HUD DESTINAZIONE
            if (VarPlanetSystem.DestinationPlanet == false && VarPlanetSystem.DestinationMoon == false && VarPlanetSystem.DestinationSubMoon == false) {
                Cockpit.children[3].children[0].children[0].visible = false;
                Cockpit.children[3].children[0].children[1].visible = false;
                DynamHud.children[3].children[0].children[0].style.display = "none";
                DynamHud.children[3].children[0].children[1].style.display = "none";
                DynamHud.children[3].children[0].children[2].style.display = "none";
            }
            else {
                Cockpit.children[3].children[0].children[0].visible = true;
                Cockpit.children[3].children[0].children[1].visible = true;
                DynamHud.children[3].children[0].children[0].style.display = "block";
                DynamHud.children[3].children[0].children[1].style.display = "block";
                DynamHud.children[3].children[0].children[2].style.display = "block";
            };

            _1000_E2_UpdateSymbolsMoons();
            _1000_E2_UpdateSymbolsSubMoons();
        };
    }, 1000);

    UserObjects.add(Cockpit);
    return Cockpit;
};
//#endregion

/*--------------------DYNAMIC COCKPIT DOM--------------------------*/
//#region
let Cockpit;
let Sunlight;
let DynamHud;        //INSIEME DELLE AREE DELLE CORNICI
let DynamHudDir;     //INSIEME DELLE AREE DELLE DIREZIONI
let DynamCockpitVar;
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
// function E2_ResizeDist(Child0, Child1, Dist, SpriteScale, MeshScale) {
//    DynamCockpitVar.References[Child0][Child1].Sprite.scale.setScalar(SpriteScale * DynamicScale(
//       Dist, Par.DynamicCockpit.SpriteMinDist, Par.DynamicCockpit.SpriteMaxDist,
//       Par.DynamicCockpit.SpriteMinScale, Par.DynamicCockpit.SpriteMaxScale));
//    DynamCockpitVar.References[Child0][Child1].Text.scale.setScalar(MeshScale * DynamicScale(
//       Dist, Par.DynamicCockpit.MeshMinDist, Par.DynamicCockpit.MeshMaxDist,
//       Par.DynamicCockpit.MeshMinScale, Par.DynamicCockpit.MeshMaxScale));
// };

//FUNZIONE AGGIORNAMENTO INDICATORI DOM CORNICE
function E2_IndVisual(Num, Num2) {
   /*-------------VISIBILITÀ E POSIZIONE INDICATORI DOM CORNICE-------------*/
   if (DynamCockpitVar.PositionDomDir[Num][Num2].z < 1) {
      //INDICATORE FUORI DALLA VISUALE A SINISTRA
      if (DynamCockpitVar.PositionDomDir[Num][Num2].x < (100 - Par.DynamicCockpit.Width) / 2) {
         DynamCockpitVar.DomVisible[Num][Num2] = true;
         DynamCockpitVar.References[Num][Num2].Dom.style.top = `${DynamCockpitVar.PositionDomDir[Num][Num2].y}%`;
         DynamCockpitVar.References[Num][Num2].Dom.style.left = `${(100 - Par.DynamicCockpit.Width) / 2}%`;
      }
      //INDICATORE FUORI DALLA VISUALE A DESTRA
      else if (DynamCockpitVar.PositionDomDir[Num][Num2].x > ((100 - Par.DynamicCockpit.Width) / 2) + Par.DynamicCockpit.Width) {
         DynamCockpitVar.DomVisible[Num][Num2] = true;
         DynamCockpitVar.References[Num][Num2].Dom.style.top = `${DynamCockpitVar.PositionDomDir[Num][Num2].y}%`;
         DynamCockpitVar.References[Num][Num2].Dom.style.left = `${((100 - Par.DynamicCockpit.Width) / 2) + Par.DynamicCockpit.Width}%`;
      }
      //INDICATORE FUORI DALLA VISUALE IN ALTO
      else if (DynamCockpitVar.PositionDomDir[Num][Num2].y < Par.DynamicCockpit.Top) {
         DynamCockpitVar.DomVisible[Num][Num2] = true;
         DynamCockpitVar.References[Num][Num2].Dom.style.left = `${DynamCockpitVar.PositionDomDir[Num][Num2].x}%`;
         DynamCockpitVar.References[Num][Num2].Dom.style.top = `${Par.DynamicCockpit.Top}%`;
      }
      //INDICATORE FUORI DALLA VISUALE IN BASSO
      else if (DynamCockpitVar.PositionDomDir[Num][Num2].y > Par.DynamicCockpit.Top + Par.DynamicCockpit.Height) {
         DynamCockpitVar.DomVisible[Num][Num2] = true;
         DynamCockpitVar.References[Num][Num2].Dom.style.left = `${DynamCockpitVar.PositionDomDir[Num][Num2].x}%`;
         DynamCockpitVar.References[Num][Num2].Dom.style.top = `${Par.DynamicCockpit.Top + Par.DynamicCockpit.Height}%`;
      }
      //INDICATORE DENTRO LA VISUALE
      else {
         DynamCockpitVar.DomVisible[Num][Num2] = false;
      };
   }
   else {
      DynamCockpitVar.DomVisible[Num][Num2] = true;
   };
};

//FUNZIONE AGGIORNAMENTO SIMBOLI LUNE E SUBLUNE COCKPIT E HUB, SOLO CON DYNAMIC PLANETARY SYSTEM (OK)
function E2_UpdateSimbols() {
   //AGGIORNAMENTO LUNE
   for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
      //LUNA PIANETA
      if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Type == 0) {
         //DynamCockpitVar.References[1][i].Sprite.material.map = Loader.load(Par.DynamicCockpit.MoonSprite);
         //INDICATORI DOM CORNICE
         DynamCockpitVar.References[1][i].DomDiv.style.visibility = "visible";
         DynamCockpitVar.References[1][i].DomText.style.visibility = "visible";
         DynamCockpitVar.References[1][i].DomImg.src = "";
         //INDICATORI DOM DIREZIONE
         DynamCockpitVar.References[1][i].DomDirImg.src = Par.DynamicCockpit.MoonSprite;
      }
      //LUNA STAZIONE SPAZIALE - PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
      else {
         //DynamCockpitVar.References[1][i].Sprite.material.map = Loader.load(Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Type - 1][0]);
         //INDICATORI DOM CORNICE
         DynamCockpitVar.References[1][i].DomDiv.style.visibility = "hidden";
         DynamCockpitVar.References[1][i].DomText.style.visibility = "hidden";
         DynamCockpitVar.References[1][i].DomImg.src = Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Type - 1][1];
         //INDICATORI DOM DIREZIONE
         DynamCockpitVar.References[1][i].DomDirImg.src = Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Type - 1][1];
      };
   };
   //AGGIORNAMENTO SUB-LUNE
   for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
      if (VarPlanetSystem.MoonOrbit > 0) {
         // if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type == 0) {
         //    DynamCockpitVar.References[2][i].Sprite.material.map = Loader.load(Par.DynamicCockpit.MoonSprite);
         //    DynamCockpitVar.References[2][i].DomDiv.style.visibility = "visible";
         //    DynamCockpitVar.References[2][i].DomText.style.visibility = "visible";
         //    DynamCockpitVar.References[2][i].DomImg.src = "";
         // }
         //PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
         // else {
         //SUB-LUNA STAZIONE SPAZIALE - PER OGNI SIMBOLO DISPONIBILE NELL'ARRAY "TYPE"
         //DynamCockpitVar.References[2][i].Sprite.material.map = Loader.load(Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1][0]);
         //INDICATORI DOM CORNICE
         DynamCockpitVar.References[2][i].DomDiv.style.visibility = "hidden";
         DynamCockpitVar.References[2][i].DomText.style.visibility = "hidden";
         DynamCockpitVar.References[2][i].DomImg.src = Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1][1];
         //INDICATORI DOM DIREZIONE
         DynamCockpitVar.References[2][i].DomDirImg.src = Par.DynamicCockpit.Type[Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1].Modular[i].Type - 1][1];
         // };
      };

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
               Oggetto.Lampeggi[i] = !Oggetto.Lampeggi[i];
               if (Oggetto.Lampeggi[i] == true) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
               else Oggetto.CockpitObjects.children[i].children[0].material.opacity = 0.3;
               // Oggetto.Lampeggi[i] += 1;
               // if (Oggetto.Lampeggi[i] <= 5) {
               //    Oggetto.CockpitObjects.children[i].children[0].material.opacity = 0.3;
               // }
               // if (Oggetto.Lampeggi[i] > 5) {
               //    Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
               // }
               // if (Oggetto.Lampeggi[i] >= 10) Oggetto.Lampeggi[i] = 0;
            };
            if (Oggetto.Sun == true) Oggetto.CockpitObjects.children[i].children[0].visible = false;
         }
         //SE L'OGGETTO NON È DIETRO IL CORPO CELESTE
         else {
            if (Oggetto.Sun == false) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
            if (Oggetto.Sun == true) Oggetto.CockpitObjects.children[i].children[0].visible = true;
         };
      }
      //SE LA LUNA PIÙ VICINA DEL PIANETA
      else {
         if (Oggetto.Sun == false) Oggetto.CockpitObjects.children[i].children[0].material.opacity = 1;
         if (Oggetto.Sun == true) Oggetto.CockpitObjects.children[i].children[0].visible = true;
      };
   };
};

/*-----------------------------------FUNZIONI DA ESEGUIRE NEL LOOP RENDER-------------------------------------*/
//FUNZIONE AGGIORNAMENTO DISPLAY COCKPIT
//const tmpScreenVec = new THREE.Vector3();

// function E2_UpdateLookCockpitORIGINALE() {
//    if (Par.DynamicCockpit.Sunlight == true) Sunlight.lookAt(PosZero);
//    // //DynamCockpitVar.References[0][0].Obj.lookAt(PosZero);     //INDICATORE STELLA MADRE

//    //INDICATORI RIVOLTI VERSO I PIANETI
//    for (let i = 0; i < VarPlanetSystem.PlanetsNum; i++) {
//       DynamCockpitVar.References[0][i + 1].Obj.lookAt(VarPlanetSystem.WorldPosPlanets[i]);
//    };
//    //INDICATORI RIVOLTI VERSO LE LUNE
//    for (let i = 0; i < Par.DynamicCockpit.Area[1].Num; i++) {
//       DynamCockpitVar.References[1][i].Obj.lookAt(VarPlanetSystem.WorldPosMoons[i]);
//    };
//    //INDICATORI RIVOLTI VERSO LE SUB-LUNE
//    for (let i = 0; i < Par.DynamicCockpit.Area[2].Num; i++) {
//       DynamCockpitVar.References[2][i].Obj.lookAt(VarPlanetSystem.WorldPosSubMoons[i]);
//    };

//    //DESTINAZIONE VERSO UN PIANETA
//    if (VarPlanetSystem.DestinationPlanet == true && VarPlanetSystem.DestPlanet > 0)
//       DynamCockpitVar.References[3][0].Obj.lookAt(VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1]);

//    //DESTINAZIONE VERSO UNA LUNA
//    if (VarPlanetSystem.DestinationMoon == true && VarPlanetSystem.DestMoon > 0)
//       DynamCockpitVar.References[3][0].lookAt(VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1]);

//    //DESTINAZIONE VERSO UNA SUB-LUNA
//    if (VarPlanetSystem.DestinationSubMoon == true && VarPlanetSystem.DestSubMoon > 0)
//       DynamCockpitVar.References[3][0].lookAt(VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1]);

//    //NEMICI
//    // if (DynamCockpitVar.EnemyNum > 0) Cockpit.children[4].children[0].lookAt(MicEnginereturn.GenericGroup.children[0].position);
// };

// function E2_UpdateLookCockpit2() {      //(OK)
//    //if (Par.DynamicCockpit.Sunlight == true) Sunlight.lookAt(PosZero);

//    //INDICATORI RIVOLTI VERSO I PIANETI
//    for (let i = 0; i < VarPlanetSystem.PlanetsNum; i++) {
//       //DynamCockpitVar.References[0][i + 1].Obj.lookAt(VarPlanetSystem.WorldPosPlanets[i]);

//       tmpScreenVec.copy(VarPlanetSystem.WorldPosPlanets[i]).project(Camera);
//       DynamCockpitVar.PositionDomDir[0][i + 1].x = ((tmpScreenVec.x + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[0][i + 1].y = ((-tmpScreenVec.y + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[0][i + 1].z = tmpScreenVec.z;
//       DynamCockpitVar.References[0][i + 1].DomDir.style.left = `${DynamCockpitVar.PositionDomDir[0][i + 1].x}%`;
//       DynamCockpitVar.References[0][i + 1].DomDir.style.top = `${DynamCockpitVar.PositionDomDir[0][i + 1].y}%`;

//       //CAMERA IN DIREZIONE
//       if (DynamCockpitVar.PositionDomDir[0][i + 1].x > 50 - Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[0][i + 1].x < 50 + Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[0][i + 1].y > 50 - Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[0][i + 1].y < 50 + Par.DynamicCockpit.DirDiff) DynamCockpitVar.PositionDomDir[0][i + 1].Dir = true;
//       else DynamCockpitVar.PositionDomDir[0][i + 1].Dir = false;
//    };
//    //INDICATORI RIVOLTI VERSO LE LUNE
//    for (let i = 0; i < Par.DynamicCockpit.Area[1].Num; i++) {
//       //DynamCockpitVar.References[1][i].Obj.lookAt(VarPlanetSystem.WorldPosMoons[i]);

//       tmpScreenVec.copy(VarPlanetSystem.WorldPosMoons[i]).project(Camera);
//       DynamCockpitVar.PositionDomDir[1][i].x = ((tmpScreenVec.x + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[1][i].y = ((-tmpScreenVec.y + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[1][i].z = tmpScreenVec.z;
//       DynamCockpitVar.References[1][i].DomDir.style.left = `${DynamCockpitVar.PositionDomDir[1][i].x}%`;
//       DynamCockpitVar.References[1][i].DomDir.style.top = `${DynamCockpitVar.PositionDomDir[1][i].y}%`;

//       //CAMERA IN DIREZIONE
//       if (DynamCockpitVar.PositionDomDir[1][i].x > 50 - Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[1][i].x < 50 + Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[1][i].y > 50 - Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[1][i].y < 50 + Par.DynamicCockpit.DirDiff) DynamCockpitVar.PositionDomDir[1][i].Dir = true;
//       else DynamCockpitVar.PositionDomDir[1][i].Dir = false;
//    };

//    //INDICATORI RIVOLTI VERSO LE SUB-LUNE
//    for (let i = 0; i < Par.DynamicCockpit.Area[2].Num; i++) {
//       //DynamCockpitVar.References[2][i].Obj.lookAt(VarPlanetSystem.WorldPosSubMoons[i]);

//       tmpScreenVec.copy(VarPlanetSystem.WorldPosSubMoons[i]).project(Camera);
//       DynamCockpitVar.PositionDomDir[2][i].x = ((tmpScreenVec.x + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[2][i].y = ((-tmpScreenVec.y + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[2][i].z = tmpScreenVec.z;
//       DynamCockpitVar.References[2][i].DomDir.style.left = `${DynamCockpitVar.PositionDomDir[2][i].x}%`;
//       DynamCockpitVar.References[2][i].DomDir.style.top = `${DynamCockpitVar.PositionDomDir[2][i].y}%`;

//       //CAMERA IN DIREZIONE
//       if (DynamCockpitVar.PositionDomDir[2][i].x > 50 - Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[2][i].x < 50 + Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[2][i].y > 50 - Par.DynamicCockpit.DirDiff &&
//          DynamCockpitVar.PositionDomDir[2][i].y < 50 + Par.DynamicCockpit.DirDiff) DynamCockpitVar.PositionDomDir[2][i].Dir = true;
//       else DynamCockpitVar.PositionDomDir[2][i].Dir = false;
//    };

//    //DESTINAZIONE VERSO UN PIANETA
//    if (VarPlanetSystem.DestinationPlanet == true && VarPlanetSystem.DestPlanet > 0) {
//       //DynamCockpitVar.References[3][0].Obj.lookAt(VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1]);

//       tmpScreenVec.copy(VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1]).project(Camera);
//       DynamCockpitVar.PositionDomDir[3][0].x = ((tmpScreenVec.x + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[3][0].y = ((-tmpScreenVec.y + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[3][0].z = tmpScreenVec.z;
//       DynamCockpitVar.References[3][i].DomDir.style.left = `${DynamCockpitVar.PositionDomDir[3][0].x}%`;
//       DynamCockpitVar.References[3][i].DomDir.style.top = `${DynamCockpitVar.PositionDomDir[3][0].y}%`;
//    };


//    //DESTINAZIONE VERSO UNA LUNA
//    if (VarPlanetSystem.DestinationMoon == true && VarPlanetSystem.DestMoon > 0) {
//       //DynamCockpitVar.References[3][0].lookAt(VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1]);

//       tmpScreenVec.copy(VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1]).project(Camera);
//       DynamCockpitVar.PositionDomDir[3][0].x = ((tmpScreenVec.x + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[3][0].y = ((-tmpScreenVec.y + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[3][0].z = tmpScreenVec.z;
//       DynamCockpitVar.References[3][0].DomDir.style.left = `${DynamCockpitVar.PositionDomDir[3][0].x}%`;
//       DynamCockpitVar.References[3][0].DomDir.style.top = `${DynamCockpitVar.PositionDomDir[3][0].y}%`;
//    };


//    //DESTINAZIONE VERSO UNA SUB-LUNA
//    if (VarPlanetSystem.DestinationSubMoon == true && VarPlanetSystem.DestSubMoon > 0) {
//       //DynamCockpitVar.References[3][0].lookAt(VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1]);

//       tmpScreenVec.copy(VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1]).project(Camera);
//       DynamCockpitVar.PositionDomDir[3][0].x = ((tmpScreenVec.x + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[3][0].y = ((-tmpScreenVec.y + 1) / 2) * 100;
//       DynamCockpitVar.PositionDomDir[3][0].z = tmpScreenVec.z;
//       DynamCockpitVar.References[3][0].DomDir.style.left = `${DynamCockpitVar.PositionDomDir[3][0].x}%`;
//       DynamCockpitVar.References[3][0].DomDir.style.top = `${DynamCockpitVar.PositionDomDir[3][0].y}%`;
//    };

//    //CAMERA IN DIREZIONE
//    if (DynamCockpitVar.PositionDomDir[3][0].x > 50 - Par.DynamicCockpit.DirDiff &&
//       DynamCockpitVar.PositionDomDir[3][0].x < 50 + Par.DynamicCockpit.DirDiff &&
//       DynamCockpitVar.PositionDomDir[3][0].y > 50 - Par.DynamicCockpit.DirDiff &&
//       DynamCockpitVar.PositionDomDir[3][0].y < 50 + Par.DynamicCockpit.DirDiff) DynamCockpitVar.PositionDomDir[3][0].Dir = true;
//    else DynamCockpitVar.PositionDomDir[3][0].Dir = false;


//    //NEMICI
//    // if (DynamCockpitVar.EnemyNum > 0) Cockpit.children[4].children[0].lookAt(MicEnginereturn.GenericGroup.children[0].position);
// };



// Variabili temporanee (creale una volta fuori dal loop globale)

// const __tmpProjMat = new THREE.Matrix4();
// const __tmpScreenVec = new THREE.Vector4(); // usiamo Vector4 per gestire w senza allocazioni

// function E2_UpdateLookCockpitGPT() {
//    // Sole (se vuoi tenerlo, lo lasci così)
//     if (Par.DynamicCockpit.Sunlight == true) Sunlight.lookAt(PosZero);

//    const cam = Camera;
//    // const width = renderer.domElement.clientWidth;
//    // const height = renderer.domElement.clientHeight;

//    // Precalcola matrice proj * view (una volta per frame)
//    __tmpProjMat.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);

//    // scale per convertire NDC [-1,1] -> percentuale [0,100]
//    const scaleX = 50.0; // (100 / 2)
//    const scaleY = 50.0;

//    // ----- PIANETI -----
//    for (let i = 0; i < VarPlanetSystem.PlanetsNum; i++) {
//       const worldPos = VarPlanetSystem.WorldPosPlanets[i];
//       const refObj = DynamCockpitVar.References[0][i + 1];
//       const dom = refObj.DomDir;
//       const store = DynamCockpitVar.PositionDomDir[0][i + 1];

//       // proiezione manuale (equivalente a worldPos.project(camera))
//       __tmpScreenVec.set(worldPos.x, worldPos.y, worldPos.z, 1.0).applyMatrix4(__tmpProjMat);
//       const invW = 1.0 / __tmpScreenVec.w;
//       __tmpScreenVec.x *= invW;
//       __tmpScreenVec.y *= invW;
//       __tmpScreenVec.z *= invW;

//       // salva z (utile per ogni logica che la usa)
//       store.z = __tmpScreenVec.z;

//       // se fuori frustum in Z nascondi (opzionale: match tua logica se vuoi sempre mostrare)
//       if (__tmpScreenVec.z < -1.0 || __tmpScreenVec.z > 1.0) {
//          dom.style.display = "none";
//          store.Dir = false;
//          continue;
//       }

//       // percentuali
//       const newX = (__tmpScreenVec.x + 1.0) * scaleX;
//       const newY = (-__tmpScreenVec.y + 1.0) * scaleY;

//       // aggiorna solo se cambiato
//       if (store.x !== newX || store.y !== newY) {
//          store.x = newX;
//          store.y = newY;
//          dom.style.left = `${newX}%`;
//          dom.style.top = `${newY}%`;
//          dom.style.display = "block";
//       }

//       // CAMERA IN DIREZIONE (Dir)
//       if (newX > 50 - Par.DynamicCockpit.DirDiff &&
//          newX < 50 + Par.DynamicCockpit.DirDiff &&
//          newY > 50 - Par.DynamicCockpit.DirDiff &&
//          newY < 50 + Par.DynamicCockpit.DirDiff) {
//          store.Dir = true;
//       } else {
//          store.Dir = false;
//       }
//    }

//    // ----- LUNE -----
//    for (let i = 0; i < Par.DynamicCockpit.Area[1].Num; i++) {
//       const worldPos = VarPlanetSystem.WorldPosMoons[i];
//       const refObj = DynamCockpitVar.References[1][i];
//       const dom = refObj.DomDir;
//       const store = DynamCockpitVar.PositionDomDir[1][i];

//       __tmpScreenVec.set(worldPos.x, worldPos.y, worldPos.z, 1.0).applyMatrix4(__tmpProjMat);
//       const invW = 1.0 / __tmpScreenVec.w;
//       __tmpScreenVec.x *= invW;
//       __tmpScreenVec.y *= invW;
//       __tmpScreenVec.z *= invW;

//       store.z = __tmpScreenVec.z;

//       if (__tmpScreenVec.z < -1.0 || __tmpScreenVec.z > 1.0) {
//          dom.style.display = "none";
//          store.Dir = false;
//          continue;
//       }

//       const newX = (__tmpScreenVec.x + 1.0) * scaleX;
//       const newY = (-__tmpScreenVec.y + 1.0) * scaleY;

//       if (store.x !== newX || store.y !== newY) {
//          store.x = newX;
//          store.y = newY;
//          dom.style.left = `${newX}%`;
//          dom.style.top = `${newY}%`;
//          dom.style.display = "block";
//       }

//       if (newX > 50 - Par.DynamicCockpit.DirDiff &&
//          newX < 50 + Par.DynamicCockpit.DirDiff &&
//          newY > 50 - Par.DynamicCockpit.DirDiff &&
//          newY < 50 + Par.DynamicCockpit.DirDiff) {
//          store.Dir = true;
//       } else {
//          store.Dir = false;
//       }
//    }

//    // ----- SUB-LUNE -----
//    for (let i = 0; i < Par.DynamicCockpit.Area[2].Num; i++) {
//       const worldPos = VarPlanetSystem.WorldPosSubMoons[i];
//       const refObj = DynamCockpitVar.References[2][i];
//       const dom = refObj.DomDir;
//       const store = DynamCockpitVar.PositionDomDir[2][i];

//       __tmpScreenVec.set(worldPos.x, worldPos.y, worldPos.z, 1.0).applyMatrix4(__tmpProjMat);
//       const invW = 1.0 / __tmpScreenVec.w;
//       __tmpScreenVec.x *= invW;
//       __tmpScreenVec.y *= invW;
//       __tmpScreenVec.z *= invW;

//       store.z = __tmpScreenVec.z;

//       if (__tmpScreenVec.z < -1.0 || __tmpScreenVec.z > 1.0) {
//          dom.style.display = "none";
//          store.Dir = false;
//          continue;
//       }

//       const newX = (__tmpScreenVec.x + 1.0) * scaleX;
//       const newY = (-__tmpScreenVec.y + 1.0) * scaleY;

//       if (store.x !== newX || store.y !== newY) {
//          store.x = newX;
//          store.y = newY;
//          dom.style.left = `${newX}%`;
//          dom.style.top = `${newY}%`;
//          dom.style.display = "block";
//       }

//       if (newX > 50 - Par.DynamicCockpit.DirDiff &&
//          newX < 50 + Par.DynamicCockpit.DirDiff &&
//          newY > 50 - Par.DynamicCockpit.DirDiff &&
//          newY < 50 + Par.DynamicCockpit.DirDiff) {
//          store.Dir = true;
//       } else {
//          store.Dir = false;
//       }
//    }

//    // ----- DESTINAZIONE (pianeta / luna / sub-luna) -----
//    if (VarPlanetSystem.DestinationPlanet == true && VarPlanetSystem.DestPlanet > 0) {
//       const worldPos = VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1];
//       const destStore = DynamCockpitVar.PositionDomDir[3][0];
//       const destDom = DynamCockpitVar.References[3][0].DomDir;

//       __tmpScreenVec.set(worldPos.x, worldPos.y, worldPos.z, 1.0).applyMatrix4(__tmpProjMat);
//       const invW = 1.0 / __tmpScreenVec.w;
//       __tmpScreenVec.x *= invW;
//       __tmpScreenVec.y *= invW;
//       __tmpScreenVec.z *= invW;

//       destStore.z = __tmpScreenVec.z;

//       if (!(__tmpScreenVec.z < -1.0 || __tmpScreenVec.z > 1.0)) {
//          const newX = (__tmpScreenVec.x + 1.0) * scaleX;
//          const newY = (-__tmpScreenVec.y + 1.0) * scaleY;
//          destStore.x = newX;
//          destStore.y = newY;
//          destDom.style.left = `${newX}%`;
//          destDom.style.top = `${newY}%`;
//       }
//    }

//    if (VarPlanetSystem.DestinationMoon == true && VarPlanetSystem.DestMoon > 0) {
//       const worldPos = VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1];
//       const destStore = DynamCockpitVar.PositionDomDir[3][0];
//       const destDom = DynamCockpitVar.References[3][0].DomDir;

//       __tmpScreenVec.set(worldPos.x, worldPos.y, worldPos.z, 1.0).applyMatrix4(__tmpProjMat);
//       const invW = 1.0 / __tmpScreenVec.w;
//       __tmpScreenVec.x *= invW;
//       __tmpScreenVec.y *= invW;
//       __tmpScreenVec.z *= invW;

//       destStore.z = __tmpScreenVec.z;

//       if (!(__tmpScreenVec.z < -1.0 || __tmpScreenVec.z > 1.0)) {
//          const newX = (__tmpScreenVec.x + 1.0) * scaleX;
//          const newY = (-__tmpScreenVec.y + 1.0) * scaleY;
//          destStore.x = newX;
//          destStore.y = newY;
//          destDom.style.left = `${newX}%`;
//          destDom.style.top = `${newY}%`;
//       }
//    }

//    if (VarPlanetSystem.DestinationSubMoon == true && VarPlanetSystem.DestSubMoon > 0) {
//       const worldPos = VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1];
//       const destStore = DynamCockpitVar.PositionDomDir[3][0];
//       const destDom = DynamCockpitVar.References[3][0].DomDir;

//       __tmpScreenVec.set(worldPos.x, worldPos.y, worldPos.z, 1.0).applyMatrix4(__tmpProjMat);
//       const invW = 1.0 / __tmpScreenVec.w;
//       __tmpScreenVec.x *= invW;
//       __tmpScreenVec.y *= invW;
//       __tmpScreenVec.z *= invW;

//       destStore.z = __tmpScreenVec.z;

//       if (!(__tmpScreenVec.z < -1.0 || __tmpScreenVec.z > 1.0)) {
//          const newX = (__tmpScreenVec.x + 1.0) * scaleX;
//          const newY = (-__tmpScreenVec.y + 1.0) * scaleY;
//          destStore.x = newX;
//          destStore.y = newY;
//          destDom.style.left = `${newX}%`;
//          destDom.style.top = `${newY}%`;
//       }
//    }

//    // CAMERA IN DIREZIONE per la destinazione (ultimo controllo Dir)
//    const d = DynamCockpitVar.PositionDomDir[3][0];
//    if (d.x > 50 - Par.DynamicCockpit.DirDiff &&
//       d.x < 50 + Par.DynamicCockpit.DirDiff &&
//       d.y > 50 - Par.DynamicCockpit.DirDiff &&
//       d.y < 50 + Par.DynamicCockpit.DirDiff) {
//       d.Dir = true;
//    } else {
//       d.Dir = false;
//    }

//    // NEMICI (lasciato commentato come nell'originale)
//    // if (DynamCockpitVar.EnemyNum > 0) Cockpit.children[4].children[0].lookAt(MicEnginereturn.GenericGroup.children[0].position);
// };

const LookMatrix = new THREE.Matrix4();
const LookVector = new THREE.Vector4();

function E2_UpdateLookCockpit() {
   if (Par.DynamicCockpit.Sunlight == true) Sunlight.lookAt(PosZero);

   LookMatrix.multiplyMatrices(Camera.projectionMatrix, Camera.matrixWorldInverse);

   // scale per convertire NDC [-1,1] -> percentuale [0,100]
   const scaleX = 50.0; // (100 / 2)
   const scaleY = 50.0;

   // // ----- PIANETI -----Par.DynamicCockpit.Area[0].Num+1 VarPlanetSystem.PlanetsNum+1 FARE L'INDICATORE DEL SOLE A PARTE
   for (let i = 0; i < Par.DynamicCockpit.Area[0].Num + 1; i++) {
      if (DynamCockpitVar.DomEnabled[0][i + 1]) {
         // proiezione manuale (equivalente a worldPos.project(camera))
         LookVector.set(VarPlanetSystem.WorldPosPlanets[i].x, VarPlanetSystem.WorldPosPlanets[i].y, VarPlanetSystem.WorldPosPlanets[i].z, 1.0).applyMatrix4(LookMatrix);
         const invW = 1.0 / LookVector.w;
         LookVector.x *= invW;
         LookVector.y *= invW;
         LookVector.z *= invW;

         // salva z (utile per ogni logica che la usa)
         DynamCockpitVar.PositionDomDir[0][i + 1].z = LookVector.z;

         // se fuori frustum in Z nascondi (opzionale: match tua logica se vuoi sempre mostrare)
         if (LookVector.z < -1.0 || LookVector.z > 1.0) {
            DynamCockpitVar.References[0][i + 1].DomDir.style.display = "none";
            DynamCockpitVar.PositionDomDir[0][i + 1].Dir = false;
            continue;
         }

         // percentuali
         const newX = (LookVector.x + 1.0) * scaleX;
         const newY = (-LookVector.y + 1.0) * scaleY;

         // aggiorna solo se cambiato
         //if (DynamCockpitVar.PositionDomDir[0][i + 1].x !== newX || DynamCockpitVar.PositionDomDir[0][i + 1].y !== newY) {
         DynamCockpitVar.PositionDomDir[0][i + 1].x = newX;
         DynamCockpitVar.PositionDomDir[0][i + 1].y = newY;
         DynamCockpitVar.References[0][i + 1].DomDir.style.left = `${newX}%`;
         DynamCockpitVar.References[0][i + 1].DomDir.style.top = `${newY}%`;
         DynamCockpitVar.References[0][i + 1].DomDir.style.display = "block";
         //}

         // CAMERA IN DIREZIONE (Dir)
         if (newX > 50 - Par.DynamicCockpit.DirDiff &&
            newX < 50 + Par.DynamicCockpit.DirDiff &&
            newY > 50 - Par.DynamicCockpit.DirDiff &&
            newY < 50 + Par.DynamicCockpit.DirDiff) {
            DynamCockpitVar.PositionDomDir[0][i + 1].Dir = true;
         } else {
            DynamCockpitVar.PositionDomDir[0][i + 1].Dir = false;
         };
      };
   };

   // ----- LUNE ----- Par.DynamicCockpit.Area[1].Num VarPlanetSystem.NumMoons
   for (let i = 0; i < Par.DynamicCockpit.Area[1].Num; i++) {
      if (DynamCockpitVar.DomEnabled[1][i]) {
         LookVector.set(VarPlanetSystem.WorldPosMoons[i].x, VarPlanetSystem.WorldPosMoons[i].y, VarPlanetSystem.WorldPosMoons[i].z, 1.0).applyMatrix4(LookMatrix);
         const invW = 1.0 / LookVector.w;
         LookVector.x *= invW;
         LookVector.y *= invW;
         LookVector.z *= invW;

         DynamCockpitVar.PositionDomDir[1][i].z = LookVector.z;

         if (LookVector.z < -1.0 || LookVector.z > 1.0) {
            DynamCockpitVar.References[1][i].DomDir.style.display = "none";
            DynamCockpitVar.PositionDomDir[1][i].Dir = false;
            continue;
         };

         const newX = (LookVector.x + 1.0) * scaleX;
         const newY = (-LookVector.y + 1.0) * scaleY;

         //if (DynamCockpitVar.PositionDomDir[1][i].x !== newX || DynamCockpitVar.PositionDomDir[1][i].y !== newY) {
         DynamCockpitVar.PositionDomDir[1][i].x = newX;
         DynamCockpitVar.PositionDomDir[1][i].y = newY;
         DynamCockpitVar.References[1][i].DomDir.style.left = `${newX}%`;
         DynamCockpitVar.References[1][i].DomDir.style.top = `${newY}%`;
         DynamCockpitVar.References[1][i].DomDir.style.display = "block";
         //};

         if (newX > 50 - Par.DynamicCockpit.DirDiff &&
            newX < 50 + Par.DynamicCockpit.DirDiff &&
            newY > 50 - Par.DynamicCockpit.DirDiff &&
            newY < 50 + Par.DynamicCockpit.DirDiff) {
            DynamCockpitVar.PositionDomDir[1][i].Dir = true;
         } else {
            DynamCockpitVar.PositionDomDir[1][i].Dir = false;
         };
      };

   };

   // ----- SUB-LUNE -----Par.DynamicCockpit.Area[2].Num VarPlanetSystem.NumSubMoons
   for (let i = 0; i < Par.DynamicCockpit.Area[2].Num; i++) {
      if (DynamCockpitVar.DomEnabled[2][i]) {
         const store = DynamCockpitVar.PositionDomDir[2][i];

         LookVector.set(VarPlanetSystem.WorldPosSubMoons[i].x, VarPlanetSystem.WorldPosSubMoons[i].y, VarPlanetSystem.WorldPosSubMoons[i].z, 1.0).applyMatrix4(LookMatrix);
         const invW = 1.0 / LookVector.w;
         LookVector.x *= invW;
         LookVector.y *= invW;
         LookVector.z *= invW;

         DynamCockpitVar.PositionDomDir[2][i].z = LookVector.z;

         if (LookVector.z < -1.0 || LookVector.z > 1.0) {
            DynamCockpitVar.References[2][i].DomDir.style.display = "none";
            DynamCockpitVar.PositionDomDir[2][i].Dir = false;
            continue;
         }

         const newX = (LookVector.x + 1.0) * scaleX;
         const newY = (-LookVector.y + 1.0) * scaleY;

         //if (DynamCockpitVar.PositionDomDir[2][i].x !== newX || DynamCockpitVar.PositionDomDir[2][i].y !== newY) {
         DynamCockpitVar.PositionDomDir[2][i].x = newX;
         DynamCockpitVar.PositionDomDir[2][i].y = newY;
         DynamCockpitVar.References[2][i].DomDir.style.left = `${newX}%`;
         DynamCockpitVar.References[2][i].DomDir.style.top = `${newY}%`;
         DynamCockpitVar.References[2][i].DomDir.style.display = "block";
         //}

         if (newX > 50 - Par.DynamicCockpit.DirDiff &&
            newX < 50 + Par.DynamicCockpit.DirDiff &&
            newY > 50 - Par.DynamicCockpit.DirDiff &&
            newY < 50 + Par.DynamicCockpit.DirDiff) {
            DynamCockpitVar.PositionDomDir[2][i].Dir = true;
         } else {
            DynamCockpitVar.PositionDomDir[2][i].Dir = false;
         };
      };
   }

   // ----- DESTINAZIONE (pianeta / luna / sub-luna) -----
   if (VarPlanetSystem.DestinationPlanet == true && VarPlanetSystem.DestPlanet > 0) {
      LookVector.set(VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1].x, VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1].y, VarPlanetSystem.WorldPosPlanets[VarPlanetSystem.DestPlanet - 1].z, 1.0).applyMatrix4(LookMatrix);
      const invW = 1.0 / LookVector.w;
      LookVector.x *= invW;
      LookVector.y *= invW;
      LookVector.z *= invW;

      DynamCockpitVar.PositionDomDir[3][0].z = LookVector.z;

      if (!(LookVector.z < -1.0 || LookVector.z > 1.0)) {
         const newX = (LookVector.x + 1.0) * scaleX;
         const newY = (-LookVector.y + 1.0) * scaleY;
         DynamCockpitVar.PositionDomDir[3][0].x = newX;
         DynamCockpitVar.PositionDomDir[3][0].y = newY;
         DynamCockpitVar.References[3][0].DomDir.style.left = `${newX}%`;
         DynamCockpitVar.References[3][0].DomDir.style.top = `${newY}%`;
      }
   }

   if (VarPlanetSystem.DestinationMoon == true && VarPlanetSystem.DestMoon > 0) {
      LookVector.set(VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1].x, VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1].y, VarPlanetSystem.WorldPosMoons[VarPlanetSystem.DestMoon - 1].z, 1.0).applyMatrix4(LookMatrix);
      const invW = 1.0 / LookVector.w;
      LookVector.x *= invW;
      LookVector.y *= invW;
      LookVector.z *= invW;

      DynamCockpitVar.PositionDomDir[3][0].z = LookVector.z;

      if (!(LookVector.z < -1.0 || LookVector.z > 1.0)) {
         const newX = (LookVector.x + 1.0) * scaleX;
         const newY = (-LookVector.y + 1.0) * scaleY;
         DynamCockpitVar.PositionDomDir[3][0].x = newX;
         DynamCockpitVar.PositionDomDir[3][0].y = newY;
         DynamCockpitVar.References[3][0].DomDir.style.left = `${newX}%`;
         DynamCockpitVar.References[3][0].DomDir.style.top = `${newY}%`;
      }
   }

   if (VarPlanetSystem.DestinationSubMoon == true && VarPlanetSystem.DestSubMoon > 0) {
      LookVector.set(VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1].x, VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1].y, VarPlanetSystem.WorldPosSubMoons[VarPlanetSystem.DestSubMoon - 1].z, 1.0).applyMatrix4(LookMatrix);
      const invW = 1.0 / LookVector.w;
      LookVector.x *= invW;
      LookVector.y *= invW;
      LookVector.z *= invW;

      DynamCockpitVar.PositionDomDir[3][0].z = LookVector.z;

      if (!(LookVector.z < -1.0 || LookVector.z > 1.0)) {
         const newX = (LookVector.x + 1.0) * scaleX;
         const newY = (-LookVector.y + 1.0) * scaleY;
         DynamCockpitVar.PositionDomDir[3][0].x = newX;
         DynamCockpitVar.PositionDomDir[3][0].y = newY;
         DynamCockpitVar.References[3][0].DomDir.style.left = `${newX}%`;
         DynamCockpitVar.References[3][0].DomDir.style.top = `${newY}%`;
      }
   }

   // CAMERA IN DIREZIONE per la destinazione (ultimo controllo Dir)
   const d = DynamCockpitVar.PositionDomDir[3][0];
   if (d.x > 50 - Par.DynamicCockpit.DirDiff &&
      d.x < 50 + Par.DynamicCockpit.DirDiff &&
      d.y > 50 - Par.DynamicCockpit.DirDiff &&
      d.y < 50 + Par.DynamicCockpit.DirDiff) {
      d.Dir = true;
   } else {
      d.Dir = false;
   }

   // NEMICI (lasciato commentato come nell'originale)
   // if (DynamCockpitVar.EnemyNum > 0) Cockpit.children[4].children[0].lookAt(MicEnginereturn.GenericGroup.children[0].position);
};

function E2_UpdateDynamicCockpit(delta) {
   E2_UpdateLookCockpit();
   //E3_UpdateDynamicHUD();
};
/*--------------------------------------------FUNZIONE PRINCIPALE----------------------------------------------*/
// function E0_DynamicCockpit(Oggetto) {
//    if (Par.Log.Moduli == true) console.log("DynamicCockpit");
//    Cockpit = new THREE.Group();
//    Cockpit.name = "CockpitVisore";

//    //SUNLIGHT
//    if (Par.DynamicCockpit.Sunlight == true) {
//       Sunlight = new THREE.Group();   //GRUPPO POSIZIONE APPARENTE DEL SOLE SEMPRE NELLA STESSA POSIZIONE DELLA NAVE SPAZIALE
//       Sunlight.name = "Sunlight";
//       const SpriteSole = new THREE.Sprite(new THREE.SpriteMaterial({
//          map: Loader.load(Par.DynamicCockpit.SunSprite),
//          depthWrite: false,
//          depthTest: true,
//          opacity: 0.8,
//       }));
//       SpriteSole.name = "SpriteSole";
//       SpriteSole.position.set(0, 0, Par.Camera.CameraFar / 100);

//       Sunlight.add(SpriteSole);
//    };

//    //CREAZIONE LIVELLI (OK)
//    for (let i = 0; i < Par.DynamicCockpit.Area.length; i++) {
//       DynamCockpitVar.PositionDomDir[i] = [];
//       DynamCockpitVar.DomVisible[i] = [];
//       DynamCockpitVar.DomDirVisible[i] = [];
//       DynamCockpitVar.DomText[i] = [];
//       //CREAZIONE LIVELLI  COCKPIT
//       const CanvasArray = [];                //ARRAY CONTENENTE I CANVAS DEGLI INDICATORI
//       const Array = [];
//       ImageArray.push(Array);

//       //CREAZIONE LIVELLI HUD CORNICE
//       const IndArea = document.createElement('div');
//       IndArea.style.display = "block";
//       IndArea.style.position = "absolute";
//       IndArea.style.width = "100%";
//       IndArea.style.height = "100%";
//       IndArea.style.top = "0%";
//       IndArea.style.left = "0%";

//       //CREAZIONE LIVELLI HUD DIREZIONE
//       const IndAreaDir = document.createElement('div');
//       IndAreaDir.style.display = "block";
//       IndAreaDir.style.position = "absolute";
//       IndAreaDir.style.width = "100%";
//       IndAreaDir.style.height = "100%";
//       IndAreaDir.style.top = "0%";
//       IndAreaDir.style.left = "0%";

//       const Group = new THREE.Group();
//       Group.name = `GroupCockpit ${i} ${Par.DynamicCockpit.Area[i].Name}`;

//       for (let a = 0; a < Par.DynamicCockpit.Area[i].Num; a++) {
//          DynamCockpitVar.PositionDomDir[i][a] = { x: 0, y: 0, z: 0, Dir: false };
//          DynamCockpitVar.DomText[i][a] = { Name: "", Dist: "", Time: "" };

//          E2_CreateVisorCanvas(Par.DynamicCockpit.Area[i].Color, Par.DynamicCockpit.Area[i].Sprite, Group, i, a,
//             "GroupVisore", CanvasArray, ImageArray);

//          /*--------------------------------------INDICATORI DOM CORNICE-----------------------------------------*/
//          //CONTENITORE
//          const newContainer = document.createElement("div");
//          newContainer.style.display = "block";
//          newContainer.style.position = "absolute";
//          newContainer.style.width = "40px";
//          newContainer.style.height = "40px";

//          //TRIANGOLO
//          const newDiv = document.createElement("div");
//          newDiv.style.display = "block";
//          newDiv.style.position = "absolute";
//          newDiv.style.top = "0%";
//          newDiv.style.left = "50%";
//          newDiv.style.width = "0px";
//          newDiv.style.height = "0px";
//          newDiv.style.border = "solid";
//          newDiv.style.borderWidth = "0 6px 15px 6px";
//          newDiv.style.borderColor = `transparent transparent ${Par.DynamicCockpit.Area[i].Color} transparent`;
//          newDiv.style.transform = "translate(-50%) rotate(0deg)";

//          //TESTO
//          const newP = document.createElement("div");
//          newP.style.display = "block";
//          newP.style.position = "absolute";
//          newP.style.top = "0%";
//          newP.style.width = "100%";
//          newP.style.height = "50%";
//          newP.style.color = Par.DynamicCockpit.Area[i].Color;
//          newP.style.textAlign = "center";
//          newP.style.fontSize = "small";

//          //IMMAGINE
//          const newImg = document.createElement("img");
//          newImg.style.display = "block";
//          newImg.style.position = "absolute";
//          newImg.style.height = Par.DynamicCockpit.Area[i].HeightImg;

//          newContainer.appendChild(newDiv);
//          newContainer.appendChild(newP);
//          newContainer.appendChild(newImg);

//          IndArea.appendChild(newContainer);

//          /*--------------------------------------INDICATORI DOM DIREZIONE-----------------------------------------*/
//          //CONTENITORE
//          const newDirContainer = document.createElement("div");
//          newDirContainer.style.display = "block";
//          newDirContainer.style.position = "absolute";
//          newDirContainer.style.width = "40px";
//          newDirContainer.style.height = "40px";

//          //TESTO
//          const newDirP = document.createElement("div");
//          newDirP.style.display = "block";
//          newDirP.style.position = "absolute";
//          newDirP.style.top = "-20px";
//          newDirP.style.width = "100px";
//          newDirP.style.height = "100px";
//          newDirP.style.color = Par.DynamicCockpit.Area[i].Color;
//          newDirP.style.textAlign = "center";
//          newDirP.style.fontSize = "medium";
//          newDirP.style.transform = `translate(-50%, -50%)`;

//          //IMMAGINE
//          const newDirImg = document.createElement("img");
//          newDirImg.style.display = "block";
//          newDirImg.style.position = "absolute";
//          newDirImg.style.height = Par.DynamicCockpit.Area[i].HeightImg;
//          newDirImg.src = Par.DynamicCockpit.Area[i].Sprite
//          newDirImg.style.transform = `translate(-50%, -50%)`;

//          newDirContainer.appendChild(newDirP);
//          newDirContainer.appendChild(newDirImg);

//          IndAreaDir.appendChild(newDirContainer);
//       };

//       Cockpit.add(Group);
//       DynamHud.appendChild(IndArea);
//       DynamHudDir.appendChild(IndAreaDir);
//    };

//    //CREAZIONE REFERENCE (OK)
//    for (let i = 0; i < Par.DynamicCockpit.Area.length; i++) {
//       //INIZIALIZZAZIONE DELL'ARRAY PRINCIPALE PER LE AREE
//       DynamCockpitVar.References[i] = [];

//       for (let a = 0; a < Par.DynamicCockpit.Area[i].Num; a++) {
//          //CREAZIONE REFERENCE
//          DynamCockpitVar.References[i][a] = {
//             Obj: Cockpit.children[i].children[a],
//             Sprite: Cockpit.children[i].children[a].children[0],
//             Text: Cockpit.children[i].children[a].children[1],

//             //INDICATORI DOM CORNICE
//             Dom: DynamHud.children[i].children[a],
//             DomDiv: DynamHud.children[i].children[a].children[0],
//             DomText: DynamHud.children[i].children[a].children[1],
//             DomImg: DynamHud.children[i].children[a].children[2],

//             //INDICATORI DOM DIREZIONE
//             DomDir: DynamHudDir.children[i].children[a],
//             DomDirText: DynamHudDir.children[i].children[a].children[0],
//             DomDirImg: DynamHudDir.children[i].children[a].children[1],
//          };
//       };
//    };

//    //NOMI FISSI PIANETI DOM E THREE
//    // for (let i = 0; i < Par.DynamicCockpit.Area[0].Num; i++) {
//    //    ImageArray[0][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth,
//    //       Par.DynamicCockpit.CanvasWidth);
//    //    // //NOME STELLA MADRE
//    //    // if (i == 0) {
//    //    //    //INDICATORI COCKPIT
//    //    //    ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Sun.Name[Language], 20, 50);
//    //    //    //INDICATORI DOM
//    //    //    DynamCockpitVar.References[0][i].DomText.innerText = `${Oggetti.PlanetarySystem.Sun.Name[Language]}`;
//    //    // };
//    //    // //NOME PIANETA
//    //    // if (i > 0) {
//    //    //    //INDICATORI COCKPIT
//    //    //    ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Modular[i - 1].Name[Language], 20, 50);
//    //    //    //INDICATORI DOM
//    //    //    DynamCockpitVar.References[0][i].DomText.innerText = `${Oggetti.PlanetarySystem.Modular[i - 1].Name[Language]}`;
//    //    // };
//    // };

//    /*-----------------------------------VISIBILITÀ E POSIZIONE INDICATORI DOM CORNICE----------------------------------*/
//    setInterval(() => {
//       //DYNAMIC PLANETARY SYSTEM
//       if (PaceDone == true) {
//          //PER TUTTI I PIANETI COMPRESO IL SOLE
//          for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
//             E2_IndVisual(0, i);
//          };

//          //PER TUTTE LE LUNE ATTUALI
//          for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
//             if (VarPlanetSystem.PlanetOrbit > 0) E2_IndVisual(1, i);
//          };

//          //PER TUTTE LE SUB-LUNE ATTUALI
//          for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
//             if (VarPlanetSystem.MoonOrbit > 0) E2_IndVisual(2, i);
//          };
//       };
//    }, 50);

//    //ARRAY DI LAMPEGGIO LUNE E SUB-LUNE (OK)
//    const LampeggioLune = [];
//    for (let i = 0; i < Par.DynamicCockpit.Area[1].Num + 1; i++) {
//       LampeggioLune.push(0);
//    };
//    const LampeggioSubLune = [];
//    for (let i = 0; i < Par.DynamicCockpit.Area[2].Num + 1; i++) {
//       LampeggioSubLune.push(0);
//    };

//    /*FUNZIONE AGGIORNAMENTO SIMBOLI LUNE E SUBLUNE COCKPIT E HUB, SOLO CON DYNAMIC PLANETARY SYSTEM (OK)*/
//    const UpdateSymbols = new OnceFunction(function () {
//       E2_UpdateSimbols();
//    });
//    setTimeout(() => {
//       E2_UpdateSimbols();
//    }, 4000);

//    setInterval(() => {
//       DynamCockpitVar.UpdateSymbolsControl = VarPlanetSystem.PlanetOrbit + VarPlanetSystem.MoonOrbit + VarPlanetSystem.SubMoonOrbit;
//       UpdateSymbols.Update(DynamCockpitVar.UpdateSymbolsControl);

//       // console.log(VarPlanetSystem.PlanetOrbit);
//       // console.log((100 - Par.DynamicCockpit.Width) / 2);
//       // console.log(DynamCockpitVar.DomVisible[0][3]);

//       /*-----------------------------------INDICATORI DOM DIREZIONE E CORNICE----------------------------------*/
//       for (let i = 0; i < DynamCockpitVar.DomVisible.length; i++) {
//          for (let a = 0; a < DynamCockpitVar.DomVisible[i].length; a++) {
//             //VISIBILITÀ E TESTO INDICATORI DOM DIREZIONE E CORNICE
//             if (DynamCockpitVar.DomDirVisible[i][a] == true) {
//                //INDICATORI DOM DIREZIONE
//                DynamCockpitVar.References[i][a].DomDir.style.visibility = "visible";
//                DynamCockpitVar.References[i][a].DomDirText.style.visibility = "visible";
//                //TESTO INDICATORI DOM CORNICE
//                DynamCockpitVar.References[i][a].DomText.innerText = DynamCockpitVar.DomText[i][a].Name;
//                //TESTO INDICATORI DOM DIREZIONE
//                if (DynamCockpitVar.PositionDomDir[i][a].Dir == true)
//                   DynamCockpitVar.References[i][a].DomDirText.innerText = `${DynamCockpitVar.DomText[i][a].Name}
//             ${DynamCockpitVar.DomText[i][a].Dist}
//             ${DynamCockpitVar.DomText[i][a].Time}`;
//                else DynamCockpitVar.References[i][a].DomDirText.innerText = "";

//                //INDICATORI DOM CORNICE
//                if (DynamCockpitVar.DomVisible[i][a] == true) {
//                   DynamCockpitVar.References[i][a].Dom.style.visibility = "visible";
//                   DynamCockpitVar.References[i][a].DomDiv.style.visibility = "visible";
//                   DynamCockpitVar.References[i][a].DomText.style.visibility = "visible";
//                }
//                else {
//                   DynamCockpitVar.References[i][a].Dom.style.visibility = "hidden";
//                   DynamCockpitVar.References[i][a].DomDiv.style.visibility = "hidden";
//                   DynamCockpitVar.References[i][a].DomText.style.visibility = "hidden";
//                };
//             }
//             //VISIBILITÀ INDICATORI DOM DIREZIONE E CORNICE
//             else {
//                DynamCockpitVar.References[i][a].DomDir.style.visibility = "hidden";
//                DynamCockpitVar.References[i][a].DomDirText.style.visibility = "hidden";
//                DynamCockpitVar.References[i][a].Dom.style.visibility = "hidden";
//                DynamCockpitVar.References[i][a].DomDiv.style.visibility = "hidden";
//                DynamCockpitVar.References[i][a].DomText.style.visibility = "hidden";
//             };


//          };
//       };
//    }, 100);

//    /*----------------VISIBILITÀ, NOMI DYNAMIC HUD E COCKPIT, DISTANZA E TEMPI ARRIVO, DIMENSIONE SPRITE, SUNLIGHT (OK) ------------------*/
//    setInterval(() => {
//       //APPLICA LA SCALA IN BASE ALLA DISTANZA DAL SOLE
//       if (Par.DynamicCockpit.Sunlight == true) Sunlight.children[0].scale.set(E2_AutoSunlight(UserPosWorld, PosZero), E2_AutoSunlight(UserPosWorld, PosZero));

//       //PER TUTTI I PIANETI COMPRESO IL SOLE
//       for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
//          /*-----------------------------DYNAMIC COCKPIT--------------------------------------*/
//          //NOTA: IL clearRect PARTE A CANCELLARE DA Y50 COSÌ MANTIENE IL NOME FISSO DEI PIANETI
//          // ImageArray[0][i].clearRect(0, 50, Par.DynamicCockpit.CanvasWidth,
//          //    Par.DynamicCockpit.CanvasWidth);

//          //NOME STELLA MADRE
//          if (i == 0) {
//             //INDICATORI COCKPIT
//             // ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Sun.Name[Language], 20, 50);
//             //INDICATORI DOM
//             DynamCockpitVar.DomText[0][i].Name = Oggetti.PlanetarySystem.Sun.Name[Language];    //ARRAY TESTI INDICATORI
//             // DynamCockpitVar.References[0][i].DomText.innerText = DynamCockpitVar.DomText[0][i].Name;
//          };
//          //NOME PIANETA
//          if (i > 0) {
//             //INDICATORI COCKPIT
//             // ImageArray[0][i].fillText(Oggetti.PlanetarySystem.Modular[i - 1].Name[Language], 20, 50);
//             //INDICATORI DOM
//             DynamCockpitVar.DomText[0][i].Name = Oggetti.PlanetarySystem.Modular[i - 1].Name[Language];    //ARRAY TESTI INDICATORI
//             // DynamCockpitVar.References[0][i].DomText.innerText = DynamCockpitVar.DomText[0][i].Name;
//          };

//          //DISTANZA E TEMPO DI ARRIVO DAL PIANETA PIÙ VICINO COMPRESA DI DIAMETRO
//          if (i == VarPlanetSystem.NearPlanetIndex) {
//             //DISTANZA, VALORE IN MILIONI DI KM
//             // ImageArray[0][i].fillText(E3_DisplayDistance((VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000)
//             //    - (VarPlanetSystem.NearPlanetDiameter * Par.DynamicCockpit.ScalaPos), true), 20, 100);
//             DynamCockpitVar.DomText[0][i].Dist = E3_DisplayDistance((VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000)
//                - (VarPlanetSystem.NearPlanetDiameter * Par.DynamicCockpit.ScalaPos), true);    //ARRAY TESTI INDICATORI
//          }
//          //DISTANZA ALTRI PIANETI (DIAMETRO TRASCURABILE)
//          else {
//             //DISTANZA, VALORE IN MILIONI DI KM
//             // ImageArray[0][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
//             DynamCockpitVar.DomText[0][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true);    //ARRAY TESTI INDICATORI
//          };
//          //TEMPO DI ARRIVO
//          // ImageArray[0][i].fillText(DisplayTime(VarPlanetSystem.TimeDist[i]), 20, 150);
//          DynamCockpitVar.DomText[0][i].Time = DisplayTime(VarPlanetSystem.TimeDist[i]);

//          // DynamCockpitVar.References[0][i].Text.material.map.needsUpdate = true;

//          //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
//          E2_ResizeDist(0, i, VarPlanetSystem.IndDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

//          /*------------------------------------------------------VISIBILITÀ--------------------------------------------------------------*/
//          //SE NON SI È IN ORBITA ATTORNO A UN PIANETA
//          if (VarPlanetSystem.PlanetOrbit == 0) {
//             //RENDI VISIBILI I PIANETI ENTRO IL RAGGIO IMPOSTATO
//             if (VarPlanetSystem.IndDist[i] < Oggetto.DistPlanets) {
//                // DynamCockpitVar.PlanetVisible[i] = true;
//                if (DynamCockpitVar.PositionDomDir[0][i].z < 1)
//                   DynamCockpitVar.DomDirVisible[0][i] = true;
//                else DynamCockpitVar.DomDirVisible[0][i] = false;
//                //INDICATORI DOM CORNICE
//                // DynamCockpitVar.References[0][i].DomDiv.style.visibility = "visible";
//                // DynamCockpitVar.References[0][i].DomText.style.visibility = "visible";
//                // //INDICATORI DOM DIREZIONE
//                // DynamCockpitVar.References[0][i].DomDir.style.visibility = "visible";
//             }
//             //RENDI INVISIBILI I PIANETI FUORI DALL RAGGIO IMPOSTATO
//             else {
//                // DynamCockpitVar.PlanetVisible[i] = false;
//                DynamCockpitVar.DomDirVisible[0][i] = false;
//                //INDICATORI DOM CORNICE
//                // DynamCockpitVar.References[0][i].DomDiv.style.visibility = "hidden";
//                // DynamCockpitVar.References[0][i].DomText.style.visibility = "hidden";
//                // //INDICATORI DOM DIREZIONE
//                // DynamCockpitVar.References[0][i].DomDir.style.visibility = "hidden";
//             };
//          }
//          //RENDI INVISIBILI I PIANETI TRANNE QUELLO PIÙ VICINO
//          else if (i == VarPlanetSystem.NearPlanetIndex) {
//             // DynamCockpitVar.PlanetVisible[i] = true;
//             if (DynamCockpitVar.PositionDomDir[0][i].z < 1)
//                DynamCockpitVar.DomDirVisible[0][i] = true;
//             else DynamCockpitVar.DomDirVisible[0][i] = false;
//             //INDICATORI DOM CORNICE
//             // DynamCockpitVar.References[0][i].DomDiv.style.visibility = "visible";
//             // DynamCockpitVar.References[0][i].DomText.style.visibility = "visible";
//             // //INDICATORI DOM DIREZIONE
//             // DynamCockpitVar.References[0][i].DomDir.style.visibility = "visible";
//          }
//          else {
//             // DynamCockpitVar.PlanetVisible[i] = false;
//             DynamCockpitVar.DomDirVisible[0][i] = false;
//             //INDICATORI DOM CORNICE
//             // DynamCockpitVar.References[0][i].DomDiv.style.visibility = "hidden";
//             // DynamCockpitVar.References[0][i].DomText.style.visibility = "hidden";
//             // //INDICATORI DOM DIREZIONE
//             // DynamCockpitVar.References[0][i].DomDir.style.visibility = "hidden";
//          };

//          //VISIBILITÀ INDICATORE DYNAMIC COCKPIT (ELIMINARE)
//          // if (DynamCockpitVar.PlanetVisible[i] == true) {
//          //    /*SPRITE VISORE*/
//          //    //SE IL PIANETA È LA DESTINAZIONE
//          //    if (VarPlanetSystem.DestPlanet == i) {
//          //       DynamCockpitVar.References[0][i].Sprite.visible = false;       //SPRITE VISORE
//          //       DynamCockpitVar.References[0][i].Text.visible = false;       //TESTO INDICATORE
//          //    }
//          //    //SE IL PIANETA NON È LA DESTINAZIONE
//          //    else {
//          //       DynamCockpitVar.References[0][i].Sprite.visible = true;        //SPRITE VISORE
//          //       //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
//          //       if ((DynamCockpitVar.References[0][i].Obj.rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || DynamCockpitVar.References[0][i].Obj.rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && DynamCockpitVar.References[0][i].Obj.rotation.y < Par.DynamicCockpit.VisDiff && DynamCockpitVar.References[0][i].Obj.rotation.y > -Par.DynamicCockpit.VisDiff) {
//          //          // DynamCockpitVar.References[0][i].Text.visible = true;
//          //          DynamCockpitVar.References[0][i].Text.visible = false;
//          //       }
//          //       else {
//          //          DynamCockpitVar.References[0][i].Text.visible = false;

//          //       }
//          //    };
//          // }
//          // else {
//          //    DynamCockpitVar.References[0][i].Sprite.visible = false;
//          //    DynamCockpitVar.References[0][i].Text.visible = false;
//          // };


//       };

//       //PER TUTTE LE LUNE ATTUALI
//       for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
//          if (VarPlanetSystem.PlanetOrbit > 0) {
//             //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//             // ImageArray[1][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
//             // //NOME LUNA
//             // let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Name[Language];
//             // ImageArray[1][i].fillText(Text, 20, 50);		                                                      //NOME DESTINAZIONE
//             DynamCockpitVar.DomText[1][i].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Name[Language];    //ARRAY TESTI INDICATORI

//             //DISTANZA DALLA LUNA PIÙ VICINA COMPRESA DI DIAMETRO
//             if (i == VarPlanetSystem.NearMoonIndex) {
//                //ImageArray[1][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000
//                //  - (VarPlanetSystem.NearMoonDiameter * Par.DynamicCockpit.ScalaPos), true), 20, 100);		//VALORE IN KM x1000
//                DynamCockpitVar.DomText[1][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000
//                   - (VarPlanetSystem.NearMoonDiameter * Par.DynamicCockpit.ScalaPos), true);
//             }
//             //DISTANZA ALTRE LUNE (DIAMETRO TRASCURABILE)
//             else {
//                //VALORE IN KM x1000
//                //ImageArray[1][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
//                DynamCockpitVar.DomText[1][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true);
//             };
//             //ImageArray[1][i].fillText(DisplayTime(VarPlanetSystem.TimeMoonDist[i]), 20, 150);  //TEMPO DI ARRIVO
//             DynamCockpitVar.DomText[1][i].Time = DisplayTime(VarPlanetSystem.TimeMoonDist[i]);
//             //DynamCockpitVar.References[1][i].Text.material.map.needsUpdate = true;

//             //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
//             E2_ResizeDist(1, i, VarPlanetSystem.IndMoonDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

//             /*-------------------------------DYNAMIC HUD---------------------------------------*/
//             //DYNAMIC HUD - NOME INDICATORE
//             //DynamCockpitVar.References[1][i].DomText.innerText =
//             //   `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Name[Language]}`;

//             /*------------------------------------------VISIBILITÀ (ELIMINARE)--------------------------------------------------------------*/
//             // //LUNA DISTANTE
//             // if (VarPlanetSystem.IndMoonDist[i] > Par.DynamicCockpit.MaxDistHide) DynamCockpitVar.MoonVisible[i] = true;
//             // //LUNA VICINA, NASCONDERE IL TESTO
//             // else DynamCockpitVar.MoonVisible[i] = false;

//             // //VISIBILITÀ INDICATORE DYNAMIC COCKPIT (ELIMINARE)
//             // if (DynamCockpitVar.MoonVisible[i] == true) {
//             //    //SE LA LUNA È LA DESTINAZIONE
//             //    if (VarPlanetSystem.DestMoon > 0 && VarPlanetSystem.DestMoon == i + 1) {
//             //       DynamCockpitVar.References[1][i].Sprite.visible = true;     //SPRITE VISORE
//             //       DynamCockpitVar.References[1][i].Text.visible = false;     //TESTO INDICATORE
//             //    }
//             //    //SE LA LUNA NON È LA DESTINAZIONE
//             //    else {
//             //       DynamCockpitVar.References[1][i].Sprite.visible = true;     //SPRITE VISORE
//             //       //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
//             //       if ((DynamCockpitVar.References[1][i].Obj.rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || DynamCockpitVar.References[1][i].Obj.rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && DynamCockpitVar.References[1][i].Obj.rotation.y < Par.DynamicCockpit.VisDiff && DynamCockpitVar.References[1][i].Obj.rotation.y > -Par.DynamicCockpit.VisDiff) DynamCockpitVar.References[1][i].Text.visible = true;
//             //       else DynamCockpitVar.References[1][i].Text.visible = false;
//             //    };
//             // }
//             // else {
//             //    DynamCockpitVar.References[1][i].Sprite.visible = false;     //SPRITE VISORE
//             //    DynamCockpitVar.References[1][i].Text.visible = false;     //TESTO INDICATORE
//             // };


//          }

//       };

//       //PER TUTTE LE SUB-LUNE ATTUALI
//       for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
//          //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//          //ImageArray[2][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
//          //NOME LUNA
//          // let Text;
//          // if (Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular.length > 0 && VarPlanetSystem.MoonOrbit > 0)
//          //    Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
//          //       .Modular[i].Name[Language];
//          // ImageArray[2][i].fillText(Text, 20, 50);		                                                            //NOME DESTINAZIONE
//          DynamCockpitVar.DomText[2][i].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
//             .Modular[i].Name[Language];    //ARRAY TESTI INDICATORI


//          //DISTANZA DALLA LUNA PIÙ VICINA COMPRESA DI DIAMETRO
//          if (i == VarPlanetSystem.NearSubMoonIndex) {
//             DynamCockpitVar.DomText[2][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000
//                - (VarPlanetSystem.NearSubMoonDiameter * Par.DynamicCockpit.ScalaPos), true);
//             // ImageArray[2][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000
//             //    - (VarPlanetSystem.NearSubMoonDiameter * Par.DynamicCockpit.ScalaPos), true), 20, 100);		   //VALORE IN KM x1000
//          }
//          //DISTANZA ALTRE SUB-LUNE (DIAMETRO TRASCURABILE)
//          else {
//             //VALORE IN KM x1000
//             DynamCockpitVar.DomText[2][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true);
//             //ImageArray[2][i].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
//          };
//          DynamCockpitVar.DomText[2][i].Time = DisplayTime(VarPlanetSystem.TimeSubMoonDist[i]);  //TEMPO DI ARRIVO
//          // ImageArray[2][i].fillText(DisplayTime(VarPlanetSystem.TimeSubMoonDist[i]), 20, 150);  //TEMPO DI ARRIVO
//          // DynamCockpitVar.References[2][i].Text.material.map.needsUpdate = true;

//          //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
//          E2_ResizeDist(2, i, VarPlanetSystem.IndSubMoonDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

//          /*-------------------------------DYNAMIC HUD---------------------------------------*/
//          //DYNAMIC HUD - NOME INDICATORE
//          // if (VarPlanetSystem.MoonOrbit > 0)
//          //    DynamCockpitVar.References[2][0].DomText.innerText =
//          //       `${Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
//          //          .Modular[i].Name[Language]}`;

//          /*--------------------------------------VISIBILITÀ (ELIMINARE)--------------------------------------------------------------*/
//          // //SUB-LUNA DISTANTE
//          // if (VarPlanetSystem.IndSubMoonDist[i] > Par.DynamicCockpit.MaxDistHide) DynamCockpitVar.SubMoonVisible[i] = true;
//          // //LUNA VICINA, NASCONDERE IL TESTO
//          // else DynamCockpitVar.SubMoonVisible[i] = false;

//          // //VISIBILITÀ INDICATORE DYNAMIC COCKPIT (ELIMINARE)
//          // if (DynamCockpitVar.SubMoonVisible[i] == true) {
//          //    //SE LA SUB-LUNA È LA DESTINAZIONE
//          //    if (VarPlanetSystem.DestSubMoon > 0 && VarPlanetSystem.DestSubMoon == i + 1) {
//          //       DynamCockpitVar.References[2][i].Sprite.visible = true;     //SPRITE VISORE
//          //       DynamCockpitVar.References[2][i].Text.visible = false;     //MESH INDICATORE
//          //    }
//          //    //SE LA SUB-LUNA NON È LA DESTINAZIONE
//          //    else {
//          //       DynamCockpitVar.References[2][i].Sprite.visible = true;     //SPRITE VISORE
//          //       //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
//          //       if ((DynamCockpitVar.References[2][i].Obj.rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || DynamCockpitVar.References[2][i].Obj.rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && DynamCockpitVar.References[2][i].Obj.rotation.y < Par.DynamicCockpit.VisDiff && DynamCockpitVar.References[2][i].Obj.rotation.y > -Par.DynamicCockpit.VisDiff) DynamCockpitVar.References[2][i].Text.visible = true;
//          //       else DynamCockpitVar.References[2][i].Text.visible = false;
//          //    };
//          // }
//          // else {
//          //    DynamCockpitVar.References[2][i].Sprite.visible = false;     //SPRITE VISORE
//          //    DynamCockpitVar.References[2][i].Text.visible = false;     //MESH INDICATORE
//          // };
//       };

//       //VISIBILITÀ
//       for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
//          /*-------------------------------------DYNAMIC COCKPIT----------------------------------------------*/
//          //SE NON SI È IN ORBITA ATTORNO A UN PIANETA
//          if (VarPlanetSystem.PlanetOrbit == 0) {
//             //RENDI VISIBILI I PIANETI ENTRO IL RAGGIO IMPOSTATO
//             if (VarPlanetSystem.IndDist[i] < Oggetto.DistPlanets) {
//                DynamCockpitVar.PlanetVisible[i] = true;
//             }
//             //RENDI INVISIBILI I PIANETI FUORI DALL RAGGIO IMPOSTATO
//             else {
//                DynamCockpitVar.PlanetVisible[i] = false;
//             };
//          }
//          //RENDI INVISIBILI I PIANETI TRANNE QUELLO PIÙ VICINO
//          else if (i == VarPlanetSystem.NearPlanetIndex) {
//             DynamCockpitVar.PlanetVisible[i] = true;
//          }
//          else {
//             DynamCockpitVar.PlanetVisible[i] = false;
//          };

//          //VISIBILITÀ INDICATORE DYNAMIC COCKPIT
//          if (DynamCockpitVar.PlanetVisible[i] == true) {
//             /*SPRITE VISORE*/
//             //SE IL PIANETA È LA DESTINAZIONE
//             if (VarPlanetSystem.DestPlanet == i) {
//                DynamCockpitVar.References[0][i].Sprite.visible = false;       //SPRITE VISORE
//                DynamCockpitVar.References[0][i].Text.visible = false;       //TESTO INDICATORE
//             }
//             //SE IL PIANETA NON È LA DESTINAZIONE
//             else {
//                DynamCockpitVar.References[0][i].Sprite.visible = true;        //SPRITE VISORE
//                //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
//                if ((DynamCockpitVar.References[0][i].Obj.rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || DynamCockpitVar.References[0][i].Obj.rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && DynamCockpitVar.References[0][i].Obj.rotation.y < Par.DynamicCockpit.VisDiff && DynamCockpitVar.References[0][i].Obj.rotation.y > -Par.DynamicCockpit.VisDiff) {
//                   DynamCockpitVar.References[0][i].Text.visible = true;
//                }
//                else {
//                   DynamCockpitVar.References[0][i].Text.visible = false;

//                }
//             };
//          }
//          else {
//             DynamCockpitVar.References[0][i].Sprite.visible = false;
//             DynamCockpitVar.References[0][i].Text.visible = false;
//          };
//       };

//       //VISIBILITÀ
//       for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
//          //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//          //LUNA DISTANTE
//          if (VarPlanetSystem.IndMoonDist[i] > Par.DynamicCockpit.MaxDistHide) DynamCockpitVar.MoonVisible[i] = true;
//          //LUNA VICINA, NASCONDERE IL TESTO
//          else DynamCockpitVar.MoonVisible[i] = false;

//          //VISIBILITÀ INDICATORE DYNAMIC COCKPIT
//          if (DynamCockpitVar.MoonVisible[i] == true) {
//             //SE LA LUNA È LA DESTINAZIONE
//             if (VarPlanetSystem.DestMoon > 0 && VarPlanetSystem.DestMoon == i + 1) {
//                DynamCockpitVar.References[1][i].Sprite.visible = true;     //SPRITE VISORE
//                DynamCockpitVar.References[1][i].Text.visible = false;     //TESTO INDICATORE
//             }
//             //SE LA LUNA NON È LA DESTINAZIONE
//             else {
//                DynamCockpitVar.References[1][i].Sprite.visible = true;     //SPRITE VISORE
//                //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
//                if ((DynamCockpitVar.References[1][i].Obj.rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || DynamCockpitVar.References[1][i].Obj.rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && DynamCockpitVar.References[1][i].Obj.rotation.y < Par.DynamicCockpit.VisDiff && DynamCockpitVar.References[1][i].Obj.rotation.y > -Par.DynamicCockpit.VisDiff) DynamCockpitVar.References[1][i].Text.visible = true;
//                else DynamCockpitVar.References[1][i].Text.visible = false;
//             };
//          }
//          else {
//             DynamCockpitVar.References[1][i].Sprite.visible = false;     //SPRITE VISORE
//             DynamCockpitVar.References[1][i].Text.visible = false;     //TESTO INDICATORE
//          };
//       };

//       //VISIBILITÀ
//       for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
//          //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//          //SUB-LUNA DISTANTE
//          if (VarPlanetSystem.IndSubMoonDist[i] > Par.DynamicCockpit.MaxDistHide) DynamCockpitVar.SubMoonVisible[i] = true;
//          //LUNA VICINA, NASCONDERE IL TESTO
//          else DynamCockpitVar.SubMoonVisible[i] = false;

//          //VISIBILITÀ INDICATORE DYNAMIC COCKPIT
//          if (DynamCockpitVar.SubMoonVisible[i] == true) {
//             //SE LA SUB-LUNA È LA DESTINAZIONE
//             if (VarPlanetSystem.DestSubMoon > 0 && VarPlanetSystem.DestSubMoon == i + 1) {
//                DynamCockpitVar.References[2][i].Sprite.visible = true;     //SPRITE VISORE
//                DynamCockpitVar.References[2][i].Text.visible = false;     //MESH INDICATORE
//             }
//             //SE LA SUB-LUNA NON È LA DESTINAZIONE
//             else {
//                DynamCockpitVar.References[2][i].Sprite.visible = true;     //SPRITE VISORE
//                //TESTO INDICATORE SOLO SE IN SUA DIREZIONE
//                if ((DynamCockpitVar.References[2][i].Obj.rotation.x > Math.PI - Par.DynamicCockpit.VisDiff || DynamCockpitVar.References[2][i].Obj.rotation.x < -Math.PI + Par.DynamicCockpit.VisDiff) && DynamCockpitVar.References[2][i].Obj.rotation.y < Par.DynamicCockpit.VisDiff && DynamCockpitVar.References[2][i].Obj.rotation.y > -Par.DynamicCockpit.VisDiff) DynamCockpitVar.References[2][i].Text.visible = true;
//                else DynamCockpitVar.References[2][i].Text.visible = false;
//             };
//          }
//          else {
//             DynamCockpitVar.References[2][i].Sprite.visible = false;     //SPRITE VISORE
//             DynamCockpitVar.References[2][i].Text.visible = false;     //MESH INDICATORE
//          };
//       };

//       //DESTINAZIONE VERSO UN PIANETA
//       if (VarPlanetSystem.DestinationPlanet == true) {
//          //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//          ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
//          //NOME PIANETA
//          DynamCockpitVar.DomText[3][0].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Name[Language];
//          // let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Name[Language];
//          // ImageArray[3][0].fillText(Text, 20, 50);		                                                                     //NOME DESTINAZIONE
//          //VALORE IN KM x1000
//          DynamCockpitVar.DomText[3][0].Dist = E3_DisplayDistance(VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * Par.DynamicCockpit.ScalaPos * 1000, true);
//          // ImageArray[3][0].fillText(E3_DisplayDistance(VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * Par.DynamicCockpit.ScalaPos * 1000, true),
//          //    20, 100);
//          DynamCockpitVar.DomText[3][0].Time = DisplayTime((VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * 1000) / VarPlanetSystem.VelEffettiva);
//          // ImageArray[3][0].fillText(DisplayTime((VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * 1000) / VarPlanetSystem.VelEffettiva),
//          //    20, 150);  //TEMPO DI ARRIVO
//          // DynamCockpitVar.References[3][0].Text.material.map.needsUpdate = true;

//          //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
//          E2_ResizeDist(3, 0, VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet], Par.DynamicCockpit.SpriteDestScale, Par.DynamicCockpit.MeshScale);

//          //-----------------------------DYNAMIC HUD--------------------------------------//
//          DynamCockpitVar.References[3][0].DomText.innerText = Text;
//       };
//       //DESTINAZIONE VERSO UNA LUNA
//       if (VarPlanetSystem.DestinationMoon == true) {
//          //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//          ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
//          //NOME LUNA
//          DynamCockpitVar.DomText[3][0].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1].Name[Language];
//          // let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1].Name[Language];
//          // ImageArray[3][0].fillText(Text, 20, 50);		                                                                           //NOME DESTINAZIONE
//          //VALORE IN KM x1000
//          DynamCockpitVar.DomText[3][0].Dist = E3_DisplayDistance(VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * Par.DynamicCockpit.ScalaPos * 1000, true);
//          // ImageArray[3][0].fillText(E3_DisplayDistance(VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * Par.DynamicCockpit.ScalaPos * 1000, true),
//          //    20, 100);
//          DynamCockpitVar.DomText[3][0].Time = DisplayTime((VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * 1000) / VarPlanetSystem.VelEffettiva)
//          // ImageArray[3][0].fillText(DisplayTime((VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * 1000) / VarPlanetSystem.VelEffettiva),
//          //    20, 150);  //TEMPO DI ARRIVO
//          // DynamCockpitVar.References[3][0].Text.material.map.needsUpdate = true;

//          //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
//          E2_ResizeDist(3, 0, VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1], Par.DynamicCockpit.SpriteDestScale,
//             Par.DynamicCockpit.MeshScale);

//          //-----------------------------DYNAMIC HUD--------------------------------------//
//          DynamCockpitVar.References[3][0].DomText.innerText = Text;
//       };
//       //DESTINAZIONE VERSO UNA SUB-LUNA
//       if (VarPlanetSystem.DestinationSubMoon == true) {
//          //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//          ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
//          //NOME LUNA
//          DynamCockpitVar.DomText[3][0].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1]
//             .Modular[VarPlanetSystem.DestSubMoon - 1].Name[Language];
//          // let Text = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1]
//          //    .Modular[VarPlanetSystem.DestSubMoon - 1].Name[Language];
//          // ImageArray[3][0].fillText(Text, 20, 50);		                                      //NOME DESTINAZIONE
//          //VALORE IN KM x1000
//          DynamCockpitVar.DomText[3][0].Dist = E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1]
//             * Par.DynamicCockpit.ScalaPos * 1000, true)
//          // ImageArray[3][0].fillText(E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1]
//          //    * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);
//          DynamCockpitVar.DomText[3][0].Time = DisplayTime((VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1]
//             * 1000) / VarPlanetSystem.VelEffettiva)
//          // ImageArray[3][0].fillText(DisplayTime((VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1]
//          //    * 1000) / VarPlanetSystem.VelEffettiva), 20, 150);  //TEMPO DI ARRIVO
//          // DynamCockpitVar.References[3][0].Text.material.map.needsUpdate = true;

//          //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
//          E2_ResizeDist(3, 0, VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1], Par.DynamicCockpit.SpriteDestScale,
//             Par.DynamicCockpit.MeshScale);

//          //-----------------------------DYNAMIC HUD--------------------------------------//
//          DynamCockpitVar.References[3][0].DomText.innerText = Text;
//       };
//       //NEMICI
//       // for (let i = 0; i < 1; i++) {
//       //    //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//       //    ImageArray[4][i].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
//       //    //NOME NEMICO
//       //    let Text;
//       //    Text = "Enemy";
//       //    ImageArray[4][i].fillText(Text, 20, 50);		                                                            //NOME DESTINAZIONE

//       //    //DISTANZA DAL NEMICO
//       //    ImageArray[4][i].fillText(E3_DisplayDistance(DynamCockpitVar.IndDistEnemy[i] * Par.DynamicCockpit.ScalaPos * 1000, true), 20, 100);		   //VALORE IN KM x1000
//       //    //ImageArray[4][i].fillText(DisplayTime(VarPlanetSystem.TimeSubMoonDist[i]), 20, 150);  //TEMPO DI ARRIVO
//       //    DynamCockpit.children[4].children[i].children[1].material.map.needsUpdate = true;

//       //    //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
//       //    E2_ResizeDist(4, i, DynamCockpitVar.IndDistEnemy[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

//       //    /*-------------------------------DYNAMIC HUD---------------------------------------*/
//       //    //DYNAMIC HUD - NOME INDICATORE
//       //    DynamHud.children[4].children[i].children[1].innerText = "Enemy";
//       // };
//    }, 100);

//    /*------------VISIBILITÀ INDICATORE HUD E SIMBOLO STAZIONE SPAZIALE, VISIBILITÀ TESTI DESTINAZIONE, OGGETTI DIETRO I PIANETI--------------*/
//    setInterval(() => {
//       //PER TUTTI GLI INDICATORI DELLE LUNE NON UTILIZZATI
//       for (let i = 0; i < VarPlanetSystem.NumMajorMoons; i++) {
//          /*-------------------------------------------DYNAMIC HUD--------------------------------------------*/
//          if (i < VarPlanetSystem.NumMoons && DynamCockpitVar.PositionDomDir[1][i].z < 1) DynamCockpitVar.DomDirVisible[1][i] = true;
//          else DynamCockpitVar.DomDirVisible[1][i] = false;
//          //DynamCockpitVar.References[1][i + VarPlanetSystem.NumMoons].Dom.style.visibility = "hidden";
//          //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//          // DynamCockpitVar.References[1][i + VarPlanetSystem.NumMoons].Sprite.visible = false;     //SPRITE VISORE
//          // DynamCockpitVar.References[1][i + VarPlanetSystem.NumMoons].Text.visible = false;     //MESH INDICATORE
//       };

//       //PER TUTTI GLI INDICATORI DELLE SUB-LUNE NON UTILIZZATI
//       for (let i = 0; i < VarPlanetSystem.NumMajorSubMoons; i++) {
//          /*-------------------------------------------DYNAMIC HUD--------------------------------------------*/
//          if (i < VarPlanetSystem.NumSubMoons && DynamCockpitVar.PositionDomDir[1][i].z < 1) DynamCockpitVar.DomDirVisible[2][i] = true;
//          else DynamCockpitVar.DomDirVisible[2][i] = false;
//          //DynamCockpitVar.References[2][i + VarPlanetSystem.NumSubMoons].Dom.style.visibility = "hidden";
//          //-----------------------------DYNAMIC COCKPIT--------------------------------------//
//          // DynamCockpitVar.References[2][i + VarPlanetSystem.NumSubMoons].Sprite.visible = false;     //SPRITE VISORE
//          // DynamCockpitVar.References[2][i + VarPlanetSystem.NumSubMoons].Text.visible = false;     //MESH INDICATORE
//       };

//       //VISIBLITÀ COCKPIT E HUD DESTINAZIONE
//       if (VarPlanetSystem.DestinationPlanet == false && VarPlanetSystem.DestinationMoon == false && VarPlanetSystem.DestinationSubMoon == false) {
//          // DynamCockpitVar.References[3][0].Sprite.visible = false;
//          // DynamCockpitVar.References[3][0].Text.visible = false;
//          // DynamCockpitVar.References[3][0].DomDiv.style.visibility = "hidden";
//          // DynamCockpitVar.References[3][0].DomText.style.visibility = "hidden";
//          // DynamCockpitVar.References[3][0].DomImg.style.visibility = "hidden";
//          DynamCockpitVar.DomDirVisible[3][0] = false;
//       }
//       else {
//          if (DynamCockpitVar.PositionDomDir[1][i].z < 1) DynamCockpitVar.DomDirVisible[3][0] = true;
//          else DynamCockpitVar.DomDirVisible[3][0] = false;
//          // DynamCockpitVar.References[3][0].Sprite.visible = true;
//          // DynamCockpitVar.References[3][0].Text.visible = true;
//          // DynamCockpitVar.References[3][0].DomDiv.style.visibility = "visible";
//          // DynamCockpitVar.References[3][0].DomText.style.visibility = "visible";
//          // DynamCockpitVar.References[3][0].DomImg.style.visibility = "visible";
//       };

//       /*-------------------------------CALCOLI PER STABILIRE SE UNA LUNA È DIETRO UN PIANETA------------------------------*/
//       //DENTRO L'ORBITA DI UN PIANETA
//       if (VarPlanetSystem.PlanetOrbit > 0) E2_ObjectBehindPlanet({
//          Sun: false,                                                                            //GLI OGGETTI DA CALCOLARE SONO IL SOLE
//          Radius: VarPlanetSystem.NearPlanetDiameter,                                          //DIAMETRO CORPO CELESTE
//          Distance: VarPlanetSystem.IndDist[VarPlanetSystem.NearPlanetIndex],                    //DISTANZA CORPO CELESTE
//          NumObjects: VarPlanetSystem.NumMoons,                                                  //NUMERO DI OGGETTI DA CALCOLARE
//          DistObjects: VarPlanetSystem.IndMoonDist,                                              //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
//          CockpitPlanet: DynamCockpitVar.References[0][VarPlanetSystem.NearPlanetIndex].Obj,      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
//          CockpitObjects: Cockpit.children[1],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
//          Lampeggi: LampeggioLune,                                                               //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
//       });
//       /*-------------------------------CALCOLI PER STABILIRE SE UNA SUB-LUNA È DIETRO UNA LUNA-------------------------------*/
//       //DENTRO L'ORBITA DI UNA LUNA
//       if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0) E2_ObjectBehindPlanet({
//          Sun: false,                                                                      //GLI OGGETTI DA CALCOLARE SONO IL SOLE
//          Radius: VarPlanetSystem.NearMoonDiameter,                                      //DIAMETRO CORPO CELESTE
//          Distance: VarPlanetSystem.IndMoonDist[VarPlanetSystem.NearMoonIndex],            //DISTANZA CORPO CELESTE
//          NumObjects: VarPlanetSystem.NumSubMoons,                                         //NUMERO DI OGGETTI DA CALCOLARE
//          DistObjects: VarPlanetSystem.IndSubMoonDist,                                     //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
//          CockpitPlanet: DynamCockpitVar.References[1][VarPlanetSystem.NearMoonIndex].Obj,      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
//          CockpitObjects: Cockpit.children[2],                                             //GRUPPO 3D DI OGGETTI COCKPIT
//          Lampeggi: LampeggioSubLune,                                                      //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
//       });

//       /*-------------------------------CALCOLI PER STABILIRE SE IL SOLE È DIETRO UN PIANETA-------------------------------*/
//       if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit == 0) E2_ObjectBehindPlanet({
//          Sun: true,                                                                             //GLI OGGETTI DA CALCOLARE SONO IL SOLE
//          Radius: VarPlanetSystem.NearPlanetDiameter,                                          //DIAMETRO CORPO CELESTE
//          Distance: VarPlanetSystem.IndDist[VarPlanetSystem.NearPlanetIndex],                    //DISTANZA CORPO CELESTE
//          NumObjects: 1,                                                                         //NUMERO DI OGGETTI DA CALCOLARE
//          DistObjects: VarPlanetSystem.IndDist,                                                  //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
//          CockpitPlanet: DynamCockpitVar.References[0][1 + VarPlanetSystem.NearPlanetIndex].Obj,      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
//          CockpitObjects: Cockpit.children[0],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
//          Lampeggi: null,                                                                        //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
//       });

//       /*-------------------------------CALCOLI PER STABILIRE SE IL SOLE È DIETRO UNA LUNA-------------------------------*/
//       if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0 && VarPlanetSystem.StationType == 0) E2_ObjectBehindPlanet({
//          Sun: true,                                                                             //GLI OGGETTI DA CALCOLARE SONO IL SOLE
//          Radius: VarPlanetSystem.NearMoonDiameter,                                          //DIAMETRO CORPO CELESTE
//          Distance: VarPlanetSystem.IndMoonDist[VarPlanetSystem.NearMoonIndex],                    //DISTANZA CORPO CELESTE
//          NumObjects: 1,                                                                         //NUMERO DI OGGETTI DA CALCOLARE
//          DistObjects: VarPlanetSystem.IndMoonDist,                                                  //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
//          CockpitPlanet: DynamCockpitVar.References[0][0].Obj,      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
//          CockpitObjects: Cockpit.children[0],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
//          Lampeggi: null,                                                                        //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
//       });
//    }, 1000);

//    UserObjects.add(Cockpit);
//    if (Par.DynamicCockpit.Sunlight == true) UserObjects.add(Sunlight);
// };

function E0_DynamicCockpit(Oggetto) {
   if (Par.Log.Moduli == true) console.log("DynamicCockpit");

   //SUNLIGHT
   if (Par.DynamicCockpit.Sunlight == true) {
      Sunlight = new THREE.Group();   //GRUPPO POSIZIONE APPARENTE DEL SOLE SEMPRE NELLA STESSA POSIZIONE DELLA NAVE SPAZIALE
      Sunlight.name = "Sunlight";
      const SpriteSole = new THREE.Sprite(new THREE.SpriteMaterial({
         map: Loader.load(Par.DynamicCockpit.SunSprite),
         depthWrite: false,
         depthTest: true,
         opacity: 0.8,
      }));
      SpriteSole.name = "SpriteSole";
      SpriteSole.position.set(0, 0, Par.Camera.CameraFar / 100);

      Sunlight.add(SpriteSole);
   };

   //CREAZIONE LIVELLI (OK)
   for (let i = 0; i < Par.DynamicCockpit.Area.length; i++) {
      DynamCockpitVar.PositionDomDir[i] = [];
      DynamCockpitVar.DomVisible[i] = [];
      DynamCockpitVar.DomDirVisible[i] = [];
      DynamCockpitVar.DomText[i] = [];
      DynamCockpitVar.DomEnabled[i] = [];
      //CREAZIONE LIVELLI  COCKPIT
      const CanvasArray = [];                //ARRAY CONTENENTE I CANVAS DEGLI INDICATORI
      const Array = [];
      ImageArray.push(Array);

      //CREAZIONE LIVELLI HUD CORNICE
      const IndArea = document.createElement('div');
      IndArea.style.display = "block";
      IndArea.style.position = "absolute";
      IndArea.style.width = "100%";
      IndArea.style.height = "100%";
      IndArea.style.top = "0%";
      IndArea.style.left = "0%";

      //CREAZIONE LIVELLI HUD DIREZIONE
      const IndAreaDir = document.createElement('div');
      IndAreaDir.style.display = "block";
      IndAreaDir.style.position = "absolute";
      IndAreaDir.style.width = "100%";
      IndAreaDir.style.height = "100%";
      IndAreaDir.style.top = "0%";
      IndAreaDir.style.left = "0%";

      const Group = new THREE.Group();
      Group.name = `GroupCockpit ${i} ${Par.DynamicCockpit.Area[i].Name}`;

      for (let a = 0; a < Par.DynamicCockpit.Area[i].Num; a++) {
         DynamCockpitVar.PositionDomDir[i][a] = { x: 0, y: 0, z: 0, Dir: false };
         DynamCockpitVar.DomText[i][a] = { Name: "", Dist: "", Time: "" };

         // E2_CreateVisorCanvas(Par.DynamicCockpit.Area[i].Color, Par.DynamicCockpit.Area[i].Sprite, Group, i, a,
         //    "GroupVisore", CanvasArray, ImageArray);

         /*--------------------------------------INDICATORI DOM CORNICE-----------------------------------------*/
         //CONTENITORE
         const newContainer = document.createElement("div");
         newContainer.style.display = "block";
         newContainer.style.position = "absolute";
         newContainer.style.width = "40px";
         newContainer.style.height = "40px";

         //TRIANGOLO
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

         //TESTO
         const newP = document.createElement("div");
         newP.style.display = "block";
         newP.style.position = "absolute";
         newP.style.top = "0%";
         newP.style.width = "100%";
         newP.style.height = "50%";
         newP.style.color = Par.DynamicCockpit.Area[i].Color;
         newP.style.textAlign = "center";
         newP.style.fontSize = "small";

         //IMMAGINE
         const newImg = document.createElement("img");
         newImg.style.display = "block";
         newImg.style.position = "absolute";
         newImg.style.height = Par.DynamicCockpit.Area[i].HeightImg;

         newContainer.appendChild(newDiv);
         newContainer.appendChild(newP);
         newContainer.appendChild(newImg);

         IndArea.appendChild(newContainer);

         /*--------------------------------------INDICATORI DOM DIREZIONE-----------------------------------------*/
         //CONTENITORE
         const newDirContainer = document.createElement("div");
         newDirContainer.style.display = "block";
         newDirContainer.style.position = "absolute";
         newDirContainer.style.width = "40px";
         newDirContainer.style.height = "40px";

         //TESTO
         const newDirP = document.createElement("div");
         newDirP.style.display = "block";
         newDirP.style.position = "absolute";
         newDirP.style.top = "-20px";
         newDirP.style.width = "100px";
         newDirP.style.height = "100px";
         newDirP.style.color = Par.DynamicCockpit.Area[i].Color;
         newDirP.style.textAlign = "center";
         newDirP.style.fontSize = "medium";
         newDirP.style.transform = `translate(-50%, -50%)`;

         //IMMAGINE
         const newDirImg = document.createElement("img");
         newDirImg.style.display = "block";
         newDirImg.style.position = "absolute";
         newDirImg.style.height = Par.DynamicCockpit.Area[i].HeightImg;
         newDirImg.src = Par.DynamicCockpit.Area[i].Sprite
         newDirImg.style.transform = `translate(-50%, -50%)`;

         newDirContainer.appendChild(newDirP);
         newDirContainer.appendChild(newDirImg);

         IndAreaDir.appendChild(newDirContainer);
      };

      //Cockpit.add(Group);
      DynamHud.appendChild(IndArea);
      DynamHudDir.appendChild(IndAreaDir);
   };

   //CREAZIONE REFERENCE (OK)
   for (let i = 0; i < Par.DynamicCockpit.Area.length; i++) {
      //INIZIALIZZAZIONE DELL'ARRAY PRINCIPALE PER LE AREE
      DynamCockpitVar.References[i] = [];

      for (let a = 0; a < Par.DynamicCockpit.Area[i].Num; a++) {
         //CREAZIONE REFERENCE
         DynamCockpitVar.References[i][a] = {
            //Obj: Cockpit.children[i].children[a],
            //Sprite: Cockpit.children[i].children[a].children[0],
            //Text: Cockpit.children[i].children[a].children[1],

            //INDICATORI DOM CORNICE
            Dom: DynamHud.children[i].children[a],
            DomDiv: DynamHud.children[i].children[a].children[0],
            DomText: DynamHud.children[i].children[a].children[1],
            DomImg: DynamHud.children[i].children[a].children[2],

            //INDICATORI DOM DIREZIONE
            DomDir: DynamHudDir.children[i].children[a],
            DomDirText: DynamHudDir.children[i].children[a].children[0],
            DomDirImg: DynamHudDir.children[i].children[a].children[1],
         };
      };
   };

   /*-----------------------------------VISIBILITÀ E POSIZIONE INDICATORI DOM CORNICE----------------------------------*/
   setInterval(() => {
      //DYNAMIC PLANETARY SYSTEM
      if (PaceDone == true) {
         //PER TUTTI I PIANETI COMPRESO IL SOLE
         for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
            E2_IndVisual(0, i);
         };
         //PER TUTTE LE LUNE ATTUALI
         for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
            if (VarPlanetSystem.PlanetOrbit > 0) E2_IndVisual(1, i);
         };
         //PER TUTTE LE SUB-LUNE ATTUALI
         for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
            if (VarPlanetSystem.MoonOrbit > 0) E2_IndVisual(2, i);
         };
      };
   }, 50);

   //ARRAY DI LAMPEGGIO LUNE E SUB-LUNE (OK)
   const LampeggioLune = [];
   for (let i = 0; i < Par.DynamicCockpit.Area[1].Num + 1; i++) {
      LampeggioLune.push(0);
   };
   const LampeggioSubLune = [];
   for (let i = 0; i < Par.DynamicCockpit.Area[2].Num + 1; i++) {
      LampeggioSubLune.push(0);
   };

   /*FUNZIONE AGGIORNAMENTO SIMBOLI LUNE E SUBLUNE COCKPIT E HUB, SOLO CON DYNAMIC PLANETARY SYSTEM (OK)*/
   const UpdateSymbols = new OnceFunction(function () {
      E2_UpdateSimbols();
   });
   setTimeout(() => {
      E2_UpdateSimbols();
   }, 4000);

   /*----------------VISIBILITÀ, NOMI DYNAMIC HUD E COCKPIT, DISTANZA E TEMPI ARRIVO, DIMENSIONE SPRITE, SUNLIGHT (OK) ------------------*/
   setInterval(() => {
      /*-------------------------------OnceFunction UPDATE DEI SIMBOLI-----------------------------*/
      DynamCockpitVar.UpdateSymbolsControl = VarPlanetSystem.PlanetOrbit + VarPlanetSystem.MoonOrbit + VarPlanetSystem.SubMoonOrbit;
      UpdateSymbols.Update(DynamCockpitVar.UpdateSymbolsControl);

      /*-----------------------------------INDICATORI DOM DIREZIONE E CORNICE----------------------------------*/
      for (let i = 0; i < DynamCockpitVar.DomVisible.length; i++) {
         for (let a = 0; a < DynamCockpitVar.DomVisible[i].length; a++) {
            //VISIBILITÀ E TESTO INDICATORI DOM DIREZIONE E CORNICE
            if (DynamCockpitVar.DomDirVisible[i][a] == true) {
               //INDICATORI DOM DIREZIONE
               DynamCockpitVar.References[i][a].DomDir.style.visibility = "visible";
               DynamCockpitVar.References[i][a].DomDirText.style.visibility = "visible";
               //TESTO INDICATORI DOM CORNICE
               DynamCockpitVar.References[i][a].DomText.innerText = DynamCockpitVar.DomText[i][a].Name;
               //TESTO INDICATORI DOM DIREZIONE
               if (DynamCockpitVar.PositionDomDir[i][a].Dir == true)
                  DynamCockpitVar.References[i][a].DomDirText.innerText = `${DynamCockpitVar.DomText[i][a].Name}
            ${DynamCockpitVar.DomText[i][a].Dist}
            ${DynamCockpitVar.DomText[i][a].Time}`;
               else DynamCockpitVar.References[i][a].DomDirText.innerText = "";

               //INDICATORI DOM CORNICE
               if (DynamCockpitVar.DomVisible[i][a] == true) {
                  DynamCockpitVar.References[i][a].Dom.style.visibility = "visible";
                  DynamCockpitVar.References[i][a].DomDiv.style.visibility = "visible";
                  DynamCockpitVar.References[i][a].DomText.style.visibility = "visible";
               }
               else {
                  DynamCockpitVar.References[i][a].Dom.style.visibility = "hidden";
                  DynamCockpitVar.References[i][a].DomDiv.style.visibility = "hidden";
                  DynamCockpitVar.References[i][a].DomText.style.visibility = "hidden";
               };
            }
            //VISIBILITÀ INDICATORI DOM DIREZIONE E CORNICE
            else {
               DynamCockpitVar.References[i][a].DomDir.style.visibility = "hidden";
               DynamCockpitVar.References[i][a].DomDirText.style.visibility = "hidden";
               DynamCockpitVar.References[i][a].Dom.style.visibility = "hidden";
               DynamCockpitVar.References[i][a].DomDiv.style.visibility = "hidden";
               DynamCockpitVar.References[i][a].DomText.style.visibility = "hidden";
            };
         };
      };

      /*----------------------------------------SCALA SUNLIGHT--------------------------------------*/
      if (Par.DynamicCockpit.Sunlight == true) Sunlight.children[0].scale.set(E2_AutoSunlight(UserPosWorld, PosZero), E2_AutoSunlight(UserPosWorld, PosZero));

      //PER TUTTI I PIANETI COMPRESO IL SOLE
      for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
         /*-----------------------------DYNAMIC COCKPIT--------------------------------------*/
         //NOME STELLA MADRE
         if (i == 0) DynamCockpitVar.DomText[0][i].Name = Oggetti.PlanetarySystem.Sun.Name[Language];    //ARRAY TESTI INDICATORI
         //NOME PIANETA
         if (i > 0) DynamCockpitVar.DomText[0][i].Name = Oggetti.PlanetarySystem.Modular[i - 1].Name[Language];    //ARRAY TESTI INDICATORI

         //DISTANZA E TEMPO DI ARRIVO DAL PIANETA PIÙ VICINO COMPRESA DI DIAMETRO
         if (i == VarPlanetSystem.NearPlanetIndex) DynamCockpitVar.DomText[0][i].Dist = E3_DisplayDistance((VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000) - (VarPlanetSystem.NearPlanetDiameter * Par.DynamicCockpit.ScalaPos), true);    //ARRAY TESTI INDICATORI
         //DISTANZA ALTRI PIANETI (DIAMETRO TRASCURABILE)
         else DynamCockpitVar.DomText[0][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true);    //ARRAY TESTI INDICATORI
         //TEMPO DI ARRIVO
         DynamCockpitVar.DomText[0][i].Time = DisplayTime(VarPlanetSystem.TimeDist[i]);

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         //E2_ResizeDist(0, i, VarPlanetSystem.IndDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

         /*------------------------------------------------------VISIBILITÀ--------------------------------------------------------------*/
         if (DynamCockpitVar.DomEnabled[0][i] == true) {
            if (DynamCockpitVar.PositionDomDir[0][i].z < 1)
               DynamCockpitVar.DomDirVisible[0][i] = true;
            else DynamCockpitVar.DomDirVisible[0][i] = false;
         };
      };

      //PER TUTTE LE LUNE ATTUALI
      for (let i = 0; i < VarPlanetSystem.NumMoons; i++) {
         // if (VarPlanetSystem.PlanetOrbit > 0) DynamCockpitVar.DomText[1][i].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.NearPlanetIndex - 1].Modular[i].Name[Language];    //ARRAY TESTI INDICATORI
         if (VarPlanetSystem.PlanetOrbit > 0) DynamCockpitVar.DomText[1][i].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit].Modular[i].Name[Language];    //ARRAY TESTI INDICATORI

         //DISTANZA DALLA LUNA PIÙ VICINA COMPRESA DI DIAMETRO
         if (i == VarPlanetSystem.NearMoonIndex) DynamCockpitVar.DomText[1][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000
            - (VarPlanetSystem.NearMoonDiameter * Par.DynamicCockpit.ScalaPos), true);
         //DISTANZA ALTRE LUNE (DIAMETRO TRASCURABILE)
         else DynamCockpitVar.DomText[1][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true);
         DynamCockpitVar.DomText[1][i].Time = DisplayTime(VarPlanetSystem.TimeMoonDist[i]);

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         //E2_ResizeDist(1, i, VarPlanetSystem.IndMoonDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

         /*------------------------------------------------------VISIBILITÀ--------------------------------------------------------------*/
         if (DynamCockpitVar.DomEnabled[1][i] == true) {
            if (DynamCockpitVar.PositionDomDir[1][i].z < 1)
               DynamCockpitVar.DomDirVisible[1][i] = true;
            else DynamCockpitVar.DomDirVisible[1][i] = false;
         };
      };

      //PER TUTTE LE SUB-LUNE ATTUALI
      for (let i = 0; i < VarPlanetSystem.NumSubMoons; i++) {
         DynamCockpitVar.DomText[2][i].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.PlanetOrbit - 1].Modular[VarPlanetSystem.MoonOrbit - 1]
            .Modular[i].Name[Language];    //ARRAY TESTI INDICATORI

         //DISTANZA DALLA LUNA PIÙ VICINA COMPRESA DI DIAMETRO
         if (i == VarPlanetSystem.NearSubMoonIndex) DynamCockpitVar.DomText[2][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true);
         //DISTANZA ALTRE SUB-LUNE (DIAMETRO TRASCURABILE)
         else DynamCockpitVar.DomText[2][i].Dist = E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[i] * Par.DynamicCockpit.ScalaPos * 1000, true);

         DynamCockpitVar.DomText[2][i].Time = DisplayTime(VarPlanetSystem.TimeSubMoonDist[i]);  //TEMPO DI ARRIVO

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         //E2_ResizeDist(2, i, VarPlanetSystem.IndSubMoonDist[i], Par.DynamicCockpit.SpriteScale, Par.DynamicCockpit.MeshScale);

         /*------------------------------------------------------VISIBILITÀ--------------------------------------------------------------*/
         if (DynamCockpitVar.DomEnabled[2][i] == true) {
            if (DynamCockpitVar.PositionDomDir[2][i].z < 1)
               DynamCockpitVar.DomDirVisible[2][i] = true;
            else DynamCockpitVar.DomDirVisible[2][i] = false;
         };
      };

      //DESTINAZIONE VERSO UN PIANETA
      if (VarPlanetSystem.DestinationPlanet == true) {
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
         //NOME PIANETA
         DynamCockpitVar.DomText[3][0].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Name[Language];
         //VALORE IN KM x1000
         DynamCockpitVar.DomText[3][0].Dist = E3_DisplayDistance(VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * Par.DynamicCockpit.ScalaPos * 1000, true);
         DynamCockpitVar.DomText[3][0].Time = DisplayTime((VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet] * 1000) / VarPlanetSystem.VelEffettiva);

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         //E2_ResizeDist(3, 0, VarPlanetSystem.IndDist[VarPlanetSystem.DestPlanet], Par.DynamicCockpit.SpriteDestScale, Par.DynamicCockpit.MeshScale);

         //-----------------------------DYNAMIC HUD--------------------------------------//
         // DynamCockpitVar.References[3][0].DomText.innerText = Text;
      };
      //DESTINAZIONE VERSO UNA LUNA
      if (VarPlanetSystem.DestinationMoon == true) {
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
         //NOME LUNA
         DynamCockpitVar.DomText[3][0].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1].Name[Language];
         //VALORE IN KM x1000
         DynamCockpitVar.DomText[3][0].Dist = E3_DisplayDistance(VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * Par.DynamicCockpit.ScalaPos * 1000, true);
         DynamCockpitVar.DomText[3][0].Time = DisplayTime((VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1] * 1000) / VarPlanetSystem.VelEffettiva);

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         //E2_ResizeDist(3, 0, VarPlanetSystem.IndMoonDist[VarPlanetSystem.DestMoon - 1], Par.DynamicCockpit.SpriteDestScale, Par.DynamicCockpit.MeshScale);

         //-----------------------------DYNAMIC HUD--------------------------------------//
         // DynamCockpitVar.References[3][0].DomText.innerText = Text;
      };
      //DESTINAZIONE VERSO UNA SUB-LUNA
      if (VarPlanetSystem.DestinationSubMoon == true) {
         //-----------------------------DYNAMIC COCKPIT--------------------------------------//
         ImageArray[3][0].clearRect(0, 0, Par.DynamicCockpit.CanvasWidth, Par.DynamicCockpit.CanvasWidth);
         //NOME LUNA
         DynamCockpitVar.DomText[3][0].Name = Oggetti.PlanetarySystem.Modular[VarPlanetSystem.DestPlanet - 1].Modular[VarPlanetSystem.DestMoon - 1]
            .Modular[VarPlanetSystem.DestSubMoon - 1].Name[Language];
         //VALORE IN KM x1000
         DynamCockpitVar.DomText[3][0].Dist = E3_DisplayDistance(VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1]
            * Par.DynamicCockpit.ScalaPos * 1000, true)
         DynamCockpitVar.DomText[3][0].Time = DisplayTime((VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1]
            * 1000) / VarPlanetSystem.VelEffettiva)

         //DIMENSIONE SPRITE IN BASE ALLA DISTANZA
         //E2_ResizeDist(3, 0, VarPlanetSystem.IndSubMoonDist[VarPlanetSystem.DestSubMoon - 1], Par.DynamicCockpit.SpriteDestScale, Par.DynamicCockpit.MeshScale);

         //-----------------------------DYNAMIC HUD--------------------------------------//
         //DynamCockpitVar.References[3][0].DomText.innerText = Text;
      };
   }, 100);

   /*------------VISIBILITÀ INDICATORE HUD E SIMBOLO STAZIONE SPAZIALE, VISIBILITÀ TESTI DESTINAZIONE, OGGETTI DIETRO I PIANETI--------------*/
   setInterval(() => {
      //PER TUTTI I PIANETI COMPRESO IL SOLE
      for (let i = 0; i < VarPlanetSystem.PlanetsNum + 1; i++) {
         //SE NON SI È IN ORBITA ATTORNO A UN PIANETA
         if (VarPlanetSystem.PlanetOrbit == 0) {
            //RENDI VISIBILI I PIANETI ENTRO IL RAGGIO IMPOSTATO
            if (VarPlanetSystem.IndDist[i] < Oggetto.DistPlanets) {
               DynamCockpitVar.DomEnabled[0][i] = true;
            }
            //RENDI INVISIBILI I PIANETI FUORI DALL RAGGIO IMPOSTATO
            else {
               DynamCockpitVar.DomEnabled[0][i] = false;
            }
         }
         //RENDI INVISIBILI I PIANETI TRANNE QUELLO PIÙ VICINO
         else if (i == VarPlanetSystem.PlanetOrbit) {
            DynamCockpitVar.DomEnabled[0][i] = true;
         }
         else {
            DynamCockpitVar.DomEnabled[0][i] = false;
         }
      };

      //PER TUTTI GLI INDICATORI DELLE LUNE NON UTILIZZATI
      for (let i = 0; i < VarPlanetSystem.NumMajorMoons; i++) {
         if (i < VarPlanetSystem.NumMoons) {
            DynamCockpitVar.DomEnabled[1][i] = true;
         }
         else {
            DynamCockpitVar.DomEnabled[1][i] = false;
         };
      };

      //PER TUTTI GLI INDICATORI DELLE SUB-LUNE NON UTILIZZATI
      for (let i = 0; i < VarPlanetSystem.NumMajorSubMoons; i++) {
         if (i < VarPlanetSystem.NumSubMoons) {
            DynamCockpitVar.DomEnabled[2][i] = true;
         }
         else {
            DynamCockpitVar.DomEnabled[2][i] = false;
         };
      };

      //VISIBLITÀ COCKPIT E HUD DESTINAZIONE
      if (VarPlanetSystem.DestinationPlanet == false && VarPlanetSystem.DestinationMoon == false && VarPlanetSystem.DestinationSubMoon == false) {
         DynamCockpitVar.DomDirVisible[3][0] = false;
      }
      else {
         if (DynamCockpitVar.PositionDomDir[1][i].z < 1) DynamCockpitVar.DomDirVisible[3][0] = true;
         else DynamCockpitVar.DomDirVisible[3][0] = false;
      };

      /*-------------------------------CALCOLI PER STABILIRE SE UNA LUNA È DIETRO UN PIANETA------------------------------*/
      //DENTRO L'ORBITA DI UN PIANETA
      // if (VarPlanetSystem.PlanetOrbit > 0) E2_ObjectBehindPlanet({
      //    Sun: false,                                                                            //GLI OGGETTI DA CALCOLARE SONO IL SOLE
      //    Radius: VarPlanetSystem.NearPlanetDiameter,                                          //DIAMETRO CORPO CELESTE
      //    Distance: VarPlanetSystem.IndDist[VarPlanetSystem.NearPlanetIndex],                    //DISTANZA CORPO CELESTE
      //    NumObjects: VarPlanetSystem.NumMoons,                                                  //NUMERO DI OGGETTI DA CALCOLARE
      //    DistObjects: VarPlanetSystem.IndMoonDist,                                              //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
      //    CockpitPlanet: DynamCockpitVar.References[0][VarPlanetSystem.NearPlanetIndex].Obj,      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
      //    CockpitObjects: Cockpit.children[1],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
      //    Lampeggi: LampeggioLune,                                                               //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
      // });
      /*-------------------------------CALCOLI PER STABILIRE SE UNA SUB-LUNA È DIETRO UNA LUNA-------------------------------*/
      //DENTRO L'ORBITA DI UNA LUNA
      // if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0) E2_ObjectBehindPlanet({
      //    Sun: false,                                                                      //GLI OGGETTI DA CALCOLARE SONO IL SOLE
      //    Radius: VarPlanetSystem.NearMoonDiameter,                                      //DIAMETRO CORPO CELESTE
      //    Distance: VarPlanetSystem.IndMoonDist[VarPlanetSystem.NearMoonIndex],            //DISTANZA CORPO CELESTE
      //    NumObjects: VarPlanetSystem.NumSubMoons,                                         //NUMERO DI OGGETTI DA CALCOLARE
      //    DistObjects: VarPlanetSystem.IndSubMoonDist,                                     //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
      //    CockpitPlanet: DynamCockpitVar.References[1][VarPlanetSystem.NearMoonIndex].Obj,      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
      //    CockpitObjects: Cockpit.children[2],                                             //GRUPPO 3D DI OGGETTI COCKPIT
      //    Lampeggi: LampeggioSubLune,                                                      //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
      // });

      /*-------------------------------CALCOLI PER STABILIRE SE IL SOLE È DIETRO UN PIANETA-------------------------------*/
      // if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit == 0) E2_ObjectBehindPlanet({
      //    Sun: true,                                                                             //GLI OGGETTI DA CALCOLARE SONO IL SOLE
      //    Radius: VarPlanetSystem.NearPlanetDiameter,                                          //DIAMETRO CORPO CELESTE
      //    Distance: VarPlanetSystem.IndDist[VarPlanetSystem.NearPlanetIndex],                    //DISTANZA CORPO CELESTE
      //    NumObjects: 1,                                                                         //NUMERO DI OGGETTI DA CALCOLARE
      //    DistObjects: VarPlanetSystem.IndDist,                                                  //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
      //    CockpitPlanet: DynamCockpitVar.References[0][1 + VarPlanetSystem.NearPlanetIndex].Obj,      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
      //    CockpitObjects: Cockpit.children[0],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
      //    Lampeggi: null,                                                                        //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
      // });

      /*-------------------------------CALCOLI PER STABILIRE SE IL SOLE È DIETRO UNA LUNA-------------------------------*/
      // if (VarPlanetSystem.PlanetOrbit > 0 && VarPlanetSystem.MoonOrbit > 0 && VarPlanetSystem.StationType == 0) E2_ObjectBehindPlanet({
      //    Sun: true,                                                                             //GLI OGGETTI DA CALCOLARE SONO IL SOLE
      //    Radius: VarPlanetSystem.NearMoonDiameter,                                          //DIAMETRO CORPO CELESTE
      //    Distance: VarPlanetSystem.IndMoonDist[VarPlanetSystem.NearMoonIndex],                    //DISTANZA CORPO CELESTE
      //    NumObjects: 1,                                                                         //NUMERO DI OGGETTI DA CALCOLARE
      //    DistObjects: VarPlanetSystem.IndMoonDist,                                                  //DISTANZE OGGETTI DA CALCOLARE (ARRAY)
      //    CockpitPlanet: DynamCockpitVar.References[0][0].Obj,      //INDICATORE DEL COCKPIT CORRISPONDENTE AL CORPO CELESTE
      //    CockpitObjects: Cockpit.children[0],                                                   //GRUPPO 3D DI OGGETTI COCKPIT
      //    Lampeggi: null,                                                                        //ARRAY DI VARIABILI PER GESTIRE I LAMPEGGI DI TUTTI GLI OGGETTI
      // });

      // console.log(DynamCockpitVar.DomDirVisible[0]);
      // console.log(DynamCockpitVar.PositionDomDir[0][3].z);
   }, 1000);

   //UserObjects.add(Cockpit);
   if (Par.DynamicCockpit.Sunlight == true) UserObjects.add(Sunlight);
};
//#endregion
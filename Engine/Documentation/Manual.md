# Neptune Engine

## Indice
- [1 Struttura](#struttura)
- [2 Moduli principali E0](#moduli-e0)
  - [Rendering](#rendering)
  - [Gestione Input](#gestione-input)
  - [Audio](#audio)


---
## <a id="struttura"></a>1 Struttura [↩](#indice)

### File e cartelle

Nella cartella del progetto è presente il file <u>index.html</u>, il file che viene effettivamente aperto all'avvio dell'applicazione, contiene tutti i riferimenti ai file da avviare.
La cartella <u>Engine</u> contiene tutti i file per avviare Neptune Engine.
Il file <u>EngineParameters.js</u> contiene tutti gli oggetti e i file di configurazione delle pagine che si vuole caricare.
Il file <u>Game.js</u> contiene tutta la programmazione del gioco escluse le configurazioni.
Infine una cartella a discrezione dove sono contenuti tutti gli asset del gioco.

### Gerarchia dei moduli

- E0_Modulo

Modulo principale abilitato nei parametri dell'Engine in <u>Moduli</u>, esporta variabili e oggetti nell'oggetto di esportazione
- E1_Tool Modulo

Funzione esportata solo come accessorio al modulo nello stesso oggetto
- E2_Accessorio modulo

Funzione accessoria interna al modulo
- E3_Tool Generico

Funzione generica esportata indipendente dai moduli principali
- E4_Tool Interno

Funzione generica interna

- S0_Satellite

Funzione esportata esterna all'Engine, funziona anche senza avviarlo

- G0_Funzione di gioco

Funzione generale comune a tutte le pagine e le istanze dell'Engine
- G1_Funzione Locale

Funzione comune a tutta la pagina e istanza dell'Engine
- G2_Funzione Interna

Funzione all'interno di condizioni non riusabile

---
## <a id="moduli-e0"></a>2 Moduli principali E0 [↩](#indice)
### PhysicsEngine [↩](#moduli-e0)
### CreateObj [↩](#moduli-e0)
### DynamicPlanetarySystem [↩](#moduli-e0)
### DynamicPlanetMap [↩](#moduli-e0)
### DynamicCockpit [↩](#moduli-e0)
### Skybox [↩](#moduli-e0)
### ModularShip [↩](#moduli-e0)
### Hyperloop [↩](#moduli-e0)
### LensFlare [↩](#moduli-e0)
### Audio [↩](#moduli-e0)
### OrbitControl [↩](#moduli-e0)
### VirtualPad [↩](#moduli-e0)
### Keyboard [↩](#moduli-e0)
### Performance [↩](#moduli-e0)
### SimpleMonitor [↩](#moduli-e0)
### Monitor [↩](#moduli-e0)
### Debug [↩](#moduli-e0)
### Editor [↩](#moduli-e0)

### Rendering
Descrizione del sistema di rendering, pipeline grafica, gestione materiali, ottimizzazioni.

```js
function test() {
  console.log("Ciao");
}
```
---
// ==UserScript==
// @name         Shelshog Aimbot
// @author       WAP Industries
// @namespace    http://tampermonkey.net/
// @match        *://shellshock.io/*
// @match        *://algebra.best/*
// @match        *://algebra.vip/*
// @match        *://biologyclass.club/*
// @match        *://deadlyegg.com/*
// @match        *://deathegg.world/*
// @match        *://eggcombat.com/*
// @match        *://egg.dance/*
// @match        *://eggfacts.fun/*
// @match        *://egghead.institute/*
// @match        *://eggisthenewblack.com/*
// @match        *://eggsarecool.com/*
// @match        *://geometry.best/*
// @match        *://geometry.monster/*
// @match        *://geometry.pw/*
// @match        *://geometry.report/*
// @match        *://hardboiled.life/*
// @match        *://hardshell.life/*
// @match        *://humanorganising.org/*
// @match        *://mathdrills.info/*
// @match        *://mathfun.rocks/*
// @match        *://mathgames.world/*
// @match        *://math.international/*
// @match        *://mathlete.fun/*
// @match        *://mathlete.pro/*
// @match        *://overeasy.club/*
// @match        *://scrambled.best/*
// @match        *://scrambled.tech/*
// @match        *://scrambled.today/*
// @match        *://scrambled.us/*
// @match        *://scrambled.world/*
// @match        *://shellshockers.club/*
// @match        *://shellshockers.site/*
// @match        *://shellshockers.us/*
// @match        *://shellshockers.world/*
// @match        *://softboiled.club/*
// @match        *://violentegg.club/*
// @match        *://violentegg.fun/*
// @match        *://yolk.best/*
// @match        *://yolk.life/*
// @match        *://yolk.rocks/*
// @match        *://yolk.tech/*
// @match        *://zygote.cafe/*
// @icon         https://www.google.com/s2/favicons?domain=shellshock.io
// @grant        none
// @run-at       document-start
// ==/UserScript==

window.XMLHttpRequest = class extends window.XMLHttpRequest {
    open(_, url) {
        if (url.indexOf('shellshock.js') > - 1)
            this.isScript = true;
        return super.open(...arguments);
    }

    get response(){
        if (this.isScript){
            const code = super.response

            const variables = {
                babylon: /this\.origin=new ([a-zA-Z]+)\.Vector3/.exec(code)?.[1],
                players: /([^,]+)=\[\],[^,]+=\[\],[^,]+=-1,vueApp.game.respawnTime=0/.exec(code)?.[1],
                myPlayer: /"fire":document.pointerLockElement&&([^&]+)&&/.exec(code)?.[1],
                scene: /createMapCells\(([^,]+),/.exec(code)?.[1],
                cullFunc: /=([a-zA-Z_$]+)\(this\.mesh,\.[0-9]+\)/.exec(code)?.[1],
                game: /([^,]+).playerAccount=/.exec(code)?.[1],
            }

            if (Object.values(variables).some(i=>!i))
                return void alert(`Script failed to inject\n\nVariables missing:\n${Object.keys(variables).filter(i=>!variables[i]).join('\n')}`)

            console.log('%cScript injected', 'color: red; background: black; font-size: 2em;', variables);

            return code.replace(variables.scene + '.render()', `
                    window['${onUpdateFuncName}'](${variables.babylon},${variables.players},${variables.myPlayer});
                    ${variables.scene}.render()`)
                .replace(`function ${variables.cullFunc}`, `
                    function ${variables.cullFunc}() {return true;}
                    function someFunctionWhichWillNeverBeUsedNow`)
                .replace(
                    `for(var i=0;i<this.inventory.length;i++)`,
                    `return !0;`
                )
                .replace(
                    `console.log("startGame()");`,
                    `console.log("startGame()"); window['${disguiseFuncName}'](${variables.game});`,
                )
        }

        return super.response
    }
}

let rightMouseDown = false,
    lineOrigin, lines

const genName = ()=> btoa(Math.random().toString(32)),
    onUpdateFuncName = genName(),
    disguiseFuncName = genName()

window[disguiseFuncName] = function(game){
    const weaponType = game.playerAccount.getPrimaryWeapon().category_name.replace(" Primary Weapons", "")
    
    for (const type of ["hats", "stamps", "grenades", "melee", "primaryWeapons", "secondaryWeapons"]){
        const items = extern.catalog[type].filter(i=>type=="primaryWeapons" ? i.category_name.includes(weaponType):!0);
        extern.tryEquipItem(items[Math.floor(Math.random()*items.length)]);
    }
    vueApp.$refs.equipScreen.$refs.weapon_select.selectClass(CharClass[weaponType])
}

window.addEventListener("DOMContentLoaded", ()=>{
    window.onmousemove = ()=>{
        if (!vueApp?.game.on) 
            PlayerNameInput.methods.onNameChange({target:{value:(Math.random()+1).toString(36).substring(2)}})
    }
})

window[onUpdateFuncName] = function(BABYLON, players, myPlayer){
    if (!myPlayer) return;
    
    if (!lineOrigin){
        lineOrigin = new BABYLON.Vector3();
        linesArray = [];
    }
    
    lineOrigin.copyFrom(myPlayer.actor.mesh.position);
    
    const yaw = myPlayer.actor.mesh.rotation.y;
    
    lineOrigin.x += Math.sin(yaw);
    lineOrigin.z += Math.cos(yaw);
    lineOrigin.y += Math.sin(-myPlayer.pitch);
    
    for (let i=0;i<linesArray.length;i++ )
        linesArray[ i ].playerExists = false;

    for (let i=0; i<players.length; i++) {
        const player = players[ i ];
    
        if (!player || player===myPlayer) continue;
        
        if ( player.sphere === undefined ) {
            console.log( 'Adding sphere...' );
            
            const material = new BABYLON.StandardMaterial('', player.actor.scene );
            material.emissiveColor = material.diffuseColor = new BABYLON.Color3( 1, 0, 0 );
            material.wireframe = true;
            
            const sphere = BABYLON.MeshBuilder.CreateBox('', { width: 0.5, height: 0.75, depth: 0.5 }, player.actor.scene );
            sphere.material = material;
            sphere.position.y = 0.3;
            sphere.parent = player.actor.mesh;
            
            player.sphere = sphere;
        }
        
        if ( player.lines === undefined ) {
            const options = {
                points: [ lineOrigin, player.actor.mesh.position ],
                updatable: true
            };
            
            const lines = options.instance = BABYLON.MeshBuilder.CreateLines( 'lines', options, player.actor.scene );
            lines.color = new BABYLON.Color3( 1, 0, 0 );
            lines.alwaysSelectAsActiveMesh = true;
            lines.renderingGroupId = 1;
            
            player.lines = lines;
            player.lineOptions = options;
            
            linesArray.push( lines );
            
            console.log( '%cAdding line...', 'color: green; background: black; font-size: 2em;' );
        }
        
        player.lines.playerExists = true;
        lines = BABYLON.MeshBuilder.CreateLines( 'lines', player.lineOptions );
        
        player.sphere.renderingGroupId = 1
        player.sphere.visibility = myPlayer !== player && ( myPlayer.team === 0 || myPlayer.team !== player.team );
        
        player.lines.visibility = player.playing && player.sphere.visibility;
    }
    
    for ( let i = 0; i < linesArray.length; i ++ ) {
        if ( ! linesArray[ i ].playerExists ) {
            console.log( '%cRemoving line...', 'color: red; background: black; font-size: 2em;' );
            linesArray[ i ].dispose();
            linesArray.splice( i, 1 );
        }
    }
    
    if (rightMouseDown && myPlayer.playing ) {
        let minDistance = Infinity;
        let targetPlayer;
        
        for ( let i = 0; i < players.length; i ++ ) {
            const player = players[ i ];
            
            if ( player && player !== myPlayer && player.playing && ( myPlayer.team === 0 || player.team !== myPlayer.team ) ) {
                const distance = Math.hypot( player.x - myPlayer.x, player.y - myPlayer.y, player.z - myPlayer.z );
                if ( distance < minDistance ) {
                    minDistance = distance;
                    targetPlayer = player;
                }
            }
        }
        
        if ( targetPlayer ) {
            const x = targetPlayer.actor.mesh.position.x - myPlayer.actor.mesh.position.x;
            const y = targetPlayer.actor.mesh.position.y - myPlayer.actor.mesh.position.y;
            const z = targetPlayer.actor.mesh.position.z - myPlayer.actor.mesh.position.z;
            
            myPlayer.yaw = Math.radAdd( Math.atan2( x, z ), 0 );
            myPlayer.pitch = - Math.atan2( y, Math.hypot( x, z ) ) % 1.5;
        }
    }
}


const handleMouse = (e)=>
    rightMouseDown = e.type === 'pointerdown'

window.addEventListener('pointerdown', handleMouse)
window.addEventListener('pointerup', handleMouse)

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
                game: /([^,]+).playerAccount=/.exec(code)?.[1]
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

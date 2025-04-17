import { sleep } from "./Util.js"
import { constants } from "./constants.js"
import { getSkill, openHarvestMenu } from "./harvestUtil.js"

function getHarvestMessageData(token){
    let data = {
        d20: "icons/svg/d20-grey.svg",
        d20Hover: 'icons/svg/d20-highlight.svg',
        id1: Math.floor(Math.random() * 100000000), // IDEA, I think foundry has a ID function or just dont use
        id2: Math.floor(Math.random() * 100000000),
        id3: Math.floor(Math.random() * 100000000),
        id4: Math.floor(Math.random() * 100000000),
        creatureType: token.actor.system.details.type.value,
        creatureName: token.name,
        creatureCR: token.actor.system.details.cr,
        isGM: game.user.isGM,
    }

    data.skillReq = getSkill(data.creatureType)

    return data
}

async function activateListeners(msg){
    console.log("Activate Listeners ", '[data-message-id="'+msg._id+'"]', msg)
    let html = $('[data-message-id="'+msg._id+'"]')
    html.find(".hgtmh-roll-assessment").click((e) => rollListener(e, msg, "assessment", html));
    html.find(".hgtmh-roll-carving").click((e) => rollListener(e, msg, "carving", html));
    html.find(".hgtmh-finish").click((e) => finishListener(e,msg));
}

async function rollListener(e, msg, job, html){
    if (e.currentTarget.attributes["data-rolled"].value == 'false') {
			
        let actor;
        let flags = msg.flags[constants.MODULEID]
    
        // if the user is the GM, using selected token.  
        if (game.user.role == 4) {
            if(canvas.tokens.controlled.length){
                actor = canvas.tokens.controlled[0].actor;
            }
            else{
                ui.notifications.warn("You must have a token selected to Harvest!");
                return
            }

        } else {
            actor = game.user.character;
        }

        let ability = constants.ABILITIES[job];

        let skill = getSkill(flags.creatureType).substring(0, 3).toLowerCase();

        let total = actor.system.skills[skill].total;
        let mod = actor.system.skills[skill].mod
        let abil = actor.system.abilities[ability].mod;
        let roll = await new Roll("1d20 + @skill + @ability", {
            "skill": total-mod,
            "ability": abil
        }).roll();

        let theResult = roll.total;

        flags.results[job] = theResult
        flags.results.total += theResult

        //Set Total
        html.find(".hgtmh-total").html(flags.results.total);
        
        //Set the Result
        let rollHTML = await html.find(".hgtmh-roll-"+job)
        rollHTML.html(theResult);
        rollHTML.attr("data-rolled", "true");
        rollHTML.attr("class", "hgtmh-rolled-button");
        
        let rollBreakdown = "TODO"//`1d20(${roll.dice[0].total}) + prof(${prof}) + ${ability}(${abil})`;
        rollHTML.attr("title", rollBreakdown);
    
        //set name and image
        html.find(".hgtmh-"+job+"-name").html(actor.name.split(" ")[0])
        html.find(".hgtmh-"+job+"-img").html(`<img title="${actor.name}" class="hgtmh-harvest-player-img" src="${actor.img}" />`)   
        
        if(job == "carving"){
            flags.charID = actor.id
        }


        let update = {
            "flags.hgtmh": flags,
            "content": html.find(".message-content")[0].outerHTML
        }

        if (game.user.isGM) {
            console.log("PreUpdate - GM")
            msg.update(update).then(async ()=>{
                await sleep(10)
                activateListeners(msg)
            });
        }
        else{
            console.log("PreUpdate - Non-GM")
            game.socket.emit(`module.hgtmh`, {
                "action": "updateChatMessage",
                "chatMessage": msg._id,
                "update": update,
                "msg": msg
            })
            await sleep(100)
            activateListeners(msg)
        }
    }
}

async function finishListener(e, msg){
    if(!game.user.isGM){
        ui.notifications.warn(constants.INFO+"Harvent Menu is GM only")
    }
    else{
        openHarvestMenu(msg.flags[constants.MODULEID])
    }
}

async function CreateHarvestMessage(token) {
	if(token == null){
		ui.notifications.warn("You must have a token selected to harvest!");
		return;
	}
    let data =getHarvestMessageData(token)

    if (data.creatureType == undefined) {
		ui.notifications.warn("Token must have a creature type");
        return;
    }

    let html = await renderTemplate(`modules/${constants.MODULEID}/templates/chatMessage.hbs`, data)

    ChatMessage.create({
        flags: {
            hgtmh: {
                creatureName: data.creatureName,
                creatureType: data.creatureType,
                creatureCR: data.creatureCR,
                results:  {assessment: undefined, carving: undefined, total: 0}
            }
        },
        speaker: ChatMessage.getSpeaker({
            alias: 'Harvest Check'
        }),
        content: html,
        "hgtmh": true
    }).then(async (msg)=> { 
        await sleep(10)
        activateListeners(msg)
        game.socket.emit(`module.hgtmh`, {
            "action": "activateListeners",
            "msg": msg
        })
    });
    
    
    
}

Hooks.once("init", async function () {
    // this is not working. Look into
    CONFIG.DND5E.spellSchools["bio"] = "Biomancy"

    // run hooks
    Hooks.on("hgtmh-ActivateListeners", (msg) => {activateListeners(msg)})

});

Hooks.on("ready", async function () {
    game.socket.on(`module.hgtmh`, async (data) => {
        console.log("Update", data)
        switch (data.action) {
        case "updateChatMessage":
            if (game.user.isGM) {
                game.messages.get(data.chatMessage).update(data.update);
            }
            await sleep(100)
            activateListeners(data.msg)
            break;

        case "activateListeners":
            await sleep(100)
            activateListeners(data.msg)
        }
    });

    game.modules.get(constants.MODULEID).API = {
        CreateHarvestMessage: (token)=>{CreateHarvestMessage(token)},
    }

    //reset listeners on messages which have not been used
    let messages = game.messages.filter(x=> x.flags.hgtmh)
    messages.forEach(msg=>{
        activateListeners(msg)
    })
});
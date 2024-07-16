
Hooks.on("init", async function () {
    

});

Hooks.on("ready", async function () {
    game.socket.on(`module.hgtmh`, (data) => {
        switch (data.action) {
        case "updateChatMessage":
            if (game.user.isGM) {

                game.messages.get(data.chatMessage).update({
                    content: data.content
                });
            }
            break;
        }
    });
});

let HARVEST_MESSAGE = `
    <h2>{creatureName}</h2>
	<p>{skillReq}</p>
	<table data-creatureType="{creatureType}" data-creatureName="{creatureName}">
		<tr>
			<th title="Intelligence Check" >Assessment Check</th>
			<th class="hgtmh-roller-name"></th>
			<th class='hgtmh-30-square' ></th>
			<th class='hgtmh-30-square'><div id='{id1}' class='hgtmh-roll-button' src='{d20}' title="" type="image" data-rolled='false' data-ability="int"></div></th>
		</tr>
		<tr >
			<th title="Dexterity Check">Carving Check</th>
			<th class="hgtmh-roller-name"></th>
			<th class='hgtmh-30-square'></th>
			<th class='hgtmh-30-square'><div id='{id2}' class='hgtmh-roll-button' src='{d20}' title="" type="image" data-rolled='false' data-ability="dex"></div></th>
		</tr>
	</table>
	<table>
		<tr>
			<th>Total</th>
			<th><a id="{id3}" class="hgtmh-total">0</th>
		</tr>
	</table>
`;

let d20 = "icons/svg/d20-grey.svg";
let d20Hover = 'icons/svg/d20-black.svg';




function getSkill(type) {
    type = type.split(" ", 1)[0]
        switch (type) {
        case "aberration":
            return "Arcana"
        case "beast":
            return "Survival"
        case "celestial":
            return "Religion"
        case "construction":
            return "Investigation"
        case "dragon":
            return "Survival"
        case "elemental":
            return "Arcana"
        case "gey":
            return "Arcana"
        case "giend":
            return "Religion"
        case "giant":
            return "Medicine"
        case "humanoid":
            return "Medicine"
        case "monstrosity":
            return "Survival"
        case "ooze":
            return "Nature"
        case "plant":
            return "Nature"
        case "undead":
            return "Medicine"
        default:
            console.log("[ERROR] " + type + " Does not exist")
            return "ERR"
        }
}

function CreateHarvestMessage(token) {
    if(token == null){
        ui.notifications.warn("You must have a token selected to harvest!");
        return;
    }
    let creatureType = token.actor.system.details.type.value;
    console.log(creatureType)
    if (creatureType == undefined) {
        return;
    }
    
    let id1 = Math.floor(Math.random() * 100000000);
    let id2 = Math.floor(Math.random() * 100000000);
    let id3 = Math.floor(Math.random() * 100000000);
    let skillReq = getSkill(creatureType);

    let chatData = {
        speaker: ChatMessage.getSpeaker({
            alias: 'Harvest Check'
        }),
        content: HARVEST_MESSAGE.replaceAll("{id1}", id1).replaceAll("{id2}", id2).replaceAll("{id3}", id3).replaceAll("{d20}", d20).replaceAll("{creatureType}", creatureType).replaceAll("{creatureName}", token.name).replaceAll("{skillReq}",skillReq),
        "hgtmh": true
    };
    
    Hooks.once('renderChatMessage', (chatItem, html) => {    
        html.find(".hgtmh-roll-button").click(async e => {
            //console.log(e);
            if (e.currentTarget.attributes["data-rolled"].value == 'false') {
                
                let actor;
                if (game.user.role == 4) {
                    actor = canvas.tokens.controlled[0].actor;
                } else {
                    actor = game.user.character;
                }
                let creatureType = e.currentTarget.parentElement.parentElement.parentElement.parentElement.attributes["data-creaturetype"].value;
                let ability = e.currentTarget.attributes["data-ability"].value;
    
                let skill = getSkill(creatureType).substring(0, 3).toLowerCase();
    
                let total = actor.system.skills[skill].total;
                let mod = actor.system.skills[skill].mod
                let abil = actor.system.abilities[ability].mod;
                let roll = new Roll("1d20 + @skill + @ability", {
                    "skill": total-mod,
                    "ability": abil
                });
    
                await roll.roll();
    
                let theResult = roll.total;
    
                let currentTotal = Number(e.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.children[3].children[0].children[0].children[1].children[0].innerText);
                currentTotal += theResult;
                let chatMessage = game.messages.get(e.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.getAttribute("data-message-id"));
                let content = chatMessage.content;
                var parser = new DOMParser();
                var htmlDoc = parser.parseFromString(content, 'text/html');
                let theElement = htmlDoc.evaluate("//a[@class='hgtmh-total']", htmlDoc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                //Set Total
                theElement.singleNodeValue.innerText = currentTotal;
                theElement = htmlDoc.getElementById(e.currentTarget.id);
                theElement.innerText = theResult;
                theElement.setAttribute("data-rolled", "true");
                theElement.setAttribute("class", "hgtmh-rolled-button");
                
                let rollBreakdown = `1d20(${roll.dice[0].total}) + skill(${total-mod}) + ${ability}(${abil})`;
                theElement.setAttribute("title", rollBreakdown);
                
                // theElement = htmlDoc.evaluate(`(//div[@id='${e.currentTarget.attributes["id"].value}']/../../th)[2]`, htmlDoc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                // console.log(theElement.singleNodeValue);
                // console.log(actor.name);
                // theElement.singleNodeValue.innerText = actor.name.split(" ")[0];
                
                theElement = htmlDoc.evaluate(`(//div[@id='${e.currentTarget.attributes["id"].value}']/../../th)[2]`, htmlDoc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                theElement.innerText = actor.name.split(" ")[0];
                theElement = htmlDoc.evaluate(`(//div[@id='${e.currentTarget.attributes["id"].value}']/../../th)[3]`, htmlDoc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                theElement.innerHTML = `<img title="${actor.name}" class="hgtmh-harvest-player-img" src="${actor.img}" />`;
                
                
                //console.log("htmlDoc.singleNodeValue.innerHTML", htmlDoc.children[0].children[1].innerHTML);
                if (game.user.isGM) {
                    chatMessage.update({
                        content: htmlDoc.children[0].children[1].innerHTML
                    });
                } else {
                    game.socket.emit(`module.hgtmh`, {
                        "action": "updateChatMessage",
                        "chatMessage": chatMessage.id,
                        "content": htmlDoc.children[0].children[1].innerHTML
                    });
                }
            }
    
        });
    })
    

    ChatMessage.create(chatData);
}
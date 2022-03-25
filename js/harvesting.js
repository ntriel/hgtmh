
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
			<th title="Intelligence Check">Assessment Check</th>
			<th><div id='{id1}' class='hgtmh-roll-button' src='{d20}' title="" type="image" width="30" height="30" data-rolled='false' data-ability="int"></div></th>
		</tr>
		<tr>
			<th title="Dexterity Check">Carving Check</th>
			<th><div id='{id2}' class='hgtmh-roll-button' src='{d20}' title="" type="image" width="30" height="30" data-rolled='false' data-ability="dex"></div></th>
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
let d20Hover = 'icons/svg/d20-highlight.svg';

Hooks.on('renderChatMessage', (chatItem, html) => {
    // console.log(chatItem.data.content);
    //console.log("html",html);
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(chatItem.data.content, 'text/html');
    let theElement = htmlDoc.evaluate(`//div[@data-hgtmh="true"]`, htmlDoc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (theElement.singleNodeValue != null) {
        //console.log("theElement.singleNodeValue", theElement.singleNodeValue);
        //console.log("theElement.singleNodeValue.outerHTML", theElement.singleNodeValue.outerHTML);
        let content = theElement.singleNodeValue.outerHTML.replaceAll(`data-hgtmh="true"`, `data-hgtmh="false"`);
        let id1 = Math.floor(Math.random() * 100000000);
        let id2 = Math.floor(Math.random() * 100000000);
        let id3 = Math.floor(Math.random() * 100000000);

        let creatureType = theElement.singleNodeValue.attributes["data-creatureType"].value;
        let creatureName = theElement.singleNodeValue.attributes["data-creatureName"].value;
		let skillReq = getSkill(creatureType);
        content = HARVEST_MESSAGE.replaceAll("{id1}", id1).replaceAll("{id2}", id2).replaceAll("{id3}", id3).replaceAll("{d20}", d20).replaceAll("{creatureType}", creatureType).replaceAll("{creatureName}", creatureName).replaceAll("{skillReq}",skillReq);
        if (game.user.isGM) {
            chatItem.update({
                content: content
            })
        }

    }

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

            let prof = actor.data.data.skills[skill].prof.flat;
            let abil = actor.data.data.abilities[ability].mod;
            let roll = new Roll("1d20 + @prof + @mod", {
                "prof": prof,
                "mod": abil
            });

            await roll.roll();

            let theResult = roll.total;

            let currentTotal = Number(e.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.children[3].children[0].children[0].children[1].children[0].innerText);
            currentTotal += theResult;
            let chatMessage = game.messages.get(e.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.getAttribute("data-message-id"));
            let content = chatMessage.data.content;
            var parser = new DOMParser();
            var htmlDoc = parser.parseFromString(content, 'text/html');
            let theElement = htmlDoc.evaluate("//a[@class='hgtmh-total']", htmlDoc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            //Set Total
            theElement.singleNodeValue.innerText = currentTotal;
            theElement = htmlDoc.getElementById(e.currentTarget.id);
            theElement.innerText = theResult;
            theElement.setAttribute("data-rolled", "true");
            theElement.setAttribute("class", "hgtmh-rolled-button");
			
			let rollBreakdown = `1d20(${roll.dice[0].total}) + prof(${prof}) + ${ability}(${abil})`;
            theElement.setAttribute("title", rollBreakdown);
			
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

});

function getSkill(type) {
    type = type.split(" ", 1)[0]
        switch (type) {
        case "Aberration":
            return "Arcana"
        case "Beast":
            return "Survival"
        case "Celestial":
            return "Religion"
        case "Construction":
            return "Investigation"
        case "Dragon":
            return "Survival"
        case "Elemental":
            return "Arcana"
        case "Fey":
            return "Arcana"
        case "Fiend":
            return "Religion"
        case "Giant":
            return "Medicine"
        case "Humanoid":
            return "Medicine"
        case "Monstrosity":
            return "Survival"
        case "Ooze":
            return "Nature"
        case "Plant":
            return "Nature"
        case "Undead":
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
    let creatureType = token.actor.labels.creatureType;
    if (creatureType == undefined) {
        return;
    }
    let chatData = {
        speaker: ChatMessage.getSpeaker({
            alias: 'Harvest Check'
        }),
        content: `
			<div data-hgtmh="true" data-creatureType=${creatureType} data-creatureName=${token.name}>
			</div>
		`,
        "hgtmh": true
    };
    ChatMessage.create(chatData);
}

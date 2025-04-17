import { sleep, capitalizeFirstLetter } from "./Util.js"

export function getSkill(type) {
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
        case "fey":
            return "Arcana"
        case "fiend":
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
            console.log(constants.ERROR + type + " Does not exist")
            return "ERR"
        }
}


export function openHarvestMenu(flags)
{
    const mouseEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    })

    let val = flags.results.total
    let type = flags.creatureType
    let name = flags.creatureName
    let CR = flags.creatureCR
    let charID = flags.charID

    Array.from(document.getElementsByClassName("control-tool")).filter(x => x.ariaLabel=="Harvest Creature")[0].dispatchEvent(mouseEvent)
    
    sleep(100).then(async() => {
        $("#creature-type").val(capitalizeFirstLetter(type)).trigger("change")
        await sleep(10)
        $("#harvesting-character").val(charID).trigger("change")
        await sleep(10)
        $("#harvest-check").val(val).trigger("change")
        await sleep(10)
        $("#creature-name").val(name).trigger("change")
        await sleep(10)
        $("#creature-cr").val(CR).trigger("change")
    })
}

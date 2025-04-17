export async function RollDie(dice){
    var r = new Roll(dice);
    await r.roll();
    return (r.total);
}

export function RandomChoice(arr) {
const randomIndex = Math.floor(Math.random() * arr.length);
return arr[randomIndex];
}

//makes sure num is between(inclusive) max and min. If no min is given min is 0
export function between(num, max, min=0){
    return Math.min(Math.max(num, min), max);
  }

export function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
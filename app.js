const json = require('./words.json');
const fs = require("fs");
const process = require('process');
const ProgressBar = require("progress");

let words = new Map(Object.entries(json));
function getWordProbabilities(word, allStates) {
    let matched = [];
    let mispositioned = [];
    let absent = [];
    let probabilitiesArray = [];
    const letterArray = word.split('');

    for (const state of allStates) {
        for (const letter in letterArray) {
            if (state[letter] === 'matched') {
                matched.push({
                    letter: letterArray[letter],
                    index: Number(letter),
                });
            } else if (state[letter] === 'mispositioned') {
                mispositioned.push({
                    letter: letterArray[letter],
                    index: Number(letter),
                });
            } else if (state[letter] === 'absent') {
                absent.push(letterArray[letter]);
            }
        }
        probabilitiesArray.push(filter(absent, matched, mispositioned).size / words.size);
        matched = [];
        mispositioned = [];
        absent = [];
    }
    return probabilitiesArray;
}

function calculateEntropy(array) {
    let sum = 0;
    for (const number of array) {
        if (number !== 0) {
            sum += number * Math.log2(1 / number);
        }
    }
    return sum;
}

function generateStates(length, current = []) {
    const possibleStates = ['matched', 'mispositioned', 'absent'];
    const statesCombinations = [];

    if (current.length === length) {
        return [current];
    }

    for (const state of possibleStates) {
        const newCombination = [...current, state];
        statesCombinations.push(...generateStates(length, newCombination));
    }

    return statesCombinations;
}



function filter(absent, matched, mispositioned) {
    return new Map(
        Array.from(words.entries()).filter(
            ([key]) =>
                !absent.some((letter) => key.includes(letter)) &&
                matched.every(({ letter, index }) => key.charAt(index) === letter) &&
                mispositioned.every(({ letter, index }) => key.includes(letter) && key.charAt(index) !== letter),
        ),
    );
}

const allStates = generateStates(5);
let entropyMap = new Map();
let i = 0;

const bar = new ProgressBar(':bar :percent :etas', { total: words.size, width: 30 });

for (const word of words.keys()) {
    entropyMap.set(word, calculateEntropy(getWordProbabilities(word, allStates)));
    i++;
    console.clear();
    bar.tick();
    console.log(`\n ${word} ${i}/${words.size}`);
}


const entropyObject = {};
entropyMap.forEach((value, key) => {
    entropyObject[key] = value;
});

// Convert the object to a JSON string
const jsonString = JSON.stringify(entropyObject, null, 2);

// Write the JSON string to a file
fs.writeFileSync('entropyMap.json', jsonString);
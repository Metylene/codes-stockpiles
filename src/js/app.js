// let regionNameArray = ["TheFingersHex", "GreatMarchHex", "TempestIslandHex", "MarbanHollow", "ViperPitHex", "BasinSionnachHex", "DeadLandsHex", "HeartlandsHex", "EndlessShoreHex", "WestgateHex", "OarbreakerHex", "AcrithiaHex", "MooringCountyHex", "WeatheredExpanseHex", "LochMorHex", "MorgensCrossingHex", "StonecradleHex", "AllodsBightHex", "KalokaiHex", "RedRiverHex", "OriginHex", "HowlCountyHex", "ShackledChasmHex", "SpeakingWoodsHex", "TerminusHex", "LinnMercyHex", "ClansheadValleyHex", "GodcroftsHex", "NevishLineHex", "CallumsCapeHex", "FishermansRowHex", "UmbralWildwoodHex", "ReachingTrailHex", "CallahansPassageHex", "AshFieldsHex", "DrownedValeHex", "FarranacCoastHex"];
// let regionNameArray = [ "StonecradleHex", "AllodsBightHex", "TempestIslandHex", "GreatMarchHex", "MarbanHollow", "ViperPitHex", "ShackledChasmHex", "HeartlandsHex", "DeadLandsHex", "LinnMercyHex", "EndlessShoreHex", "GodcroftsHex", "FishermansRowHex", "WestgateHex", "ReachingTrailHex", "UmbralWildwoodHex", "OarbreakerHex", "CallahansPassageHex", "DrownedValeHex", "FarranacCoastHex", "MooringCountyHex", "WeatheredExpanseHex", "LochMorHex" ];
let storageItemsByRegion = []; // data from api/regionName/dynamic/public + property cityName with closest Major maptextItems
const emojiStockpileArray = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'];
const emojiArray = emojiStockpileArray.concat(['◼️', '🔹', '🆕', '❌']);

const codeListElt = document.querySelector('#codeList');

// helpers
function createElement(tagName, parent = null, attributs = null) {
    let elt = document.createElement(tagName);
    if (parent != null) parent.appendChild(elt);
    if (attributs != null) {
        for (const key in attributs) {
            elt[key] = attributs[key];
        }
    }
    return elt;
}
// Replace tag name but keep element contents
function changeTag(el, newTagName, keepAttributes) {
    let newEl = document.createElement(newTagName);
    while (el.firstChild) {
        newEl.appendChild(el.firstChild);
    }
    if (keepAttributes) {
        for (let i = el.attributes.length - 1; i >= 0; --i) {
            newEl.attributes.setNamedItem(el.attributes[i].cloneNode());
        }
    }
    el.parentNode.replaceChild(newEl, el);
}
function DistSquared(pt1, pt2) {
    return Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2);
}
function transformNameInID(locationName) {
    return locationName.toLowerCase().replaceAll("'", "").replaceAll(" ", "").trim();
}
// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id/6860916#6860916
function randomIdGenerator() {
    let S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4());
}

async function loadStorageItems(regionName) {
    storageItemsByRegion[regionName] = [];
    let staticData = await fetch('https://war-service-live.foxholeservices.com/api/worldconquest/maps/' + regionName + '/static')
        .then(function (response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        })
        .catch(err => {
            // console.error('Failed to fetch data for ' + regionName);
            // console.error(err);
        });
    if (!staticData) return;
    let dynamicData = await fetch('https://war-service-live.foxholeservices.com/api/worldconquest/maps/' + regionName + '/dynamic/public')
        .then(function (response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response.json();
        })
        .catch(err => {
            // console.error('Failed to fetch data for ' + regionName);
            // console.error(err);
        });
    if (!dynamicData) return;
    staticData = staticData.mapTextItems.reduce((previous, item) => item.mapMarkerType == "Major" ? previous.concat(item) : previous, []);
    // We add a property cityName to all storage items 
    storageItemsByRegion[regionName] = dynamicData.mapItems.reduce((previous, item) => {
        // 33 : Storage depot, 52 : Seaport _ from foxhole warapi
        if (['33', '52'].includes(item.iconType + "")) {
            previous.push(item);
            const storagePoint = { x: item.x, y: item.y };
            const closestTextItem = staticData.reduce((a, b) => DistSquared(a, storagePoint) < DistSquared(b, storagePoint) ? a : b);
            item.cityName = closestTextItem.text;
        }
        return previous;
    }, []);
    // Sort North to south
    storageItemsByRegion[regionName] = storageItemsByRegion[regionName].sort((a, b) => (a.y > b.y) ? 1 : ((b.y > a.y) ? -1 : 0))
    return storageItemsByRegion[regionName];
}

function selectHexShape(regionName) {
    if (!regionName || regionName == "-1") { return; }
    const gHexElt = document.getElementById(regionName + '-shape');
    const selectedHexes = document.querySelectorAll('g[selected="true"]');
    if (selectedHexes) {
        selectedHexes.forEach(hexElt => {
            hexElt.setAttribute('selected', "false");
        });
    }
    gHexElt.setAttribute('selected', "true");

    const selectElt = document.getElementById('regionSelect');
    selectElt.value = regionName;
    selectElt.checkValidity();

    updateCitySelect(regionName);
}

async function updateCitySelect(regionName) {
    // update hex shape
    const gHexElt = document.getElementById('citySelection-shape');
    gHexElt.querySelector('#selectRegionShapeText1').style.display = "none";
    gHexElt.querySelector('#selectRegionShapeText2').style.display = "none";
    gHexElt.querySelector('text').innerHTML = regionName;

    if (!storageItemsByRegion[regionName]) {
        await loadStorageItems(regionName);
    }

    const radioGroupElt = document.getElementById('citiesRadioGroup');
    radioGroupElt.innerHTML = "";

    let citySelectionMapElt = document.getElementById('citySelectionMap');
    const svgElt = citySelectionMapElt.children[0].parentElement.removeChild(citySelectionMapElt.children[0]);
    citySelectionMapElt.innerHTML = "";
    citySelectionMapElt.append(svgElt);

    // create cities radio input
    let inputElt;
    for (let i = 0; i < storageItemsByRegion[regionName].length; i++) {
        const storageItem = storageItemsByRegion[regionName][i];

        const divElt = createElement('div', radioGroupElt, { classList: "form-check" });
        const options = {
            type: "radio",
            name: "city",
            id: transformNameInID(storageItem.cityName),
            value: storageItem.cityName,
            required: true,
            classList: "form-check-input"
        }
        let indexByCity = "";
        while (radioGroupElt.querySelector(`#${options.id + indexByCity}`)) {
            indexByCity++;
        }
        options.value = options.value + indexByCity;
        options.id = options.id + indexByCity;
        inputElt = createElement('input', divElt, options);
        inputElt.onclick = function (event) {
            const radioInputs = document.getElementsByName(event.target.name);
            if (radioInputs) {
                for (let i = 0; i < radioInputs.length; i++) {
                    radioInputs[i].checkValidity();
                }
            }
        }
        createElement('label', divElt, { classList: "form-check-label", htmlFor: options.id, innerHTML: options.value, id: options.id + "Label" });

        addStoragePin({ x: storageItem.x, y: storageItem.y }, { cityName: options.value, team: storageItem.teamId.toLowerCase(), type: storageItem.iconType + "" });
    }
    if (inputElt) createElement('div', inputElt.parentNode, { innerHTML: "Please select a city.", classList: "invalid-feedback" })

    gHexElt.style.fill = `url(#imageMap${regionName})`;
    gHexElt.style.filter = "none";
}

function addStoragePin(pos, item) {
    const hexShape = document.getElementById('citySelectionMap');
    const posStyle = "top: " + pos.y * 100 + "%; left: " + pos.x * 100 + "%;";
    const pin = createElement('div', hexShape, { className: 'pin', style: posStyle });
    const iconElt = createElement('div', pin, { className: 'pinIcon' });
    if (item) {
        iconElt.onmouseenter = () => {
            document.getElementById(transformNameInID(item.cityName) + "Label").style.color = "#e77c48";
        }
        iconElt.onmouseleave = () => {
            document.getElementById(transformNameInID(item.cityName) + "Label").style.color = "inherit";
        }
        iconElt.onclick = () => {
            document.getElementById(transformNameInID(item.cityName)).checked = true;
        }
        if (item.cityName) iconElt.setAttribute('title', item.cityName);
        if (item.team && item.team != "none") iconElt.classList.add(item.team);
        if (item.type && item.type == '52') iconElt.classList.add('seaport');
    }
}

function generateDiscordMessage(event) {
    event.preventDefault();
    event.stopPropagation();

    // Validation form
    const formElt = document.querySelector('.needs-validation');
    const formData = new FormData(formElt);
    if (!formElt.checkValidity() || !formData.get('city')) {
        formElt.classList.add('was-validated');
        return false;
    }

    // Generate message
    const separatorChar = "・";
    let message = ":new:";
    message += separatorChar + "**" + formData.get('region').replace("Hex", "").replace(/([A-Z])/g, ' $1').trim() + "**";
    message += separatorChar + "*" + formData.get('city') + "*";
    message += separatorChar + formData.get('name');
    message += separatorChar + formData.get('code');
    message += separatorChar + formData.get('creator');

    const textareaElt = document.getElementById("outputForm");
    textareaElt.value += message + "\r\n";

    document.querySelector('#inputCode').value = "";
    document.querySelector('#inputName').value = "11eRC-FL ";

    // Reset form
    const buttonElt = document.querySelector('#submitButton');
    const initialText = buttonElt.value;
    buttonElt.value = "Stockpile added ! ✔️";
    setTimeout(() => {
        buttonElt.value = initialText;
    }, 2000);
    formElt.classList.remove('was-validated');
}

function copyToClipboard(buttonElt, elementToCopyId) {
    let inputElt = document.getElementById(elementToCopyId);
    if (inputElt == null || inputElt.value.trim() == "") {
        inputElt.classList.add('is-invalid');
        setTimeout(() => {
            inputElt.classList.remove('is-invalid');
        }, 5000);
        console.log("Can't copy !");
        return;
    }
    const inputValue = inputElt.value.trim();
    navigator.clipboard.writeText(inputValue)
        .then(() => {
            if (buttonElt.value !== 'Copied ! ✔️') {
                const originalText = buttonElt.value;
                buttonElt.value = 'Copied ! ✔️';
                setTimeout(() => {
                    buttonElt.value = originalText;
                }, 2000);
            }
        })
        .catch(err => {
            console.log('Something went wrong', err);
        })
}

function copyListToClipboard(buttonElt) {
    const codeListEltClone = document.getElementById('codeList').cloneNode(true);
    if (!codeListEltClone) { return; }
    while (codeListEltClone.querySelector('button')) {
        const elt = codeListEltClone.querySelector('button');
        if (elt.parentNode.getAttribute('role') == "group") {
            elt.parentNode.remove();
        } else {
            elt.remove();
        }
    }
    while (codeListEltClone.querySelector('input[type="button"]')) {
        const elt = codeListEltClone.querySelector('input[type="button"]')
        elt.remove();
    }
    while (codeListEltClone.querySelector('input')) {
        const elt = codeListEltClone.querySelector('input')
        elt.replaceWith(elt.value);
    }
    while (codeListEltClone.querySelector('img')) {
        const elt = codeListEltClone.querySelector('img')
        elt.replaceWith(elt.getAttribute("alt"));
    }

    let codeListString = codeListEltClone.innerText
        .replaceAll("  ", "")
        .replaceAll("\n\n", "\n")
        .replaceAll("\nhttps", " https")
        .replaceAll("\n~~\n", "~~\n")
    // .replaceAll("\n*", "*")
    // .replaceAll("\n・\n", "・")
    // .replaceAll("\n~~", "~~")
    // .replaceAll("\n:", ":")
    // .replaceAll(":**:", ":**\n:")
    // // .replaceAll("\n\n", "\n")
    // .replaceAll("\n~~~~", "~~\n~~")
    // .replaceAll("\n~~:", "~~\n:")
    // .replaceAll("*~~", "*\n~~")
    // .replaceAll("*:r", "*\n:r")
    // .replaceAll("**:s", "**\n:s")

    navigator.clipboard.writeText(codeListString)
        .then(() => {
            if (buttonElt.value !== 'List copied ! ✔️') {
                buttonElt.classList.add('btn-success');
                const originalText = buttonElt.value;
                buttonElt.value = 'List copied ! ✔️';
                setTimeout(() => {
                    buttonElt.classList.remove('btn-success');
                    buttonElt.value = originalText;
                }, 1500);
            }
        })
        .catch(err => {
            console.log('Something went wrong', err);
        });
}

function strikeStockpile(stockpileElt) {
    const stockpileInfosElt = stockpileElt.children[0];
    const imgElt = stockpileInfosElt.querySelector('img');
    let newTagName;
    if (stockpileInfosElt.tagName != 'S') {
        imgElt.setAttribute('alt', ':x:');
        imgElt.src = './assets/x.svg';

        newTagName = 'S';

        const tildeElt = createElement('span', null, { classList: "visually-hidden" });
        tildeElt.innerText = "~~";
        const tildeElt2 = createElement('span', null, { classList: "visually-hidden" });
        tildeElt2.innerText = "~~";
        tildeElt2.innerHTML += '\n';
        stockpileInfosElt.prepend(tildeElt);
        stockpileInfosElt.append(tildeElt2);
    } else {
        imgElt.setAttribute('alt', ':regional_indicator_a:');
        imgElt.src = './assets/capital_abcd.svg';

        newTagName = 'DIV';

        stockpileInfosElt.querySelectorAll('span.visually-hidden').forEach(function (elt) {
            elt.parentNode.removeChild(elt);
        });
    }

    changeTag(stockpileInfosElt, newTagName, true);

    setStockpileImageAlt();
}

function removeStockpile(stockpileElt) {
    stockpileElt.parentNode.removeChild(stockpileElt);

    setStockpileImageAlt();
}

// data : { name : "string", code : "string", creator : "string"}
function addStockpileElt(cityElt, data = null) {
    if (!data) { data = {} }
    const stockpileElt = createElement('div', null, { classList: "stockpile d-flex align-items-center w-100" });
    const stockpileContentElt = createElement('div', stockpileElt, { classList: "stockpileContent" });
    createElement('img', stockpileContentElt, { src: "./assets/capital_abcd.svg", alt: ":regional_indicator_a:", draggable: false, classList: "emoji" });
    createElement('span', stockpileContentElt, { innerText: "・", classList: "separator" });
    createElement('span', stockpileContentElt, { innerText: data.name ?? "", contentEditable: "true", spellcheck: false });
    createElement('span', stockpileContentElt, { innerText: "・", classList: "separator" });
    createElement('span', stockpileContentElt, { innerText: data.code ?? "", contentEditable: "true", spellcheck: false });
    createElement('span', stockpileContentElt, { innerText: "・", classList: "separator" });
    createElement('span', stockpileContentElt, { innerText: data.creator ?? "", contentEditable: "true", spellcheck: false });
    stockpileContentElt.innerHTML += '\n';

    const btnGroupElt = createElement('div', stockpileElt, { classList: "btn-group btn-group-sm ms-auto" });
    btnGroupElt.setAttribute('role', 'group');
    const checkboxId = `checkbox-stockpile-${randomIdGenerator()}`;
    createElement('input', btnGroupElt, { classList: "btn-check", type: "checkbox", id: checkboxId });
    const labelCheckboxElt = createElement('label', btnGroupElt, { classList: "btn btn-outline-success", htmlFor: checkboxId });
    labelCheckboxElt.innerHTML = '\n<i class="fa fa-check"></i>\n';
    const strikeElt = createElement('button', btnGroupElt, { classList: "btn btn-outline-warning", type: "button" });
    strikeElt.setAttribute('onclick', 'strikeStockpile(this.parentNode.parentNode)');
    strikeElt.innerHTML = '\n<i class="fa fa-strikethrough"></i>\n<span class="d-none d-sm-inline"> Strike</span>\n';
    const removeElt = createElement('button', btnGroupElt, { classList: "btn btn-outline-danger", type: "button" });
    removeElt.setAttribute('onclick', 'removeStockpile(this.parentNode.parentNode)');
    removeElt.innerHTML = '\n<i class="fa fa-trash"></i>\n<span class="d-none d-sm-inline"> Remove</span>\n';


    cityElt.insertBefore(stockpileElt, cityElt.children[cityElt.children.length - 1]);

    setStockpileImageAlt();
    stockpileElt.innerHTML += '\n';
    return stockpileElt;
}

// Add keyboard listener on "RETURN" key to prevent adding line break on span[contenteditable]
document.addEventListener("keydown", e => {
    if (e.isComposing || e.key != "Enter") {
        return;
    }
    if (e.target.getAttribute('contenteditable') == null) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.target.blur();
});

function setStockpileImageAlt() {
    const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    let index = 0;
    document.querySelectorAll('.stockpile>div.stockpileContent').forEach(function (elt) {
        elt.querySelector('img').setAttribute('alt', `:regional_indicator_${alphabet[index]}:`);
        index++;
        if (index >= 26) { index = 0 }
    })
}

// ^(:)(\w{1,64})(:) Regex : line start with ':', follow by 1 to 64 alphanumeric char or underscore, followed by ':'
// Basically : Line start with an emoji ?
function isStartingWithEmoji(row) {
    let emoji = row.match(/^(:)(\w{1,64})(:)/gi);
    if (emoji) { return true; }
    const firstChar = split(row, '', 1)[0];
    if (emojiArray.includes(firstChar)) { return true; }

    return false;
}

function parseTextareaContent() {
    const textareaElt = document.querySelector("#textareaChannelContent");
    if (textareaElt == null || textareaElt.value.trim() == "") {
        textareaElt.classList.add('is-invalid');
        setTimeout(() => {
            textareaElt.classList.remove('is-invalid');
        }, 1500);
        return;
    }
    const channelContent = textareaElt.value;


    let currentRegionElt, currentCityElt;
    const rows = channelContent.split('\n');
    rows.forEach(row => {
        // remove '*' and '~' if input is comming directly from 'Add stockpile' form or #codeList
        row = row.replaceAll("*", "");
        row = row.replaceAll("~", "");

        if (!isStartingWithEmoji(row)) {
            if ((row.match(/・/g) || []).length > 0) {
                addRowToProblemsLinesElt(row);
            }
            return;
        }
        let emoji = row.match(/^(:)(\w{1,64})(:)/gi);
        if (emoji) {
            emoji = emoji[0];
        } else {
            emoji = split(row, '', 1)[0];
        }

        if (emoji == ":new:" || emoji == '🆕') {
            const rowParts = row.split("・");
            if (rowParts.length != 6) {
                addRowToProblemsLinesElt(row);
                return;
            }
            const stockpileData = {
                emojiCode: rowParts[0],
                regionName: rowParts[1].trim(),
                cityName: rowParts[2].trim(),
                name: rowParts[3].trim(),
                code: rowParts[4].trim(),
                creator: rowParts[5].trim()
            }
            const regionElt = getRegionEltOrCreateIt(stockpileData.regionName);
            const cityElt = getCityEltOrCreateIt(regionElt, stockpileData.cityName);
            addStockpileElt(cityElt, stockpileData);
        } else if (emoji.endsWith('square:') || emoji == '◼️') {
            const regionName = row.replace(emoji, "").trim();
            if (!regionName || (regionName && regionName.length <= 3)) {
                addRowToProblemsLinesElt(row);
                return;
            }
            currentRegionElt = getRegionEltOrCreateIt(regionName);
        } else if (emoji.endsWith('diamond:') || emoji == '🔹') {
            const cityName = row.replace(emoji, "").trim();
            if (!cityName || (cityName && cityName.length <= 3)) {
                addRowToProblemsLinesElt(row);
                return;
            }
            currentCityElt = getCityEltOrCreateIt(currentRegionElt ?? codeListElt, cityName);
        } else if (emoji.startsWith(':regional') || emojiStockpileArray.includes(emoji)) {
            const rowParts = row.split("・");
            if (rowParts.length != 4) {
                addRowToProblemsLinesElt(row);
                return;
            }
            const stockpileData = {
                emojiCode: rowParts[0],
                name: rowParts[1],
                code: rowParts[2],
                creator: rowParts[3]
            }
            const stockpileElt = addStockpileElt(currentCityElt ?? codeListElt, stockpileData);
        } else if (emoji == ':x:' || emoji == '❌') {
            const rowParts = row.split("・");
            if (rowParts.length != 4) {
                addRowToProblemsLinesElt(row);
                return;
            }
            const regionName = currentRegionElt?.firstChild?.innerText.replaceAll('\n', '').replaceAll('**', '') || "Region";
            const cityName = currentCityElt?.firstChild?.innerText.replaceAll('\n', '').replaceAll('*', '') || "City";
            let deletedStockpile = `${regionName}・${cityName}・${row}`
            addRowToDeletedLinesElt(deletedStockpile);
        } else {
            addRowToProblemsLinesElt(row);
        }
    });

    textareaElt.value = "";
    document.querySelector('#bottomCodeList').classList.remove('d-none');
}

function createLocationNameElt(name, emoji, isRegion = false) {
    const divNameElt = createElement('div', null, { classList: "name d-flex align-items-end" });
    const style = isRegion ? '**' : '*';

    const divNameContentElt = createElement('div', divNameElt, { classList: "nameContent" });
    divNameContentElt.innerHTML = `<span class="visually-hidden">${style}</span>${name}<span class="visually-hidden">${style}</span>\n`;

    const imgElt = createElement('img', null, { classList: 'emoji', draggable: false })
    imgElt.setAttribute('alt', `${emoji}`);
    imgElt.src = `./assets/${emoji.replaceAll(':', "")}.svg`;
    divNameContentElt.prepend(imgElt);

    return divNameElt;
}

function getRegionEltOrCreateIt(regionName) {
    const regionId = 'region-' + transformNameInID(regionName);
    let regionElt = document.getElementById(regionId);
    if (regionElt != null) {
        return regionElt;
    }
    regionElt = createElement('div', codeListElt, { classList: "region mb-3", id: regionId });
    nameElt = createLocationNameElt(regionName, ":black_medium_square:", true);
    regionElt.append(nameElt);
    createElement('br', codeListElt);
    regionElt.innerHTML += '\n';
    return regionElt;
}

function getCityEltOrCreateIt(regionElt, cityName) {
    const cityId = 'city-' + transformNameInID(cityName);
    let cityElt = document.getElementById(cityId);
    if (cityElt != null) {
        return cityElt;
    }
    cityElt = createElement('div', regionElt, { classList: "city", id: cityId });
    cityElt.innerHTML = `<button class="btn btn-outline-success btn-sm mb-1" type="button" onclick="addStockpileElt(this.parentNode)"><i class="fa fa-plus"></i><span> New Stockpile </span></button>`;

    nameElt = createLocationNameElt(cityName, ":small_blue_diamond:", false);

    const btnGroupElt = createElement('div', nameElt, { classList: "btn-group btn-group-sm ms-auto" });
    btnGroupElt.setAttribute('role', 'group');
    const removeElt = createElement('button', btnGroupElt, { classList: "btn btn-outline-danger", type: "button" });
    removeElt.setAttribute('onclick', 'removeCity(this.closest(".city"))');
    removeElt.innerHTML = '\n<i class="fa fa-trash"></i>\n<span class="d-none d-sm-inline"> Remove City</span>\n';

    cityElt.prepend(nameElt);
    cityElt.innerHTML += '\n';
    return cityElt;

}

function removeCity(cityElt){
    const regionElt = cityElt.closest('.region');
    cityElt.parentNode.removeChild(cityElt);
    if(regionElt && regionElt.children.length <= 1){
        regionElt.parentNode.removeChild(regionElt.nextSibling);
        regionElt.parentNode.removeChild(regionElt);
    }

    setStockpileImageAlt();
}

function addRowToProblemsLinesElt(row) {
    const problemsLinesElt = document.getElementById('problems-lines');
    problemsLinesElt.parentNode.classList.remove('d-none');
    createElement('div', problemsLinesElt, { innerText: row })
}

function addRowToDeletedLinesElt(row) {
    const deletedLinesElt = document.getElementById('deleted-lines');
    deletedLinesElt.parentNode.classList.remove('d-none');
    createElement('div', deletedLinesElt, { innerText: row })
}

function fillTextareaWithDebugdata() {
    document.getElementById('textareaChannelContent').value = `[11eRC] Guismo ⊙⊜⊚ — 16/09/2021\n#Liste des codes - https://metylene.github.io/codes-reserves/\n\n:black_small_square: Reaching Trail\n:small_blue_diamond: Brodytown\n:x:11eRC-FL・801050・Zeip\n・11eRC-FL・801050・Zeip\n:x:・・11eRC-FL・801050・Zeip\n:regional_indicator_b:・11eRC-FL 2・353618・Killa\n\n:black_small_square: Godcrofts\n\n:small_blue_diamond: The Axehead\n:regional_indicator_c:・11eRC-FL 1・166753・Ciselin\n\n:black_small_square: Viper Pit\n:small_blue_diamond: Kirknell\n:regional_indicator_d:・11eRC-FL 1・739921・Ciselin\n:x:・11eRC-FL 1・739921・Ciselin\n\n:black_small_square: Callahan's Passage\n:small_blue_diamond: Lochan\n:x:・11eRC-FL 1・250771・Sir Madijeis\n:x:・11eRC-FL 1・250771・Sir Madijeis\n:x:・11eRC-FL 1・250771・Sir Madijeis\n\n### Critical deadline before a new list is needed : 3 days ago - https://metylene.github.io/codes-reserves/\n[11eRC] SterlifngCroco — 17/09/2021\n:new:・Shackled Chasm・*Widow's Web・11eRC-FL ・811803・SterlingCroo\n[11eRC] Guismo ⊙⊜⊚ — 19/09/2021\n═══════════════════════════╣WAR 83 ╠`;
}
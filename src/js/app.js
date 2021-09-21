// let regionNameArray = ["TheFingersHex", "GreatMarchHex", "TempestIslandHex", "MarbanHollow", "ViperPitHex", "BasinSionnachHex", "DeadLandsHex", "HeartlandsHex", "EndlessShoreHex", "WestgateHex", "OarbreakerHex", "AcrithiaHex", "MooringCountyHex", "WeatheredExpanseHex", "LochMorHex", "MorgensCrossingHex", "StonecradleHex", "AllodsBightHex", "KalokaiHex", "RedRiverHex", "OriginHex", "HowlCountyHex", "ShackledChasmHex", "SpeakingWoodsHex", "TerminusHex", "LinnMercyHex", "ClansheadValleyHex", "GodcroftsHex", "NevishLineHex", "CallumsCapeHex", "FishermansRowHex", "UmbralWildwoodHex", "ReachingTrailHex", "CallahansPassageHex", "AshFieldsHex", "DrownedValeHex", "FarranacCoastHex"];
// let regionNameArray = [ "StonecradleHex", "AllodsBightHex", "TempestIslandHex", "GreatMarchHex", "MarbanHollow", "ViperPitHex", "ShackledChasmHex", "HeartlandsHex", "DeadLandsHex", "LinnMercyHex", "EndlessShoreHex", "GodcroftsHex", "FishermansRowHex", "WestgateHex", "ReachingTrailHex", "UmbralWildwoodHex", "OarbreakerHex", "CallahansPassageHex", "DrownedValeHex", "FarranacCoastHex", "MooringCountyHex", "WeatheredExpanseHex", "LochMorHex" ];
let storageItemsByRegion = []; // data from api/regionName/dynamic/public + property cityName with closest Major maptextItems

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

        addStoragePin({ x: storageItem.x, y: storageItem.y }, { cityName: storageItem.cityName, team: storageItem.teamId.toLowerCase(), type: storageItem.iconType + "" });
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
        .replaceAll("\n*", "*")
        .replaceAll("\n・\n", "・")
        .replaceAll("\n~~", "~~")
        .replaceAll("\n:", ":")
        .replaceAll("\n\n", "\n")
        .replaceAll("\n~~~~", "~~\n~~")
        .replaceAll("\n~~:r", "~~\n:r")

    console.log(codeListString);
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
        stockpileInfosElt.append(tildeElt);
        stockpileInfosElt.prepend(tildeElt2);
    } else {
        imgElt.setAttribute('alt', ':regional_indicator_a:');
        imgElt.src = './assets/capital_abcd.svg';

        newTagName = 'DIV';

        stockpileInfosElt.querySelectorAll('span.visually-hidden').forEach(function (elt) {
            elt.parentNode.removeChild(elt);
        });
    }

    changeTag(stockpileInfosElt, newTagName, true);
}

function removeStockpile(stockpileElt) {
    stockpileElt.parentNode.removeChild(stockpileElt);
}

// data : { name : "string", code : "string", creator : "string"}
function addStockpile(cityElt, data) {
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
    stockpileContentElt.innerHTML += '\n\n\n';

    const btnGroupElt = createElement('div', stockpileElt, { classList: "btn-group btn-group-sm ms-auto" });
    btnGroupElt.setAttribute('role', 'group');
    const strikeElt = createElement('button', btnGroupElt, { classList: "btn btn-outline-warning", type: "button" });
    strikeElt.setAttribute('onclick', 'strikeStockpile(this.parentNode.parentNode)');
    strikeElt.innerHTML = '\n<i class="fa fa-strikethrough">\n</i>\n<span class="d-none d-lg-inline"> Strike</span>\n';
    const removeElt = createElement('button', btnGroupElt, { classList: "btn btn-outline-danger", type: "button" });
    removeElt.setAttribute('onclick', 'removeStockpile(this.parentNode.parentNode)');
    removeElt.innerHTML = '\n<i class="fa fa-trash">\n</i>\n<span class="d-none d-lg-inline"> Remove</span>\n';


    cityElt.insertBefore(stockpileElt, cityElt.children[cityElt.children.length - 1]);
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
}
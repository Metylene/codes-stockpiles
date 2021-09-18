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
    // Validation form
    event.preventDefault();
    event.stopPropagation();
    const formElt = document.querySelector('.needs-validation');
    if (!formElt.checkValidity()) {
        formElt.classList.add('was-validated');
        return false;
    }

    // Generate message
    const formData = new FormData(formElt);
    console.log('city : ', formData.get('city'));

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

function copyToClipboard(buttonElement, elementToCopyId) {
    let inputElt = document.getElementById(elementToCopyId);
    if (inputElt == null || inputElt.value.trim() == "") {
        inputElt.classList.add('is-invalid');
        setTimeout(() => {
            inputElt.classList.remove('is-invalid');
        }, 2000);
        console.log("Can't copy !");
        return;
    }
    const inputValue = inputElt.value.trim();
    navigator.clipboard.writeText(inputValue)
        .then(() => {
            if (buttonElement.value !== 'Copied ! ✔️') {
                const originalText = buttonElement.value;
                buttonElement.value = 'Copied ! ✔️';
                setTimeout(() => {
                    buttonElement.value = originalText;
                }, 2000);
            }
        })
        .catch(err => {
            console.log('Something went wrong', err);
        })
}
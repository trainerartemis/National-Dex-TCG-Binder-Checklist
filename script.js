const TOTAL_POKEMON = 1025;
const binderMaxCards = { 9: 360, 12: 480, 16: 512 };
const generationMap = {
    1: { start: 1, end: 151 }, 2: { start: 152, end: 251 }, 3: { start: 252, end: 386 },
    4: { start: 387, end: 493 }, 5: { start: 494, end: 649 }, 6: { start: 650, end: 721 },
    7: { start: 722, end: 809 }, 8: { start: 810, end: 905 }, 9: { start: 906, end: 1025 }
};

const grid = document.getElementById("dexGrid");
const missingGrid = document.getElementById("missingGrid");
const binderSelect = document.getElementById("binderSize");
const binderDropdown = document.getElementById("binderNumber");
const pageNumberDisplay = document.getElementById("pageNumber");
const binderPageStatus = document.getElementById("binderPageStatus");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const clearPageBtn = document.getElementById("clearPage");
const addPageBtn = document.getElementById("addPage");
const searchInput = document.getElementById("searchPokemon");
const searchBtn = document.getElementById("searchBtn");
const autocompleteList = document.getElementById("autocomplete-list");
const showMissingButton = document.getElementById("toggleMissingBtn");
const genTabs = document.querySelectorAll(".gen-tab");

let pageSize = parseInt(binderSelect.value);
let pagesPerBinder = 1;
let totalBinders = 1;
let currentBinder = 1;
let currentPage = 1;
let showMissingOnly = false;
let pokemonNameMap = {};

// Fetch Pokémon names
async function fetchPokemonNames() {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${TOTAL_POKEMON}`);
    const data = await response.json();
    data.results.forEach((poke, index) => {
        pokemonNameMap[poke.name.toLowerCase()] = index + 1;
    });
}

function padNumber(num) { return num.toString().padStart(4, "0"); }

function updateCompletion() {
    let totalCollected = 0;
    genTabs.forEach(tab => {
        const gen = tab.dataset.gen;
        if (!gen) return;
        const range = generationMap[gen];
        let collected = 0;
        for (let i = range.start; i <= range.end && i <= TOTAL_POKEMON; i++) {
            if (localStorage.getItem(padNumber(i)) === "true") collected++;
        }

        // Update tab text and color based on progress
        tab.textContent = `Gen ${gen}: ${collected} / ${range.end - range.start + 1}`;
        
        // Change color to green if generation is fully collected
        if (collected === range.end - range.start + 1) {
            tab.style.backgroundColor = "#4CAF50"; // Green color for completed gen
            tab.style.color = "#000000"; // Ensure text is readable
        } else {
            tab.style.backgroundColor = ""; // Reset background color if not complete
            tab.style.color = ""; // Reset text color
        }

        totalCollected += collected;
    });

    const totalTab = document.getElementById("totalProgress");
    totalTab.textContent = `Total: ${totalCollected} / ${TOTAL_POKEMON}`;

    // If total is fully collected, color the total tab in green
    if (totalCollected === TOTAL_POKEMON) {
        totalTab.style.backgroundColor = "#4CAF50";
        totalTab.style.color = "#000000";
    } else {
        totalTab.style.backgroundColor = "";
        totalTab.style.color = "";
    }
}

function updateGridColumns() {
    const cols = pageSize === 9 ? 3 : pageSize === 12 ? 3 : 4;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    missingGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

function createCard(i) {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");

    const img = document.createElement("img");
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`;
    img.loading = "lazy";

    const name = Object.keys(pokemonNameMap).find(n => pokemonNameMap[n] === i);
    const displayName = name ? name.charAt(0).toUpperCase() + name.slice(1) : `#${padNumber(i)}`;

    const nameDiv = document.createElement("div");
    nameDiv.classList.add("pokemon-name");
    nameDiv.textContent = displayName;

    const label = document.createElement("div");
    label.classList.add("pokemon-number");
    label.textContent = `#${padNumber(i)}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = localStorage.getItem(padNumber(i)) === "true";
    if (checkbox.checked) card.classList.add("collected");

    // Add the dynamic link to each card
    const linkDiv = document.createElement("div");
    linkDiv.classList.add("pokemon-card-link");

    const link = document.createElement("a");
    link.href = `https://app.getcollectr.com/?query=${name}&cardType=cards`; // Updated URL with cardType=cards
    link.target = "_blank";

    // Use innerHTML to add a <br> tag for line break
    link.innerHTML = `Check out<br>${displayName} Cards`; // Dynamic text with a line break

    linkDiv.appendChild(link);

    // Prevent the collection toggle when clicking the link
    link.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent the card click from happening
    });

    // Toggle collected on card click, but not when clicking the link
    card.addEventListener("click", () => {
        // This will only toggle the checkbox and update collection status, not when the link is clicked
        checkbox.checked = !checkbox.checked;
        localStorage.setItem(padNumber(i), checkbox.checked);
        card.classList.toggle("collected");
        updateCompletion();
        if (!showMissingOnly) renderCurrentPage();
        else renderMissingCards();
    });

    // Append all elements to the card
    card.append(img, nameDiv, label, checkbox, linkDiv); // Add the linkDiv here
    return card;
}

function setupBinders() {
    const maxCardsPerBinder = binderMaxCards[pageSize];
    pagesPerBinder = maxCardsPerBinder / pageSize;
    totalBinders = Math.ceil(TOTAL_POKEMON / maxCardsPerBinder);

    binderDropdown.innerHTML = "";
    for (let i = 1; i <= totalBinders; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        binderDropdown.appendChild(opt);
    }
    binderDropdown.value = currentBinder;
}

function getStartIndex() {
    return ((currentBinder - 1) * pagesPerBinder + (currentPage - 1)) * pageSize + 1;
}

function renderCurrentPage() {
    showMissingOnly = false;
    grid.style.display = "grid";
    missingGrid.style.display = "none";
    grid.innerHTML = "";
    updateGridColumns();

    const startIndex = getStartIndex();
    for (let i = startIndex; i < startIndex + pageSize && i <= TOTAL_POKEMON; i++) {
        grid.appendChild(createCard(i));
    }

    pageNumberDisplay.textContent = `Page ${currentPage}`;
    binderPageStatus.textContent = `Binder ${currentBinder} — Page ${currentPage} of ${pagesPerBinder}`;

    const firstNum = startIndex;
    genTabs.forEach(t => t.classList.remove("active"));
    for (const [gen, range] of Object.entries(generationMap)) {
        if (firstNum >= range.start && firstNum <= range.end) {
            document.querySelector(`.gen-tab[data-gen="${gen}"]`).classList.add("active");
            break;
        }
    }
}

function renderMissingCards() {
    showMissingOnly = true;
    grid.style.display = "none";
    missingGrid.style.display = "grid";
    missingGrid.innerHTML = "";
    updateGridColumns();

    for (let i = 1; i <= TOTAL_POKEMON; i++) {
        if (localStorage.getItem(padNumber(i)) !== "true") {
            missingGrid.appendChild(createCard(i));
        }
    }
}

// Navigation buttons
prevBtn.addEventListener("click", () => {
    if (currentPage > 1) currentPage--;
    else if (currentBinder > 1) {
        currentBinder--;
        currentPage = pagesPerBinder;
    }
    binderDropdown.value = currentBinder;
    renderCurrentPage();
});

nextBtn.addEventListener("click", () => {
    const startIndex = getStartIndex();
    if (startIndex + pageSize <= TOTAL_POKEMON) {
        if (currentPage < pagesPerBinder) currentPage++;
        else if (currentBinder < totalBinders) {
            currentBinder++;
            currentPage = 1;
        }
    }
    binderDropdown.value = currentBinder;
    renderCurrentPage();
});

clearPageBtn.addEventListener("click", () => {
    const startIndex = getStartIndex();
    for (let i = startIndex; i < startIndex + pageSize && i <= TOTAL_POKEMON; i++) {
        localStorage.setItem(padNumber(i), false);
    }
    if (!showMissingOnly) renderCurrentPage();
    else renderMissingCards();
    updateCompletion();
});

addPageBtn.addEventListener("click", () => {
    const startIndex = getStartIndex();
    for (let i = startIndex; i < startIndex + pageSize && i <= TOTAL_POKEMON; i++) {
        localStorage.setItem(padNumber(i), true);
    }
    if (!showMissingOnly) renderCurrentPage();
    else renderMissingCards();
    updateCompletion();
});

// Toggle missing view
showMissingButton.addEventListener("click", () => {
    if (showMissingOnly) renderCurrentPage();
    else renderMissingCards();
    showMissingButton.textContent = showMissingOnly ? "Show Binder" : "Show Missing";
});

// Binder / layout changes
binderDropdown.addEventListener("change", e => {
    currentBinder = parseInt(e.target.value);
    currentPage = 1;
    renderCurrentPage();
});

binderSelect.addEventListener("change", e => {
    pageSize = parseInt(e.target.value);
    currentBinder = 1;
    currentPage = 1;
    setupBinders();
    updateGridColumns();
    renderCurrentPage();
});

// Gen tab click
genTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        genTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const startNum = generationMap[tab.dataset.gen].start;
        const globalPage = Math.ceil(startNum / pageSize);
        currentBinder = Math.ceil(globalPage / pagesPerBinder);
        currentPage = globalPage - ((currentBinder - 1) * pagesPerBinder);
        binderDropdown.value = currentBinder;
        renderCurrentPage();
    });
});

// Autocomplete
searchInput.addEventListener("input", () => {
    const val = searchInput.value.toLowerCase();
    autocompleteList.innerHTML = "";
    if (!val) return;
    let matches = Object.keys(pokemonNameMap).filter(n => n.startsWith(val)).slice(0, 10);
    matches.forEach(match => {
        const item = document.createElement("div");
        item.classList.add("autocomplete-item");
        item.textContent = match.charAt(0).toUpperCase() + match.slice(1);
        item.addEventListener("click", () => {
            searchInput.value = match;
            autocompleteList.innerHTML = "";
            searchPokemon(match);
        });
        autocompleteList.appendChild(item);
    });
});

searchBtn.addEventListener("click", () => {
    const val = searchInput.value.toLowerCase();
    if (val) searchPokemon(val);
});

// Updated searchPokemon function
function searchPokemon(val) {
    val = val.trim().toLowerCase();

    let id;

    // If user typed a number
    if (!isNaN(val)) {
        id = parseInt(val);
    } 
    // If user typed a name
    else {
        id = pokemonNameMap[val];
    }

    if (!id || id < 1 || id > TOTAL_POKEMON) {
        return alert("Pokémon not found!");
    }

    // Find the Pokémon's generation
    let genNumber;
    for (const [gen, range] of Object.entries(generationMap)) {
        if (id >= range.start && id <= range.end) {
            genNumber = gen;
            break;
        }
    }

    // Update the gen tab (highlight the active generation tab)
    genTabs.forEach(tab => tab.classList.remove("active"));
    const genTab = document.querySelector(`.gen-tab[data-gen="${genNumber}"]`);
    if (genTab) {
        genTab.classList.add("active");
    }

    // Update the binder and page status
    const globalPage = Math.ceil(id / pageSize); // Calculate global page number for the Pokémon
    currentBinder = Math.ceil(globalPage / pagesPerBinder);
    currentPage = globalPage - ((currentBinder - 1) * pagesPerBinder);
    binderDropdown.value = currentBinder;
    binderPageStatus.textContent = `Binder ${currentBinder} — Page ${currentPage} of ${pagesPerBinder}`;
    
    // Force binder view (not missing cards)
    showMissingOnly = false;
    grid.style.display = "grid";
    missingGrid.style.display = "none";

    // Clear and show the found Pokémon
    grid.innerHTML = "";
    const foundCard = createCard(id);  // This creates the card

    // Debugging - Check if the foundCard is valid
    console.log("Created card:", foundCard);
    
    // Add the found card to the grid
    grid.appendChild(foundCard);

    // Optionally, call renderCurrentPage to ensure correct display of other cards in the grid
    renderCurrentPage();
}

document.getElementById('clearAllBtn').addEventListener('click', clearAll);
document.getElementById('clearAllBtn').addEventListener('touchend', clearAll);  // Added for mobile

function clearAll() {
    // Show a confirmation prompt before clearing all data
    if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
        // Clear all localStorage data
        localStorage.clear();
        
        // Reset all gen tabs to '0 / 0' for progress
        genTabs.forEach(tab => {
            tab.textContent = `Gen ${tab.dataset.gen}: 0 / 0`;  // Reset text for each gen tab
            tab.classList.remove('completed');  // Remove any 'completed' class
        });
        
        // Reset the total progress tab to '0 / 1025'
        const totalTab = document.getElementById("totalProgress");
        totalTab.textContent = `Total: 0 / 1025`;  // Or update as needed
        
        // Call the function to update progress and visuals
        updateCompletion();  // Recalculate and update the completion progress
        
        // Optionally, re-render the page content (e.g., Pokémon cards)
        renderCurrentPage();  // Re-render the current page's content
        
        // Optionally, notify the user that the data was cleared
        alert('All progress has been cleared.');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchPokemonNames().then(() => {
        setupBinders();
        renderCurrentPage();
        updateCompletion();
    });
});


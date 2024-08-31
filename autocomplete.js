document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('search-box');
    const clearBtn = document.getElementById('clear-btn');
    const micBtn = document.getElementById('mic-btn');
    const suggestionsList = document.getElementById('suggestions-list');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    micBtn.addEventListener('click', () => {
        recognition.start();
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase().replace(/[^a-z\s]/g, '');
        searchBox.value = transcript;

        const inputEvent = new Event('input', {
            bubbles: true, 
            cancelable: true 
        });
        searchBox.dispatchEvent(inputEvent);
    };

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark-theme' : 'light-theme');
    });

    const trie = new Trie();
    let focusedIndex = -1;

    // Function to fetch data from JSON file and populate Trie
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log("Data fetched from data.json:", data); // Check if data is loaded

            data.forEach(word => {
                trie.insert(word);
                console.log(`Inserted word: ${word}`); // Confirm each word is inserted
            });

            console.log("Trie structure after loading data:", trie); // Check Trie structure

        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

    // Load data on page load
    loadData();

    function toggleSpinner(show) {
        const spinner = document.getElementById('loading-spinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    function showSuggestions(suggestions) {
        suggestionsList.innerHTML = '';
        focusedIndex = -1;

        if (suggestions.length > 0) {
            suggestions.forEach((suggestion) => {
                const div = document.createElement('div');
                div.classList.add('suggestion-item');
                div.textContent = suggestion;
                div.setAttribute('role', 'option');
                div.tabIndex = 0;
                div.addEventListener('click', () => {
                    searchBox.value = suggestion;
                    suggestionsList.innerHTML = '';
                    clearBtn.classList.add('hidden');
                });
                suggestionsList.appendChild(div);
            });
        } else {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.classList.add('no-results');
            noResultsDiv.textContent = 'No results found';
            suggestionsList.appendChild(noResultsDiv);
        }
    }

    function handleKeyboardNavigation(event) {
        const items = suggestionsList.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                focusedIndex = (focusedIndex + 1) % items.length;
                items[focusedIndex].focus();
                event.preventDefault();
                break;
            case 'ArrowUp':
                focusedIndex = (focusedIndex - 1 + items.length) % items.length;
                items[focusedIndex].focus();
                event.preventDefault();
                break;
            case 'Enter':
                if (focusedIndex >= 0 && focusedIndex < items.length) {
                    items[focusedIndex].click();
                    event.preventDefault();
                }
                break;
        }
    }

    searchBox.addEventListener('input', () => {
        const query = searchBox.value.trim().toLowerCase();
        clearBtn.classList.toggle('hidden', query === '');
        
        if (query.length > 0) {
            toggleSpinner(true);
            setTimeout(() => {
                const suggestions = trie.autocomplete(query);
                console.log("Query:", query);
                console.log("Suggestions found:", suggestions);
                
                if (suggestions.length > 0) {
                    showSuggestions(suggestions);
                } else {
                    suggestionsList.innerHTML = '<div class="no-results">No results found</div>';
                }
                toggleSpinner(false);
            }, 500);
        } else {
            suggestionsList.innerHTML = '';
        }
    });

    searchBox.addEventListener('keydown', handleKeyboardNavigation);

    clearBtn.addEventListener('click', () => {
        searchBox.value = '';
        suggestionsList.innerHTML = '';
        clearBtn.classList.add('hidden');
    });
});

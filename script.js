document.addEventListener('DOMContentLoaded', () => {
	let currentCategoryIndex = -1;
	let currentLinkIndex = -1;
	const categories = document.querySelectorAll('.category');
	const commandElement = document.getElementById('command');
	const commandInput = document.getElementById('commandInput');
	const statsDisplay = document.getElementById('stats-display');
	let commandText = '';
	let inputMode = false;
	let isMobile = window.innerWidth <= 768;
	const mobileGreeting = window.innerWidth <= 600 ? true : false;
	let statsInterval;

	function updateHighlight() {
		document.querySelectorAll('.links a').forEach(link => link.classList.remove('highlight'));
		if (currentCategoryIndex >= 0 && currentLinkIndex >= 0) {
			const currentLinks = categories[currentCategoryIndex].querySelectorAll('.links a');
			currentLinkIndex = Math.min(currentLinkIndex, currentLinks.length - 1);
			currentLinks[currentLinkIndex].classList.add('highlight');
		}
	}

	// Update mobile greeting based on time of day
	function updateMobileGreeting() {
		if (mobileGreeting) {
			const hour = new Date().getHours();
			let greeting = "~/terminal";

			if (hour < 12) greeting = "~/morning";
			else if (hour < 18) greeting = "~/afternoon";
			else greeting = "~/evening";

			document.querySelector('.right-container').style.setProperty('--greeting', `"${greeting}"`);
		}
	}

	function updateSystemStats() {
		if (!statsDisplay) return;

		const now = new Date();
		const timeStr = now.toLocaleTimeString();
		const dateStr = now.toLocaleDateString();

		// You can replace this with an actual API call for weather
		const weatherData = "Weather: 22°C - Clear";

		statsDisplay.textContent = `┌─ System Info ────────────────────┐
│ ${dateStr} | ${timeStr}         │
│ ${weatherData}              │
└──────────────────────────────────┘`;
	}

	function addToCommandHistory(command, result = null) {
		const historyElement = document.getElementById('commandHistory');
		if (!historyElement) return;

		const historyItem = document.createElement('div');
		historyItem.className = 'history-item';

		const commandSpan = document.createElement('div');
		commandSpan.className = 'history-command';
		commandSpan.textContent = `> ${command}`;
		historyItem.appendChild(commandSpan);

		if (result) {
			const resultSpan = document.createElement('div');
			resultSpan.className = 'history-result';
			resultSpan.textContent = result;
			historyItem.appendChild(resultSpan);
		}

		historyElement.appendChild(historyItem);
		historyElement.scrollTop = historyElement.scrollHeight;

		// Keep history limited to last 5 commands
		while (historyElement.children.length > 5) {
			historyElement.removeChild(historyElement.firstChild);
		}
	}

	function levenshtein(a, b) {
		const matrix = [];

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
					);
				}
			}
		}

		return matrix[b.length][a.length];
	}

	function openLinkByName(name) {
		const links = document.querySelectorAll('.links a');
		let closestLink = null;
		let closestDistance = Infinity;

		for (let link of links) {
			const distance = levenshtein(link.textContent.toLowerCase(), name.toLowerCase());
			if (distance < closestDistance) {
				closestDistance = distance;
				closestLink = link;
			}
		}

		if (closestLink && closestDistance <= 3) {
			addToCommandHistory(name, `Opening ${closestLink.textContent}...`);
			closestLink.click();
		} else {
			addToCommandHistory(name, `Error: No link found with name "${name}"`);
			alert('No link found with the name: ' + name);
		}
	}

	function handleSearch(query) {
		if (query.startsWith('!g ')) {
			// Google search
			const searchTerm = query.substring(3);
			addToCommandHistory(`!g ${searchTerm}`, `Searching Google for "${searchTerm}"`);
			window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
		} else if (query.startsWith('!y ')) {
			// YouTube search
			const searchTerm = query.substring(3);
			addToCommandHistory(`!y ${searchTerm}`, `Searching YouTube for "${searchTerm}"`);
			window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`;
		} else if (query.startsWith('!w ')) {
			// Wikipedia search
			const searchTerm = query.substring(3);
			addToCommandHistory(`!w ${searchTerm}`, `Searching Wikipedia for "${searchTerm}"`);
			window.location.href = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(searchTerm)}`;
		} else {
			// Try to open bookmark or treat as direct URL
			if (query.includes('.') && !query.includes(' ')) {
				let url = query;
				if (!url.startsWith('http://') && !url.startsWith('https://')) {
					url = 'https://' + url;
				}
				addToCommandHistory(query, `Navigating to ${url}`);
				window.location.href = url;
			} else {
				openLinkByName(query);
			}
		}
	}

	// Add touch events for mobile
	if ('ontouchstart' in window) {
		// Add subtle touch highlight to links
		document.querySelectorAll('.links a').forEach(link => {
			link.addEventListener('touchstart', function() {
				document.querySelectorAll('.links a').forEach(l => l.classList.remove('highlight'));
				this.classList.add('highlight');
			});
		});

		// Add touch support for command input
		if (document.querySelector('.command-line')) {
			document.querySelector('.command-line').addEventListener('touchstart', function() {
				if (!inputMode) {
					inputMode = true;
					commandElement.classList.add('hidden');
					commandInput.classList.remove('hidden');
					commandInput.focus();
				}
			});
		}
	}

	document.addEventListener('keydown', (event) => {
		if (!inputMode && event.key === 'i') {
			event.preventDefault();
			inputMode = true;
			commandElement.classList.add('hidden');
			commandInput.classList.remove('hidden');
			commandInput.focus();
		} else if (!inputMode && event.key === 's') {
			event.preventDefault();
			const statsElement = document.querySelector('.system-stats');
			statsElement.style.display = statsElement.style.display === 'block' ? 'none' : 'block';

			if (statsElement.style.display === 'block') {
				updateSystemStats();
				// Update every minute when visible
				statsInterval = setInterval(updateSystemStats, 60000);
			} else {
				clearInterval(statsInterval);
			}
		} else if (!inputMode && event.key === '?') {
			event.preventDefault();
			document.getElementById('helpOverlay').style.display =
				document.getElementById('helpOverlay').style.display === 'flex' ? 'none' : 'flex';
		} else if (!inputMode) {
			switch (event.key) {
				case 'j':
					event.preventDefault();
					if (currentCategoryIndex === -1) {
						currentCategoryIndex = 0;
						currentLinkIndex = 0;
					} else {
						const currentLinks = categories[currentCategoryIndex].querySelectorAll('.links a');
						currentLinkIndex = (currentLinkIndex + 1) % currentLinks.length;
					}
					updateHighlight();
					break;
				case 'k':
					event.preventDefault();
					if (currentCategoryIndex === -1) {
						currentCategoryIndex = 0;
						currentLinkIndex = categories[currentCategoryIndex].querySelectorAll('.links a').length - 1;
					} else {
						const currentLinks = categories[currentCategoryIndex].querySelectorAll('.links a');
						currentLinkIndex = (currentLinkIndex - 1 + currentLinks.length) % currentLinks.length;
					}
					updateHighlight();
					break;
				case 'h':
					event.preventDefault();
					if (currentCategoryIndex === -1) {
						currentCategoryIndex = categories.length - 1;
						currentLinkIndex = 0;
					} else {
						const previousCategoryIndex = (currentCategoryIndex - 1 + categories.length) % categories.length;
						const previousLinks = categories[previousCategoryIndex].querySelectorAll('.links a');
						currentLinkIndex = Math.min(currentLinkIndex, previousLinks.length - 1);
						currentCategoryIndex = previousCategoryIndex;
					}
					updateHighlight();
					break;
				case 'l':
					event.preventDefault();
					if (currentCategoryIndex === -1) {
						currentCategoryIndex = 0;
						currentLinkIndex = 0;
					} else {
						const nextCategoryIndex = (currentCategoryIndex + 1) % categories.length;
						const nextLinks = categories[nextCategoryIndex].querySelectorAll('.links a');
						currentLinkIndex = Math.min(currentLinkIndex, nextLinks.length - 1);
						currentCategoryIndex = nextCategoryIndex;
					}
					updateHighlight();
					break;
				case 'Enter':
					event.preventDefault();
					if (currentCategoryIndex >= 0 && currentLinkIndex >= 0) {
						const currentLinks = categories[currentCategoryIndex].querySelectorAll('.links a');
						currentLinks[currentLinkIndex].click();
					}
					break;
			}
		} else {
			switch (event.key) {
				case 'Enter':
					event.preventDefault();
					if (commandInput.value) {
						const query = commandInput.value;
						handleSearch(query);
						exitInputMode();
					}
					break;
				case 'Escape':
					event.preventDefault();
					exitInputMode();
					break;
			}
		}
	});

	function exitInputMode() {
		inputMode = false;
		commandInput.classList.add('hidden');
		commandElement.classList.remove('hidden');
		commandInput.value = '';
		commandText = '';
		commandElement.textContent = commandText + '_';
	}

	// Add blur event listener to clear the input box when it loses focus
	commandInput.addEventListener('blur', exitInputMode);

	// Handle window resize to update mobile state
	window.addEventListener('resize', () => {
		isMobile = window.innerWidth <= 768;
	});

	// Update greeting on load
	if (mobileGreeting) {
		updateMobileGreeting();
		setInterval(updateMobileGreeting, 60000); // Update every minute
	}

	// Dark mode toggle
	document.getElementById('darkModeToggle').addEventListener('click', () => {
		document.body.classList.toggle('ultra-dark');
		// Save preference to localStorage
		localStorage.setItem('ultraDarkMode', document.body.classList.contains('ultra-dark'));
	});

	// Check for saved preference on load
	if (localStorage.getItem('ultraDarkMode') === 'true') {
		document.body.classList.add('ultra-dark');
	}

	// Help button
	document.getElementById('helpButton').addEventListener('click', () => {
		document.getElementById('helpOverlay').style.display = 'flex';
	});

	// Close help when close button is clicked
	document.getElementById('closeHelp').addEventListener('click', () => {
		document.getElementById('helpOverlay').style.display = 'none';
	});

	// Close help when clicking outside the help content
	document.getElementById('helpOverlay').addEventListener('click', (event) => {
		if (event.target === document.getElementById('helpOverlay')) {
			document.getElementById('helpOverlay').style.display = 'none';
		}
	});

	// Initialize highlight
	updateHigh
});

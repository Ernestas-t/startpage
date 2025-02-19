document.addEventListener('DOMContentLoaded', (event) => {
	let currentCategoryIndex = -1;
	let currentLinkIndex = -1;
	const categories = document.querySelectorAll('.category');
	const commandElement = document.getElementById('command');
	const commandInput = document.getElementById('commandInput');
	let commandText = '';
	let inputMode = false;

	function updateHighlight() {
		document.querySelectorAll('.links a').forEach(link => link.classList.remove('highlight'));
		if (currentCategoryIndex >= 0 && currentLinkIndex >= 0) {
			const currentLinks = categories[currentCategoryIndex].querySelectorAll('.links a');
			currentLinkIndex = Math.min(currentLinkIndex, currentLinks.length - 1);
			currentLinks[currentLinkIndex].classList.add('highlight');
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

		if (closestLink && closestDistance <= 3) { // Allow up to 2 typos
			closestLink.click();
		} else {
			alert('No link found with the name: ' + name);
		}
	}

	document.addEventListener('keydown', (event) => {
		if (!inputMode && event.key === 'i') {
			event.preventDefault();
			inputMode = true;
			commandElement.classList.add('hidden');
			commandInput.classList.remove('hidden');
			commandInput.focus();
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
						currentCategoryIndex = 1;
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
						openLinkByName(commandInput.value);
					}
					break;
				case 'Escape':
					event.preventDefault();
					inputMode = false;
					commandInput.classList.add('hidden');
					commandElement.classList.remove('hidden');
					commandInput.value = ''; // Clear the input box
					commandText = '';
					commandElement.textContent = commandText + '_';
					break;
			}
		}
	});

	// Add blur event listener to clear the input box when it loses focus
	commandInput.addEventListener('blur', () => {
		commandInput.value = ''; // Clear the input box
		inputMode = false;
		commandInput.classList.add('hidden');
		commandElement.classList.remove('hidden');
		commandText = '';
		commandElement.textContent = commandText + '_';
	});

	updateHighlight();
});

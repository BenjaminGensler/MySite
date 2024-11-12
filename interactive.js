document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById("header");
    const texts = ["Web Developer", "Automation Expert", "Software Developer"];
    let index = 0;
    let charIndex = 0;
    let currentText = texts[index];

    function typeText() {
        if (charIndex < currentText.length) {
            header.textContent += currentText.charAt(charIndex);
            charIndex++;
            setTimeout(typeText, 100); // Typing speed
        } else {
            charIndex = 0;
            index++;
            if (index < texts.length) {
                currentText = texts[index];
                setTimeout(() => {
                    header.textContent = "";
                    typeText();
                }, 2000); // Delay before typing the next word
            }
        }
    }

    typeText();

});